/**
 * AI Agent 测试脚本
 */
import mongoose from 'mongoose';
import { processAgentRequest } from '../ai/agent/agent-service';

async function runTests() {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/donhauser');
    console.log('MongoDB 连接成功\n');

    // 测试1: 查询用户丁媛媛
    console.log('='.repeat(60));
    console.log('测试1: 查询用户丁媛媛');
    console.log('='.repeat(60));

    try {
        const result1 = await processAgentRequest({
            message: '帮我查询用户丁媛媛的详细信息，包括电话、邮箱和公司',
            userId: 'test-user-001',
            sessionId: 'test-session-001',
            context: { module: 'settings', pathname: '/dashboard/settings', pageType: 'list' }
        });

        console.log('\n响应内容:');
        console.log(result1.content);
        console.log('\n工具调用:');
        result1.toolResults?.forEach(t => {
            console.log(`  - ${t.toolId}: ${t.result.success ? '成功' : '失败'}`);
            if (t.result.data) {
                console.log(`    数据: ${JSON.stringify(t.result.data).substring(0, 200)}...`);
            }
        });
    } catch (error) {
        console.error('测试1失败:', error);
    }

    // 测试2: 查询客户中信出版社
    console.log('\n' + '='.repeat(60));
    console.log('测试2: 查询客户中信出版社');
    console.log('='.repeat(60));

    try {
        const result2 = await processAgentRequest({
            message: '查询客户中信出版社的信息',
            userId: 'test-user-001',
            sessionId: 'test-session-002',
            context: { module: 'clients', pathname: '/dashboard/clients', pageType: 'list' }
        });

        console.log('\n响应内容:');
        console.log(result2.content);
        console.log('\n工具调用:');
        result2.toolResults?.forEach(t => {
            console.log(`  - ${t.toolId}: ${t.result.success ? '成功' : '失败'}`);
        });
    } catch (error) {
        console.error('测试2失败:', error);
    }

    // 测试3: 统计项目数量
    console.log('\n' + '='.repeat(60));
    console.log('测试3: 统计项目数量');
    console.log('='.repeat(60));

    try {
        const result3 = await processAgentRequest({
            message: '现在系统里有多少个项目',
            userId: 'test-user-001',
            sessionId: 'test-session-003',
            context: { module: 'projects', pathname: '/dashboard/projects', pageType: 'list' }
        });

        console.log('\n响应内容:');
        console.log(result3.content);
    } catch (error) {
        console.error('测试3失败:', error);
    }

    // 测试4: 中信出版社的联系人（复杂多表查询）
    console.log('\n' + '='.repeat(60));
    console.log('测试4: 中信出版社的联系人');
    console.log('='.repeat(60));

    try {
        const result4 = await processAgentRequest({
            message: '查询中信出版社的联系人',
            userId: 'test-user-001',
            sessionId: 'test-session-004',
            context: { module: 'clients', pathname: '/dashboard/clients', pageType: 'list' }
        });

        console.log('\n响应内容:');
        console.log(result4.content);
        console.log('\n工具调用:');
        result4.toolResults?.forEach(t => {
            console.log(`  - ${t.toolId}: ${t.result.success ? '成功' : '失败'}`);
            if (t.result.data && Array.isArray(t.result.data)) {
                console.log(`    返回 ${t.result.data.length} 条记录`);
            }
        });
    } catch (error) {
        console.error('测试4失败:', error);
    }

    await mongoose.disconnect();
    console.log('\n' + '='.repeat(60));
    console.log('所有测试完成');
    console.log('='.repeat(60));
}

runTests().catch(console.error);

