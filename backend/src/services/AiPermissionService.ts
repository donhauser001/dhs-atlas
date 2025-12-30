import User from '../models/User';
import AiTool from '../models/AiToolkit';

/**
 * 权限检查结果
 */
export interface PermissionResult {
    allowed: boolean;
    reason?: string;
    reasonCode?: string;
}

/**
 * 缓存的用户权限
 */
interface CachedUserPermissions {
    permissions: string[];
    timestamp: number;
}

/**
 * 缓存的工具权限
 */
interface CachedToolPermission {
    permission: string | null;
    timestamp: number;
}

// ============================================================================
// LRU 缓存实现
// ============================================================================

/**
 * 简单的 LRU 缓存实现
 */
class LRUCache<K, V> {
    private cache: Map<K, V>;
    private maxSize: number;

    constructor(maxSize: number) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    get(key: K): V | undefined {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // 移到末尾（最近使用）
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }

    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // 删除最老的（第一个）
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }

    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

// ============================================================================
// 缓存配置
// ============================================================================

// 用户权限缓存：最多 500 个用户，5 分钟过期
const userPermissionsCache = new LRUCache<string, CachedUserPermissions>(500);
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 分钟

// 工具权限缓存：最多 200 个工具，10 分钟过期
const toolPermissionsCache = new LRUCache<string, CachedToolPermission>(200);
const TOOL_CACHE_TTL = 10 * 60 * 1000; // 10 分钟

// ============================================================================
// 静态配置
// ============================================================================

/**
 * 工具到权限的映射（静态回退配置）
 * 优先使用数据库中的 requiredPermission 字段
 */
const TOOL_PERMISSION_MAP: Record<string, string> = {
    // 数据库操作
    'db.query': 'ai:db.query',
    'db.insert': 'ai:db.insert',
    'db.update': 'ai:db.update',
    'db.delete': 'ai:db.delete',

    // 合同相关
    'contract.generate': 'ai:contract.generate',
    'contract.template.list': 'ai:contract.view',
    'contract.template.match': 'ai:contract.view',
    'contract.save': 'ai:contract.create',

    // CRM 相关
    'crm.contact_stats': 'ai:crm.contact_stats',
    'crm.client.query': 'ai:crm.view',

    // 项目相关
    'project.query': 'ai:project.view',
    'project.stats': 'ai:project.view',
};

/**
 * 超级权限列表
 */
const SUPER_PERMISSIONS = ['all', 'ai:*', 'ai:all'];

/**
 * 默认允许的工具列表（无需特定权限）
 */
const DEFAULT_ALLOWED_TOOLS = [
    'db.query',        // 基础查询权限
    'map.search',      // AI 地图搜索（系统核心能力）
    'datamodel.get',   // 获取数据模型（了解字段结构）
    'schema.search',   // 搜索相关数据表（按需返回，节省 token）
];

// ============================================================================
// AI 权限服务
// ============================================================================

/**
 * AI 权限服务
 * 
 * 功能：
 * - 检查用户是否有权限执行特定 AI 工具
 * - 检查用户是否有权限访问特定集合
 * - 获取用户的 AI 权限列表
 * 
 * 优化：
 * - LRU 缓存减少数据库查询
 * - 支持从数据库动态读取工具权限配置
 */
