/**
 * Phase 1 测试脚本
 * 
 * 测试内容：
 * 1. AuditLog 持久化
 * 2. RBAC 权限检查
 * 3. 参数验证
 * 4. 敏感字段过滤
 */

import mongoose from 'mongoose';
import { processAgentRequest } from '../ai/agent/agent-service';
import { auditLogService } from '../services/AuditLogService';
import { aiPermissionService } from '../services/AiPermissionService';
import AuditLog from '../models/AuditLog';
// AiDataModel 已移除，数据结构现在由 DataMapService 自动从 Schema 提取
import AiTool from '../models/AiToolkit';
import User from '../models/User';

// 连接到 MongoDB
async function connectDB() {
    const dbUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/donhauser';
    await mongoose.connect(dbUri);
    console.log('✅ 数据库连接成功');
}

// 辅助函数：打印分隔线
function printSection(title: string) {
    console.log('\n' + '═'.repeat(60));
    console.log(`📋 ${title}`);
    console.log('─'.repeat(60));
}

// 测试 1: AuditLog 持久化
async function testAuditLogPersistence() {
    printSection('测试 1: AuditLog 持久化');

    const testEntry = {
        userId: 'test-user-001',
        toolId: 'db.query',
        params: { collection: 'clients', query: { name: 'test' } },
        success: true,
        duration: 100,
        timestamp: new Date(),
        sessionId: 'test-session-001',
        requestId: `test-request-${Date.now()}`,
    };

    // 使用同步方法确保写入
    const log = await auditLogService.logSync(testEntry);

    if (log) {
        console.log('✅ 审计日志写入成功');
        console.log(`   - ID: ${log._id}`);
        console.log(`   - RequestId: ${log.requestId}`);
    } else {
        console.log('❌ 审计日志写入失败');
        return false;
    }

    // 验证可以查询到
    const found = await auditLogService.getByRequestId(testEntry.requestId);
    if (found) {
        console.log('✅ 审计日志查询成功');
    } else {
        console.log('❌ 审计日志查询失败');
        return false;
    }

    // 测试统计查询
    const stats = await auditLogService.getStats({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(),
    });
    console.log('✅ 审计日志统计:');
    console.log(`   - 总调用: ${stats.totalCalls}`);
    console.log(`   - 成功: ${stats.successCalls}`);
    console.log(`   - 成功率: ${stats.successRate}%`);

    return true;
}

// 测试 2: RBAC 权限检查
async function testRBACPermission() {
    printSection('测试 2: RBAC 权限检查');

    // 创建测试用户
    const testUserId = new mongoose.Types.ObjectId().toString();

    // 测试 1: 用户不存在
    const result1 = await aiPermissionService.checkToolPermission(testUserId, 'db.query');
    console.log(`用户不存在检查: ${result1.allowed ? '允许' : '拒绝'} (${result1.reasonCode || '-'})`);

    // 创建一个测试用户
    const testUser = await User.create({
        username: `test-phase1-${Date.now()}`,
        password: 'test123456',
        email: `test-phase1-${Date.now()}@test.com`,
        phone: '13800138000',
        realName: '测试用户',
        role: '员工',
        department: '测试部门',
        status: 'active',
        permissions: ['ai:db.query'], // 给予 db.query 权限
    });

    console.log(`✅ 创建测试用户: ${testUser._id}`);

    // 测试 2: 有权限的工具
    const result2 = await aiPermissionService.checkToolPermission(testUser._id.toString(), 'db.query');
    console.log(`有权限工具检查: ${result2.allowed ? '✅ 允许' : '❌ 拒绝'}`);

    // 测试 3: 无权限的工具
    const result3 = await aiPermissionService.checkToolPermission(testUser._id.toString(), 'contract.generate');
    console.log(`无权限工具检查: ${result3.allowed ? '允许' : '✅ 拒绝'} (${result3.reasonCode || '-'})`);

    // 测试 4: 超级管理员
    const adminUser = await User.create({
        username: `test-admin-${Date.now()}`,
        password: 'test123456',
        email: `test-admin-${Date.now()}@test.com`,
        phone: '13800138001',
        realName: '测试管理员',
        role: '超级管理员',
        department: '管理部门',
        status: 'active',
    });

    const result4 = await aiPermissionService.checkToolPermission(adminUser._id.toString(), 'contract.generate');
    console.log(`超级管理员检查: ${result4.allowed ? '✅ 允许' : '❌ 拒绝'}`);

    // 清理测试数据
    await User.deleteOne({ _id: testUser._id });
    await User.deleteOne({ _id: adminUser._id });
    console.log('✅ 清理测试用户');

    return true;
}

