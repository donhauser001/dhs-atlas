/**
 * AI 工具和地图测试脚本（简化版）
 * 
 * 直接使用 MongoDB 操作来测试，避免 TypeScript 类型问题
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/donhauser';

async function testLoadTools() {
    console.log('\n========== 测试 1: 加载数据库工具 ==========\n');
    
    const db = mongoose.connection.db;
    if (!db) {
        console.log('❌ 数据库未连接');
        return;
    }
    
    const tools = await db.collection('aitools').find({ enabled: true }).toArray();
    console.log(`总共加载了 ${tools.length} 个工具：\n`);
    
    tools.forEach((tool: any) => {
        const hasExec = tool.execution ? '✅ 有执行配置' : '⚠️ 无执行配置';
        console.log(`  - ${tool.toolId} (${tool.name}) [${tool.category}] ${hasExec}`);
        if (tool.execution) {
            console.log(`    类型: ${tool.execution.type}, 操作: ${tool.execution.operation || '管道'}`);
        }
    });
    
    return tools;
}

async function testToolExecution() {
    console.log('\n========== 测试 2: 工具执行测试 ==========\n');
    
    const db = mongoose.connection.db;
    if (!db) {
        console.log('❌ 数据库未连接');
        return;
    }
    
    // 测试 1: 查询客户
    console.log('2.1 测试查询客户（模拟 db.query 工具）');
    try {
        const clients = await db.collection('clients').find({}).limit(3).toArray();
        console.log(`  ✅ 成功，返回 ${clients.length} 条记录`);
        if (clients.length > 0) {
            console.log(`  示例: ${clients[0].name || clients[0]._id}`);
        }
    } catch (error: any) {
        console.log(`  ❌ 失败: ${error.message}`);
    }
    
    // 测试 2: 查询合同范本
    console.log('\n2.2 测试查询合同范本（模拟 contract.template.list 工具）');
    try {
        const templates = await db.collection('contracttemplates').find({}).limit(5).toArray();
        console.log(`  ✅ 成功，返回 ${templates.length} 条记录`);
        if (templates.length > 0) {
            console.log(`  示例: ${templates[0].name || templates[0]._id}`);
        }
    } catch (error: any) {
        console.log(`  ❌ 失败: ${error.message}`);
    }
    
    // 测试 3: 查询已生成合同
    console.log('\n2.3 测试查询已生成合同（模拟 contract.list 工具）');
    try {
        const contracts = await db.collection('generatedcontracts').find({}).limit(3).toArray();
        console.log(`  ✅ 成功，返回 ${contracts.length} 条记录`);
        if (contracts.length > 0) {
            console.log(`  示例: ${contracts[0].name || contracts[0]._id}`);
        }
    } catch (error: any) {
        console.log(`  ❌ 失败: ${error.message}`);
    }
}

async function testAiMaps() {
    console.log('\n========== 测试 3: AI 地图 ==========\n');
    
    const db = mongoose.connection.db;
    if (!db) {
        console.log('❌ 数据库未连接');
        return;
    }
    
    const maps = await db.collection('aimaps').find({ enabled: true }).toArray();
    console.log(`总共 ${maps.length} 个启用的 AI 地图：\n`);
    
    maps.forEach((map: any) => {
        console.log(`地图: ${map.name} (${map.mapId})`);
        console.log(`  模块: ${map.module}`);
        console.log(`  触发词: ${map.triggers?.join(', ') || '无'}`);
        console.log(`  步骤数: ${map.steps?.length || 0}`);
        if (map.steps?.length > 0) {
            console.log(`  步骤详情:`);
            map.steps.forEach((step: any, idx: number) => {
                console.log(`    ${idx + 1}. ${step.action} (工具: ${step.toolId || '无'})`);
            });
        }
        console.log('---');
    });
}

async function testMapMatching() {
    console.log('\n========== 测试 4: 地图匹配 ==========\n');
    
    const db = mongoose.connection.db;
    if (!db) {
        console.log('❌ 数据库未连接');
        return;
    }
    
    const testCases = [
        { message: '帮我生成一份合同', module: 'contracts' },
        { message: '我要生成合同', module: 'contracts' },
        { message: '查询所有合同', module: 'contracts' },
        { message: '查合同列表', module: 'contracts' },
        { message: '获取合同范本列表', module: 'contracts' },
        { message: '有哪些范本可以用', module: 'contracts' },
        { message: '查询客户信息', module: 'clients' },
        { message: '帮我查一下客户', module: 'clients' },
    ];
    
    const maps = await db.collection('aimaps').find({ enabled: true }).sort({ priority: -1 }).toArray();
    const moduleMapping: Record<string, string[]> = {
        clients: ['crm', 'clients', 'general'],
        projects: ['project', 'projects', 'general'],
        contracts: ['contract', 'contracts', 'general'],
    };
    
    for (const { message, module } of testCases) {
        console.log(`测试: "${message}" (模块: ${module})`);
        
        const allowedModules = moduleMapping[module] || ['general'];
        
        let matchedMap = null;
        for (const map of maps) {
            if (!allowedModules.includes(map.module)) continue;
            for (const trigger of map.triggers || []) {
                if (message.includes(trigger)) {
                    matchedMap = map;
                    break;
                }
            }
            if (matchedMap) break;
        }
        
        if (matchedMap) {
            console.log(`  ✅ 匹配到: ${matchedMap.name}`);
            console.log(`     触发词: ${matchedMap.triggers.find((t: string) => message.includes(t))}`);
        } else {
            console.log('  ⚠️ 未匹配到地图');
        }
        console.log('');
    }
}

async function testToolExecutorDirectly() {
    console.log('\n========== 测试 5: 模拟工具执行器 ==========\n');
    
    const db = mongoose.connection.db;
    if (!db) {
        console.log('❌ 数据库未连接');
        return;
    }
    
    // 获取一个工具的执行配置并模拟执行
    const dbQueryTool = await db.collection('aitools').findOne({ toolId: 'db.query', enabled: true });
    
    if (dbQueryTool) {
        console.log('db.query 工具配置:');
        console.log(`  执行类型: ${dbQueryTool.execution?.type}`);
        console.log(`  操作类型: ${dbQueryTool.execution?.operation}`);
        console.log(`  集合: ${dbQueryTool.execution?.collection || '由参数指定'}`);
        
        // 模拟执行简单模式
        if (dbQueryTool.execution?.type === 'simple') {
            console.log('\n模拟执行 db.query (查询 clients):');
            const params = { collection: 'clients', operation: 'find', limit: 2 };
            
            // 解析模板变量
            let collection = dbQueryTool.execution.collection;
            if (collection?.includes('{{params.collection}}')) {
                collection = params.collection;
            }
            
            const results = await db.collection(collection || 'clients')
                .find({})
                .limit(params.limit)
                .toArray();
            
            console.log(`  ✅ 成功，返回 ${results.length} 条记录`);
        }
    } else {
        console.log('❌ 未找到 db.query 工具');
    }
    
    // 检查 contract.list 工具
    const contractListTool = await db.collection('aitools').findOne({ toolId: 'contract.list', enabled: true });
    
    if (contractListTool) {
        console.log('\ncontract.list 工具配置:');
        console.log(`  执行类型: ${contractListTool.execution?.type}`);
        console.log(`  操作类型: ${contractListTool.execution?.operation}`);
        console.log(`  集合: ${contractListTool.execution?.collection}`);
        
        if (contractListTool.execution?.type === 'simple' && contractListTool.execution?.collection) {
            console.log('\n模拟执行 contract.list:');
            const results = await db.collection(contractListTool.execution.collection)
                .find({})
                .limit(3)
                .toArray();
            
            console.log(`  ✅ 成功，返回 ${results.length} 条记录`);
        }
    } else {
        console.log('\n❌ 未找到 contract.list 工具');
    }
}

async function testAiCapabilities() {
    console.log('\n========== 测试 6: AI 能力汇总 ==========\n');
    
    const db = mongoose.connection.db;
    if (!db) {
        console.log('❌ 数据库未连接');
        return;
    }
    
    // 统计各类数据
    const toolsCount = await db.collection('aitools').countDocuments({ enabled: true });
    const toolsWithExec = await db.collection('aitools').countDocuments({ enabled: true, execution: { $exists: true, $ne: null } });
    const mapsCount = await db.collection('aimaps').countDocuments({ enabled: true });
    const dataModelsCount = await db.collection('aidatamodels').countDocuments({ enabled: true });
    const templatesCount = await db.collection('aitemplates').countDocuments({ enabled: true });
    
    console.log('AI 系统能力汇总:');
    console.log(`  工具总数: ${toolsCount}`);
    console.log(`  已配置执行逻辑的工具: ${toolsWithExec}`);
    console.log(`  AI 地图: ${mapsCount}`);
    console.log(`  数据模型: ${dataModelsCount}`);
    console.log(`  输出模板: ${templatesCount}`);
    
    // 按分类统计工具
    console.log('\n工具分类统计:');
    const categories = await db.collection('aitools').aggregate([
        { $match: { enabled: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]).toArray();
    
    categories.forEach((cat: any) => {
        console.log(`  ${cat._id}: ${cat.count} 个`);
    });
}

async function main() {
    try {
        console.log('连接数据库...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ 数据库连接成功\n');
        
        // 执行所有测试
        await testLoadTools();
        await testToolExecution();
        await testAiMaps();
        await testMapMatching();
        await testToolExecutorDirectly();
        await testAiCapabilities();
        
        console.log('\n========== 测试完成 ==========\n');
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    } finally {
        await mongoose.disconnect();
        console.log('数据库连接已关闭');
    }
}

main();
