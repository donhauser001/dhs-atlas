/**
 * 上下文初始化服务
 * 
 * 功能：
 * - 在会话开始时拼装 AI 上下文
 * - 整合用户记忆、活跃项目、最近话题等
 * - 提供结构化的上下文包供系统提示词使用
 * - 支持缓存以提升性能
 */

import { keyMemoryService } from './KeyMemoryService';
import { conversationService } from './ConversationService';
import User from '../models/User';
import Project from '../models/Project';
import { IKeyMemory } from '../models/KeyMemory';

// ============================================================================
// 缓存配置
// ============================================================================

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

/**
 * 简单的 LRU 缓存实现
 */
class SimpleCache<K, V> {
    private cache = new Map<K, CacheEntry<V>>();
    private maxSize: number;
    private ttlMs: number;

    constructor(maxSize: number = 100, ttlSeconds: number = 300) {
        this.maxSize = maxSize;
        this.ttlMs = ttlSeconds * 1000;
    }

    get(key: K): V | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;
        
        // 检查是否过期
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return undefined;
        }
        
        return entry.data;
    }

    set(key: K, value: V): void {
        // 如果超出大小限制，删除最旧的条目
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }
        
        this.cache.set(key, {
            data: value,
            timestamp: Date.now(),
        });
    }

    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    /**
     * 使特定用户的缓存失效
     */
    invalidateForUser(userId: string): number {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (String(key).startsWith(userId)) {
                this.cache.delete(key);
                count++;
            }
        }
        return count;
    }
}

// 上下文缓存（5分钟过期）
const contextCache = new SimpleCache<string, ContextPack>(100, 300);
// 用户档案缓存（10分钟过期）
const userProfileCache = new SimpleCache<string, UserProfile>(200, 600);
// 项目缓存（5分钟过期）
const projectCache = new SimpleCache<string, ProjectSummary[]>(100, 300);

/**
 * 项目摘要
 */
export interface ProjectSummary {
    id: string;
    name: string;
    status: string;
    clientName?: string;
    createdAt: Date;
}

/**
 * 用户档案
 */
export interface UserProfile {
    name?: string;
    role?: string;
    department?: string;
    permissions?: string[];
    preferences: string[];
}

/**
 * 上下文包（用于注入系统提示词）
 */
export interface ContextPack {
    /** 用户档案 */
    userProfile: UserProfile;
    /** 活跃项目 */
    activeProjects: ProjectSummary[];
    /** 最近话题 */
    recentTopics: string[];
    /** 边界与禁忌 */
    boundaries: string[];
    /** 用户记忆（按类型分组） */
    memories: {
        preferences: string[];
        projects: string[];
        roles: string[];
        boundaries: string[];
    };
    /** 元数据 */
    meta: {
        bootstrapTime: Date;
        sessionId?: string;
        memoryCount: number;
        projectCount: number;
    };
}

/**
 * Bootstrap 选项
 */
export interface BootstrapOptions {
    /** 是否加载项目 */
    loadProjects?: boolean;
    /** 项目数量限制 */
    projectLimit?: number;
    /** 是否加载最近话题 */
    loadRecentTopics?: boolean;
    /** 最近话题数量 */
    topicLimit?: number;
}

const DEFAULT_OPTIONS: BootstrapOptions = {
    loadProjects: true,
    projectLimit: 5,
    loadRecentTopics: true,
    topicLimit: 5,
};

/**
 * 上下文初始化服务
 */
