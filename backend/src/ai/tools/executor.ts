/**
 * 通用工具执行器
 * 
 * 根据工具的 execution 配置执行工具调用
 * 支持声明式配置，无需编写代码即可定义工具执行逻辑
 * 
 * 安全原则：
 * 1. AI 只能访问 Mongoose 注册的集合（自动从 DataMapService 获取）
 * 2. 敏感集合（如 users 的密码字段）通过字段过滤保护
 * 3. 参数必须符合工具定义的 paramsSchema
 * 
 * 注意：AiDataModel 已移除，集合白名单现在由 DataMapService 自动管理
 */

import mongoose from 'mongoose';
import AiTool, { IToolExecution, IExecutionStep } from '../../models/AiToolkit';
import { ToolResult, ToolContext, StructuredError } from './types';
import {
    createToolNotFoundError,
    createValidationError,
    createDangerousOperatorError,
    createCollectionNotAllowedError,
    createDatabaseError,
    createExecutionError,
    fromError,
} from '../agent/explanation-templates';

// ============================================================================
// 敏感字段过滤
// ============================================================================

/**
 * 敏感字段列表（小写）
 * 这些字段在返回给用户之前会被过滤
 * 注意：比较时会转换为小写
 */
const SENSITIVE_FIELDS = [
    'password',
    'passwordhash',
    'salt',
    'token',
    'accesstoken',
    'refreshtoken',
    'apikey',
    'secretkey',
    'secret',
    'privatekey',
    '__v',  // Mongoose 版本字段
];

/**
 * 递归过滤敏感字段
 */
function sanitizeOutput(data: any, depth: number = 0): any {
    // 防止无限递归
    if (depth > 10) {
        return data;
    }

    if (data === null || data === undefined) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeOutput(item, depth + 1));
    }

    if (typeof data === 'object') {
        // 处理 Date 对象
        if (data instanceof Date) {
            return data;
        }

        // 处理 ObjectId
        if (data._bsontype === 'ObjectId' || data.constructor?.name === 'ObjectId') {
            return data.toString();
        }

        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            // 跳过敏感字段（忽略大小写）
            if (SENSITIVE_FIELDS.includes(lowerKey)) {
                continue;
            }
            // 跳过以下划线开头的私有字段（除了 _id）
            if (key.startsWith('_') && key !== '_id') {
                continue;
            }
            sanitized[key] = sanitizeOutput(value, depth + 1);
        }
        return sanitized;
    }

    return data;
}

// ============================================================================
// 参数验证
// ============================================================================

/**
 * 验证结果
 */
interface ValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * 验证参数是否符合 Schema
 * 
 * 支持的 Schema 格式（JSON Schema 子集）：
 * - type: 'string' | 'number' | 'boolean' | 'object' | 'array'
 * - required: string[] - 必填字段列表
 * - properties: { [key]: { type, description, enum, default } }
 * - enum: any[] - 枚举值
 */
