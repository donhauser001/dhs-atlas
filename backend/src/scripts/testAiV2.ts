/**
 * AI V2 架构测试脚本
 * 测试 AI 的实际能力
 */

import mongoose from 'mongoose';
import { processAgentRequest } from '../ai/agent/agent-service';

async function main() {
    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/donhauser';
    await mongoose.connect(mongoUri);
    console.log('✅ 数据库连接成功\n');

    const testCases = [
        {
            name: '测试1: 闲聊能力',
            message: '你好',
            expectedBehavior: '友好回复，不调用工具',
            context: { module: 'clients', pageType: 'list' as const, pathname: '/dashboard/clients' }
        },
        {
            name: '测试2: 查询客户（模糊）',
            message: '帮我查一下中信出版社的信息',
            expectedBehavior: '调用 db.query 工具查询 clients 集合',
            context: { module: 'clients', pageType: 'list' as const, pathname: '/dashboard/clients' }
        },
        {
            name: '测试3: 查询项目',
            message: '查看最近的项目',
            expectedBehavior: '调用 db.query 工具查询 projects 集合',
            context: { module: 'projects', pageType: 'list' as const, pathname: '/dashboard/projects' }
        },
        {
            name: '测试4: 统计查询',
            message: '有多少个客户',
            expectedBehavior: '调用 db.query 使用 count',
            context: { module: 'clients', pageType: 'list' as const, pathname: '/dashboard/clients' }
        }
    ];

    for (const testCase of testCases) {
        console.log('═'.repeat(60));
        console.log(`📋 ${testCase.name}`);
        console.log(`💬 用户消息: "${testCase.message}"`);
        console.log(`🎯 预期行为: ${testCase.expectedBehavior}`);
        console.log('─'.repeat(60));

        try {
            const startTime = Date.now();
            const response = await processAgentRequest({
                message: testCase.message,
                history: [],
                context: testCase.context,
                userId: 'test-user',
            });
            const duration = Date.now() - startTime;

            console.log(`⏱️ 耗时: ${duration}ms`);
            
            // 显示 AI 回复（限制长度）
            const contentPreview = response.content?.substring(0, 500) || '(无内容)';
            console.log(`📝 AI 回复:\n${contentPreview}${response.content && response.content.length > 500 ? '...' : ''}`);
            
            // 显示工具调用结果
            if (response.toolResults?.length) {
                console.log(`\n🔧 工具调用结果:`);
                for (const tr of response.toolResults) {
                    console.log(`   - ${tr.toolId}: ${tr.result.success ? '✅ 成功' : '❌ 失败'}`);
                    if (tr.result.success && tr.result.data) {
                        const dataStr = JSON.stringify(tr.result.data, null, 2);
                        // 限制数据显示长度
                        if (dataStr.length > 500) {
                            console.log(`     数据: ${dataStr.substring(0, 500)}...`);
                        } else {
                            console.log(`     数据: ${dataStr}`);
                        }
                    }
                    if (tr.result.error) {
                        console.log(`     错误: ${tr.result.error.message}`);
                    }
                }
            } else {
                console.log(`\n🔧 工具调用: 无`);
            }

            // 显示待确认工具
            if (response.pendingToolCalls?.length) {
                console.log(`\n⏳ 待确认工具: ${response.pendingToolCalls.map(t => t.toolId).join(', ')}`);
            }

        } catch (error: any) {
            console.log(`❌ 错误: ${error.message}`);
            console.log(error.stack);
        }

        console.log('\n');
    }

    await mongoose.disconnect();
    console.log('═'.repeat(60));
    console.log('✅ 测试完成');
}

main().catch(err => {
    console.error('测试失败:', err);
    process.exit(1);
});
