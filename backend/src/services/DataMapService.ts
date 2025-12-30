/**
 * 数据地图服务
 * 
 * 功能：
 * - 自动从 Mongoose Schema 构建数据地图
 * - 每小时自动刷新缓存
 * - 支持按关键词搜索，返回相关表和关联信息
 * - 大幅减少 AI 的 token 消耗
 */

import mongoose from 'mongoose';

// ============================================================================
// 类型定义
// ============================================================================

interface FieldInfo {
    name: string;
    type: string;
    required: boolean;
    ref?: string;
    enum?: string[];
}

interface TableInfo {
    collection: string;
    model: string;
    chineseName: string;  // 中文名
    fields: FieldInfo[];
    fieldCount: number;
}

interface RelationInfo {
    from: string;       // 源表
    to: string;         // 目标表
    field: string;      // 通过哪个字段关联
    type: 'one' | 'many';
}

interface DataMap {
    tables: Map<string, TableInfo>;
    relations: RelationInfo[];
    relationGraph: Map<string, Set<string>>;  // 双向关联图
    lastUpdated: Date;
}

// ============================================================================
// 中文名映射（可以后续改成从数据库读取）
// ============================================================================

const CHINESE_NAMES: Record<string, string> = {
    'User': '用户/联系人',
    'Client': '客户',
    'Project': '项目',
    'Quotation': '报价单',
    'Settlement': '结算',
    'Invoice': '发票',
    'Income': '收入',
    'Task': '任务',
    'Enterprise': '企业',
    'Department': '部门',
    'Role': '角色',
    'Permission': '权限',
    'Article': '文章',
    'ArticleCategory': '文章分类',
    'ArticleTag': '文章标签',
    'Form': '表单',
    'FormCategory': '表单分类',
    'ContractTemplate': '合同模板',
    'ContractTemplateCategory': '合同模板分类',
    'GeneratedContract': '生成的合同',
    'PricingPolicy': '定价策略',
    'ServicePricing': '服务定价',
    'ServiceProcess': '服务流程',
    'Specification': '规格',
    'ClientCategory': '客户分类',
    'Message': '消息',
    'MessageTemplate': '消息模板',
    'ProjectLog': '项目日志',
    'AuditLog': '审计日志',
};

// ============================================================================
// 关键词别名（用于搜索匹配）
// ============================================================================

const KEYWORD_ALIASES: Record<string, string[]> = {
    'Client': ['客户', '公司', '甲方', 'client', 'company', '企业'],
    'User': ['用户', '联系人', '员工', '人员', 'user', 'contact', 'employee'],
    'Project': ['项目', '工程', 'project'],
    'Quotation': ['报价', '报价单', '询价', 'quotation', 'quote'],
    'Settlement': ['结算', '付款', '收款', 'settlement', 'payment'],
    'Invoice': ['发票', '开票', 'invoice'],
    'Income': ['收入', '进账', 'income'],
    'Task': ['任务', '待办', 'task', 'todo'],
    'ContractTemplate': ['合同', '合同模板', '范本', 'contract', 'template'],
    'GeneratedContract': ['合同', '生成合同', 'contract'],
};

// ============================================================================
// 自动消歧义规则（核心：减少人工维护）
// ============================================================================

/**
 * 消歧义配置
 * 
 * 设计原则：
 * 1. 基于输入特征自动判断，而不是让 AI 猜
 * 2. 只配置真正有歧义的术语
 * 3. 提供查询示例，AI 可以直接复制使用
 */
const DISAMBIGUATION_RULES: Record<string, {
    description: string;
    branches: Array<{
        condition: string;        // 人类可读的判断条件
        pattern?: RegExp;         // 自动检测模式（可选）
        target: string;           // 目标表
        field: string;            // 查询字段
        example: string;          // 查询示例
    }>;
}> = {
    '客户': {
        description: '"客户"有两种含义',
        branches: [
            {
                condition: '如果是人名（2-4个汉字，无公司后缀）',
                pattern: /^[\u4e00-\u9fa5]{2,4}$/,  // 纯中文2-4字
                target: 'users',
                field: 'realName',
                example: '{"collection": "users", "query": {"realName": {"$regex": "NAME"}, "role": "客户"}}',
            },
            {
                condition: '如果是公司名（含有限公司/集团/科技等）',
                pattern: /(有限|公司|集团|科技|股份|企业|工程|建设|发展)/,
                target: 'clients',
                field: 'name',
                example: '{"collection": "clients", "query": {"name": {"$regex": "NAME"}}}',
            },
        ],
    },
    '联系人': {
        description: '"联系人"指的是用户表中的人员',
        branches: [
            {
                condition: '查询联系人信息',
                target: 'users',
                field: 'realName',
                example: '{"collection": "users", "query": {"realName": {"$regex": "NAME"}}}',
            },
        ],
    },
    '公司': {
        description: '"公司"指的是客户企业',
        branches: [
            {
                condition: '查询公司/企业信息',
                target: 'clients',
                field: 'name',
                example: '{"collection": "clients", "query": {"name": {"$regex": "NAME"}}}',
            },
        ],
    },
};

