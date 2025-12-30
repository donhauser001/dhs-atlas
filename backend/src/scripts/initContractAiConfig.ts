/**
 * 合同模块 AI 配置初始化脚本
 * 
 * 初始化合同相关的 AI 工具集和地图
 * 包括工具的执行配置（execution），实现声明式工具定义
 * 
 * 运行方式：
 * docker exec donhauser-backend npx ts-node --transpile-only src/scripts/initContractAiConfig.ts
 * 或本地：npx ts-node src/scripts/initContractAiConfig.ts
 */

import mongoose from 'mongoose';
import AiTool from '../models/AiToolkit';
import AiMap from '../models/AiMap';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser';

async function initContractAiConfig() {
    try {
        console.log('🔌 连接数据库...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ 数据库连接成功\n');

        // ============ 初始化合同相关工具（包含执行配置） ============
        console.log('📦 初始化合同相关工具...');
        const tools = [
            {
                toolId: 'contract.template.list',
                name: '获取合同范本列表',
                description: '获取可用的合同范本列表，包括范本名称、分类、状态等基本信息。用于展示可选范本或帮助用户选择合适的范本。',
                usage: `\`\`\`tool_call
{
  "toolId": "contract.template.list",
  "params": {
    "categoryId": "可选，按分类筛选",
    "status": "可选，active/inactive",
    "limit": 20
  }
}
\`\`\``,
                examples: `**获取所有启用的范本**
\`\`\`tool_call
{"toolId": "contract.template.list", "params": {"status": "active"}}
\`\`\`

**按分类获取范本**
\`\`\`tool_call
{"toolId": "contract.template.list", "params": {"categoryId": "xxx", "status": "active"}}
\`\`\``,
                category: 'contract',
                enabled: true,
                order: 10,
                // 执行配置：声明式定义工具逻辑
                execution: {
                    type: 'simple',
                    collection: 'contracttemplates',
                    operation: 'find',
                    query: {
                        status: '{{params.status}}',
                        category: '{{params.categoryId}}',
                    },
                    projection: {
                        name: 1,
                        category: 1,
                        status: 1,
                        isDefault: 1,
                        placeholders: 1,
                        createdAt: 1,
                    },
                    sort: { createdAt: -1 },
                    limit: '{{params.limit || 20}}',
                },
                paramsSchema: {
                    type: 'object',
                    properties: {
                        categoryId: { type: 'string', description: '分类ID' },
                        status: { type: 'string', enum: ['active', 'inactive'] },
                        limit: { type: 'number', default: 20 },
                    },
                },
            },
            {
                toolId: 'contract.template.match',
                name: '智能匹配合同范本',
                description: '根据用户对合同需求的描述，获取所有可用范本供 AI 分析匹配。AI 将根据范本名称、分类、内容特征选择最合适的范本。',
                usage: `\`\`\`tool_call
{
  "toolId": "contract.template.match",
  "params": {
    "description": "用户对合同需求的描述",
    "clientInfo": "可选，客户相关信息用于更精准匹配"
  }
}
\`\`\``,
                examples: `**根据描述匹配范本**
\`\`\`tool_call
{"toolId": "contract.template.match", "params": {"description": "我要签一个翻译服务的合同"}}
\`\`\``,
                category: 'contract',
                enabled: true,
                order: 11,
                // 返回所有可用范本，由 AI 根据 description 智能选择
                execution: {
                    type: 'pipeline',
                    steps: [
                        {
                            name: 'fetch_templates',
                            type: 'db_aggregate',
                            collection: 'contracttemplates',
                            pipeline: [
                                { $match: { status: 'active' } },
                                {
                                    $lookup: {
                                        from: 'contracttemplatecategories',
                                        localField: 'category',
                                        foreignField: '_id',
                                        as: 'categoryInfo',
                                    },
                                },
                                { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
                                {
                                    $project: {
                                        name: 1,
                                        categoryName: '$categoryInfo.name',
                                        placeholders: 1,
                                        isDefault: 1,
                                        // 提取内容摘要供 AI 分析
                                        contentPreview: { $substrCP: ['$content', 0, 500] },
                                    },
                                },
                            ],
                        },
                        {
                            name: 'return_result',
                            type: 'return',
                            result: '{{steps.fetch_templates}}',
                            message: '已获取所有可用范本，请根据用户描述"{{params.description}}"选择最合适的范本',
                        },
                    ],
                },
                paramsSchema: {
                    type: 'object',
                    properties: {
                        description: { type: 'string', description: '用户对合同需求的描述' },
                        clientInfo: { type: 'string', description: '客户信息' },
                    },
                    required: ['description'],
                },
            },
            {
                toolId: 'contract.template.analyze',
                name: '分析范本所需数据',
                description: '分析指定合同范本需要填充哪些占位符数据，返回每个占位符的名称和描述。',
                usage: `\`\`\`tool_call
{
  "toolId": "contract.template.analyze",
  "params": {
    "templateId": "范本ID"
  }
}
\`\`\``,
                examples: `**分析范本需要的数据**
\`\`\`tool_call
{"toolId": "contract.template.analyze", "params": {"templateId": "6xxx..."}}
\`\`\``,
                category: 'contract',
                enabled: true,
                order: 12,
                execution: {
                    type: 'pipeline',
                    steps: [
                        {
                            name: 'fetch_template',
                            type: 'db_query',
                            collection: 'contracttemplates',
                            query: { _id: { $oid: '{{params.templateId}}' } },
                            projection: {
                                name: 1,
                                content: 1,
                                placeholders: 1,
                                placeholderMode: 1,
                            },
                            single: true,
                        },
                        {
                            name: 'return_result',
                            type: 'return',
                            result: '{{steps.fetch_template}}',
                            message: '范本分析完成，placeholders 字段包含所有需要填充的占位符',
                        },
                    ],
                },
                paramsSchema: {
                    type: 'object',
                    properties: {
                        templateId: { type: 'string', description: '范本ID' },
                    },
                    required: ['templateId'],
                },
            },
            {
                toolId: 'contract.generate',
                name: '生成合同内容',
                description: '基于指定范本和提供的数据，生成完整的合同内容。会将数据填充到范本的占位符中，返回生成的合同内容预览。',
                usage: `\`\`\`tool_call
{
  "toolId": "contract.generate",
  "params": {
    "templateId": "范本ID",
    "data": {
      "甲方名称": "xxx公司",
      "乙方名称": "xxx",
      "合同金额": "10000"
    }
  }
}
\`\`\``,
                examples: `**生成合同内容**
\`\`\`tool_call
{"toolId": "contract.generate", "params": {"templateId": "6xxx...", "data": {"甲方名称": "中信出版社", "乙方名称": "唐豪服务", "服务内容": "翻译服务", "合同金额": "50000"}}}
\`\`\``,
                category: 'contract',
                enabled: true,
                order: 13,
                execution: {
                    type: 'pipeline',
                    steps: [
                        {
                            name: 'fetch_template',
                            type: 'db_query',
                            collection: 'contracttemplates',
                            query: { _id: { $oid: '{{params.templateId}}' } },
                            projection: { name: 1, content: 1, placeholders: 1 },
                            single: true,
                        },
                        {
                            name: 'generate_content',
                            type: 'template_replace',
                            template: '{{steps.fetch_template.content}}',
                            data: '{{params.data}}',
                        },
                        {
                            name: 'return_result',
                            type: 'return',
                            result: {
                                templateId: '{{params.templateId}}',
                                templateName: '{{steps.fetch_template.name}}',
                                content: '{{steps.generate_content}}',
                                filledData: '{{params.data}}',
                            },
                        },
                    ],
                },
                paramsSchema: {
                    type: 'object',
                    properties: {
                        templateId: { type: 'string', description: '范本ID' },
                        data: { type: 'object', description: '占位符填充数据' },
                    },
                    required: ['templateId', 'data'],
                },
            },
            {
                toolId: 'contract.save',
                name: '保存合同',
                description: '将生成的合同保存到数据库。这是一个需要用户确认的操作。保存后合同会出现在合同列表中。',
                usage: `\`\`\`tool_call
{
  "toolId": "contract.save",
  "params": {
    "templateId": "使用的范本ID",
    "name": "合同名称",
    "content": "合同内容",
    "clientId": "可选，关联的客户ID",
    "projectId": "可选，关联的项目ID"
  },
  "requiresConfirmation": true
}
\`\`\``,
                examples: `**保存合同（需确认）**
\`\`\`tool_call
{"toolId": "contract.save", "params": {"templateId": "6xxx...", "name": "中信出版社翻译服务合同", "content": "...", "clientId": "6xxx..."}, "requiresConfirmation": true}
\`\`\``,
                category: 'contract',
                enabled: true,
                order: 14,
                execution: {
                    type: 'simple',
                    collection: 'generatedcontracts',
                    operation: 'insert',
                    document: {
                        name: '{{params.name}}',
                        templateId: { $oid: '{{params.templateId}}' },
                        content: '{{params.content}}',
                        status: 'draft',
                        clientInfo: {
                            clientId: '{{params.clientId}}',
                        },
                        projectInfo: {
                            projectId: '{{params.projectId}}',
                        },
                        createdAt: { $date: 'now' },
                        updatedAt: { $date: 'now' },
                    },
                    requiresConfirmation: true,
                },
                paramsSchema: {
                    type: 'object',
                    properties: {
                        templateId: { type: 'string', description: '范本ID' },
                        name: { type: 'string', description: '合同名称' },
                        content: { type: 'string', description: '合同内容' },
                        clientId: { type: 'string', description: '客户ID' },
                        projectId: { type: 'string', description: '项目ID' },
                    },
                    required: ['templateId', 'name', 'content'],
                },
            },
            {
                toolId: 'contract.list',
                name: '查询合同列表',
                description: '查询已生成的合同列表，支持按状态、客户、时间等条件筛选。返回合同的基本信息。',
                usage: `\`\`\`tool_call
{
  "toolId": "contract.list",
  "params": {
    "status": "可选，draft/active/signed/cancelled",
    "clientId": "可选，按客户筛选",
    "keyword": "可选，关键词搜索",
    "limit": 20
  }
}
\`\`\``,
                examples: `**查询所有合同**
\`\`\`tool_call
{"toolId": "contract.list", "params": {"limit": 20}}
\`\`\`

**按状态筛选**
\`\`\`tool_call
{"toolId": "contract.list", "params": {"status": "signed"}}
\`\`\``,
                category: 'contract',
                enabled: true,
                order: 15,
                execution: {
                    type: 'simple',
                    collection: 'generatedcontracts',
                    operation: 'find',
                    query: {
                        status: '{{params.status}}',
                        'clientInfo.clientId': '{{params.clientId}}',
                        name: { $regex: '{{params.keyword}}', $options: 'i' },
                    },
                    projection: {
                        name: 1,
                        status: 1,
                        contractNumber: 1,
                        clientInfo: 1,
                        createdAt: 1,
                        updatedAt: 1,
                    },
                    sort: { createdAt: -1 },
                    limit: '{{params.limit || 20}}',
                },
                paramsSchema: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['draft', 'active', 'signed', 'cancelled'] },
                        clientId: { type: 'string' },
                        keyword: { type: 'string' },
                        limit: { type: 'number', default: 20 },
                    },
                },
            },
            {
                toolId: 'contract.get',
                name: '获取合同详情',
                description: '获取指定合同的详细信息，包括合同内容、状态、关联客户/项目等完整信息。',
                usage: `\`\`\`tool_call
{
  "toolId": "contract.get",
  "params": {
    "contractId": "合同ID"
  }
}
\`\`\``,
                examples: `**获取合同详情**
\`\`\`tool_call
{"toolId": "contract.get", "params": {"contractId": "6xxx..."}}
\`\`\``,
                category: 'contract',
                enabled: true,
                order: 16,
                execution: {
                    type: 'simple',
                    collection: 'generatedcontracts',
                    operation: 'findOne',
                    query: { _id: { $oid: '{{params.contractId}}' } },
                },
                paramsSchema: {
                    type: 'object',
                    properties: {
                        contractId: { type: 'string', description: '合同ID' },
                    },
                    required: ['contractId'],
                },
            },
        ];

        for (const tool of tools) {
            await AiTool.updateOne(
                { toolId: tool.toolId },
                { $set: tool },
                { upsert: true }
            );
            console.log(`  ✓ ${tool.name} (${tool.toolId})`);
        }

        // ============ 初始化合同相关地图 ============
        console.log('\n🗺️ 初始化合同相关地图...');
        
        // 先删除旧的合同地图（如果存在）
        await AiMap.deleteMany({ module: 'contract' });
        console.log('  🗑️ 已清理旧的合同地图');

        const maps = [
            {
                mapId: 'generate_contract',
                name: '生成合同',
                description: 'AI 原生合同生成流程：根据用户需求智能匹配范本，收集必要信息，生成完整合同',
                triggers: ['生成合同', '新建合同', '创建合同', '出合同', '拟合同', '写合同', '做合同', '签合同'],
                steps: [
                    {
                        order: 1,
                        action: '询问用户需要什么类型的合同',
                        note: '如果用户已经说明，跳过此步',
                    },
                    {
                        order: 2,
                        action: '获取可用的合同范本列表',
                        toolId: 'contract.template.list',
                        note: '获取所有启用状态的范本',
                    },
                    {
                        order: 3,
                        action: '根据用户描述智能匹配最合适的范本',
                        toolId: 'contract.template.match',
                        note: '分析用户需求，匹配最佳范本',
                    },
                    {
                        order: 4,
                        action: '分析所选范本需要填充的数据',
                        toolId: 'contract.template.analyze',
                        note: '获取所有占位符及其描述',
                    },
                    {
                        order: 5,
                        action: '收集合同所需数据',
                        note: '根据分析结果，向用户询问必要信息，或使用 db.query 从数据库获取客户/项目信息',
                    },
                    {
                        order: 6,
                        action: '生成合同内容',
                        toolId: 'contract.generate',
                        note: '将收集的数据填充到范本中',
                    },
                    {
                        order: 7,
                        action: '展示合同预览，请求用户确认',
                        note: '让用户检查合同内容是否正确',
                    },
                    {
                        order: 8,
                        action: '保存合同到数据库',
                        toolId: 'contract.save',
                        note: '需要用户确认后才执行',
                    },
                ],
                examples: `**用户**: 我要生成一份合同
**AI**: 请问您需要生成什么类型的合同呢？比如服务合同、采购合同、翻译合同等。

**用户**: 翻译服务合同，客户是中信出版社
**AI**: 
1. 调用 contract.template.match 匹配翻译相关范本
2. 调用 contract.template.analyze 分析范本需要的数据
3. 询问用户：服务内容、金额、期限等信息
4. 调用 db.query 获取中信出版社的详细信息
5. 调用 contract.generate 生成合同内容
6. 展示预览，请求确认
7. 确认后调用 contract.save 保存

**工具调用示例**:
\`\`\`tool_call
{"toolId": "contract.template.match", "params": {"description": "翻译服务合同"}}
\`\`\``,
                enabled: true,
                priority: 10,
                module: 'contract',
            },
            {
                mapId: 'query_contracts',
                name: '查询合同',
                description: '查询合同列表或合同详情',
                triggers: ['查合同', '查看合同', '合同列表', '找合同', '哪些合同', '合同情况'],
                steps: [
                    {
                        order: 1,
                        action: '使用 contract.list 查询合同列表',
                        toolId: 'contract.list',
                        note: '根据用户条件筛选',
                    },
                    {
                        order: 2,
                        action: '如果用户想看详情，使用 contract.get 获取',
                        toolId: 'contract.get',
                        condition: '用户指定了具体合同',
                    },
                ],
                examples: `**用户**: 查一下最近的合同
**AI**: 
\`\`\`tool_call
{"toolId": "contract.list", "params": {"limit": 10}}
\`\`\`

**用户**: 查一下中信出版社的合同
**AI**: 
\`\`\`tool_call
{"toolId": "contract.list", "params": {"keyword": "中信出版社"}}
\`\`\``,
                enabled: true,
                priority: 8,
                module: 'contract',
            },
            {
                mapId: 'list_templates',
                name: '查看合同范本',
                description: '查看可用的合同范本列表',
                triggers: ['合同范本', '范本列表', '有哪些范本', '合同模板', '模板列表'],
                steps: [
                    {
                        order: 1,
                        action: '使用 contract.template.list 获取范本列表',
                        toolId: 'contract.template.list',
                    },
                ],
                examples: `**用户**: 我们有哪些合同范本
**AI**: 
\`\`\`tool_call
{"toolId": "contract.template.list", "params": {"status": "active"}}
\`\`\``,
                enabled: true,
                priority: 6,
                module: 'contract',
            },
        ];

        for (const map of maps) {
            await AiMap.create(map);
            console.log(`  ✓ ${map.name} (${map.mapId}) - 优先级: ${map.priority}`);
        }

        console.log('\n✅ 合同模块 AI 配置初始化完成！');
        console.log(`   工具: ${tools.length} 个`);
        console.log(`   地图: ${maps.length} 个`);

    } catch (error) {
        console.error('❌ 初始化失败:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 数据库连接已关闭');
    }
}

initContractAiConfig();

