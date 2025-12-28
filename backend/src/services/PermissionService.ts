import { Permission, PermissionGroup, CreatePermissionGroupRequest, UpdatePermissionGroupRequest, PermissionGroupQuery } from '../models/Permission';

// 模拟权限组数据
let permissionGroups: PermissionGroup[] = [
    {
        id: '1',
        name: '超级管理员权限组',
        description: '拥有系统所有权限，适用于系统管理员',
        permissions: ['all'],
        createTime: '2024-01-01 10:00:00'
    },
    {
        id: '2',
        name: '项目管理测试组',
        description: '项目管理的测试权限组，包含项目相关的所有权限',
        permissions: ['projects:view', 'projects:create', 'projects:edit', 'projects:delete', 'projects:task', 'projects:proposal', 'projects:progress'],
        createTime: '2024-01-02 14:30:00'
    },
    {
        id: '3',
        name: '客户管理测试组',
        description: '客户管理的测试权限组，包含客户相关的所有权限',
        permissions: ['clients:view', 'clients:create', 'clients:edit', 'clients:delete', 'clients:category', 'clients:contact', 'clients:export'],
        createTime: '2024-01-03 09:15:00'
    },
    {
        id: '4',
        name: '财务管理测试组',
        description: '财务管理的测试权限组，包含财务相关的所有权限',
        permissions: ['finance:view', 'finance:order:create', 'finance:order:edit', 'finance:order:delete', 'finance:settlement:view', 'finance:settlement:create', 'finance:settlement:edit', 'finance:invoice:view', 'finance:invoice:create', 'finance:invoice:edit', 'finance:income:view', 'finance:income:stats', 'finance:export'],
        createTime: '2024-01-04 16:45:00'
    },
    {
        id: '5',
        name: '文件管理测试组',
        description: '文件管理的测试权限组，包含文件相关的所有权限',
        permissions: ['file-center:view', 'file-center:upload', 'file-center:download', 'file-center:delete', 'file-center:category', 'file-center:permission'],
        createTime: '2024-01-05 11:20:00'
    },
    {
        id: '6',
        name: '用户管理测试组',
        description: '用户管理的测试权限组，包含用户相关的所有权限',
        permissions: ['users:view', 'users:create', 'users:edit', 'users:delete', 'users:reset-password', 'users:status', 'users:export'],
        createTime: '2024-01-06 13:40:00'
    }
];

