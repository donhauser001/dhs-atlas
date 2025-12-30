/**
 * 初始化 Schema 相关工具
 * 
 * 添加 datamodel.get 和 schema.list 工具到数据库
 * 这些工具使用自定义处理器，自动从 Mongoose Schema 提取信息
 * 
 * 运行方式：
 * docker exec donhauser-backend npx ts-node --transpile-only src/scripts/initSchemaTools.ts
 */

import mongoose from 'mongoose';
import AiTool from '../models/AiToolkit';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/donhauser';

async function initSchemaTools() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ 数据库连接成功');

        const tools = [
            {
                toolId: 'schema.search',
                name: '搜索相关数据表',
                description: '根据关键词搜索相关的数据表。返回匹配的表、关键字段和关联关系。这是查询前的首选工具，只返回相关的表，节省 token。',
                usage: `\`\`\`tool_call
{"toolId": "schema.search", "params": {"keyword": "客户", "entityName": "丁媛媛"}}
\`\`\``,
                examples: `**搜索客户，并提供实体名称以获取智能推荐**
\`\`\`tool_call
{"toolId": "schema.search", "params": {"keyword": "客户", "entityName": "丁媛媛"}}
\`\`\`

返回示例:
{
  "tables": [...],
  "relations": ["Project.clientId → Client"],
  "disambiguation": "💡 '客户'有两种含义：\\n  • 如果是人名 → users.realName\\n  • 如果是公司名 → clients.name\\n  ✅ '丁媛媛' 匹配人名规则",
  "recommendedQuery": "{\\"collection\\": \\"users\\", \\"query\\": {\\"realName\\": {\\"$regex\\": \\"丁媛媛\\"}, \\"role\\": \\"client\\"}}",
  "message": "找到 2 个相关表。⚠️ 注意消歧义提示"
}

**只搜索关键词（不提供实体名称）**
\`\`\`tool_call
{"toolId": "schema.search", "params": {"keyword": "项目报价"}}
\`\`\``,
                category: 'schema',
                enabled: true,
                order: 0,
                execution: {
                    type: 'custom',
                    handler: 'schemaSearch',
                },
                paramsSchema: {
                    type: 'object',
                    properties: {
                        keyword: { type: 'string', description: '搜索关键词，如"客户"、"项目"、"报价"' },
                        entityName: { type: 'string', description: '可选，实体名称（如人名、公司名），用于智能消歧义和推荐查询' },
                    },
                    required: ['keyword'],
                },
            },
            {
                toolId: 'datamodel.get',
                name: '获取数据模型详情',
                description: '获取指定集合的详细字段信息。查询数据库前必须先调用此工具获取正确的字段名！',
                usage: `\`\`\`tool_call
{"toolId": "datamodel.get", "params": {"collection": "集合名"}}
\`\`\``,
                examples: `**获取客户表字段**
\`\`\`tool_call
{"toolId": "datamodel.get", "params": {"collection": "clients"}}
\`\`\`

**获取用户表字段**
\`\`\`tool_call
{"toolId": "datamodel.get", "params": {"collection": "users"}}
\`\`\`

返回示例:
{
  "found": true,
  "collection": "clients",
  "model": "Client",
  "fields": [
    "name: String (必填)",
    "address: String",
    "status: String [active|inactive]",
    ...
  ],
  "relations": ["无外键关联"]
}`,
                category: 'schema',
                enabled: true,
                order: 1,
                execution: {
                    type: 'custom',
                    handler: 'datamodelGet',
                },
                paramsSchema: {
                    type: 'object',
                    properties: {
                        collection: { type: 'string', description: '集合名称或模型名称' },
                    },
                    required: ['collection'],
                },
            },
            {
                toolId: 'map.search',
                name: '搜索业务地图',
                description: '搜索业务流程指南。当需要执行复杂的多步骤业务操作时使用。',
                usage: `\`\`\`tool_call
{"toolId": "map.search", "params": {"keyword": "关键词"}}
\`\`\``,
                examples: `**搜索查询客户相关的地图**
\`\`\`tool_call
{"toolId": "map.search", "params": {"keyword": "查询客户"}}
\`\`\``,
                category: 'schema',
                enabled: true,
                order: 2,
                execution: {
                    type: 'custom',
                    handler: 'mapSearch',
                },
                paramsSchema: {
                    type: 'object',
                    properties: {
                        keyword: { type: 'string', description: '搜索关键词' },
                    },
                    required: ['keyword'],
                },
            },
        ];

        console.log('\n📦 初始化 Schema 工具...');
        for (const tool of tools) {
            await AiTool.updateOne(
                { toolId: tool.toolId },
                { $set: tool },
                { upsert: true }
            );
            console.log(`  ✓ ${tool.name} (${tool.toolId})`);
        }

        console.log('\n✅ Schema 工具初始化完成！');
    } catch (error) {
        console.error('❌ 初始化失败:', error);
    } finally {
        await mongoose.disconnect();
    }
}

initSchemaTools();