class ContextBootstrapService {
    /**
     * 执行上下文初始化
     * 
     * @param userId 用户 ID
     * @param sessionId 会话 ID
     * @param options 选项
     * @returns 上下文包
     */
    async bootstrap(
        userId: string,
        sessionId?: string,
        options: BootstrapOptions & { useCache?: boolean; forceRefresh?: boolean } = {}
    ): Promise<ContextPack> {
        const opts = { ...DEFAULT_OPTIONS, useCache: true, ...options };
        const bootstrapTime = new Date();

        // 生成缓存键
        const cacheKey = `${userId}:${opts.loadProjects}:${opts.loadRecentTopics}`;

        // 检查缓存（如果启用且非强制刷新）
        if (opts.useCache && !opts.forceRefresh) {
            const cached = contextCache.get(cacheKey);
            if (cached) {
                console.log('[ContextBootstrapService] 使用缓存的上下文');
                return {
                    ...cached,
                    meta: {
                        ...cached.meta,
                        sessionId,
                        bootstrapTime,
                    },
                };
            }
        }

        console.log('[ContextBootstrapService] 开始初始化上下文:', { userId, sessionId });

        // 并行加载所有数据
        const [
            userProfile,
            memories,
            activeProjects,
            recentTopics,
        ] = await Promise.all([
            this.loadUserProfileCached(userId),
            keyMemoryService.getMemoriesForContext(userId),
            opts.loadProjects ? this.loadActiveProjectsCached(userId, opts.projectLimit!) : [],
            opts.loadRecentTopics ? this.loadRecentTopics(userId, opts.topicLimit!) : [],
        ]);

        // 提取边界（来自记忆和用户设置）
        const boundaries = [...memories.boundaries];

        // 计算记忆总数
        const memoryCount = 
            memories.preferences.length +
            memories.projects.length +
            memories.roles.length +
            memories.boundaries.length;

        const contextPack: ContextPack = {
            userProfile: {
                ...userProfile,
                preferences: memories.preferences,
            },
            activeProjects,
            recentTopics,
            boundaries,
            memories,
            meta: {
                bootstrapTime,
                sessionId,
                memoryCount,
                projectCount: activeProjects.length,
            },
        };

        console.log('[ContextBootstrapService] 上下文初始化完成:', {
            memoryCount,
            projectCount: activeProjects.length,
            topicCount: recentTopics.length,
        });

        // 缓存结果
        if (opts.useCache) {
            const cacheKey = `${userId}:${opts.loadProjects}:${opts.loadRecentTopics}`;
            contextCache.set(cacheKey, contextPack);
        }

        return contextPack;
    }

    /**
     * 获取当前上下文包（快速版，不加载项目）
     */
    async getCurrentContextPack(userId: string): Promise<ContextPack> {
        return this.bootstrap(userId, undefined, {
            loadProjects: false,
            loadRecentTopics: false,
        });
    }

    /**
     * 加载用户档案（带缓存）
     */
    private async loadUserProfileCached(userId: string): Promise<UserProfile> {
        const cached = userProfileCache.get(userId);
        if (cached) {
            return cached;
        }
        
        const profile = await this.loadUserProfile(userId);
        userProfileCache.set(userId, profile);
        return profile;
    }

    /**
     * 加载活跃项目（带缓存）
     */
    private async loadActiveProjectsCached(userId: string, limit: number): Promise<ProjectSummary[]> {
        const cacheKey = `${userId}:${limit}`;
        const cached = projectCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        
        const projects = await this.loadActiveProjects(userId, limit);
        projectCache.set(cacheKey, projects);
        return projects;
    }

    /**
     * 使用户缓存失效
     */
    invalidateUserCache(userId: string): void {
        contextCache.invalidateForUser(userId);
        userProfileCache.delete(userId);
        projectCache.invalidateForUser(userId);
        console.log('[ContextBootstrapService] 已清除用户缓存:', userId);
    }

    /**
     * 清除所有缓存
     */
    clearAllCaches(): void {
        contextCache.clear();
        userProfileCache.clear();
        projectCache.clear();
        console.log('[ContextBootstrapService] 已清除所有缓存');
    }

    /**
     * 加载用户档案
     */
    private async loadUserProfile(userId: string): Promise<UserProfile> {
        try {
            const user = await User.findById(userId)
                .select('username realName role department permissions')
                .lean();

            if (!user) {
                return {
                    preferences: [],
                };
            }

            return {
                name: user.realName || user.username,
                role: user.role,
                department: (user as any).department,
                permissions: user.permissions || [],
                preferences: [],
            };
        } catch (error) {
            console.error('[ContextBootstrapService] 加载用户档案失败:', error);
            return { preferences: [] };
        }
    }

    /**
     * 加载活跃项目
     */
    private async loadActiveProjects(
        userId: string,
        limit: number
    ): Promise<ProjectSummary[]> {
        try {
            // 查询用户参与的活跃项目
            const projects = await Project.find({
                $or: [
                    { manager: userId },
                    { members: userId },
                    { createdBy: userId },
                ],
                status: { $nin: ['completed', 'cancelled', 'archived'] },
            })
                .sort({ updatedAt: -1 })
                .limit(limit)
                .populate('client', 'name')
                .select('name status client createdAt')
                .lean();

            return projects.map((p: any) => ({
                id: p._id.toString(),
                name: p.name,
                status: p.status,
                clientName: p.client?.name,
                createdAt: p.createdAt,
            }));
        } catch (error) {
            console.error('[ContextBootstrapService] 加载活跃项目失败:', error);
            return [];
        }
    }

