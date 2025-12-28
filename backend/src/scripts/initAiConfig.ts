/**
 * AI 配置初始化脚本
 * 
 * 初始化 AI 工具集、数据模型、样例模板
 * 
 * 运行方式：
 * docker exec donhauser-backend npx ts-node --transpile-only src/scripts/initAiConfig.ts
 */

import mongoose from 'mongoose';
import AiTool from '../models/AiToolkit';
import AiDataModel from '../models/AiDataModel';
import AiTemplate from '../models/AiTemplate';
import AiMap from '../models/AiMap';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/donhauser';

async function initAiConfig() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ 数据库连接成功');

        // 初始化工具集
        console.log('\n📦 初始化工具集...');
        const tools = [
            {
                toolId: 'db.query',
                name: '数据库查询',
                description: '执行 MongoDB 查询，获取数据。可以查询客户、项目、报价单等任何白名单中的数据。',
                usage: `\`\`\`tool_call
{
  "toolId": "db.query",
  "params": {
    "collection": "clients",
    "operation": "find",
    "query": { "name": { "$regex": "中信", "$options": "i" } },
    "limit": 10
  }
}
\`\`\``,
                examples: `**查询客户**
\`\`\`tool_call
{"toolId": "db.query", "params": {"collection": "clients", "operation": "find", "query": {"name": "中信出版社"}}}
\`\`\`

**统计数量**
\`\`\`tool_call
{"toolId": "db.query", "params": {"collection": "clients", "operation": "count", "query": {"status": "active"}}}
\`\`\`

**模糊搜索**
\`\`\`tool_call
{"toolId": "db.query", "params": {"collection": "clients", "operation": "find", "query": {"name": {"$regex": "出版", "$options": "i"}}}}
\`\`\``,
                category: 'database',
                enabled: true,
                order: 1,
            },
            {
                toolId: 'ui.form',
                name: '打开表单',
                description: '在画布上打开新建或编辑表单。支持预填数据。',
                usage: `\`\`\`ui_form
{
  "formId": "client-create",
  "mode": "create",
  "initialData": { "name": "客户名称" }
}
\`\`\``,
                examples: `**新建客户**
\`\`\`ui_form
{"formId": "client-create", "mode": "create"}
\`\`\`

**新建客户并预填信息**
\`\`\`ui_form
{"formId": "client-create", "mode": "create", "initialData": {"name": "中信出版社", "address": "北京市"}}
\`\`\``,
                category: 'ui',
                enabled: true,
                order: 2,
            },
            {
                toolId: 'ai.capabilities',
                name: '查询 AI 能力',
                description: 'AI 可以调用此工具来查询自己可用的工具、数据模型和输出模板。用于不确定如何操作时获取上下文。',
                usage: `\`\`\`tool_call
{"toolId": "ai.capabilities", "params": {}}
\`\`\``,
                examples: '',
                category: 'system',
                enabled: true,
                order: 0,
            },
            {
                toolId: 'crm.contact_stats',
                name: '联系人项目统计',
                description: '统计某客户下各联系人的项目数量和金额。直接返回聚合好的统计数据，无需 AI 自行计算，可避免幻觉。',
                usage: `\`\`\`tool_call
{"toolId": "crm.contact_stats", "params": {"clientName": "中信出版社", "includeAmount": false}}
\`\`\``,
                examples: `**统计联系人项目数**
\`\`\`tool_call
{"toolId": "crm.contact_stats", "params": {"clientName": "中信出版社"}}
\`\`\`

**包含金额统计**
\`\`\`tool_call
{"toolId": "crm.contact_stats", "params": {"clientName": "中信出版社", "includeAmount": true}}
\`\`\``,
                category: 'crm',
                enabled: true,
                order: 3,
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

        // 初始化数据模型
        console.log('\n📊 初始化数据模型...');
        const dataModels = [
            {
                collection: 'clients',
                name: '客户表',
                description: '存储所有客户信息，包括基本资料和开票信息',
                fields: `- \`_id\`: ObjectId (主键)
- \`name\`: string (客户名称，必填)
- \`address\`: string (地址)
- \`invoiceType\`: '增值税专用发票' | '增值税普通发票' | '不开票' (发票类型)
- \`invoiceInfo\`: string (开票信息，包含纳税人识别号等)
- \`category\`: string (客户分类，关联 clientcategories)
- \`rating\`: number 1-5 (评级)
- \`summary\`: string (备注/摘要)
- \`status\`: 'active' | 'inactive' (状态)
- \`createTime\`, \`updateTime\`: Date (创建/更新时间)`,
                relations: `- \`projects\` (项目表): 通过 \`clientId\` 关联，一个客户可有多个项目
- \`quotations\` (报价单表): 通过 \`clientId\` 关联，一个客户可有多个报价单
- \`clientcategories\` (客户分类表): 通过 \`category\` 字段名称关联`,
                queryExamples: `**按名称查询**
\`\`\`json
{"name": "中信出版社"}
\`\`\`

**模糊搜索**
\`\`\`json
{"name": {"$regex": "出版", "$options": "i"}}
\`\`\``,
                enabled: true,
                order: 1,
            },
            {
                collection: 'projects',
                name: '项目表',
                description: '存储项目信息，包含客户、联系人、金额等',
                fields: `- \`_id\`: ObjectId (主键)
- \`projectName\`: string (项目名称)
- \`clientId\`: ObjectId (关联客户ID)
- \`clientName\`: string (客户名称，冗余字段)
- \`contactIds\`: ObjectId[] (联系人ID数组)
- \`contactNames\`: string[] (联系人姓名数组)
- \`contactPhones\`: string[] (联系人电话数组)
- \`progressStatus\`: 'pending' | 'in-progress' | 'completed' | 'cancelled' (进度状态)
- \`settlementStatus\`: 'unpaid' | 'partial' | 'paid' (结算状态)
- \`createdAt\`, \`updatedAt\`: Date`,
                relations: `- \`clients\` (客户表): 通过 \`clientId\` 关联
- \`settlements\` (结算表): 通过 \`projectId\` 关联`,
                queryExamples: `**查询某客户的所有项目**
\`\`\`json
{"clientName": {"$regex": "中信", "$options": "i"}}
\`\`\`

**按状态筛选**
\`\`\`json
{"progressStatus": "in-progress"}
\`\`\``,
                enabled: true,
                order: 2,
            },
            {
                collection: 'settlements',
                name: '结算表',
                description: '存储项目结算/付款信息',
                fields: `- \`_id\`: ObjectId (主键)
- \`projectId\`: ObjectId (关联项目)
- \`totalAmount\`: number (结算金额)
- \`status\`: 'pending' | 'completed' (结算状态)
- \`createdAt\`: Date`,
                relations: `- \`projects\` (项目表): 通过 \`projectId\` 关联`,
                queryExamples: `**查询某项目的结算**
\`\`\`json
{"projectId": ObjectId("xxx")}
\`\`\``,
                enabled: true,
                order: 3,
            },
            {
                collection: 'quotations',
                name: '报价单表',
                description: '存储报价单信息',
                fields: `- \`_id\`: ObjectId (主键)
- \`clientId\`: ObjectId (关联客户)
- \`items\`: array (报价项)
- \`totalAmount\`: number (总金额)
- \`status\`: string (状态)
- \`createdAt\`, \`updatedAt\`: Date`,
                relations: `- \`clients\` (客户表): 通过 \`clientId\` 关联`,
                queryExamples: '',
                enabled: true,
                order: 4,
            },
            {
                collection: 'clientcategories',
                name: '客户分类表',
                description: '客户分类字典表',
                fields: `- \`_id\`: ObjectId
- \`name\`: string (分类名称)
- \`status\`: 'active' | 'inactive'`,
                relations: `- \`clients\` (客户表): 通过 \`category\` 字段名称关联`,
                queryExamples: '',
                enabled: true,
                order: 5,
            },
        ];

        for (const model of dataModels) {
            await AiDataModel.updateOne(
                { collection: model.collection },
                { $set: model },
                { upsert: true }
            );
            console.log(`  ✓ ${model.name} (${model.collection})`);
        }

        // 初始化样例模板
        console.log('\n📝 初始化样例模板...');
        const templates = [
            {
                templateId: 'client_detail',
                name: '客户详情',
                scenario: '查询单个客户详细信息时使用',
                template: `### 客户信息

| 字段 | 内容 |
|------|------|
| 客户名称 | {{name}} |
| 地址 | {{address}} |
| 客户分类 | {{category}} |
| 评级 | {{rating}}/5 |
| 状态 | {{status}} |

#### 开票信息

| 字段 | 内容 |
|------|------|
| 发票类型 | {{invoiceType}} |
| 开票信息 | {{invoiceInfo}} |

#### 其他
- 创建时间: {{createTime}}
- 更新时间: {{updateTime}}
- 备注: {{summary}}`,
                tags: ['客户', '详情', '单条记录'],
                enabled: true,
                order: 1,
            },
            {
                templateId: 'client_list',
                name: '客户列表',
                scenario: '查询多个客户时使用',
                template: `### 客户列表 (共 {{count}} 条)

| 客户名称 | 分类 | 评级 | 状态 |
|----------|------|------|------|
{{#each clients}}
| {{name}} | {{category}} | {{rating}}/5 | {{status}} |
{{/each}}`,
                tags: ['客户', '列表', '多条记录'],
                enabled: true,
                order: 2,
            },
            {
                templateId: 'project_list',
                name: '项目列表',
                scenario: '查询项目列表时使用',
                template: `### 项目列表 (共 {{count}} 条)

| 项目名称 | 状态 | 创建时间 |
|----------|------|----------|
{{#each projects}}
| {{name}} | {{status}} | {{createTime}} |
{{/each}}`,
                tags: ['项目', '列表'],
                enabled: true,
                order: 3,
            },
            {
                templateId: 'not_found',
                name: '未找到记录',
                scenario: '查询结果为空时使用',
                template: `没有找到符合条件的记录。

您可以：
- 检查搜索条件是否正确
- 尝试更宽泛的搜索词
- 新建一条记录`,
                tags: ['空结果', '提示'],
                enabled: true,
                order: 10,
            },
            {
                templateId: 'contact_stats',
                name: '联系人统计',
                scenario: '统计某客户下各联系人的项目数量时使用',
                template: `### {{clientName}} 联系人统计

| 联系人 | 项目数量 | 项目列表 |
|--------|----------|----------|
{{#each contacts}}
| {{name}} | {{count}} | {{projects}} |
{{/each}}

**总结**: 共 {{totalContacts}} 位联系人，{{totalProjects}} 个项目。项目最多的是 **{{topContact}}**（{{topCount}} 个项目）。`,
                tags: ['联系人', '统计', '客户'],
                enabled: true,
                order: 5,
            },
            {
                templateId: 'project_amount_stats',
                name: '项目金额统计',
                scenario: '统计项目金额时使用',
                template: `### {{clientName}} 项目金额统计

| 联系人 | 项目数 | 总金额 | 项目列表 |
|--------|--------|--------|----------|
{{#each contacts}}
| {{name}} | {{count}} | ¥{{amount}} | {{projects}} |
{{/each}}

**总结**: 
- 总项目数: {{totalProjects}}
- 总金额: ¥{{totalAmount}}
- 金额最高: **{{topAmountContact}}**（¥{{topAmount}}）
- 项目最多: **{{topCountContact}}**（{{topCount}} 个）`,
                tags: ['金额', '统计', '项目'],
                enabled: true,
                order: 6,
            },
        ];

        for (const template of templates) {
            await AiTemplate.updateOne(
                { templateId: template.templateId },
                { $set: template },
                { upsert: true }
            );
            console.log(`  ✓ ${template.name} (${template.templateId})`);
        }

        // 初始化 AI 地图
        console.log('\n🗺️ 初始化 AI 地图...');
        const maps = [
            {
                mapId: 'query_client',
                name: '查询客户',
                description: '根据客户名称或条件查询客户信息',
                triggers: ['查询', '查一下', '找一下', '搜索', '查找', '信息', '资料', '详情'],
                steps: [
                    {
                        order: 1,
                        action: '使用 db.query 工具查询 clients 集合',
                        toolId: 'db.query',
                        dataModel: 'clients',
                        note: '根据用户提供的名称进行模糊匹配',
                    },
                    {
                        order: 2,
                        action: '使用 client_detail 模板输出结果',
                        templateId: 'client_detail',
                        condition: '找到单个客户时',
                    },
                    {
                        order: 3,
                        action: '使用 client_list 模板输出结果',
                        templateId: 'client_list',
                        condition: '找到多个客户时',
                    },
                    {
                        order: 4,
                        action: '使用 not_found 模板提示',
                        templateId: 'not_found',
                        condition: '未找到客户时',
                    },
                ],
                examples: `**用户**: 查一下中信出版社的信息
**AI**: 
1. 调用 db.query 查询 clients 表
2. 找到客户后，使用 client_detail 模板输出

**工具调用**:
\`\`\`tool_call
{"toolId": "db.query", "params": {"collection": "clients", "operation": "find", "query": {"name": {"$regex": "中信出版社", "$options": "i"}}}}
\`\`\``,
                enabled: true,
                priority: 10,
                module: 'crm',
            },
            {
                mapId: 'create_client',
                name: '新建客户',
                description: '创建新客户，打开表单并协助填写',
                triggers: ['新建客户', '创建客户', '添加客户', '录入客户'],
                steps: [
                    {
                        order: 1,
                        action: '先查询是否已存在同名客户',
                        toolId: 'db.query',
                        dataModel: 'clients',
                        note: '避免重复创建',
                    },
                    {
                        order: 2,
                        action: '打开新建客户表单',
                        toolId: 'ui.form',
                        note: '使用 client-create 表单',
                    },
                    {
                        order: 3,
                        action: '根据用户提供的信息预填表单',
                        note: '将已知信息填入 initialData',
                    },
                ],
                examples: `**用户**: 帮我新建一个客户，叫中信出版社
**AI**:
1. 先查询是否已存在
2. 如果不存在，打开表单并预填名称

**工具调用**:
\`\`\`ui_form
{"formId": "client-create", "mode": "create", "initialData": {"name": "中信出版社"}}
\`\`\``,
                enabled: true,
                priority: 10,
                module: 'crm',
            },
            {
                mapId: 'query_client_projects',
                name: '查询客户项目',
                description: '查询指定客户的关联项目',
                triggers: ['客户的项目', '关联项目', '查项目', '有哪些项目'],
                steps: [
                    {
                        order: 1,
                        action: '使用 clientName 字段直接查询 projects 集合',
                        toolId: 'db.query',
                        dataModel: 'projects',
                        note: 'projects 表有 clientName 冗余字段，可直接模糊匹配',
                    },
                    {
                        order: 2,
                        action: '使用 project_list 模板输出结果',
                        templateId: 'project_list',
                    },
                ],
                examples: `**用户**: 查一下中信出版社有哪些项目
**AI**: 直接查询 projects 表的 clientName 字段

**工具调用**:
\`\`\`tool_call
{"toolId": "db.query", "params": {"collection": "projects", "operation": "find", "query": {"clientName": {"$regex": "中信", "$options": "i"}}}}
\`\`\``,
                enabled: true,
                priority: 5,
                module: 'crm',
            },
            {
                mapId: 'query_contact_stats',
                name: '联系人项目统计',
                description: '统计某客户下各联系人的项目数量，找出项目最多的联系人',
                triggers: ['哪些联系人', '哪个人', '谁的项目', '项目最多'],
                steps: [
                    {
                        order: 1,
                        action: '使用 crm.contact_stats 工具获取聚合好的统计数据',
                        toolId: 'crm.contact_stats',
                        note: '该工具会自动聚合统计，返回真实数据',
                    },
                    {
                        order: 2,
                        action: '使用 contact_stats 模板格式化输出',
                        templateId: 'contact_stats',
                    },
                ],
                examples: `**用户**: 中信出版社有哪些联系人，哪个人项目最多
**AI**: 使用 crm.contact_stats 工具获取统计数据

**工具调用**:
\`\`\`tool_call
{"toolId": "crm.contact_stats", "params": {"clientName": "中信出版社"}}
\`\`\`

**工具返回示例（这是真实数据，直接使用）**:
{
  "clientName": "中信出版社",
  "contacts": [
    {"name": "丁媛媛", "projectCount": 2, "projects": "量子金融科技, 可持续投资"},
    {"name": "立晓", "projectCount": 1, "projects": "企业文化落地"}
  ],
  "summary": {"totalContacts": 6, "totalProjects": 7, "topByProjectCount": "丁媛媛（2个项目）"}
}

**输出**:
直接使用工具返回的数据填充模板，不要编造任何数据！`,
                enabled: true,
                priority: 8,
                module: 'crm',
            },
            {
                mapId: 'query_project_amount',
                name: '项目金额统计',
                description: '统计某客户的项目金额，找出金额最高的联系人',
                triggers: ['金额最高', '金额统计', '多少钱', '结算'],
                steps: [
                    {
                        order: 1,
                        action: '使用 crm.contact_stats 工具并开启金额统计',
                        toolId: 'crm.contact_stats',
                        note: '设置 includeAmount: true 获取金额数据',
                    },
                    {
                        order: 2,
                        action: '使用 project_amount_stats 模板格式化输出',
                        templateId: 'project_amount_stats',
                    },
                ],
                examples: `**用户**: 中信出版社哪个联系人给我们的项目金额最高
**AI**: 使用 crm.contact_stats 工具并开启金额统计

**工具调用**:
\`\`\`tool_call
{"toolId": "crm.contact_stats", "params": {"clientName": "中信出版社", "includeAmount": true}}
\`\`\`

**工具返回示例（这是真实数据）**:
{
  "clientName": "中信出版社",
  "contacts": [
    {"name": "丁媛媛", "projectCount": 2, "projects": "xxx", "totalAmount": 50000},
    {"name": "立晓", "projectCount": 1, "projects": "xxx", "totalAmount": 0}
  ],
  "summary": {"topByAmount": "丁媛媛（¥50000）", "totalAmount": 50000}
}

**输出**:
直接使用工具返回的数据，不要编造！`,
                enabled: true,
                priority: 7,
                module: 'crm',
            },
        ];

        for (const map of maps) {
            await AiMap.updateOne(
                { mapId: map.mapId },
                { $set: map },
                { upsert: true }
            );
            console.log(`  ✓ ${map.name} (${map.mapId})`);
        }

        console.log('\n✅ AI 配置初始化完成！');
    } catch (error) {
        console.error('❌ 初始化失败:', error);
    } finally {
        await mongoose.disconnect();
    }
}

initAiConfig();
