export interface Role {
    id: string;
    roleName: string;
    description: string;
    permissions: string[];
    permissionGroups: string[];
    status: 'active' | 'inactive';
    userCount: number;
    createTime: string;
}

export interface CreateRoleRequest {
    roleName: string;
    description: string;
    permissions: string[];
    permissionGroups: string[];
    status: 'active' | 'inactive';
}

export interface UpdateRoleRequest {
    roleName?: string;
    description?: string;
    permissions?: string[];
    permissionGroups?: string[];
    status?: 'active' | 'inactive';
}

export interface RoleQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive';
} 