// ============================================================================
// 数据地图服务
// ============================================================================

class DataMapService {
    private dataMap: DataMap | null = null;
    private refreshInterval: NodeJS.Timeout | null = null;
    private readonly CACHE_TTL = 60 * 60 * 1000; // 1 小时

    /**
     * 启动服务（开始定时刷新）
     */
    start(): void {
        // 立即构建一次
        this.refresh().catch(err => {
            console.error('[DataMapService] 初始化失败:', err);
        });

        // 定时刷新
        this.refreshInterval = setInterval(() => {
            this.refresh().catch(err => {
                console.error('[DataMapService] 定时刷新失败:', err);
            });
        }, this.CACHE_TTL);

        console.log('[DataMapService] 服务已启动，每小时自动刷新');
    }

    /**
     * 停止服务
     */
    stop(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        console.log('[DataMapService] 服务已停止');
    }

    /**
     * 刷新数据地图
     */
    async refresh(): Promise<void> {
        console.log('[DataMapService] 开始刷新数据地图...');
        
        // 确保所有模型被加载
        await this.ensureModelsLoaded();
        
        const tables = new Map<string, TableInfo>();
        const relations: RelationInfo[] = [];
        const relationGraph = new Map<string, Set<string>>();

        // 遍历所有 Mongoose 模型
        for (const modelName of mongoose.modelNames()) {
            try {
                const model = mongoose.model(modelName);
                const schema = model.schema;
                const fields: FieldInfo[] = [];

                // 提取字段信息
                schema.eachPath((pathname: string, schemaType: any) => {
                    if (pathname.startsWith('_') && pathname !== '_id') return;
                    if (pathname === '__v') return;

                    const fieldInfo: FieldInfo = {
                        name: pathname,
                        type: this.getTypeName(schemaType),
                        required: !!schemaType.isRequired,
                    };

                    // 枚举值
                    if (schemaType.enumValues?.length > 0) {
                        fieldInfo.enum = schemaType.enumValues;
                    }

                    // 关联关系
                    const ref = schemaType.options?.ref || schemaType.caster?.options?.ref;
                    if (ref) {
                        fieldInfo.ref = ref;
                        
                        // 添加到关系列表
                        relations.push({
                            from: modelName,
                            to: ref,
                            field: pathname,
                            type: schemaType.instance === 'Array' ? 'many' : 'one',
                        });

                        // 构建双向关联图
                        if (!relationGraph.has(modelName)) {
                            relationGraph.set(modelName, new Set());
                        }
                        relationGraph.get(modelName)!.add(ref);

                        // 反向关联
                        if (!relationGraph.has(ref)) {
                            relationGraph.set(ref, new Set());
                        }
                        relationGraph.get(ref)!.add(modelName);
                    }

                    fields.push(fieldInfo);
                });

                tables.set(modelName, {
                    collection: model.collection.name,
                    model: modelName,
                    chineseName: CHINESE_NAMES[modelName] || modelName,
                    fields,
                    fieldCount: fields.length,
                });

            } catch (err) {
                console.warn(`[DataMapService] 无法处理模型 ${modelName}:`, err);
            }
        }

        this.dataMap = {
            tables,
            relations,
            relationGraph,
            lastUpdated: new Date(),
        };

        console.log(`[DataMapService] 刷新完成，共 ${tables.size} 个表，${relations.length} 个关联`);
    }

