/**
 * StagingMemoryService 单元测试
 * 
 * 测试内容：
 * 1. AI 提议记忆
 * 2. 获取待确认记忆
 * 3. 提升为关键记忆
 * 4. 拒绝/删除记忆
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import StagingMemory from '../models/StagingMemory';
import KeyMemory from '../models/KeyMemory';
import Conversation from '../models/Conversation';
import { stagingMemoryService } from '../services/StagingMemoryService';

// 类型辅助函数
const getId = (doc: any): string => doc._id.toString();

describe('StagingMemoryService', () => {
    let mongoServer: MongoMemoryServer;
    let testEventId: Types.ObjectId;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await StagingMemory.deleteMany({});
        await KeyMemory.deleteMany({});
        await Conversation.deleteMany({});

        // 创建一个测试用的对话事件
        const event = await Conversation.create({
            userId: 'user1',
            sessionId: 'session1',
            role: 'user',
            content: '我喜欢简洁的报告格式',
            timestamp: new Date(),
        });
        testEventId = event._id as Types.ObjectId;
    });

    describe('proposeMemory', () => {
        it('创建暂存记忆', async () => {
            const memory = await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '用户喜欢简洁的报告格式',
                memoryType: 'preference',
                sourceEventId: testEventId,
                sourceQuote: '我喜欢简洁的报告格式',
            });

            expect(memory._id).toBeDefined();
            expect(memory.userId).toBe('user1');
            expect(memory.content).toBe('用户喜欢简洁的报告格式');
            expect(memory.memoryType).toBe('preference');
            expect(memory.status).toBe('pending');
            expect(memory.expiresAt).toBeDefined();
        });

        it('设置 7 天后过期', async () => {
            const now = Date.now();
            const memory = await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '测试记忆',
                memoryType: 'preference',
                sourceEventId: testEventId,
            });

            const expiresAt = memory.expiresAt.getTime();
            const expectedExpiry = now + 7 * 24 * 60 * 60 * 1000;

            // 允许 1 秒误差
            expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(1000);
        });

        it('避免重复创建相同内容的记忆', async () => {
            const proposal = {
                userId: 'user1',
                content: '重复的记忆内容',
                memoryType: 'preference' as const,
                sourceEventId: testEventId,
            };

            const first = await stagingMemoryService.proposeMemory(proposal);
            const second = await stagingMemoryService.proposeMemory(proposal);

            expect(getId(first)).toBe(getId(second));

            const count = await StagingMemory.countDocuments({ content: '重复的记忆内容' });
            expect(count).toBe(1);
        });
    });

    describe('getUserStagingMemories', () => {
        beforeEach(async () => {
            // 创建测试数据
            await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '偏好1',
                memoryType: 'preference',
                sourceEventId: testEventId,
            });
            await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '项目1',
                memoryType: 'project',
                sourceEventId: testEventId,
            });
            await stagingMemoryService.proposeMemory({
                userId: 'user2',
                content: '其他用户的记忆',
                memoryType: 'preference',
                sourceEventId: testEventId,
            });
        });

        it('获取用户的待确认记忆', async () => {
            const memories = await stagingMemoryService.getUserStagingMemories('user1');

            expect(memories).toHaveLength(2);
            expect(memories.every(m => m.userId === 'user1')).toBe(true);
        });

        it('按类型筛选', async () => {
            const memories = await stagingMemoryService.getUserStagingMemories('user1', {
                type: 'preference',
            });

            expect(memories).toHaveLength(1);
            expect(memories[0].memoryType).toBe('preference');
        });

        it('不返回其他用户的记忆', async () => {
            const memories = await stagingMemoryService.getUserStagingMemories('user1');

            expect(memories.every(m => m.userId === 'user1')).toBe(true);
        });
    });

    describe('promoteToKeyMemory', () => {
        it('提升为关键记忆', async () => {
            const staging = await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '用户喜欢蓝色',
                memoryType: 'preference',
                sourceEventId: testEventId,
            });

            const result = await stagingMemoryService.promoteToKeyMemory(getId(staging));

            expect(result).not.toBeNull();
            expect(result!.stagingMemory.status).toBe('confirmed');
            expect(result!.keyMemory.content).toBe('用户喜欢蓝色');
            expect(result!.keyMemory.source).toBe('ai_proposal');
            expect(result!.keyMemory.isActive).toBe(true);
        });

        it('只能提升 pending 状态的记忆', async () => {
            const staging = await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '测试',
                memoryType: 'preference',
                sourceEventId: testEventId,
            });

            // 先拒绝
            await stagingMemoryService.rejectMemory(getId(staging));

            // 尝试提升
            await expect(
                stagingMemoryService.promoteToKeyMemory(getId(staging))
            ).rejects.toThrow('只能提升待确认的记忆');
        });

        it('在 KeyMemory 中创建对应记录', async () => {
            const staging = await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '测试提升',
                memoryType: 'project',
                sourceEventId: testEventId,
            });

            await stagingMemoryService.promoteToKeyMemory(getId(staging));

            const keyMemory = await KeyMemory.findOne({ content: '测试提升' });
            expect(keyMemory).not.toBeNull();
            expect(keyMemory!.userId).toBe('user1');
            expect(keyMemory!.memoryType).toBe('project');
        });
    });

    describe('promoteMultiple', () => {
        it('批量提升多条记忆', async () => {
            const staging1 = await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '记忆1',
                memoryType: 'preference',
                sourceEventId: testEventId,
            });
            const staging2 = await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '记忆2',
                memoryType: 'preference',
                sourceEventId: testEventId,
            });

            const result = await stagingMemoryService.promoteMultiple([
                getId(staging1),
                getId(staging2),
            ]);

            expect(result.success).toHaveLength(2);
            expect(result.failed).toHaveLength(0);
        });

        it('记录失败的提升', async () => {
            const staging = await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '记忆',
                memoryType: 'preference',
                sourceEventId: testEventId,
            });
            await stagingMemoryService.rejectMemory(getId(staging));

            const result = await stagingMemoryService.promoteMultiple([
                getId(staging),
                'invalid_id',
            ]);

            expect(result.success).toHaveLength(0);
            expect(result.failed).toHaveLength(2);
        });
    });

    describe('rejectMemory', () => {
        it('拒绝记忆', async () => {
            const staging = await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '要拒绝的记忆',
                memoryType: 'preference',
                sourceEventId: testEventId,
            });

            const rejected = await stagingMemoryService.rejectMemory(getId(staging));

            expect(rejected).not.toBeNull();
            expect(rejected!.status).toBe('rejected');
        });
    });

    describe('deleteMemory', () => {
        it('删除记忆', async () => {
            const staging = await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '要删除的记忆',
                memoryType: 'preference',
                sourceEventId: testEventId,
            });

            const deleted = await stagingMemoryService.deleteMemory(getId(staging));

            expect(deleted).toBe(true);

            const remaining = await StagingMemory.findById(staging._id);
            expect(remaining).toBeNull();
        });
    });

    describe('getStats', () => {
        it('返回统计信息', async () => {
            // 创建测试数据
            await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '待确认1',
                memoryType: 'preference',
                sourceEventId: testEventId,
            });
            const toReject = await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '待拒绝',
                memoryType: 'project',
                sourceEventId: testEventId,
            });
            await stagingMemoryService.rejectMemory(getId(toReject));

            const stats = await stagingMemoryService.getStats('user1');

            expect(stats.total).toBe(2);
            expect(stats.pending).toBe(1);
            expect(stats.rejected).toBe(1);
        });
    });

    describe('extendExpiry', () => {
        it('延长过期时间', async () => {
            const staging = await stagingMemoryService.proposeMemory({
                userId: 'user1',
                content: '测试',
                memoryType: 'preference',
                sourceEventId: testEventId,
            });

            const originalExpiry = staging.expiresAt.getTime();
            const extended = await stagingMemoryService.extendExpiry(getId(staging), 14);

            expect(extended).not.toBeNull();
            expect(extended!.expiresAt.getTime()).toBeGreaterThan(originalExpiry);
        });
    });
});