export class AiPermissionService {
    /**
     * 检查用户是否有权限执行工具
     */
    async checkToolPermission(
        userId: string,
        toolId: string
    ): Promise<PermissionResult> {
        try {
            // 1. 获取用户权限（带缓存）
            const userPermissions = await this.getUserPermissionsCached(userId);

            if (!userPermissions) {
                return {
                    allowed: false,
                    reason: '用户不存在',
                    reasonCode: 'BLOCKED_USER_NOT_FOUND',
                };
            }

            // 2. 检查超级权限
            if (this.hasSuperPermission(userPermissions)) {
                return { allowed: true };
            }

            // 3. 检查是否是默认允许的工具
            if (DEFAULT_ALLOWED_TOOLS.includes(toolId)) {
                return { allowed: true };
            }

            // 4. 获取工具所需的权限（带缓存）
            const requiredPermission = await this.getToolRequiredPermissionCached(toolId);

            if (!requiredPermission) {
                // 工具没有配置权限要求，默认允许
                return { allowed: true };
            }

            // 5. 检查用户是否有所需权限
            if (this.hasPermission(userPermissions, requiredPermission)) {
                return { allowed: true };
            }

            // 6. 检查分类权限（如 ai:db.* 可以访问所有 ai:db.xxx）
            const category = requiredPermission.split('.')[0]; // e.g., "ai:db"
            if (this.hasPermission(userPermissions, `${category}.*`)) {
                return { allowed: true };
            }

            return {
                allowed: false,
                reason: `无权限执行工具 ${toolId}，需要权限: ${requiredPermission}`,
                reasonCode: 'BLOCKED_PERMISSION_DENIED',
            };
        } catch (error) {
            console.error('[AiPermissionService] 检查工具权限失败:', error);
            return {
                allowed: false,
                reason: '权限检查失败',
                reasonCode: 'ERROR_PERMISSION_CHECK',
            };
        }
    }

    /**
     * 检查用户是否有权限访问集合
     */
    async checkCollectionPermission(
        userId: string,
        collection: string,
        operation: 'read' | 'write'
    ): Promise<PermissionResult> {
        try {
            const userPermissions = await this.getUserPermissionsCached(userId);

            if (!userPermissions) {
                return {
                    allowed: false,
                    reason: '用户不存在',
                    reasonCode: 'BLOCKED_USER_NOT_FOUND',
                };
            }

            // 检查超级权限
            if (this.hasSuperPermission(userPermissions)) {
                return { allowed: true };
            }

            // 映射操作到权限
            const permissionKey = operation === 'read' ? 'ai:db.query' : 'ai:db.update';

            // 检查基础数据库权限
            if (this.hasPermission(userPermissions, permissionKey)) {
                return { allowed: true };
            }

            // 检查分类权限
            if (this.hasPermission(userPermissions, 'ai:db.*')) {
                return { allowed: true };
            }

            return {
                allowed: false,
                reason: `无权限${operation === 'read' ? '读取' : '写入'}集合 ${collection}`,
                reasonCode: 'BLOCKED_COLLECTION_PERMISSION_DENIED',
            };
        } catch (error) {
            console.error('[AiPermissionService] 检查集合权限失败:', error);
            return {
                allowed: false,
                reason: '权限检查失败',
                reasonCode: 'ERROR_PERMISSION_CHECK',
            };
        }
    }

    /**
     * 获取用户的 AI 权限列表
     */
    async getUserAiPermissions(userId: string): Promise<string[]> {
        const permissions = await this.getUserPermissionsCached(userId);
        if (!permissions) {
            return [];
        }
        // 过滤出 AI 相关权限
        return permissions.filter(p => p.startsWith('ai:') || SUPER_PERMISSIONS.includes(p));
    }

    // ========================================================================
    // 缓存相关方法
    // ========================================================================

    /**
     * 获取用户权限（带缓存）
     */
    private async getUserPermissionsCached(userId: string): Promise<string[] | null> {
        const now = Date.now();
        const cached = userPermissionsCache.get(userId);

        // 检查缓存是否有效
        if (cached && (now - cached.timestamp) < USER_CACHE_TTL) {
            return cached.permissions;
        }

        // 查询数据库
        const user = await User.findById(userId).select('permissions permissionGroups role').lean();

        if (!user) {
            return null;
        }

        const permissions = this.getUserAllPermissions(user);

        // 更新缓存
        userPermissionsCache.set(userId, {
            permissions,
            timestamp: now,
        });

        return permissions;
    }

    /**
     * 获取工具所需权限（带缓存）
     */
    private async getToolRequiredPermissionCached(toolId: string): Promise<string | null> {
        const now = Date.now();
        const cached = toolPermissionsCache.get(toolId);

        // 检查缓存是否有效
        if (cached && (now - cached.timestamp) < TOOL_CACHE_TTL) {
            return cached.permission;
        }

        // 获取权限
        const permission = await this.getToolRequiredPermission(toolId);

        // 更新缓存
        toolPermissionsCache.set(toolId, {
            permission,
            timestamp: now,
        });

        return permission;
    }