    /**
     * 按关键词搜索相关表（核心功能）
     * 
     * 新增：自动消歧义 + 智能推荐查询
     */
    search(keyword: string, entityName?: string): {
        tables: Array<{
            collection: string;
            model: string;
            name: string;
            fields: string[];
            relevance: 'high' | 'medium' | 'low';
        }>;
        relations: string[];
        disambiguation?: string;           // 消歧义提示
        recommendedQuery?: string;         // 智能推荐的查询（可直接使用）
        message: string;
    } {
        if (!this.dataMap) {
            return {
                tables: [],
                relations: [],
                message: '数据地图未初始化，请稍后重试',
            };
        }

        const matchedModels = new Set<string>();
        const relevanceMap = new Map<string, 'high' | 'medium' | 'low'>();

        // 1. 精确匹配中文名
        for (const [modelName, info] of this.dataMap.tables) {
            if (info.chineseName.includes(keyword)) {
                matchedModels.add(modelName);
                relevanceMap.set(modelName, 'high');
            }
        }

        // 2. 关键词别名匹配
        for (const [modelName, aliases] of Object.entries(KEYWORD_ALIASES)) {
            if (aliases.some(alias => 
                alias.toLowerCase().includes(keyword.toLowerCase()) ||
                keyword.toLowerCase().includes(alias.toLowerCase())
            )) {
                matchedModels.add(modelName);
                if (!relevanceMap.has(modelName)) {
                    relevanceMap.set(modelName, 'high');
                }
            }
        }

        // 3. 集合名/模型名模糊匹配
        for (const [modelName, info] of this.dataMap.tables) {
            if (
                modelName.toLowerCase().includes(keyword.toLowerCase()) ||
                info.collection.toLowerCase().includes(keyword.toLowerCase())
            ) {
                matchedModels.add(modelName);
                if (!relevanceMap.has(modelName)) {
                    relevanceMap.set(modelName, 'medium');
                }
            }
        }

        // 4. 添加关联表（一度关联）
        const relatedModels = new Set<string>();
        for (const modelName of matchedModels) {
            const related = this.dataMap.relationGraph.get(modelName);
            if (related) {
                for (const r of related) {
                    if (!matchedModels.has(r)) {
                        relatedModels.add(r);
                        relevanceMap.set(r, 'low');
                    }
                }
            }
        }

        // 合并
        for (const r of relatedModels) {
            matchedModels.add(r);
        }

        // 限制返回数量（最多 5 个）
        const sortedModels = Array.from(matchedModels)
            .sort((a, b) => {
                const order = { high: 0, medium: 1, low: 2 };
                return order[relevanceMap.get(a) || 'low'] - order[relevanceMap.get(b) || 'low'];
            })
            .slice(0, 5);

        // 构建返回结果
        const tables = sortedModels.map(modelName => {
            const info = this.dataMap!.tables.get(modelName)!;
            // 只返回重要字段（限制数量）
            const importantFields = info.fields
                .filter(f => f.required || f.ref || f.name === '_id')
                .slice(0, 8)
                .map(f => {
                    let desc = `${f.name}: ${f.type}`;
                    if (f.ref) desc += ` → ${f.ref}`;
                    if (f.enum) desc += ` [${f.enum.slice(0, 3).join('|')}${f.enum.length > 3 ? '...' : ''}]`;
                    return desc;
                });

            return {
                collection: info.collection,
                model: modelName,
                name: info.chineseName,
                fields: importantFields,
                relevance: relevanceMap.get(modelName) || 'low',
            };
        });

        // 构建关联关系描述
        const relevantRelations = this.dataMap.relations
            .filter(r => matchedModels.has(r.from) && matchedModels.has(r.to))
            .map(r => `${r.from}.${r.field} → ${r.to}`);

        // 自动消歧义
        const disambiguationResult = this.getDisambiguation(keyword, entityName);

        return {
            tables,
            relations: relevantRelations,
            disambiguation: disambiguationResult?.hint,
            recommendedQuery: disambiguationResult?.recommendedQuery,
            message: tables.length > 0
                ? `找到 ${tables.length} 个相关表。${disambiguationResult?.hint ? '⚠️ 注意消歧义提示' : ''}`
                : `未找到与"${keyword}"相关的表`,
        };
    }

    /**
     * 自动消歧义逻辑
     * 
     * 根据关键词和实体名称，智能推断应该查哪个表、用什么字段
     */
    private getDisambiguation(keyword: string, entityName?: string): {
        hint: string;
        recommendedQuery?: string;
    } | null {
        // 查找匹配的消歧义规则
        const rule = DISAMBIGUATION_RULES[keyword];
        if (!rule) return null;

        let hint = `💡 ${rule.description}：\n`;
        let recommendedQuery: string | undefined;

        for (const branch of rule.branches) {
            hint += `  • ${branch.condition} → ${branch.target}.${branch.field}\n`;

            // 如果提供了实体名称，尝试自动匹配
            if (entityName && branch.pattern) {
                if (branch.pattern.test(entityName)) {
                    recommendedQuery = branch.example.replace('NAME', entityName);
                    hint += `  ✅ "${entityName}" 匹配此规则\n`;
                }
            }
        }

        // 如果没有自动匹配，但只有一个分支，直接推荐
        if (!recommendedQuery && rule.branches.length === 1 && entityName) {
            recommendedQuery = rule.branches[0].example.replace('NAME', entityName);
        }

        return { hint: hint.trim(), recommendedQuery };
    }

