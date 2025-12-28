import { Role, CreateRoleRequest, UpdateRoleRequest, RoleQuery } from '../models/Role';

// 模拟数据库
let roles: Role[] = [
    {
        id: '1',
        roleName: '超级管理员',
        description: '拥有系统所有权限，可以管理所有功能和用户',
        permissions: ['all'],
        permissionGroups: [],
        status: 'active',
        userCount: 1,
        createTime: '2024-01-01 10:00:00'
    },
    {
        id: '2',
        roleName: '客户',
        description: '客户角色，可以查看自己的项目进度和文件',
        permissions: ['projects:view', 'clients:view', 'contracts:view', 'file-center:view', 'file-center:download'],
        permissionGroups: [],
        status: 'active',
        userCount: 0,
        createTime: '2024-01-02 14:30:00'
    },
    {
        id: '3',
        roleName: '员工',
        description: '普通员工角色，可以参与项目工作和查看相关信息',
        permissions: ['dashboard:view', 'projects:view', 'projects:edit', 'clients:view', 'file-center:view', 'file-center:upload', 'file-center:download'],
        permissionGroups: [],
        status: 'active',
        userCount: 0,
        createTime: '2024-01-03 09:15:00'
    }
];

export class RoleService {
    // 获取角色列表
    static getRoles(query: RoleQuery = {}): { data: Role[]; total: number; page: number; limit: number } {
        const { page = 1, limit = 10, search = '', status } = query;

        let filteredRoles = roles;

        // 搜索过滤
        if (search) {
            filteredRoles = filteredRoles.filter(role =>
                role.roleName.toLowerCase().includes(search.toLowerCase()) ||
                role.description.toLowerCase().includes(search.toLowerCase())
            );
        }

        // 状态过滤
        if (status) {
            filteredRoles = filteredRoles.filter(role => role.status === status);
        }

        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedRoles = filteredRoles.slice(startIndex, endIndex);

        return {
            data: paginatedRoles,
            total: filteredRoles.length,
            page,
            limit
        };
    }

    // 根据ID获取角色
    static getRoleById(id: string): Role | null {
        return roles.find(role => role.id === id) || null;
    }

    // 创建角色
    static createRole(roleData: CreateRoleRequest): Role {
        const newRole: Role = {
            id: Date.now().toString(),
            ...roleData,
            userCount: 0,
            createTime: new Date().toLocaleString()
        };

        roles.push(newRole);
        return newRole;
    }

    // 更新角色
    static updateRole(id: string, roleData: UpdateRoleRequest): Role | null {
        const roleIndex = roles.findIndex(role => role.id === id);
        if (roleIndex === -1) {
            return null;
        }

        roles[roleIndex] = {
            ...roles[roleIndex],
            ...roleData
        };

        return roles[roleIndex];
    }

    // 删除角色
    static deleteRole(id: string): boolean {
        const roleIndex = roles.findIndex(role => role.id === id);
        if (roleIndex === -1) {
            return false;
        }

        // 检查是否有用户使用该角色
        if (roles[roleIndex].userCount > 0) {
            return false;
        }

        roles.splice(roleIndex, 1);
        return true;
    }

    // 检查角色名称是否已存在
    static isRoleNameExists(roleName: string, excludeId?: string): boolean {
        return roles.some(role =>
            role.roleName === roleName &&
            (!excludeId || role.id !== excludeId)
        );
    }

    // 获取所有角色（不分页）
    static getAllRoles(): Role[] {
        return roles;
    }
} 