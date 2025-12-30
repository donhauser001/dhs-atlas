/**
 * ContextBootstrapService 单元测试
 * 
 * 测试内容：
 * 1. 上下文初始化
 * 2. 用户档案加载
 * 3. 记忆整合
 * 4. 上下文格式化
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import KeyMemory from '../models/KeyMemory';
import Conversation from '../models/Conversation';
import User from '../models/User';
import { contextBootstrapService, ContextPack } from '../services/ContextBootstrapService';
import { keyMemoryService } from '../services/KeyMemoryService';
import { conversationService } from '../services/ConversationService';

describe('ContextBootstrapService', () => {
    let mongoServer: MongoMemoryServer;
    let testUserId: string;

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
        await Conversation.deleteMany({});
        await User.deleteMany({});

        // 创建测试用户
        const user = await User.create({
            username: 'zhangsan',
            realName: '张三',
            email: 'zhangsan@example.com',
            password: 'test123',
            role: '项目经理',
            department: '设计部',
            phone: '13800138000',
        }) as { _id: { toString(): string } };
        testUserId = user._id.toString();
    });

    describe('bootstrap', () => {
        it('返回完整的上下文包', async () => {
            const contextPack = await contextBootstrapService.bootstrap(testUserId, 'session1');

            expect(contextPack).toHaveProperty('userProfile');
            expect(contextPack).toHaveProperty('activeProjects');
            expect(contextPack).toHaveProperty('recentTopics');
            expect(contextPack).toHaveProperty('boundaries');
            expect(contextPack).toHaveProperty('memories');
            expect(contextPack).toHaveProperty('meta');
        });

        it('包含用户档案', async () => {
            const contextPack = await contextBootstrapService.bootstrap(testUserId, 'session1');

            expect(contextPack.userProfile.name).toBe('张三');
            expect(contextPack.userProfile.role).toBe('项目经理');
        });

        it('包含用户记忆', async () => {
            // 创建测试记忆
            await keyMemoryService.addKeyMemory({
                userId: testUserId,
                content: '喜欢简洁的报告',
                memoryType: 'preference',
                source: 'user_input',
            });
            await keyMemoryService.addKeyMemory({
                userId: testUserId,
                content: '正在做网站项目',
                memoryType: 'project',
                source: 'user_input',
            });

            const contextPack = await contextBootstrapService.bootstrap(testUserId, 'session1');

            expect(contextPack.memories.preferences).toContain('喜欢简洁的报告');
            expect(contextPack.memories.projects).toContain('正在做网站项目');
        });

        it('包含边界约束', async () => {
            await keyMemoryService.addKeyMemory({
                userId: testUserId,
                content: '不讨论竞争对手',
                memoryType: 'boundary',
                source: 'user_input',
            });

            const contextPack = await contextBootstrapService.bootstrap(testUserId, 'session1');

            expect(contextPack.boundaries).toContain('不讨论竞争对手');
        });

        it('记录元数据', async () => {
            const contextPack = await contextBootstrapService.bootstrap(testUserId, 'session1');

            expect(contextPack.meta.bootstrapTime).toBeInstanceOf(Date);
            expect(contextPack.meta.sessionId).toBe('session1');
            expect(typeof contextPack.meta.memoryCount).toBe('number');
            expect(typeof contextPack.meta.projectCount).toBe('number');
        });
    });

    describe('bootstrap options', () => {
        it('可以禁用项目加载', async () => {
            const contextPack = await contextBootstrapService.bootstrap(
                testUserId,
                'session1',
                { loadProjects: false }
            );

            expect(contextPack.activeProjects).toHaveLength(0);
        });

        it('可以禁用最近话题加载', async () => {
            // 先创建一些对话
            await conversationService.logEvent({
                userId: testUserId,
                sessionId: 'session0',
                role: 'user',
                content: '查询客户信息',
            });

            const contextPack = await contextBootstrapService.bootstrap(
                testUserId,
                'session1',
                { loadRecentTopics: false }
            );

            expect(contextPack.recentTopics).toHaveLength(0);
        });
    });

    describe('getCurrentContextPack', () => {
        it('返回快速上下文包', async () => {
            const contextPack = await contextBootstrapService.getCurrentContextPack(testUserId);

            expect(contextPack).toHaveProperty('userProfile');
            expect(contextPack).toHaveProperty('memories');
            // 快速版本不加载项目和话题
            expect(contextPack.activeProjects).toHaveLength(0);
            expect(contextPack.recentTopics).toHaveLength(0);
        });
    });

    describe('formatContextForPrompt', () => {
        it('格式化用户信息', async () => {
            const contextPack: ContextPack = {
                userProfile: {
                    name: '张三',
                    role: '设计师',
                    preferences: [],
                },
                activeProjects: [],
                recentTopics: [],
                boundaries: [],
                memories: {
                    preferences: [],
                    projects: [],
                    roles: [],
                    boundaries: [],
                },
                meta: {
                    bootstrapTime: new Date(),
                    memoryCount: 0,
                    projectCount: 0,
                },
            };

            const prompt = contextBootstrapService.formatContextForPrompt(contextPack);

            expect(prompt).toContain('张三');
            expect(prompt).toContain('设计师');
        });

        it('格式化用户偏好', async () => {
            const contextPack: ContextPack = {
                userProfile: { preferences: [] },
                activeProjects: [],
                recentTopics: [],
                boundaries: [],
                memories: {
                    preferences: ['喜欢简洁', '偏好蓝色'],
                    projects: [],
                    roles: [],
                    boundaries: [],
                },
                meta: {
                    bootstrapTime: new Date(),
                    memoryCount: 2,
                    projectCount: 0,
                },
            };

            const prompt = contextBootstrapService.formatContextForPrompt(contextPack);

            expect(prompt).toContain('喜欢简洁');
            expect(prompt).toContain('偏好蓝色');
            expect(prompt).toContain('偏好');
        });

        it('格式化边界约束', async () => {
            const contextPack: ContextPack = {
                userProfile: { preferences: [] },
                activeProjects: [],
                recentTopics: [],
                boundaries: ['不讨论薪资', '不透露客户信息'],
                memories: {
                    preferences: [],
                    projects: [],
                    roles: [],
                    boundaries: ['不讨论薪资', '不透露客户信息'],
                },
                meta: {
                    bootstrapTime: new Date(),
                    memoryCount: 2,
                    projectCount: 0,
                },
            };

            const prompt = contextBootstrapService.formatContextForPrompt(contextPack);

            expect(prompt).toContain('不讨论薪资');
            expect(prompt).toContain('禁忌');
            expect(prompt).toContain('⚠️');
        });

        it('格式化活跃项目', async () => {
            const contextPack: ContextPack = {
                userProfile: { preferences: [] },
                activeProjects: [
                    {
                        id: '1',
                        name: '网站设计项目',
                        status: '进行中',
                        clientName: '中信出版社',
                        createdAt: new Date(),
                    },
                ],
                recentTopics: [],
                boundaries: [],
                memories: {
                    preferences: [],
                    projects: [],
                    roles: [],
                    boundaries: [],
                },
                meta: {
                    bootstrapTime: new Date(),
                    memoryCount: 0,
                    projectCount: 1,
                },
            };

            const prompt = contextBootstrapService.formatContextForPrompt(contextPack);

            expect(prompt).toContain('网站设计项目');
            expect(prompt).toContain('中信出版社');
            expect(prompt).toContain('进行中');
        });

        it('格式化最近话题', async () => {
            const contextPack: ContextPack = {
                userProfile: { preferences: [] },
                activeProjects: [],
                recentTopics: ['客户查询', '项目统计'],
                boundaries: [],
                memories: {
                    preferences: [],
                    projects: [],
                    roles: [],
                    boundaries: [],
                },
                meta: {
                    bootstrapTime: new Date(),
                    memoryCount: 0,
                    projectCount: 0,
                },
            };

            const prompt = contextBootstrapService.formatContextForPrompt(contextPack);

            expect(prompt).toContain('客户查询');
            expect(prompt).toContain('项目统计');
            expect(prompt).toContain('最近');
        });

        it('空上下文返回空字符串或最小内容', async () => {
            const contextPack: ContextPack = {
                userProfile: { preferences: [] },
                activeProjects: [],
                recentTopics: [],
                boundaries: [],
                memories: {
                    preferences: [],
                    projects: [],
                    roles: [],
                    boundaries: [],
                },
                meta: {
                    bootstrapTime: new Date(),
                    memoryCount: 0,
                    projectCount: 0,
                },
            };

            const prompt = contextBootstrapService.formatContextForPrompt(contextPack);

            // 空上下文应该返回空或非常短的内容
            expect(prompt.length).toBeLessThan(100);
        });
    });

    describe('用户不存在时的处理', () => {
        it('用户不存在时返回默认上下文', async () => {
            const contextPack = await contextBootstrapService.bootstrap(
                new mongoose.Types.ObjectId().toString(),
                'session1'
            );

            expect(contextPack.userProfile).toBeDefined();
            expect(contextPack.userProfile.preferences).toEqual([]);
        });
    });
});