    /**
     * 清除用户权限缓存
     */
    clearUserCache(userId?: string): void {
        if (userId) {
            userPermissionsCache.delete(userId);
        } else {
            userPermissionsCache.clear();
        }
    }

    /**
     * 清除工具权限缓存
     */
    clearToolCache(toolId?: string): void {
        if (toolId) {
            toolPermissionsCache.delete(toolId);
        } else {
            toolPermissionsCache.clear();
        }
    }

    /**
     * 清除所有缓存
     */
    clearAllCache(): void {
        userPermissionsCache.clear();
        toolPermissionsCache.clear();
        console.log('[AiPermissionService] 所有缓存已清除');
    }

    /**
     * 获取缓存统计
     */
    getCacheStats(): { userCacheSize: number; toolCacheSize: number } {
        return {
            userCacheSize: userPermissionsCache.size(),
            toolCacheSize: toolPermissionsCache.size(),
        };
    }

    // ========================================================================
    // 私有方法
    // ========================================================================

    /**
     * 获取工具所需的权限
     * 优先级：数据库 requiredPermission > 数据库 category 推断 > 静态映射表
     */
    private async getToolRequiredPermission(toolId: string): Promise<string | null> {
        // 1. 检查数据库中的工具配置
        const tool = await AiTool.findOne({ toolId }).select('requiredPermission category').lean();

        if (tool) {
            // 如果 requiredPermission 字段存在（包括显式设为 null），使用它
            // null 表示不需要权限，字符串表示需要该权限
            if ('requiredPermission' in tool) {
                return (tool as any).requiredPermission; // null 或 string
            }
            // 未配置 requiredPermission 时，根据 category 生成默认权限
            if ((tool as any).category) {
                return `ai:${(tool as any).category}.${toolId.split('.').pop()}`;
            }
        }

        // 2. 回退到静态映射表
        if (TOOL_PERMISSION_MAP[toolId]) {
            return TOOL_PERMISSION_MAP[toolId];
        }

        return null;
    }

    /**
     * 获取用户的所有权限（包括权限组中的权限）
     */
    private getUserAllPermissions(user: any): string[] {
        const permissions: string[] = [];

        // 添加直接分配的权限
        if (user.permissions && Array.isArray(user.permissions)) {
            permissions.push(...user.permissions);
        }

        // 根据角色添加默认权限
        if (user.role) {
            const rolePermissions = this.getRoleDefaultPermissions(user.role);
            permissions.push(...rolePermissions);
        }

        return [...new Set(permissions)]; // 去重
    }

    /**
     * 获取角色的默认 AI 权限
     */
    private getRoleDefaultPermissions(role: string): string[] {
        const rolePermissionMap: Record<string, string[]> = {
            '超级管理员': ['all'],
            '项目经理': ['ai:db.query', 'ai:project.view', 'ai:crm.view', 'ai:contract.view'],
            '设计师': ['ai:db.query', 'ai:project.view'],
            '员工': ['ai:db.query'],
            '客户': [], // 客户默认无 AI 权限
        };

        return rolePermissionMap[role] || [];
    }

    /**
     * 检查用户是否有超级权限
     */
    private hasSuperPermission(permissions: string[]): boolean {
        return permissions.some(p => SUPER_PERMISSIONS.includes(p));
    }

    /**
     * 检查用户是否有指定权限
     */
    private hasPermission(userPermissions: string[], requiredPermission: string): boolean {
        return userPermissions.some(p => {
            // 完全匹配
            if (p === requiredPermission) {
                return true;
            }
            // 通配符匹配 (e.g., ai:db.* 匹配 ai:db.query)
            if (p.endsWith('.*')) {
                const prefix = p.slice(0, -1); // 去掉 *
                return requiredPermission.startsWith(prefix);
            }
            return false;
        });
    }
}

// 导出单例
export const aiPermissionService = new AiPermissionService();
export default aiPermissionService;
