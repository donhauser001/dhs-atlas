/**
 * ConversationService 单元测试
 * 
 * 测试内容：
 * 1. 对话事件记录
 * 2. 会话历史获取
 * 3. 用户最近对话
 * 4. 对话统计
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Conversation from '../models/Conversation';
import { conversationService } from '../services/ConversationService';

describe('ConversationService', () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await Conversation.deleteMany({});
    });

    describe('logEvent', () => {
        it('记录用户消息', async () => {
            const event = await conversationService.logEvent({
                userId: 'user1',
                sessionId: 'session1',
                role: 'user',
                content: '你好',
                module: 'dashboard',
            });

            expect(event._id).toBeDefined();
            expect(event.userId).toBe('user1');
            expect(event.sessionId).toBe('session1');
            expect(event.role).toBe('user');
            expect(event.content).toBe('你好');
            expect(event.module).toBe('dashboard');
        });

        it('记录 AI 响应（带工具调用）', async () => {
            const event = await conversationService.logEvent({
                userId: 'user1',
                sessionId: 'session1',
                role: 'assistant',
                content: '已查询到 3 个客户',
                toolCalls: [
                    {
                        toolId: 'db.query',
                        params: { collection: 'clients' },
                        success: true,
                    },
                ],
            });

            expect(event.role).toBe('assistant');
            expect(event.toolCalls).toHaveLength(1);
            expect(event.toolCalls![0].toolId).toBe('db.query');
            expect(event.toolCalls![0].success).toBe(true);
        });

        it('自动设置时间戳', async () => {
            const before = new Date();
            const event = await conversationService.logEvent({
                userId: 'user1',
                sessionId: 'session1',
                role: 'user',
                content: '测试',
            });
            const after = new Date();

            expect(event.timestamp).toBeDefined();
            expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(event.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe('logEvents', () => {
        it('批量记录多条消息', async () => {
            const events = await conversationService.logEvents([
                { userId: 'user1', sessionId: 'session1', role: 'user', content: '消息1' },
                { userId: 'user1', sessionId: 'session1', role: 'assistant', content: '回复1' },
                { userId: 'user1', sessionId: 'session1', role: 'user', content: '消息2' },
            ]);

            expect(events).toHaveLength(3);
        });
    });

    describe('getSessionHistory', () => {
        it('获取会话历史（按时间正序）', async () => {
            // 创建测试数据
            await conversationService.logEvent({
                userId: 'user1',
                sessionId: 'session1',
                role: 'user',
                content: '第一条',
                timestamp: new Date('2024-01-01T10:00:00Z'),
            });
            await conversationService.logEvent({
                userId: 'user1',
                sessionId: 'session1',
                role: 'assistant',
                content: '第二条',
                timestamp: new Date('2024-01-01T10:01:00Z'),
            });
            await conversationService.logEvent({
                userId: 'user1',
                sessionId: 'session1',
                role: 'user',
                content: '第三条',
                timestamp: new Date('2024-01-01T10:02:00Z'),
            });

            const history = await conversationService.getSessionHistory('session1');

            expect(history).toHaveLength(3);
            expect(history[0].content).toBe('第一条');
            expect(history[1].content).toBe('第二条');
            expect(history[2].content).toBe('第三条');
        });

        it('支持限制返回数量', async () => {
            // 创建测试数据
            for (let i = 0; i < 10; i++) {
                await conversationService.logEvent({
                    userId: 'user1',
                    sessionId: 'session2',
                    role: 'user',
                    content: `消息${i}`,
                });
            }

            const history = await conversationService.getSessionHistory('session2', { limit: 5 });

            expect(history).toHaveLength(5);
        });
    });

    describe('getUserRecentConversations', () => {
        it('获取用户最近对话（按时间倒序）', async () => {
            // 创建测试数据
            await conversationService.logEvent({
                userId: 'user1',
                sessionId: 'session1',
                role: 'user',
                content: '旧消息',
                timestamp: new Date('2024-01-01T10:00:00Z'),
            });
            await conversationService.logEvent({
                userId: 'user1',
                sessionId: 'session2',
                role: 'user',
                content: '新消息',
                timestamp: new Date('2024-01-02T10:00:00Z'),
            });

            const recent = await conversationService.getUserRecentConversations('user1', 10);

            expect(recent).toHaveLength(2);
            expect(recent[0].content).toBe('新消息');
            expect(recent[1].content).toBe('旧消息');
        });

        it('不返回其他用户的对话', async () => {
            await conversationService.logEvent({
                userId: 'user1',
                sessionId: 'session1',
                role: 'user',
                content: '用户1的消息',
            });
            await conversationService.logEvent({
                userId: 'user2',
                sessionId: 'session2',
                role: 'user',
                content: '用户2的消息',
            });

            const recent = await conversationService.getUserRecentConversations('user1', 10);

            expect(recent).toHaveLength(1);
            expect(recent[0].content).toBe('用户1的消息');
        });
    });

    describe('getUserSessions', () => {
        it('获取用户的会话列表', async () => {
            // 创建测试数据
            await conversationService.logEvents([
                { userId: 'user1', sessionId: 'session1', role: 'user', content: '消息1' },
                { userId: 'user1', sessionId: 'session1', role: 'assistant', content: '回复1' },
                { userId: 'user1', sessionId: 'session2', role: 'user', content: '消息2' },
            ]);

            const { sessions, total } = await conversationService.getUserSessions('user1');

            expect(total).toBe(2);
            expect(sessions).toHaveLength(2);
            expect(sessions.some(s => s.sessionId === 'session1')).toBe(true);
            expect(sessions.some(s => s.sessionId === 'session2')).toBe(true);
        });

        it('返回会话的消息统计', async () => {
            await conversationService.logEvents([
                { userId: 'user1', sessionId: 'session1', role: 'user', content: '消息1' },
                { userId: 'user1', sessionId: 'session1', role: 'assistant', content: '回复1' },
                { userId: 'user1', sessionId: 'session1', role: 'user', content: '消息2' },
            ]);

            const { sessions } = await conversationService.getUserSessions('user1');
            const session = sessions.find(s => s.sessionId === 'session1');

            expect(session).toBeDefined();
            expect(session!.messageCount).toBe(3);
        });
    });

    describe('getStats', () => {
        it('返回对话统计', async () => {
            // 创建测试数据
            await conversationService.logEvents([
                { userId: 'user1', sessionId: 'session1', role: 'user', content: '消息1' },
                { 
                    userId: 'user1', 
                    sessionId: 'session1', 
                    role: 'assistant', 
                    content: '回复1',
                    toolCalls: [{ toolId: 'db.query', params: {}, success: true }],
                },
                { userId: 'user1', sessionId: 'session1', role: 'user', content: '消息2', module: 'clients' },
            ]);

            const stats = await conversationService.getStats('user1');

            expect(stats.totalMessages).toBe(3);
            expect(stats.userMessages).toBe(2);
            expect(stats.assistantMessages).toBe(1);
            expect(stats.totalToolCalls).toBe(1);
            expect(stats.successfulToolCalls).toBe(1);
        });
    });

    describe('search', () => {
        it('搜索对话内容', async () => {
            await conversationService.logEvents([
                { userId: 'user1', sessionId: 'session1', role: 'user', content: '查询客户信息' },
                { userId: 'user1', sessionId: 'session1', role: 'assistant', content: '已找到客户' },
                { userId: 'user1', sessionId: 'session1', role: 'user', content: '查看项目' },
            ]);

            const { conversations, total } = await conversationService.search('user1', '客户');

            expect(total).toBe(2);
            expect(conversations.some(c => c.content.includes('客户'))).toBe(true);
        });
    });

    describe('deleteSession', () => {
        it('删除会话的所有对话', async () => {
            await conversationService.logEvents([
                { userId: 'user1', sessionId: 'session1', role: 'user', content: '消息1' },
                { userId: 'user1', sessionId: 'session1', role: 'assistant', content: '回复1' },
                { userId: 'user1', sessionId: 'session2', role: 'user', content: '消息2' },
            ]);

            const deletedCount = await conversationService.deleteSession('session1');

            expect(deletedCount).toBe(2);

            const remaining = await Conversation.countDocuments({ sessionId: 'session1' });
            expect(remaining).toBe(0);

            const otherSession = await Conversation.countDocuments({ sessionId: 'session2' });
            expect(otherSession).toBe(1);
        });
    });
});