// 完整的权限树数据
const treeData: Permission[] = [
    {
        title: '仪表盘',
        key: 'dashboard',
        children: [
            { title: '查看仪表盘', key: 'dashboard:view' },
            { title: '查看统计数据', key: 'dashboard:stats' },
            { title: '查看图表', key: 'dashboard:charts' },
        ],
    },
    {
        title: '项目管理',
        key: 'projects',
        children: [
            { title: '查看项目', key: 'projects:view' },
            { title: '创建项目', key: 'projects:create' },
            { title: '编辑项目', key: 'projects:edit' },
            { title: '删除项目', key: 'projects:delete' },
            { title: '项目任务管理', key: 'projects:task' },
            { title: '项目提案管理', key: 'projects:proposal' },
            { title: '项目进度管理', key: 'projects:progress' },
        ],
    },
    {
        title: '客户管理',
        key: 'clients',
        children: [
            { title: '查看客户', key: 'clients:view' },
            { title: '创建客户', key: 'clients:create' },
            { title: '编辑客户', key: 'clients:edit' },
            { title: '删除客户', key: 'clients:delete' },
            { title: '客户分类管理', key: 'clients:category' },
            { title: '联系人管理', key: 'clients:contact' },
            { title: '客户信息导出', key: 'clients:export' },
        ],
    },
    {
        title: '财务管理',
        key: 'finance',
        children: [
            { title: '查看财务', key: 'finance:view' },
            { title: '创建订单', key: 'finance:order:create' },
            { title: '编辑订单', key: 'finance:order:edit' },
            { title: '删除订单', key: 'finance:order:delete' },
            { title: '查看结算单', key: 'finance:settlement:view' },
            { title: '创建结算单', key: 'finance:settlement:create' },
            { title: '编辑结算单', key: 'finance:settlement:edit' },
            { title: '查看发票', key: 'finance:invoice:view' },
            { title: '创建发票', key: 'finance:invoice:create' },
            { title: '编辑发票', key: 'finance:invoice:edit' },
            { title: '查看回款', key: 'finance:income:view' },
            { title: '回款统计', key: 'finance:income:stats' },
            { title: '财务数据导出', key: 'finance:export' },
        ],
    },
    {
        title: '价格管理',
        key: 'pricing',
        children: [
            { title: '查看价格', key: 'pricing:view' },
            { title: '服务定价管理', key: 'pricing:service:manage' },
            { title: '定价分类管理', key: 'pricing:category:manage' },
            { title: '报价单管理', key: 'pricing:quotation:manage' },
            { title: '价格政策管理', key: 'pricing:policy:manage' },
            { title: '价格数据导出', key: 'pricing:export' },
        ],
    },
    {
        title: '合同管理',
        key: 'contracts',
        children: [
            { title: '查看合同', key: 'contracts:view' },
            { title: '创建合同', key: 'contracts:create' },
            { title: '编辑合同', key: 'contracts:edit' },
            { title: '删除合同', key: 'contracts:delete' },
            { title: '合同模板管理', key: 'contracts:template:manage' },

            { title: '合同审批', key: 'contracts:approve' },
            { title: '合同数据导出', key: 'contracts:export' },
        ],
    },
    {
        title: '内容中心',
        key: 'content',
        children: [
            { title: '查看内容', key: 'content:view' },
            { title: '页面管理', key: 'content:page:manage' },
            { title: '文章管理', key: 'content:article:manage' },
            { title: '菜单管理', key: 'content:menu:manage' },
            { title: '网站设置', key: 'content:website:manage' },
            { title: '内容审核', key: 'content:review' },
            { title: '内容发布', key: 'content:publish' },
        ],
    },
    {
        title: '消息管理',
        key: 'messages',
        children: [
            { title: '查看消息', key: 'messages:view' },
            { title: '发送消息', key: 'messages:send' },
            { title: '删除消息', key: 'messages:delete' },
            { title: '消息设置', key: 'messages:settings' },
        ],
    },
    {
        title: '文件中心',
        key: 'file-center',
        children: [
            { title: '查看文件', key: 'file-center:view' },
            { title: '上传文件', key: 'file-center:upload' },
            { title: '下载文件', key: 'file-center:download' },
            { title: '删除文件', key: 'file-center:delete' },
            { title: '文件分类管理', key: 'file-center:category' },
            { title: '文件权限管理', key: 'file-center:permission' },
        ],
    },
    {
        title: '用户管理',
        key: 'users',
        children: [
            { title: '查看用户', key: 'users:view' },
            { title: '创建用户', key: 'users:create' },
            { title: '编辑用户', key: 'users:edit' },
            { title: '删除用户', key: 'users:delete' },
            { title: '重置密码', key: 'users:reset-password' },
            { title: '用户状态管理', key: 'users:status' },
            { title: '用户数据导出', key: 'users:export' },
        ],
    },
    {
        title: '角色管理',
        key: 'roles',
        children: [
            { title: '查看角色', key: 'roles:view' },
            { title: '创建角色', key: 'roles:create' },
            { title: '编辑角色', key: 'roles:edit' },
            { title: '删除角色', key: 'roles:delete' },
            { title: '角色权限分配', key: 'roles:permission' },
        ],
    },
    {
        title: '权限管理',
        key: 'permissions',
        children: [
            { title: '查看权限', key: 'permissions:view' },
            { title: '编辑权限', key: 'permissions:edit' },
            { title: '权限分配', key: 'permissions:assign' },
        ],
    },
    {
        title: '组织架构',
        key: 'organization',
        children: [
            { title: '查看组织架构', key: 'organization:view' },
            { title: '企业管理', key: 'organization:enterprise:manage' },
            { title: '部门管理', key: 'organization:department:manage' },
            { title: '员工管理', key: 'organization:employee:manage' },
            { title: '组织架构导出', key: 'organization:export' },
        ],
    },
    {
        title: '系统设置',
        key: 'settings',
        children: [
            { title: '查看设置', key: 'settings:view' },
            { title: '常规设置', key: 'settings:general' },
            { title: '高级设置', key: 'settings:advanced' },
            { title: '登录设置', key: 'settings:login' },
            { title: '系统配置', key: 'settings:config' },
            { title: '日志查看', key: 'settings:logs' },
        ],
    },
];

