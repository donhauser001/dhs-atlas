/**
 * Phase 2 & 3 优化功能测试
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';
import {
    getContextAwareMessage,
    getContextAwareExplanation,
    ErrorContext,
    ReasonCode,
} from '../ai/agent/reason-codes';
import { keyMemoryService } from '../services/KeyMemoryService';
import KeyMemory from '../models/KeyMemory';

describe('Phase 2 & 3 优化功能', () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    // ========================================================================
    // Phase 2: 上下文感知错误消息
    // ========================================================================
    describe('上下文感知错误消息', () => {
        it('应该返回基本消息（无上下文）', () => {
            const message = getContextAwareMessage('EMPTY_CLIENT_NOT_FOUND');
            expect(message).toBe('没有找到符合条件的客户');
        });

        it('应该使用实体名称生成消息', () => {
            const context: ErrorContext = {
                entityName: '张三建筑公司',
                entityType: 'client',
            };
            const message = getContextAwareMessage('EMPTY_CLIENT_NOT_FOUND', context);
            expect(message).toContain('张三建筑公司');
        });

        it('应该根据实体类型生成消息', () => {
            const context: ErrorContext = {
                entityType: 'project',
            };
            const message = getContextAwareMessage('EMPTY_PROJECT_NOT_FOUND', context);
            expect(message).toContain('项目');
        });

        it('应该为权限错误生成操作相关消息', () => {
            const context: ErrorContext = {
                operation: '删除此合同',
            };
            const message = getContextAwareMessage('BLOCKED_PERMISSION_DENIED', context);
            expect(message).toContain('删除此合同');
        });

        it('应该返回完整的上下文感知解释', () => {
            const context: ErrorContext = {
                entityName: '项目A',
                entityType: 'project',
            };
            const explanation = getContextAwareExplanation('EMPTY_PROJECT_NOT_FOUND', context);
            
            expect(explanation.userMessage).toContain('项目A');
            expect(explanation.suggestion).toBeTruthy();
            expect(explanation.canRetry).toBe(false);
            expect(explanation.severity).toBe('info');
        });

        it('应该正确映射实体类型到中文标签', () => {
            const types = ['client', 'project', 'contract', 'invoice', 'quotation'];
            const labels = ['客户', '项目', '合同', '发票', '报价单'];
            
            types.forEach((type, i) => {
                const context: ErrorContext = { entityType: type };
                const message = getContextAwareMessage('EMPTY_DATA_NOT_FOUND', context);
                expect(message).toContain(labels[i]);
            });
        });
    });

    // ========================================================================
    // Phase 3: 记忆去重与相似度
    // ========================================================================
    describe('记忆去重与相似度', () => {
        const testUserId = 'test-user-123';

        beforeEach(async () => {
            await KeyMemory.deleteMany({});
        });

        it('应该计算字符串相似度', async () => {
            // 创建一些测试记忆
            await KeyMemory.create({
                userId: testUserId,
                content: '用户偏好使用简洁的报告格式',
                memoryType: 'preference',
                source: 'user_input',
                isActive: true,
                useCount: 5,
            });

            // 查找相似记忆（使用相同内容确保能找到）
            const similar = await keyMemoryService.findSimilarMemories(
                testUserId,
                '用户偏好使用简洁的报告格式',
                0.5
            );

            expect(similar.length).toBeGreaterThan(0);
            expect(similar[0].similarity).toBeGreaterThanOrEqual(0.5);
        });

        it('应该使用去重功能添加记忆', async () => {
            // 先添加一条记忆
            await keyMemoryService.addKeyMemory({
                userId: testUserId,
                content: '用户喜欢详细的项目报告',
                memoryType: 'preference',
                source: 'user_input',
            });

            // 尝试添加高度相似的记忆
            const result = await keyMemoryService.addMemoryWithDedup({
                userId: testUserId,
                content: '用户喜欢详细的项目报告',
                memoryType: 'preference',
                source: 'user_input',
            });

            expect(result.action).toBe('skipped');
        });

        it('应该计算记忆重要性分数', async () => {
            const memory = await KeyMemory.create({
                userId: testUserId,
                content: '测试记忆',
                memoryType: 'preference',
                source: 'user_input',
                isActive: true,
                useCount: 10,
            });

            const score = keyMemoryService.calculateImportanceScore(memory);
            expect(score).toBeGreaterThan(0);
        });

        it('应该按重要性获取记忆', async () => {
            // 创建多条记忆
            await KeyMemory.create([
                {
                    userId: testUserId,
                    content: '记忆1',
                    memoryType: 'preference',
                    source: 'user_input',
                    isActive: true,
                    useCount: 1,
                },
                {
                    userId: testUserId,
                    content: '记忆2',
                    memoryType: 'preference',
                    source: 'user_input',
                    isActive: true,
                    useCount: 10,
                },
                {
                    userId: testUserId,
                    content: '记忆3',
                    memoryType: 'role',
                    source: 'user_input',
                    isActive: true,
                    useCount: 5,
                },
            ]);

            const ranked = await keyMemoryService.getMemoriesByImportance(testUserId, 3);
            
            expect(ranked.length).toBe(3);
            // 分数应该按降序排列
            expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
            expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
        });
    });

    // ========================================================================
    // 新增 ReasonCode 测试
    // ========================================================================
    describe('新增 ReasonCode', () => {
        const newEmptyCodes: ReasonCode[] = [
            'EMPTY_INVOICE_NOT_FOUND',
            'EMPTY_QUOTATION_NOT_FOUND',
            'EMPTY_TEMPLATE_NOT_FOUND',
            'EMPTY_MEMORY_NOT_FOUND',
        ];

        const newBlockedCodes: ReasonCode[] = [
            'BLOCKED_CONCURRENT_MODIFICATION',
            'BLOCKED_RESOURCE_LOCKED',
            'BLOCKED_QUOTA_EXCEEDED',
            'BLOCKED_FEATURE_DISABLED',
        ];

        const newErrorCodes: ReasonCode[] = [
            'ERROR_SERIALIZATION',
            'ERROR_DESERIALIZATION',
            'ERROR_FILE_OPERATION',
            'ERROR_EXTERNAL_SERVICE',
        ];

        it('新增的 Empty 类 ReasonCode 应该有有效的解释', () => {
            for (const code of newEmptyCodes) {
                const explanation = getContextAwareExplanation(code);
                expect(explanation.userMessage).toBeTruthy();
                // EMPTY_TEMPLATE_NOT_FOUND 是 warning（模板缺失比较严重）
                expect(['info', 'warning']).toContain(explanation.severity);
            }
        });

        it('新增的 Blocked 类 ReasonCode 应该有有效的解释', () => {
            for (const code of newBlockedCodes) {
                const explanation = getContextAwareExplanation(code);
                expect(explanation.userMessage).toBeTruthy();
                expect(['info', 'warning']).toContain(explanation.severity);
            }
        });

        it('新增的 Error 类 ReasonCode 应该有有效的解释', () => {
            for (const code of newErrorCodes) {
                const explanation = getContextAwareExplanation(code);
                expect(explanation.userMessage).toBeTruthy();
                expect(explanation.severity).toBe('error');
            }
        });
    });
});

