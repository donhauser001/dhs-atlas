export interface Permission {
    key: string;
    title: string;
    children?: Permission[];
}

export interface PermissionGroup {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    createTime: string;
}

export interface CreatePermissionGroupRequest {
    name: string;
    description: string;
    permissions: string[];
}

export interface UpdatePermissionGroupRequest {
    name?: string;
    description?: string;
    permissions?: string[];
}

export interface PermissionGroupQuery {
    search?: string;
    page?: number;
    limit?: number;
} 