function validateParams(
    params: Record<string, any>,
    schema: Record<string, any> | undefined
): ValidationResult {
    const errors: string[] = [];

    if (!schema) {
        // 没有 Schema，跳过验证
        return { valid: true, errors: [] };
    }

    // 检查必填字段
    const required = schema.required as string[] || [];
    for (const field of required) {
        if (params[field] === undefined || params[field] === null || params[field] === '') {
            errors.push(`缺少必填参数: ${field}`);
        }
    }

    // 检查 anyOf 必填（至少满足一个）
    if (schema.anyOf && Array.isArray(schema.anyOf)) {
        const anyOfSatisfied = schema.anyOf.some((condition: any) => {
            if (condition.required && Array.isArray(condition.required)) {
                return condition.required.every((field: string) =>
                    params[field] !== undefined && params[field] !== null && params[field] !== ''
                );
            }
            return false;
        });

        if (!anyOfSatisfied && schema.anyOf.length > 0) {
            const options = schema.anyOf
                .map((c: any) => c.required?.join(', '))
                .filter(Boolean)
                .join(' 或 ');
            errors.push(`至少需要提供以下参数之一: ${options}`);
        }
    }

    // 检查属性类型和枚举值
    const properties = schema.properties as Record<string, any> || {};
    for (const [key, value] of Object.entries(params)) {
        const propSchema = properties[key];
        if (!propSchema) {
            continue; // 允许额外字段
        }

        // 检查类型
        if (propSchema.type && value !== undefined && value !== null) {
            const expectedType = propSchema.type;
            const actualType = Array.isArray(value) ? 'array' : typeof value;

            if (expectedType !== actualType) {
                // 尝试类型转换
                if (expectedType === 'number' && typeof value === 'string') {
                    const num = Number(value);
                    if (isNaN(num)) {
                        errors.push(`参数 ${key} 应为数字类型`);
                    }
                } else if (expectedType === 'string' && typeof value !== 'string') {
                    // 允许数字转字符串
                } else if (expectedType !== actualType) {
                    errors.push(`参数 ${key} 类型错误，期望 ${expectedType}，实际 ${actualType}`);
                }
            }
        }

        // 检查枚举值
        if (propSchema.enum && Array.isArray(propSchema.enum)) {
            if (!propSchema.enum.includes(value)) {
                errors.push(`参数 ${key} 的值无效，允许的值: ${propSchema.enum.join(', ')}`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * 检查危险的 MongoDB 操作符
 * 防止注入攻击
 */
function checkDangerousOperators(query: any, path: string = ''): string[] {
    const errors: string[] = [];
    const dangerousOps = ['$where', '$function', '$accumulator', '$merge', '$out'];

    if (query === null || query === undefined) {
        return errors;
    }

    if (typeof query === 'object') {
        for (const [key, value] of Object.entries(query)) {
            const currentPath = path ? `${path}.${key}` : key;

            // 检查危险操作符
            if (dangerousOps.includes(key)) {
                errors.push(`禁止使用操作符 ${key} (位置: ${currentPath})`);
            }

            // 递归检查
            if (typeof value === 'object') {
                errors.push(...checkDangerousOperators(value, currentPath));
            }
        }
    }

    return errors;
}

/**
 * 敏感集合黑名单 - 这些集合不允许 AI 直接访问
 */
const BLOCKED_COLLECTIONS = new Set([
    'sessions',           // 会话数据
    'aiconversations',    // AI 对话历史
    'auditlogs',          // 审计日志
]);

/**
 * 获取允许访问的集合列表
 * 
 * 现在自动从 Mongoose 注册的模型获取，无需手动配置 AiDataModel
 * 基于 AI 原生原则：AI 在已知世界中自由，但有安全边界
 */
async function getAllowedCollections(): Promise<Set<string>> {
    // 确保 DataMapService 已初始化
    const { dataMapService } = await import('../../services/DataMapService');
    const status = dataMapService.getStatus();
    if (!status.initialized) {
        await dataMapService.refresh();
    }

    // 获取所有 Mongoose 注册的集合名
    const allCollections = new Set<string>();
    for (const modelName of mongoose.modelNames()) {
        try {
            const model = mongoose.model(modelName);
            const collectionName = model.collection.name;

            // 排除黑名单集合
            if (!BLOCKED_COLLECTIONS.has(collectionName)) {
                allCollections.add(collectionName);
            }
        } catch {
            // 忽略无法获取的模型
        }
    }

    return allCollections;
}

/**
 * 验证集合访问权限
 * 确保 AI 只能访问 Mongoose 注册的集合（排除黑名单）
 */
async function validateCollectionAccess(collection: string): Promise<void> {
    const allowed = await getAllowedCollections();

    if (!allowed.has(collection)) {
        console.warn(`[ToolExecutor] 拒绝访问集合: ${collection}`);

        // 检查是否是黑名单集合
        if (BLOCKED_COLLECTIONS.has(collection)) {
            throw new Error(`访问被拒绝：集合 "${collection}" 是敏感数据，不允许 AI 访问。`);
        }

        // 可能是拼写错误
        throw new Error(
            `访问被拒绝：集合 "${collection}" 不存在。` +
            `请使用 schema.search 工具查找正确的集合名。`
        );
    }
}

/**
 * 清除集合缓存（保留接口兼容性）
 * 
 * 注意：由于集合列表现在从 Mongoose 动态获取，此函数已无实际作用
 * 保留此函数是为了避免旧代码调用报错
 */
export function clearCollectionCache(): void {
    console.log('[ToolExecutor] clearCollectionCache 已废弃，集合列表现在自动从 Mongoose 获取');
}

/**
 * 执行上下文
 */
interface ExecutionContext {
    params: Record<string, any>;           // 调用参数
    steps: Record<string, any>;            // 步骤执行结果
    user?: { id: string; name: string };   // 当前用户
    variables: Record<string, any>;        // 自定义变量
}

/**
 * 模板变量解析器
 * 支持 {{params.xxx}}, {{steps.stepName.xxx}}, {{user.id}} 等语法
 */
function resolveTemplate(template: any, context: ExecutionContext): any {
    if (template === null || template === undefined) {
        return template;
    }

    if (typeof template === 'string') {
        // 处理完整的模板引用 {{xxx}}
        const fullMatch = template.match(/^\{\{(.+?)\}\}$/);
        if (fullMatch) {
            const path = fullMatch[1].trim();
            return resolvePath(path, context);
        }

        // 处理嵌入的模板变量
        return template.replace(/\{\{(.+?)\}\}/g, (_, path) => {
            const value = resolvePath(path.trim(), context);
            return value !== undefined ? String(value) : '';
        });
    }

    if (Array.isArray(template)) {
        return template.map(item => resolveTemplate(item, context));
    }

    if (typeof template === 'object') {
        const resolved: Record<string, any> = {};
        for (const [key, value] of Object.entries(template)) {
            // 跳过 undefined 值
            const resolvedValue = resolveTemplate(value, context);

            // 检查是否为空值
            const isEmpty = resolvedValue === undefined
                || resolvedValue === null
                || resolvedValue === ''
                || (typeof resolvedValue === 'object' && Object.keys(resolvedValue).length === 0);

            if (!isEmpty) {
                // 特殊处理 MongoDB 操作符对象（如 $regex）
                // 如果是 MongoDB 操作对象且核心值为空，则跳过整个字段
                if (typeof resolvedValue === 'object' && !Array.isArray(resolvedValue)) {
                    const mongoOps = ['$regex', '$in', '$nin', '$gt', '$gte', '$lt', '$lte', '$eq', '$ne'];
                    const hasMongoOp = mongoOps.some(op => op in resolvedValue);
                    if (hasMongoOp) {
                        // 检查 $regex 是否为空（同时也会有 $options）
                        if ('$regex' in resolvedValue && (!resolvedValue.$regex || resolvedValue.$regex === '')) {
                            continue; // 跳过空的正则查询（包括其 $options）
                        }
                        // 检查 $in 是否为空数组
                        if ('$in' in resolvedValue && Array.isArray(resolvedValue.$in) && resolvedValue.$in.length === 0) {
                            continue;
                        }
                    }
                    // 检查是否只剩 $options（$regex 被移除的情况）
                    const keys = Object.keys(resolvedValue);
                    if (keys.length === 1 && keys[0] === '$options') {
                        continue; // 只有 $options 没有 $regex，跳过
                    }
                }
                resolved[key] = resolvedValue;
            }
        }
        return resolved;
    }

    return template;
}

/**
 * 解析路径表达式
 * 如 params.limit, steps.fetch_template.content, user.id
 */
function resolvePath(path: string, context: ExecutionContext): any {
    // 支持默认值语法: params.limit || 20
    if (path.includes('||')) {
        const [mainPath, defaultValue] = path.split('||').map(s => s.trim());
        const value = resolvePath(mainPath, context);
        if (value === undefined || value === null || value === '') {
            // 解析默认值
            try {
                return JSON.parse(defaultValue);
            } catch {
                return defaultValue.replace(/^['"]|['"]$/g, '');
            }
        }
        return value;
    }

    const parts = path.split('.');
    let current: any = context;

    for (const part of parts) {
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[part];
    }

    // 自动将 ObjectId 转换为字符串（用于步骤间数据传递）
    if (current && (current._bsontype === 'ObjectId' || current.constructor?.name === 'ObjectId')) {
        return current.toString();
    }

    return current;
}

/**
 * 安全的条件表达式求值
 * 只支持简单的比较操作，不执行任意代码
 */
function evaluateCondition(condition: string, context: ExecutionContext): boolean {
    // 替换模板变量
    const resolved = resolveTemplate(condition, context);

    // 简单的布尔判断
    if (typeof resolved === 'boolean') return resolved;
    if (resolved === 'true') return true;
    if (resolved === 'false') return false;
    if (resolved === null || resolved === undefined || resolved === '') return false;

    // 支持简单的比较表达式
    const compareMatch = resolved.match(/^(.+?)\s*(===?|!==?|>=?|<=?)\s*(.+)$/);
    if (compareMatch) {
        const [, left, op, right] = compareMatch;
        const leftVal = resolveTemplate(`{{${left.trim()}}}`, context);
        let rightVal: any = right.trim();

        // 尝试解析右值
        try {
            rightVal = JSON.parse(rightVal);
        } catch {
            rightVal = rightVal.replace(/^['"]|['"]$/g, '');
        }

        switch (op) {
            case '==':
            case '===':
                return leftVal == rightVal;
            case '!=':
            case '!==':
                return leftVal != rightVal;
            case '>':
                return leftVal > rightVal;
            case '>=':
                return leftVal >= rightVal;
            case '<':
                return leftVal < rightVal;
            case '<=':
                return leftVal <= rightVal;
        }
    }

    return Boolean(resolved);
}

/**
 * 执行数据库操作
 * 
 * 安全原则：在执行任何数据库操作前，验证集合是否在数据模型中定义
 * 这确保了 AI 只能在"已知世界"中自由（原则 4）
 */
async function executeDbOperation(
    step: IExecutionStep | IToolExecution,
    context: ExecutionContext,
    operation?: string
): Promise<any> {
    const collection = resolveTemplate(step.collection, context);
    if (!collection) {
        throw new Error('未指定集合名称');
    }

    // 🛡️ 世界边界守卫：验证集合是否在数据模型中定义
    // 这是 AI 原生架构的核心安全机制
    await validateCollectionAccess(collection);

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('数据库未连接');
    }

    const coll = db.collection(collection);
    let query = resolveTemplate(step.query || {}, context);
    const projection = resolveTemplate(step.projection, context);
    const sort = resolveTemplate(step.sort, context);

    // 处理 ObjectId 转换（用于 _id 等字段的查询）
    const convertFields = (step as any).convertToObjectId as string[] | undefined;
    if (convertFields && Array.isArray(convertFields)) {
        for (const field of convertFields) {
            if (query[field] && typeof query[field] === 'string' && query[field].length === 24) {
                try {
                    query[field] = new mongoose.Types.ObjectId(query[field]);
                } catch {
                    // 如果转换失败，保持原值
                }
            }
        }
    }
    // 自动检测 _id 字段并转换为 ObjectId
    if (query._id) {
        // 单个字符串 ID
        if (typeof query._id === 'string' && query._id.length === 24) {
            try {
                query._id = new mongoose.Types.ObjectId(query._id);
            } catch {
                // 转换失败，保持原值
            }
        }
        // $in 操作符中的 ID 数组
        if (query._id.$in && Array.isArray(query._id.$in)) {
            query._id.$in = query._id.$in.map((id: string) => {
                if (typeof id === 'string' && id.length === 24) {
                    try {
                        return new mongoose.Types.ObjectId(id);
                    } catch {
                        return id;
                    }
                }
                return id;
            });
        }
    }
    let limit = resolveTemplate(step.limit, context);
    if (typeof limit === 'string') {
        limit = parseInt(limit, 10) || 20;
    }

    // 对于 simple 类型的执行配置，type 字段表示执行模式而非操作类型
    // 所以优先使用 operation 参数，其次才用 step.type
    const stepType = operation || (step as IExecutionStep).type;

    switch (stepType as string) {
        case 'db_query':
        case 'find': {
            let cursor = coll.find(query);
            if (projection) cursor = cursor.project(projection);
            if (sort) cursor = cursor.sort(sort);
            if (limit) cursor = cursor.limit(limit);

            const results = await cursor.toArray();

            // 如果是单个结果模式
            if ((step as IExecutionStep).single) {
                return results[0] || null;
            }
            return results;
        }

        case 'findOne': {
            const options: any = {};
            if (projection) options.projection = projection;
            return await coll.findOne(query, options);
        }

        case 'db_aggregate':
        case 'aggregate': {
            const pipeline = resolveTemplate(step.pipeline || [], context);
            const results = await coll.aggregate(pipeline).toArray();
            if ((step as IExecutionStep).single) {
                return results[0] || null;
            }
            return results;
        }

        case 'db_insert':
        case 'insert': {
            const document = resolveTemplate(step.document, context);
            if (Array.isArray(document)) {
                const result = await coll.insertMany(document);
                return { insertedCount: result.insertedCount, insertedIds: result.insertedIds };
            } else {
                const result = await coll.insertOne(document);
                return { insertedId: result.insertedId };
            }
        }

        case 'db_update':
        case 'update': {
            const update = resolveTemplate(step.update, context);
            const result = await coll.updateMany(query, update);
            return {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            };
        }

        case 'db_delete':
        case 'delete': {
            const result = await coll.deleteMany(query);
            return { deletedCount: result.deletedCount };
        }

        case 'count': {
            return await coll.countDocuments(query);
        }

        default:
            throw new Error(`不支持的数据库操作类型: ${stepType}`);
    }
}

/**
 * 执行模板替换
 */
function executeTemplateReplace(step: IExecutionStep, context: ExecutionContext): string {
    let template = resolveTemplate(step.template, context);
    const data = resolveTemplate(step.data, context);

    if (!template || typeof template !== 'string') {
        return '';
    }

    if (!data || typeof data !== 'object') {
        return template;
    }

    // 替换 {{xxx}} 格式的占位符
    template = template.replace(/\{\{(.+?)\}\}/g, (_, key) => {
        const value = data[key.trim()];
        return value !== undefined ? String(value) : `{{${key}}}`;
    });

    // 替换 【xxx】 格式的占位符（合同常用）
    template = template.replace(/【(.+?)】/g, (match: string, key: string) => {
        const value = data[key.trim()];
        return value !== undefined ? String(value) : match;
    });

    return template;
}

/**
 * 执行数据转换
 */
function executeTransform(step: IExecutionStep, context: ExecutionContext): any {
    const input = resolveTemplate(step.input, context);
    const expression = step.expression;

    if (!expression) {
        return input;
    }

    // 支持的安全转换操作
    switch (expression) {
        case 'toArray':
            return Array.isArray(input) ? input : [input];
        case 'first':
            return Array.isArray(input) ? input[0] : input;
        case 'last':
            return Array.isArray(input) ? input[input.length - 1] : input;
        case 'count':
            return Array.isArray(input) ? input.length : (input ? 1 : 0);
        case 'keys':
            return typeof input === 'object' ? Object.keys(input) : [];
        case 'values':
            return typeof input === 'object' ? Object.values(input) : [];
        case 'stringify':
            return JSON.stringify(input, null, 2);
        case 'parse':
            return typeof input === 'string' ? JSON.parse(input) : input;
        default:
            // 支持简单的属性选择 select:fieldName
            if (expression.startsWith('select:')) {
                const field = expression.slice(7);
                if (Array.isArray(input)) {
                    return input.map(item => item[field]);
                }
                return input?.[field];
            }
            // 支持过滤 filter:field=value
            if (expression.startsWith('filter:')) {
                const [field, value] = expression.slice(7).split('=');
                if (Array.isArray(input)) {
                    return input.filter(item => String(item[field]) === value);
                }
                return input;
            }
            return input;
    }
}

/**
 * 执行单个步骤
 */
async function executeStep(
    step: IExecutionStep,
    context: ExecutionContext
): Promise<any> {
    switch (step.type) {
        case 'db_query':
        case 'db_aggregate':
        case 'db_insert':
        case 'db_update':
        case 'db_delete':
            return await executeDbOperation(step, context);

        case 'template_replace':
            return executeTemplateReplace(step, context);

        case 'transform':
            return executeTransform(step, context);

        case 'condition': {
            const result = evaluateCondition(step.condition || '', context);
            return {
                result,
                nextStep: result ? step.thenStep : step.elseStep
            };
        }

        case 'return':
            return {
                isReturn: true,
                result: resolveTemplate(step.result, context),
                message: resolveTemplate(step.message, context),
            };

        default:
            throw new Error(`不支持的步骤类型: ${step.type}`);
    }
}

/**
 * 执行管道模式
 */
async function executePipeline(
    steps: IExecutionStep[],
    context: ExecutionContext
): Promise<any> {
    const stepMap = new Map(steps.map((s, i) => [s.name, i]));
    let currentIndex = 0;

    while (currentIndex < steps.length) {
        const step = steps[currentIndex];
        const result = await executeStep(step, context);

        // 保存步骤结果
        context.steps[step.name] = result;

        // 检查是否是条件步骤
        if (step.type === 'condition' && result.nextStep) {
            const nextIndex = stepMap.get(result.nextStep);
            if (nextIndex !== undefined) {
                currentIndex = nextIndex;
                continue;
            }
        }

        // 检查是否是返回步骤
        if (step.type === 'return' || result?.isReturn) {
            return result.result !== undefined ? result.result : result;
        }

        currentIndex++;
    }

    // 返回最后一步的结果
    const lastStep = steps[steps.length - 1];
    return context.steps[lastStep.name];
}

/**
 * 自定义处理器注册表
 */
const customHandlers: Record<string, (context: ExecutionContext) => Promise<any>> = {
    /**
     * mapSearch - 搜索业务地图
     * 根据关键词在 AI Maps 中搜索匹配的业务流程
     */
    mapSearch: async (context: ExecutionContext) => {
        const keyword = context.params.keyword as string;
        if (!keyword) {
            return { maps: [], message: '请提供搜索关键词' };
        }

        // 动态导入 AiMap 模型
        const AiMap = (await import('../../models/AiMap')).default;

        // 搜索匹配的地图
        const maps = await AiMap.find({
            enabled: true,
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { triggers: { $elemMatch: { $regex: keyword, $options: 'i' } } },
            ],
        }).limit(3).lean();

        if (maps.length === 0) {
            return {
                maps: [],
                message: `未找到与"${keyword}"相关的业务地图。请使用 db.query 工具直接查询数据。`,
            };
        }

        // 格式化返回结果（包含完整的步骤信息）
        const formattedMaps = maps.map((map: any) => ({
            mapId: map.mapId,
            name: map.name,
            description: map.description,
            triggers: map.triggers,
            steps: map.steps?.map((s: any, i: number) => ({
                order: i + 1,
                name: s.name,
                action: s.action,
                toolId: s.toolId,
                paramsTemplate: s.paramsTemplate,
                outputKey: s.outputKey,
                nextStepPrompt: s.nextStepPrompt, // 下一步提示
                note: s.note,
            })),
            examples: map.examples,
        }));

        // 生成第一步提示
        const firstMap = formattedMaps[0];
        const firstStep = firstMap?.steps?.[0];
        const firstStepHint = firstStep
            ? `\n\n📍 **开始执行步骤 1: ${firstStep.name}**\n${firstStep.action}\n请调用工具 \`${firstStep.toolId}\``
            : '';

        return {
            maps: formattedMaps,
            message: `找到 ${maps.length} 个相关业务地图「${firstMap?.name}」，共 ${firstMap?.steps?.length || 0} 步。${firstStepHint}`,
        };
    },

    /**
     * schemaSearch - 按关键词搜索相关数据表（核心工具）
     * 
     * 功能：
     * 1. 根据关键词智能匹配相关表（不返回全部）
     * 2. 返回表之间的关联信息
     * 3. 自动消歧义：区分"客户（人）"vs"客户（企业）"等
     * 4. 智能推荐查询：如果提供了实体名称，自动生成推荐查询
     * 
     * 数据来自缓存，每小时自动刷新
     */
    schemaSearch: async (context: ExecutionContext) => {
        const keyword = context.params.keyword as string;
        const entityName = context.params.entityName as string | undefined;

        if (!keyword) {
            return { error: '请提供搜索关键词，如"客户"、"项目"、"报价"等' };
        }

        const { dataMapService } = await import('../../services/DataMapService');

        // 确保服务已初始化
        const status = dataMapService.getStatus();
        if (!status.initialized) {
            await dataMapService.refresh();
        }

        return dataMapService.search(keyword, entityName);
    },

    /**
     * datamodelGet - 获取单个表的详细字段信息
     * 
     * 在调用 db.query 前，先用这个工具获取正确的字段名
     * 数据来自缓存，自动从 Schema 提取
     */
    datamodelGet: async (context: ExecutionContext) => {
        const collection = context.params.collection as string;
        if (!collection) {
            return { error: '请提供集合名称' };
        }

        const { dataMapService } = await import('../../services/DataMapService');

        // 确保服务已初始化
        const status = dataMapService.getStatus();
        if (!status.initialized) {
            await dataMapService.refresh();
        }

        return dataMapService.getTableDetail(collection);
    },
};

/**
 * 执行自定义处理器
 */
async function executeCustomHandler(
    handlerName: string,
    context: ExecutionContext
): Promise<any> {
    const handler = customHandlers[handlerName];
    if (!handler) {
        throw new Error(`未找到自定义处理器: ${handlerName}`);
    }
    return await handler(context);
}

/**
 * 格式化结果
 */
function formatResult(result: any, template?: string, context?: ExecutionContext): any {
    if (!template) {
        return result;
    }

    // 将结果添加到上下文
    const ctx = context || { params: {}, steps: {}, variables: {} };
    ctx.variables.result = result;

    return resolveTemplate(template, ctx);
}

/**
 * 工具执行器
 */
export class ToolExecutor {
    /**
     * 执行工具
     */
    static async execute(
        toolId: string,
        params: Record<string, any>,
        toolContext?: ToolContext
    ): Promise<ToolResult> {
        try {
            // 从数据库获取工具定义
            const tool = await AiTool.findOne({ toolId, enabled: true });
            if (!tool) {
                return {
                    success: false,
                    error: createToolNotFoundError(toolId),
                };
            }

            // 检查是否有执行配置
            if (!tool.execution) {
                return {
                    success: false,
                    error: createToolNotFoundError(toolId),
                };
            }

            // ============================================================
            // 参数验证（Phase 1 增强 + Phase 2 StructuredError）
            // ============================================================
            const validation = validateParams(params, tool.paramsSchema);
            if (!validation.valid) {
                console.warn(`[ToolExecutor] 参数验证失败 (${toolId}):`, validation.errors);
                return {
                    success: false,
                    error: createValidationError(validation.errors),
                };
            }

            // ============================================================
            // 危险操作符检查（防止 MongoDB 注入）
            // ============================================================
            if (params.query) {
                const dangerousErrors = checkDangerousOperators(params.query);
                if (dangerousErrors.length > 0) {
                    console.warn(`[ToolExecutor] 检测到危险操作符 (${toolId}):`, dangerousErrors);
                    return {
                        success: false,
                        error: createDangerousOperatorError(dangerousErrors),
                    };
                }
            }
            if (params.pipeline) {
                const dangerousErrors = checkDangerousOperators(params.pipeline);
                if (dangerousErrors.length > 0) {
                    console.warn(`[ToolExecutor] 检测到危险操作符 (${toolId}):`, dangerousErrors);
                    return {
                        success: false,
                        error: createDangerousOperatorError(dangerousErrors),
                    };
                }
            }

            // 检查是否需要用户确认
            if (tool.execution.requiresConfirmation) {
                // 这里可以返回一个特殊状态，由上层处理确认逻辑
                // 暂时跳过确认，实际项目中应该实现确认机制
            }

            // 构建执行上下文
            const context: ExecutionContext = {
                params,
                steps: {},
                user: toolContext?.userId ? { id: toolContext.userId, name: '' } : undefined,
                variables: {},
            };

            let result: any;

            // 调试日志 - 完整输出 execution 对象
            console.log('[ToolExecutor] 工具执行配置:', {
                toolId,
                executionFull: JSON.stringify(tool.execution),
                executionType: tool.execution.type,
                hasHandler: !!tool.execution.handler,
                handler: tool.execution.handler,
            });

            // 根据执行类型选择执行方式
            if (tool.execution.type === 'custom' && tool.execution.handler) {
                // 自定义处理器模式
                console.log('[ToolExecutor] 使用自定义处理器:', tool.execution.handler);
                result = await executeCustomHandler(
                    tool.execution.handler,
                    context
                );
            } else if (tool.execution.type === 'pipeline' && tool.execution.steps?.length) {
                // 管道模式：多步骤执行
                result = await executePipeline(tool.execution.steps, context);
            } else {
                // 简单模式：单步数据库操作
                // 先解析 operation 模板（如 {{params.operation || "find"}}）
                const resolvedOperation = resolveTemplate(tool.execution.operation, context);
                result = await executeDbOperation(
                    tool.execution as any,
                    context,
                    resolvedOperation
                );
            }

            // 格式化结果
            const formattedResult = formatResult(
                result,
                tool.execution.resultTemplate,
                context
            );

            // ============================================================
            // 敏感字段过滤（Phase 1 增强）
            // ============================================================
            const sanitizedResult = sanitizeOutput(formattedResult);

            return {
                success: true,
                data: sanitizedResult,
            };

        } catch (error: any) {
            console.error(`[ToolExecutor] 执行工具 ${toolId} 失败:`, error);

            // 使用 StructuredError 处理错误
            let structuredError: StructuredError;

            if (error.message?.includes('访问被拒绝') || error.message?.includes('未在数据模型中定义')) {
                // 集合访问被拒绝
                const collectionMatch = error.message.match(/集合 "(.+?)"/);
                const collection = collectionMatch ? collectionMatch[1] : 'unknown';
                structuredError = createCollectionNotAllowedError(collection);
            } else if (error.message?.includes('数据库未连接')) {
                structuredError = createDatabaseError(error.message);
            } else {
                // 通用执行错误
                structuredError = fromError(error, 'ERROR_TOOL_EXECUTION');
            }

            return {
                success: false,
                error: structuredError,
            };
        }
    }

    /**
     * 检查工具是否存在且可执行
     */
    static async canExecute(toolId: string): Promise<boolean> {
        const tool = await AiTool.findOne({ toolId, enabled: true });
        return !!(tool && tool.execution);
    }

    /**
     * 获取工具的参数 Schema
     */
    static async getParamsSchema(toolId: string): Promise<Record<string, any> | null> {
        const tool = await AiTool.findOne({ toolId });
        return tool?.paramsSchema || null;
    }
}

export default ToolExecutor;