// 测试 3: 参数验证
async function testParamValidation() {
    printSection('测试 3: 参数验证');

    // 确保 db.query 工具存在
    await AiTool.updateOne(
        { toolId: 'db.query' },
        {
            $set: {
                name: '数据库查询',
                description: '执行 MongoDB 查询',
                category: 'database',
                enabled: true,
                paramsSchema: {
                    type: 'object',
                    properties: {
                        collection: { type: 'string', description: '集合名称' },
                        operation: {
                            type: 'string',
                            enum: ['find', 'findOne', 'aggregate', 'count'],
                            default: 'find',
                        },
                        query: { type: 'object', description: '查询条件' },
                        limit: { type: 'number', default: 20 },
                    },
                    required: ['collection'],
                },
                execution: {
                    type: 'simple',
                    collection: '{{params.collection}}',
                    operation: '{{params.operation || "find"}}',
                    query: '{{params.query || {}}}',
                    limit: '{{params.limit || 20}}',
                },
            },
        },
        { upsert: true }
    );

    // 测试 1: 缺少必填参数
    const { ToolExecutor } = await import('../ai/tools/executor');
    const result1 = await ToolExecutor.execute('db.query', {});
    console.log(`缺少必填参数: ${result1.success ? '❌ 通过' : '✅ 拒绝'} - ${result1.error?.code || ''}`);

    // 测试 2: 正常参数
    const result2 = await ToolExecutor.execute('db.query', { collection: 'clients', limit: 5 });
    console.log(`正常参数: ${result2.success ? '✅ 通过' : '❌ 拒绝'}`);
    if (result2.success) {
        console.log(`   - 返回数据条数: ${Array.isArray(result2.data) ? result2.data.length : 'N/A'}`);
    }

    // 测试 3: 危险操作符
    const result3 = await ToolExecutor.execute('db.query', {
        collection: 'clients',
        query: { $where: 'this.name === "test"' },
    });
    console.log(`危险操作符: ${result3.success ? '❌ 通过' : '✅ 拒绝'} - ${result3.error?.code || ''}`);

    // 测试 4: 访问 users 集合（现在应该可以访问，因为白名单已移除）
    const result4 = await ToolExecutor.execute('db.query', { collection: 'users' });
    console.log(`访问 users 集合: ${result4.success ? '✅ 通过' : '❌ 拒绝'} - ${result4.error?.code || ''}`);

    return true;
}

// 测试 4: 敏感字段过滤
async function testSensitiveFieldFilter() {
    printSection('测试 4: 敏感字段过滤');

    // 创建一个包含敏感字段的测试文档
    const db = mongoose.connection.db;
    if (!db) {
        console.log('❌ 数据库未连接');
        return false;
    }

    const testCollection = db.collection('clients');
    const testDoc = {
        name: '测试客户',
        email: 'test@example.com',
        password: 'secret123', // 敏感字段
        apiKey: 'ak_xxxxx', // 敏感字段
        _internal: 'internal', // 私有字段
    };

    // 插入测试数据
    const insertResult = await testCollection.insertOne(testDoc);
    console.log(`✅ 插入测试数据: ${insertResult.insertedId}`);

    // 通过工具查询
    const { ToolExecutor } = await import('../ai/tools/executor');
    const result = await ToolExecutor.execute('db.query', {
        collection: 'clients',
        query: { _id: insertResult.insertedId },
    });

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const data = result.data[0];
        console.log('返回的字段:', Object.keys(data).join(', '));

        // 检查敏感字段是否被过滤
        const hasPassword = 'password' in data;
        const hasApiKey = 'apiKey' in data;
        const hasInternal = '_internal' in data;

        console.log(`password 字段: ${hasPassword ? '❌ 未过滤' : '✅ 已过滤'}`);
        console.log(`apiKey 字段: ${hasApiKey ? '❌ 未过滤' : '✅ 已过滤'}`);
        console.log(`_internal 字段: ${hasInternal ? '❌ 未过滤' : '✅ 已过滤'}`);
    }

    // 清理测试数据
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ 清理测试数据');

    return true;
}

// 测试 5: 完整的 Agent 调用
async function testAgentIntegration() {
    printSection('测试 5: Agent 集成测试');

    // 创建测试用户
    const testUser = await User.create({
        username: `test-agent-${Date.now()}`,
        password: 'test123456',
        email: `test-agent-${Date.now()}@test.com`,
        phone: '13800138002',
        realName: '测试用户',
        role: '项目经理',
        department: '测试部门',
        status: 'active',
    });

    console.log(`✅ 创建测试用户: ${testUser._id}`);

    // 调用 Agent
    const response = await processAgentRequest({
        message: '查询一下客户列表',
        history: [],
        context: {
            module: 'clients',
            pageType: 'list',
            pathname: '/clients',
        },
        userId: testUser._id.toString(),
        sessionId: `test-session-${Date.now()}`,
    });

    console.log('Agent 响应:');
    console.log(`   - 内容长度: ${response.content.length} 字符`);
    console.log(`   - 工具调用: ${response.toolResults?.length || 0} 个`);

    // 检查审计日志
    const recentLogs = await auditLogService.getByUser(testUser._id.toString(), undefined, { limit: 10 });
    console.log(`   - 审计日志: ${recentLogs.total} 条`);

    // 清理
    await User.deleteOne({ _id: testUser._id });
    console.log('✅ 清理测试用户');

    return true;
}

// 主函数
async function main() {
    try {
        await connectDB();

        console.log('\n' + '═'.repeat(60));
        console.log('🚀 Phase 1 系统守门层测试');
        console.log('═'.repeat(60));

        await testAuditLogPersistence();
        await testRBACPermission();
        await testParamValidation();
        await testSensitiveFieldFilter();
        await testAgentIntegration();

        printSection('测试完成');
        console.log('✅ 所有测试执行完毕');

    } catch (error) {
        console.error('❌ 测试失败:', error);
    } finally {
        await mongoose.disconnect();
    }
}

main().catch(console.error);