    /**
     * 加载最近话题（从对话历史中提取）
     */
    private async loadRecentTopics(
        userId: string,
        limit: number
    ): Promise<string[]> {
        try {
            // 获取最近的用户消息
            const recentConversations = await conversationService.getUserRecentConversations(
                userId,
                20 // 获取更多消息用于提取话题
            );

            // 过滤出用户消息
            const userMessages = recentConversations
                .filter(c => c.role === 'user')
                .map(c => c.content);

            // 简单的话题提取（提取前几条消息的关键词）
            const topics = this.extractTopics(userMessages, limit);

            return topics;
        } catch (error) {
            console.error('[ContextBootstrapService] 加载最近话题失败:', error);
            return [];
        }
    }

    /**
     * 从消息中提取话题
     * （简单实现，可以后续用 NLP 增强）
     */
    private extractTopics(messages: string[], limit: number): string[] {
        const topics: string[] = [];
        
        // 关键词模式
        const patterns = [
            /查(询|看|找)?(.{2,10}?)的?信息/,
            /(.{2,10}?)项目/,
            /(.{2,10}?)合同/,
            /(.{2,10}?)客户/,
            /关于(.{2,10})/,
        ];

        for (const message of messages) {
            for (const pattern of patterns) {
                const match = message.match(pattern);
                if (match && match[1]) {
                    const topic = match[1].trim();
                    if (topic && !topics.includes(topic) && topic.length >= 2) {
                        topics.push(topic);
                        if (topics.length >= limit) {
                            return topics;
                        }
                    }
                }
            }

            // 如果没有匹配到模式，截取消息摘要
            if (topics.length < limit && message.length > 5 && message.length < 50) {
                const summary = message.slice(0, 20);
                if (!topics.includes(summary)) {
                    topics.push(summary);
                }
            }
        }

        return topics.slice(0, limit);
    }

    /**
     * 格式化上下文包为系统提示词片段
     */
    formatContextForPrompt(pack: ContextPack): string {
        const parts: string[] = [];

        // 用户信息
        if (pack.userProfile.name || pack.userProfile.role) {
            parts.push(`## 用户信息`);
            if (pack.userProfile.name) {
                parts.push(`- 姓名：${pack.userProfile.name}`);
            }
            if (pack.userProfile.role) {
                parts.push(`- 角色：${pack.userProfile.role}`);
            }
            if (pack.userProfile.department) {
                parts.push(`- 部门：${pack.userProfile.department}`);
            }
            parts.push('');
        }

        // 用户偏好
        if (pack.memories.preferences.length > 0) {
            parts.push(`## 用户偏好（请在交互中尊重这些偏好）`);
            for (const pref of pack.memories.preferences) {
                parts.push(`- ${pref}`);
            }
            parts.push('');
        }

        // 用户角色
        if (pack.memories.roles.length > 0) {
            parts.push(`## 用户角色/身份`);
            for (const role of pack.memories.roles) {
                parts.push(`- ${role}`);
            }
            parts.push('');
        }

        // 活跃项目
        if (pack.activeProjects.length > 0) {
            parts.push(`## 活跃项目`);
            for (const project of pack.activeProjects) {
                let line = `- ${project.name}`;
                if (project.clientName) {
                    line += ` (客户: ${project.clientName})`;
                }
                line += ` [${project.status}]`;
                parts.push(line);
            }
            parts.push('');
        }

        // 项目相关记忆
        if (pack.memories.projects.length > 0) {
            parts.push(`## 项目相关背景`);
            for (const proj of pack.memories.projects) {
                parts.push(`- ${proj}`);
            }
            parts.push('');
        }

        // 最近话题
        if (pack.recentTopics.length > 0) {
            parts.push(`## 最近讨论的话题`);
            for (const topic of pack.recentTopics) {
                parts.push(`- ${topic}`);
            }
            parts.push('');
        }

        // 边界与禁忌
        if (pack.boundaries.length > 0) {
            parts.push(`## 边界与禁忌（请严格遵守）`);
            for (const boundary of pack.boundaries) {
                parts.push(`- ⚠️ ${boundary}`);
            }
            parts.push('');
        }

        return parts.join('\n');
    }

    /**
     * 刷新用户上下文（清除缓存）
     * 预留接口，用于后续实现缓存机制
     */
    async refreshContext(userId: string): Promise<void> {
        console.log('[ContextBootstrapService] 刷新用户上下文:', userId);
        // 预留：清除缓存
    }
}

// 导出单例
export const contextBootstrapService = new ContextBootstrapService();
export default contextBootstrapService;