export class PermissionService {
    // 获取权限树数据
    async getPermissionTree(): Promise<Permission[]> {
        return treeData;
    }

    // 获取权限组列表
    async getPermissionGroups(query: PermissionGroupQuery = {}): Promise<{ permissionGroups: PermissionGroup[]; total: number }> {
        let filteredGroups = [...permissionGroups];

        // 搜索过滤
        if (query.search) {
            const searchLower = query.search.toLowerCase();
            filteredGroups = filteredGroups.filter(group =>
                group.name.toLowerCase().includes(searchLower) ||
                group.description.toLowerCase().includes(searchLower)
            );
        }

        const total = filteredGroups.length;

        // 分页
        if (query.page && query.limit) {
            const start = (query.page - 1) * query.limit;
            const end = start + query.limit;
            filteredGroups = filteredGroups.slice(start, end);
        }

        return { permissionGroups: filteredGroups, total };
    }

    // 根据ID获取权限组
    async getPermissionGroupById(id: string): Promise<PermissionGroup | null> {
        return permissionGroups.find(group => group.id === id) || null;
    }

    // 创建权限组
    async createPermissionGroup(groupData: CreatePermissionGroupRequest): Promise<PermissionGroup> {
        // 检查权限组名称是否已存在
        const existingGroup = permissionGroups.find(group => group.name === groupData.name);
        if (existingGroup) {
            throw new Error('权限组名称已存在');
        }

        const newGroup: PermissionGroup = {
            id: Date.now().toString(),
            ...groupData,
            createTime: new Date().toLocaleString()
        };

        permissionGroups.push(newGroup);
        return newGroup;
    }

    // 更新权限组
    async updatePermissionGroup(id: string, groupData: UpdatePermissionGroupRequest): Promise<PermissionGroup | null> {
        const groupIndex = permissionGroups.findIndex(group => group.id === id);
        if (groupIndex === -1) {
            return null;
        }

        // 如果更新名称，检查是否与其他权限组冲突
        if (groupData.name) {
            const existingGroup = permissionGroups.find(group => group.name === groupData.name && group.id !== id);
            if (existingGroup) {
                throw new Error('权限组名称已存在');
            }
        }

        permissionGroups[groupIndex] = { ...permissionGroups[groupIndex], ...groupData };
        return permissionGroups[groupIndex];
    }

    // 删除权限组
    async deletePermissionGroup(id: string): Promise<boolean> {
        const groupIndex = permissionGroups.findIndex(group => group.id === id);
        if (groupIndex === -1) {
            return false;
        }

        permissionGroups.splice(groupIndex, 1);
        return true;
    }

    // 获取所有权限列表（扁平化）
    getAllPermissions(): string[] {
        const permissions: string[] = [];

        const extractPermissions = (nodes: Permission[]) => {
            nodes.forEach(node => {
                if (node.children) {
                    extractPermissions(node.children);
                } else {
                    permissions.push(node.key);
                }
            });
        };

        extractPermissions(treeData);
        return permissions;
    }

    // 验证权限是否存在
    validatePermissions(permissions: string[]): { valid: string[]; invalid: string[] } {
        const allPermissions = this.getAllPermissions();
        const valid: string[] = [];
        const invalid: string[] = [];

        permissions.forEach(permission => {
            if (allPermissions.includes(permission) || permission === '*' || permission === 'all') {
                valid.push(permission);
            } else {
                invalid.push(permission);
            }
        });

        return { valid, invalid };
    }
} 