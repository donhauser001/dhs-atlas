/**
 * AI Agent 工作流测试脚本
 * 
 * 测试：用户提问 → AI地图 → 工具执行 → 模板输出
 * 
 * 运行：
 * docker exec donhauser-backend npx ts-node --transpile-only src/scripts/testAgentWorkflow.ts
 */

import mongoose from 'mongoose';
import { processAgentRequest } from '../ai/agent/agent-service';
import { registerAllTools } from '../ai/tools';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/donhauser';

async function testWorkflow() {
    console.log('🧪 AI Agent 工作流测试\n');
    console.log('='.repeat(60));

    try {
        // 连接数据库
        await mongoose.connect(MONGODB_URI);
        console.log('✅ 数据库连接成功');

        // 注册工具
        registerAllTools();
        console.log('✅ 工具注册完成\n');

        // 测试用例
        const testCases = [
            {
                name: '测试1: 简单查询',
                message: '查一下中信出版社的信息',
                context: { module: 'clients' },
            },
            {
                name: '测试2: 复杂统计 - 联系人项目数',
                message: '中信出版社有哪些联系人，哪个人给我们的项目最多',
                context: { module: 'clients' },
            },
            {
                name: '测试3: 复杂统计 - 项目金额',
                message: '中信出版社哪个联系人的项目金额最高',
                context: { module: 'clients' },
            },
        ];

        for (const testCase of testCases) {
            console.log(`\n${'─'.repeat(60)}`);
            console.log(`📋 ${testCase.name}`);
            console.log(`💬 用户: "${testCase.message}"`);
            console.log(`📍 模块: ${testCase.context.module}`);
            console.log('─'.repeat(60));

            const startTime = Date.now();

            try {
                const response = await processAgentRequest({
                    message: testCase.message,
                    history: [],
                    context: testCase.context,
                    userId: 'test-user',
                    sessionId: 'test-session',
                });

                const duration = Date.now() - startTime;

                console.log(`\n⏱️  耗时: ${duration}ms`);
                console.log(`\n🤖 AI 回复:`);
                console.log('─'.repeat(40));
                console.log(response.content || '(无文本内容)');
                console.log('─'.repeat(40));

                if (response.toolResults?.length) {
                    console.log(`\n🔧 工具执行结果:`);
                    for (const tr of response.toolResults) {
                        console.log(`  - ${tr.toolId}: ${tr.result.success ? '✅ 成功' : '❌ 失败'}`);
                        if (tr.result.data) {
                            const dataStr = JSON.stringify(tr.result.data, null, 2);
                            // 截断过长的数据
                            console.log(`    数据: ${dataStr.length > 200 ? dataStr.substring(0, 200) + '...' : dataStr}`);
                        }
                    }
                }

                if (response.uiSpec) {
                    console.log(`\n🎨 UI 指令:`);
                    console.log(`  - 组件: ${response.uiSpec.componentId}`);
                    console.log(`  - 目标: ${response.uiSpec.target}`);
                    console.log(`  - 属性: ${JSON.stringify(response.uiSpec.props)}`);
                }

                if (response.pendingToolCalls?.length) {
                    console.log(`\n⏳ 待确认工具:`);
                    for (const tc of response.pendingToolCalls) {
                        console.log(`  - ${tc.toolId}: ${JSON.stringify(tc.params)}`);
                    }
                }

                console.log(`\n✅ 测试通过`);

            } catch (error) {
                console.log(`\n❌ 测试失败: ${error instanceof Error ? error.message : error}`);
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log('🏁 所有测试完成');

    } catch (error) {
        console.error('❌ 测试脚本错误:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testWorkflow();

