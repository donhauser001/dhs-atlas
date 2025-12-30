/**
 * AI 对话测试脚本
 * 
 * 直接调用 AI Agent 服务，测试完整的对话流程
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 导入 Agent 服务
import { processAgentRequest } from '../ai/agent/agent-service';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/donhauser';

interface TestCase {
    name: string;
    message: string;
    module?: string;
    expectedMap?: string;
}

const testCases: TestCase[] = [
    {
        name: '查询合同范本列表',
        message: '帮我看看有哪些合同范本可以用',
        module: 'contracts',
        expectedMap: 'list_templates',
    },
    {
        name: '查询合同列表',
        message: '查看所有合同',
        module: 'contracts',
        expectedMap: 'query_contracts',
    },
    {
        name: '查询客户信息',
        message: '查询一下客户信息',
        module: 'clients',
        expectedMap: 'query_client',
    },
];

async function runTest(testCase: TestCase) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试: ${testCase.name}`);
    console.log(`消息: "${testCase.message}"`);
    console.log(`模块: ${testCase.module || '无'}`);
    console.log('='.repeat(60));

    try {
        const startTime = Date.now();
        
        const response = await processAgentRequest({
            message: testCase.message,
            history: [],
            context: testCase.module ? {
                module: testCase.module,
                pageType: 'list' as const,
                pathname: `/dashboard/${testCase.module}`,
            } : undefined,
            userId: 'test-user',
            sessionId: 'test-session-' + Date.now(),
        });

        const duration = Date.now() - startTime;

        console.log(`\n⏱️  响应时间: ${duration}ms`);
        
        // 显示响应内容
        console.log('\n📝 AI 响应内容:');
        console.log('-'.repeat(40));
        if (response.content) {
            // 截取前 500 字符
            const content = response.content.length > 500 
                ? response.content.substring(0, 500) + '...(截断)' 
                : response.content;
            console.log(content);
        } else {
            console.log('(无文本响应)');
        }
        console.log('-'.repeat(40));

        // 显示工具调用结果
        if (response.toolResults && response.toolResults.length > 0) {
            console.log('\n🔧 工具调用结果:');
            response.toolResults.forEach((tr, idx) => {
                console.log(`  ${idx + 1}. ${tr.toolId}: ${tr.result.success ? '✅ 成功' : '❌ 失败'}`);
                if (tr.result.success && tr.result.data) {
                    const data = tr.result.data as any;
                    if (Array.isArray(data)) {
                        console.log(`     返回 ${data.length} 条数据`);
                    } else {
                        console.log(`     返回数据:`, JSON.stringify(data).substring(0, 100));
                    }
                } else if (tr.result.error) {
                    console.log(`     错误: ${JSON.stringify(tr.result.error)}`);
                }
            });
        }

        // 显示 UI 建议
        if (response.uiSpec) {
            console.log('\n🎨 UI 建议:', response.uiSpec.componentId);
        }

        // 显示预测动作
        if (response.predictedActions && response.predictedActions.length > 0) {
            console.log('\n🔮 预测动作:');
            response.predictedActions.forEach((action, idx) => {
                console.log(`  ${idx + 1}. [${action.type}] ${action.label}`);
            });
        }

        // 显示待确认的工具调用
        if (response.pendingToolCalls && response.pendingToolCalls.length > 0) {
            console.log('\n⚠️ 待确认的工具调用:');
            response.pendingToolCalls.forEach((call, idx) => {
                console.log(`  ${idx + 1}. ${call.toolId}`);
            });
        }

        return { success: true, duration };

    } catch (error: any) {
        console.log('\n❌ 测试失败:', error.message);
        return { success: false, error: error.message };
    }
}

async function main() {
    try {
        console.log('连接数据库...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ 数据库连接成功');

        console.log('\n' + '🤖 开始 AI 对话测试 '.padStart(40, '=').padEnd(60, '='));

        const results: { name: string; success: boolean; duration?: number; error?: string }[] = [];

        for (const testCase of testCases) {
            const result = await runTest(testCase);
            results.push({ name: testCase.name, ...result });
            
            // 等待一下，避免请求太快
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 汇总结果
        console.log('\n' + '='.repeat(60));
        console.log('📊 测试结果汇总');
        console.log('='.repeat(60));
        
        let passed = 0;
        let failed = 0;
        
        results.forEach(r => {
            const status = r.success ? '✅' : '❌';
            const time = r.duration ? `${r.duration}ms` : 'N/A';
            console.log(`  ${status} ${r.name} (${time})`);
            if (r.success) passed++;
            else failed++;
        });

        console.log(`\n总计: ${passed} 通过, ${failed} 失败`);

    } catch (error) {
        console.error('❌ 测试失败:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n数据库连接已关闭');
    }
}

main();

