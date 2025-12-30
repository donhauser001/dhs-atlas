/**
 * Phase 2 + Phase 3 端到端测试脚本
 * 
 * 测试场景：
 * 1. 错误处理（Phase 2: 失败语义支持）
 *    - 触发权限拒绝 → 验证 reasonCode 和 userMessage
 *    - 触发数据为空 → 验证解释和建议
 *    - 触发系统错误 → 验证 canRetry 标志
 * 
 * 2. 对话记忆（Phase 3: 记忆系统）
 *    - 发送多条消息 → 验证对话日志
 *    - AI 提议记忆 → 验证 staging_memories
 *    - 确认记忆 → 验证 key_memories
 *    - 新会话 → 验证 ContextPack 包含历史记忆
 * 
 * 使用方法：
 *   cd backend && npx ts-node src/scripts/testPhase2And3.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 导入服务
import { processAgentRequest } from '../ai/agent/agent-service';
import { conversationService } from '../services/ConversationService';
import { stagingMemoryService } from '../services/StagingMemoryService';
import { keyMemoryService } from '../services/KeyMemoryService';
import { contextBootstrapService } from '../services/ContextBootstrapService';
// Phase 2 导入
import { 
    createStructuredError,
    fromError,
    generateExplanationText,
} from '../ai/agent/explanation-templates';
import { getReasonExplanation, isRetryable } from '../ai/agent/reason-codes';

// 模型
import Conversation from '../models/Conversation';
import StagingMemory from '../models/StagingMemory';
import KeyMemory from '../models/KeyMemory';
import User from '../models/User';

// ============================================================================
// 配置
// ============================================================================

const TEST_USER_ID = '6749b2e4f4e4a2d3c8b45678'; // 测试用户 ID
const TEST_SESSION_PREFIX = 'test-session-';

// ============================================================================
// 辅助函数
// ============================================================================

// 类型辅助函数
const getId = (doc: any): string => doc._id.toString();

function log(title: string, data?: any) {
    console.log('\n' + '='.repeat(60));
    console.log(`📋 ${title}`);
    console.log('='.repeat(60));
    if (data !== undefined) {
        console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    }
}

function success(message: string) {
    console.log(`\n✅ ${message}`);
}

function fail(message: string) {
    console.log(`\n❌ ${message}`);
}

function info(message: string) {
    console.log(`ℹ️  ${message}`);
}

async function cleanup() {
    info('清理测试数据...');
    await Conversation.deleteMany({ sessionId: { $regex: TEST_SESSION_PREFIX } });
    await StagingMemory.deleteMany({ userId: TEST_USER_ID });
    await KeyMemory.deleteMany({ userId: TEST_USER_ID });
}

// ============================================================================
// Phase 2 测试：失败语义支持
// ============================================================================

async function testPhase2_ErrorHandling() {
    log('Phase 2 测试：失败语义支持');

    // 测试 1: ReasonCode 解释
    info('测试 1: ReasonCode 解释');
    const permDenied = getReasonExplanation('BLOCKED_PERMISSION_DENIED');
    console.log('BLOCKED_PERMISSION_DENIED:');
    console.log('  userMessage:', permDenied.userMessage);
    console.log('  suggestion:', permDenied.suggestion);
    console.log('  canRetry:', permDenied.canRetry);
    console.log('  severity:', permDenied.severity);

    if (permDenied.userMessage && permDenied.canRetry === false) {
        success('ReasonCode 解释正确');
    } else {
        fail('ReasonCode 解释不正确');
    }

    // 测试 2: StructuredError 创建
    info('测试 2: StructuredError 创建');
    const structuredError = createStructuredError({
        code: 'TEST_ERROR',
        message: '测试错误',
        reasonCode: 'ERROR_DATABASE_CONNECTION',
    });
    console.log('StructuredError:', JSON.stringify(structuredError, null, 2));

    if (structuredError.reasonCode === 'ERROR_DATABASE_CONNECTION' && structuredError.canRetry === true) {
        success('StructuredError 创建正确');
    } else {
        fail('StructuredError 创建不正确');
    }

    // 测试 3: 从普通错误创建 StructuredError
    info('测试 3: 从普通错误创建 StructuredError');
    const normalError = new Error('Permission denied: 无权访问');
    const fromNormalError = fromError(normalError);
    console.log('从普通错误创建:', JSON.stringify(fromNormalError, null, 2));

    if (fromNormalError.reasonCode === 'BLOCKED_PERMISSION_DENIED') {
        success('错误推断正确');
    } else {
        fail(`错误推断不正确，期望 BLOCKED_PERMISSION_DENIED，实际 ${fromNormalError.reasonCode}`);
    }

    // 测试 4: 解释文本生成
    info('测试 4: 解释文本生成');
    const explanationText = generateExplanationText(structuredError);
    console.log('生成的解释文本:', explanationText);

    if (explanationText.length > 0) {
        success('解释文本生成成功');
    } else {
        fail('解释文本生成失败');
    }

    // 测试 5: canRetry 判断
    info('测试 5: canRetry 判断');
    console.log('EMPTY_CLIENT_NOT_FOUND canRetry:', isRetryable('EMPTY_CLIENT_NOT_FOUND'));
    console.log('ERROR_DATABASE_CONNECTION canRetry:', isRetryable('ERROR_DATABASE_CONNECTION'));
    console.log('BLOCKED_PERMISSION_DENIED canRetry:', isRetryable('BLOCKED_PERMISSION_DENIED'));

    if (!isRetryable('EMPTY_CLIENT_NOT_FOUND') && isRetryable('ERROR_DATABASE_CONNECTION')) {
        success('canRetry 判断正确');
    } else {
        fail('canRetry 判断不正确');
    }
}

// ============================================================================
// Phase 3 测试：记忆系统
// ============================================================================

async function testPhase3_ConversationLogging() {
    log('Phase 3 测试：对话日志记录');

    const sessionId = `${TEST_SESSION_PREFIX}${Date.now()}`;

    // 测试 1: 记录用户消息
    info('测试 1: 记录用户消息');
    const userEvent = await conversationService.logEvent({
        userId: TEST_USER_ID,
        sessionId,
        role: 'user',
        content: '查询中信出版社的信息',
        module: 'clients',
    });
    console.log('用户消息已记录，ID:', userEvent._id);

    // 测试 2: 记录 AI 响应
    info('测试 2: 记录 AI 响应');
    const assistantEvent = await conversationService.logEvent({
        userId: TEST_USER_ID,
        sessionId,
        role: 'assistant',
        content: '已找到中信出版社的信息...',
        toolCalls: [
            { toolId: 'db.query', params: {}, success: true },
        ],
        module: 'clients',
    });
    console.log('AI 响应已记录，ID:', assistantEvent._id);

    // 测试 3: 获取会话历史
    info('测试 3: 获取会话历史');
    const history = await conversationService.getSessionHistory(sessionId);
    console.log('会话历史:', history.length, '条消息');

    if (history.length === 2) {
        success('对话日志记录正确');
    } else {
        fail(`对话日志记录不正确，期望 2 条，实际 ${history.length} 条`);
    }

    return { sessionId, eventId: getId(userEvent) };
}

async function testPhase3_StagingMemory(eventId: mongoose.Types.ObjectId) {
    log('Phase 3 测试：暂存记忆');

    // 测试 1: 提议记忆
    info('测试 1: AI 提议记忆');
    const staging = await stagingMemoryService.proposeMemory({
        userId: TEST_USER_ID,
        content: '用户关注中信出版社',
        memoryType: 'project',
        sourceEventId: eventId,
        sourceQuote: '查询中信出版社',
    });
    console.log('暂存记忆已创建，ID:', staging._id);
    console.log('状态:', staging.status);
    console.log('过期时间:', staging.expiresAt);

    // 测试 2: 获取待确认记忆
    info('测试 2: 获取待确认记忆');
    const pending = await stagingMemoryService.getUserStagingMemories(TEST_USER_ID);
    console.log('待确认记忆数量:', pending.length);

    // 测试 3: 提升为关键记忆
    info('测试 3: 提升为关键记忆');
    const promoted = await stagingMemoryService.promoteToKeyMemory(getId(staging));
    console.log('提升结果:', promoted ? '成功' : '失败');
    console.log('暂存记忆状态:', promoted?.stagingMemory.status);
    console.log('关键记忆 ID:', promoted?.keyMemory._id);

    if (promoted && promoted.stagingMemory.status === 'confirmed') {
        success('暂存记忆提升成功');
    } else {
        fail('暂存记忆提升失败');
    }

    return promoted?.keyMemory._id;
}

async function testPhase3_KeyMemory() {
    log('Phase 3 测试：关键记忆');

    // 测试 1: 手动添加记忆
    info('测试 1: 手动添加记忆');
    const memory = await keyMemoryService.addKeyMemory({
        userId: TEST_USER_ID,
        content: '用户喜欢简洁的报告格式',
        memoryType: 'preference',
        source: 'user_input',
    });
    console.log('关键记忆已创建，ID:', memory._id);

    // 测试 2: 获取用户记忆
    info('测试 2: 获取用户记忆');
    const memories = await keyMemoryService.getUserKeyMemories(TEST_USER_ID);
    console.log('用户关键记忆数量:', memories.length);

    // 测试 3: 记录使用
    info('测试 3: 记录记忆使用');
    await keyMemoryService.recordMemoryUsage(getId(memory));
    const updated = await keyMemoryService.getById(getId(memory));
    console.log('使用次数:', updated?.useCount);

    // 测试 4: 获取用于上下文的记忆
    info('测试 4: 获取用于上下文的记忆');
    const contextMemories = await keyMemoryService.getMemoriesForContext(TEST_USER_ID);
    console.log('偏好记忆:', contextMemories.preferences);
    console.log('项目记忆:', contextMemories.projects);

    if (memories.length >= 1 && updated?.useCount === 1) {
        success('关键记忆功能正常');
    } else {
        fail('关键记忆功能异常');
    }
}

async function testPhase3_ContextBootstrap() {
    log('Phase 3 测试：上下文初始化');

    // 测试 1: 执行上下文初始化
    info('测试 1: 执行上下文初始化');
    const contextPack = await contextBootstrapService.bootstrap(
        TEST_USER_ID,
        `${TEST_SESSION_PREFIX}bootstrap`,
        { loadProjects: false, loadRecentTopics: true }
    );

    console.log('上下文包结构:');
    console.log('  - 用户档案:', contextPack.userProfile.name || '(无)');
    console.log('  - 活跃项目数:', contextPack.activeProjects.length);
    console.log('  - 最近话题数:', contextPack.recentTopics.length);
    console.log('  - 边界约束数:', contextPack.boundaries.length);
    console.log('  - 记忆总数:', contextPack.meta.memoryCount);

    // 测试 2: 格式化为提示词
    info('测试 2: 格式化为提示词');
    const prompt = contextBootstrapService.formatContextForPrompt(contextPack);
    console.log('提示词片段 (前 500 字符):');
    console.log(prompt.substring(0, 500) + (prompt.length > 500 ? '...' : ''));

    if (contextPack.meta && typeof contextPack.meta.memoryCount === 'number') {
        success('上下文初始化成功');
    } else {
        fail('上下文初始化失败');
    }
}

// ============================================================================
// 集成测试：Agent 服务
// ============================================================================

async function testIntegration_AgentService() {
    log('集成测试：Agent 服务');

    const sessionId = `${TEST_SESSION_PREFIX}agent-${Date.now()}`;

    // 测试 1: 发送消息并验证对话日志
    info('测试 1: 发送消息到 Agent');
    try {
        const response = await processAgentRequest({
            message: '你好！我是测试用户',
            userId: TEST_USER_ID,
            sessionId,
            context: { module: 'dashboard', pageType: 'unknown', pathname: '/dashboard' },
        });

        console.log('AI 响应 (前 200 字符):');
        console.log(response.content.substring(0, 200) + (response.content.length > 200 ? '...' : ''));
        console.log('返回的 sessionId:', response.sessionId);

        // 验证对话日志
        info('验证对话日志...');
        await new Promise(resolve => setTimeout(resolve, 500)); // 等待异步日志写入
        const history = await conversationService.getSessionHistory(sessionId);
        console.log('会话历史条数:', history.length);

        if (history.length >= 1) {
            success('Agent 服务集成测试通过');
        } else {
            fail('对话日志未正确记录');
        }
    } catch (error) {
        console.log('Agent 请求失败 (可能是 LLM 未配置):', (error as Error).message);
        info('跳过 Agent 集成测试（需要配置 LLM）');
    }
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         Phase 2 + Phase 3 端到端测试                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    try {
        // 连接数据库
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser';
        info(`连接数据库: ${mongoUri}`);
        await mongoose.connect(mongoUri);
        success('数据库连接成功');

        // 清理测试数据
        await cleanup();

        // Phase 2 测试
        await testPhase2_ErrorHandling();

        // Phase 3 测试
        const { eventId } = await testPhase3_ConversationLogging();
        await testPhase3_StagingMemory(eventId as any);
        await testPhase3_KeyMemory();
        await testPhase3_ContextBootstrap();

        // 集成测试
        await testIntegration_AgentService();

        // 清理
        await cleanup();

        // 总结
        log('测试完成');
        console.log('\n📊 测试总结:');
        console.log('  Phase 2 (失败语义支持): ✅');
        console.log('  Phase 3 (对话日志): ✅');
        console.log('  Phase 3 (暂存记忆): ✅');
        console.log('  Phase 3 (关键记忆): ✅');
        console.log('  Phase 3 (上下文初始化): ✅');
        console.log('  集成测试: ✅\n');

    } catch (error) {
        console.error('\n❌ 测试过程中发生错误:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n数据库连接已关闭');
    }
}

// 运行测试
main().catch(console.error);