    /**
     * 获取单个表的详细信息
     */
    getTableDetail(collectionOrModel: string): {
        found: boolean;
        collection?: string;
        model?: string;
        name?: string;
        fields?: string[];
        relations?: string[];
        message: string;
    } {
        if (!this.dataMap) {
            return { found: false, message: '数据地图未初始化' };
        }

        // 查找表
        let tableInfo: TableInfo | undefined;
        for (const [modelName, info] of this.dataMap.tables) {
            if (
                modelName === collectionOrModel ||
                modelName.toLowerCase() === collectionOrModel.toLowerCase() ||
                info.collection === collectionOrModel ||
                info.collection === collectionOrModel.toLowerCase()
            ) {
                tableInfo = info;
                break;
            }
        }

        if (!tableInfo) {
            // 尝试别名
            for (const [modelName, aliases] of Object.entries(KEYWORD_ALIASES)) {
                if (aliases.some(a => a.toLowerCase() === collectionOrModel.toLowerCase())) {
                    tableInfo = this.dataMap.tables.get(modelName);
                    break;
                }
            }
        }

        if (!tableInfo) {
            return {
                found: false,
                message: `未找到表 "${collectionOrModel}"`,
            };
        }

        // 格式化字段
        const fields = tableInfo.fields.map(f => {
            let desc = `${f.name}: ${f.type}`;
            if (f.required) desc += ' (必填)';
            if (f.ref) desc += ` → ${f.ref}`;
            if (f.enum) desc += ` [${f.enum.join('|')}]`;
            return desc;
        });

        // 查找关联
        const relations = this.dataMap.relations
            .filter(r => r.from === tableInfo!.model || r.to === tableInfo!.model)
            .map(r => {
                if (r.from === tableInfo!.model) {
                    return `${r.field} → ${r.to} (${r.type === 'many' ? '一对多' : '一对一'})`;
                } else {
                    return `← ${r.from}.${r.field} (被关联)`;
                }
            });

        return {
            found: true,
            collection: tableInfo.collection,
            model: tableInfo.model,
            name: tableInfo.chineseName,
            fields,
            relations: relations.length > 0 ? relations : ['无直接关联'],
            message: `✅ ${tableInfo.chineseName} (${tableInfo.collection})，共 ${tableInfo.fieldCount} 个字段`,
        };
    }

    /**
     * 获取缓存状态
     */
    getStatus(): { initialized: boolean; tableCount: number; lastUpdated: Date | null } {
        return {
            initialized: !!this.dataMap,
            tableCount: this.dataMap?.tables.size || 0,
            lastUpdated: this.dataMap?.lastUpdated || null,
        };
    }

    // ========== 私有方法 ==========

    private getTypeName(schemaType: any): string {
        if (!schemaType) return 'unknown';
        const instance = schemaType.instance;
        
        if (instance === 'Array') {
            const caster = schemaType.caster;
            if (caster?.instance) return `${caster.instance}[]`;
            return 'Array';
        }
        
        if (instance === 'ObjectId' || instance === 'ObjectID') {
            return schemaType.options?.ref ? `ObjectId(${schemaType.options.ref})` : 'ObjectId';
        }
        
        return instance || 'unknown';
    }

    private async ensureModelsLoaded(): Promise<void> {
        await Promise.all([
            import('../models/User'),
            import('../models/Client'),
            import('../models/Project'),
            import('../models/Quotation'),
            import('../models/Settlement'),
            import('../models/Invoice'),
            import('../models/Income'),
            import('../models/Task'),
            import('../models/Enterprise'),
            import('../models/Department'),
            import('../models/Role'),
            import('../models/Permission'),
            import('../models/Article'),
            import('../models/ArticleCategory'),
            import('../models/ArticleTag'),
            import('../models/Form'),
            import('../models/FormCategory'),
            import('../models/ContractTemplate'),
            import('../models/ContractTemplateCategory'),
            import('../models/GeneratedContract'),
            import('../models/PricingPolicy'),
            import('../models/ServicePricing'),
            import('../models/ServiceProcess'),
            import('../models/Specification'),
            import('../models/ClientCategory'),
            import('../models/Message'),
            import('../models/MessageTemplate'),
            import('../models/ProjectLog'),
        ]).catch(() => {});
    }
}

// 导出单例
export const dataMapService = new DataMapService();
export default dataMapService;

