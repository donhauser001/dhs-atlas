/**
 * KeyMemoryService 单元测试
 * 
 * 测试内容：
 * 1. 获取用户关键记忆
 * 2. 添加关键记忆
 * 3. 更新关键记忆
 * 4. 删除关键记忆
 * 5. 记录记忆使用
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import KeyMemory from '../models/KeyMemory';
import { keyMemoryService } from '../services/KeyMemoryService';

// 类型辅助函数
const getId = (doc: any): string => doc._id.toString();

describe('KeyMemoryService', () => {
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
        await KeyMemory.deleteMany({});
    });

    describe('addKeyMemory', () => {
        it('添加关键记忆', async () => {
            const memory = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '用户喜欢简洁的报告',
                memoryType: 'preference',
                source: 'user_input',
            });

            expect(memory._id).toBeDefined();
            expect(memory.userId).toBe('user1');
            expect(memory.content).toBe('用户喜欢简洁的报告');
            expect(memory.memoryType).toBe('preference');
            expect(memory.source).toBe('user_input');
            expect(memory.isActive).toBe(true);
            expect(memory.useCount).toBe(0);
        });

        it('避免重复添加相同内容', async () => {
            const input = {
                userId: 'user1',
                content: '重复内容',
                memoryType: 'preference' as const,
                source: 'user_input' as const,
            };

            const first = await keyMemoryService.addKeyMemory(input);
            const second = await keyMemoryService.addKeyMemory(input);

            expect(getId(first)).toBe(getId(second));

            const count = await KeyMemory.countDocuments({ content: '重复内容' });
            expect(count).toBe(1);
        });

        it('支持不同来源', async () => {
            const aiMemory = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: 'AI 提议的记忆',
                memoryType: 'preference',
                source: 'ai_proposal',
            });

            const systemMemory = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '系统生成的记忆',
                memoryType: 'role',
                source: 'system',
            });

            expect(aiMemory.source).toBe('ai_proposal');
            expect(systemMemory.source).toBe('system');
        });
    });

    describe('getUserKeyMemories', () => {
        beforeEach(async () => {
            // 创建测试数据
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '偏好1',
                memoryType: 'preference',
                source: 'user_input',
            });
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '项目1',
                memoryType: 'project',
                source: 'user_input',
            });
            const toDeactivate = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '已停用',
                memoryType: 'preference',
                source: 'user_input',
            });
            await keyMemoryService.deactivateKeyMemory(getId(toDeactivate));
        });

        it('默认只获取激活的记忆', async () => {
            const memories = await keyMemoryService.getUserKeyMemories('user1');

            expect(memories).toHaveLength(2);
            expect(memories.every(m => m.isActive)).toBe(true);
        });

        it('可以获取所有记忆（包括停用）', async () => {
            const memories = await keyMemoryService.getUserKeyMemories('user1', {
                activeOnly: false,
            });

            expect(memories).toHaveLength(3);
        });

        it('按类型筛选', async () => {
            const memories = await keyMemoryService.getUserKeyMemories('user1', {
                type: 'preference',
            });

            expect(memories).toHaveLength(1);
            expect(memories[0].memoryType).toBe('preference');
        });
    });

    describe('getUserMemoriesGrouped', () => {
        beforeEach(async () => {
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '偏好1',
                memoryType: 'preference',
                source: 'user_input',
            });
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '偏好2',
                memoryType: 'preference',
                source: 'user_input',
            });
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '项目1',
                memoryType: 'project',
                source: 'user_input',
            });
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '角色1',
                memoryType: 'role',
                source: 'user_input',
            });
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '边界1',
                memoryType: 'boundary',
                source: 'user_input',
            });
        });

        it('按类型分组返回记忆', async () => {
            const grouped = await keyMemoryService.getUserMemoriesGrouped('user1');

            expect(grouped.preference).toHaveLength(2);
            expect(grouped.project).toHaveLength(1);
            expect(grouped.role).toHaveLength(1);
            expect(grouped.boundary).toHaveLength(1);
        });
    });

    describe('updateKeyMemory', () => {
        it('更新记忆内容', async () => {
            const memory = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '原始内容',
                memoryType: 'preference',
                source: 'user_input',
            });

            const updated = await keyMemoryService.updateKeyMemory(getId(memory), {
                content: '更新后的内容',
            });

            expect(updated).not.toBeNull();
            expect(updated!.content).toBe('更新后的内容');
        });

        it('更新记忆类型', async () => {
            const memory = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '内容',
                memoryType: 'preference',
                source: 'user_input',
            });

            const updated = await keyMemoryService.updateKeyMemory(getId(memory), {
                memoryType: 'project',
            });

            expect(updated!.memoryType).toBe('project');
        });

        it('更新激活状态', async () => {
            const memory = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '内容',
                memoryType: 'preference',
                source: 'user_input',
            });

            const updated = await keyMemoryService.updateKeyMemory(getId(memory), {
                isActive: false,
            });

            expect(updated!.isActive).toBe(false);
        });
    });

    describe('deleteKeyMemory', () => {
        it('删除记忆', async () => {
            const memory = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '要删除的记忆',
                memoryType: 'preference',
                source: 'user_input',
            });

            const deleted = await keyMemoryService.deleteKeyMemory(getId(memory));

            expect(deleted).toBe(true);

            const remaining = await KeyMemory.findById(memory._id);
            expect(remaining).toBeNull();
        });

        it('删除不存在的记忆返回 false', async () => {
            const deleted = await keyMemoryService.deleteKeyMemory(
                new mongoose.Types.ObjectId().toString()
            );

            expect(deleted).toBe(false);
        });
    });

    describe('deactivateKeyMemory / activateKeyMemory', () => {
        it('停用记忆', async () => {
            const memory = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '内容',
                memoryType: 'preference',
                source: 'user_input',
            });

            const deactivated = await keyMemoryService.deactivateKeyMemory(getId(memory));

            expect(deactivated!.isActive).toBe(false);
        });

        it('激活记忆', async () => {
            const memory = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '内容',
                memoryType: 'preference',
                source: 'user_input',
            });
            await keyMemoryService.deactivateKeyMemory(getId(memory));

            const activated = await keyMemoryService.activateKeyMemory(getId(memory));

            expect(activated!.isActive).toBe(true);
        });
    });

    describe('recordMemoryUsage', () => {
        it('记录使用次数', async () => {
            const memory = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '内容',
                memoryType: 'preference',
                source: 'user_input',
            });

            expect(memory.useCount).toBe(0);
            expect(memory.lastUsedAt).toBeUndefined();

            const updated = await keyMemoryService.recordMemoryUsage(getId(memory));

            expect(updated!.useCount).toBe(1);
            expect(updated!.lastUsedAt).toBeDefined();
        });

        it('累加使用次数', async () => {
            const memory = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '内容',
                memoryType: 'preference',
                source: 'user_input',
            });

            await keyMemoryService.recordMemoryUsage(getId(memory));
            await keyMemoryService.recordMemoryUsage(getId(memory));
            const updated = await keyMemoryService.recordMemoryUsage(getId(memory));

            expect(updated!.useCount).toBe(3);
        });
    });

    describe('recordMultipleUsage', () => {
        it('批量记录使用', async () => {
            const memory1 = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '内容1',
                memoryType: 'preference',
                source: 'user_input',
            });
            const memory2 = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '内容2',
                memoryType: 'preference',
                source: 'user_input',
            });

            const count = await keyMemoryService.recordMultipleUsage([
                getId(memory1),
                getId(memory2),
            ]);

            expect(count).toBe(2);

            const updated1 = await keyMemoryService.getById(getId(memory1));
            const updated2 = await keyMemoryService.getById(getId(memory2));

            expect(updated1!.useCount).toBe(1);
            expect(updated2!.useCount).toBe(1);
        });
    });

    describe('getStats', () => {
        beforeEach(async () => {
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '偏好',
                memoryType: 'preference',
                source: 'user_input',
            });
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: 'AI 提议',
                memoryType: 'project',
                source: 'ai_proposal',
            });
            const toDeactivate = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '已停用',
                memoryType: 'preference',
                source: 'user_input',
            });
            await keyMemoryService.deactivateKeyMemory(getId(toDeactivate));
        });

        it('返回统计信息', async () => {
            const stats = await keyMemoryService.getStats('user1');

            expect(stats.total).toBe(3);
            expect(stats.active).toBe(2);
            expect(stats.inactive).toBe(1);
            expect(stats.byType).toHaveLength(2);
            expect(stats.bySource).toHaveLength(2);
        });
    });

    describe('search', () => {
        beforeEach(async () => {
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '我喜欢蓝色',
                memoryType: 'preference',
                source: 'user_input',
            });
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '当前项目是网站设计',
                memoryType: 'project',
                source: 'user_input',
            });
        });

        it('搜索记忆内容', async () => {
            const { memories, total } = await keyMemoryService.search('user1', '蓝色');

            expect(total).toBe(1);
            expect(memories[0].content).toContain('蓝色');
        });

        it('搜索不区分大小写', async () => {
            const { memories } = await keyMemoryService.search('user1', '项目');

            expect(memories).toHaveLength(1);
        });
    });

    describe('getMemoriesForContext', () => {
        beforeEach(async () => {
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '喜欢简洁',
                memoryType: 'preference',
                source: 'user_input',
            });
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '正在做网站项目',
                memoryType: 'project',
                source: 'user_input',
            });
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '我是设计师',
                memoryType: 'role',
                source: 'user_input',
            });
            await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '不要讨论薪资',
                memoryType: 'boundary',
                source: 'user_input',
            });
        });

        it('返回用于上下文的记忆', async () => {
            const context = await keyMemoryService.getMemoriesForContext('user1');

            expect(context.preferences).toContain('喜欢简洁');
            expect(context.projects).toContain('正在做网站项目');
            expect(context.roles).toContain('我是设计师');
            expect(context.boundaries).toContain('不要讨论薪资');
        });
    });

    describe('getRecentlyUsed', () => {
        it('返回最近使用的记忆', async () => {
            const memory1 = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '记忆1',
                memoryType: 'preference',
                source: 'user_input',
            });
            const memory2 = await keyMemoryService.addKeyMemory({
                userId: 'user1',
                content: '记忆2',
                memoryType: 'preference',
                source: 'user_input',
            });

            // 使用 memory2
            await keyMemoryService.recordMemoryUsage(getId(memory2));
            // 等一下再使用 memory1，确保时间不同
            await new Promise(resolve => setTimeout(resolve, 10));
            await keyMemoryService.recordMemoryUsage(getId(memory1));

            const recent = await keyMemoryService.getRecentlyUsed('user1', 10);

            expect(recent).toHaveLength(2);
            expect(recent[0].content).toBe('记忆1'); // 最近使用的排在前面
        });
    });
});

