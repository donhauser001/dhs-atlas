import api from '@/lib/axios';

// 权限类型定义
export interface Permission {
  _id: string;
  name: string;
  code: string;
  module: string;
  description?: string;
}

export interface PermissionGroup {
  _id: string;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionTreeNode {
  module: string;
  moduleName: string;
  permissions: Permission[];
}

export interface CreatePermissionGroupInput {
  name: string;
  code: string;
  description?: string;
  permissions: string[];
}

export interface UpdatePermissionGroupInput {
  name?: string;
  code?: string;
  description?: string;
  permissions?: string[];
}

export interface ValidatePermissionsInput {
  permissions: string[];
}

export interface ValidatePermissionsResponse {
  valid: boolean;
  invalidPermissions: string[];
}

// 获取权限树
export async function getPermissionTree(): Promise<PermissionTreeNode[]> {
  const response = await api.get('/permissions/tree');
  return response.data.data || [];
}

// 获取所有权限列表
export async function getAllPermissions(): Promise<Permission[]> {
  const response = await api.get('/permissions/all');
  return response.data.data || [];
}

// 获取权限组列表
export async function getPermissionGroups(): Promise<PermissionGroup[]> {
  const response = await api.get('/permissions/groups');
  return response.data.data || [];
}

// 验证权限
export async function validatePermissions(
  data: ValidatePermissionsInput
): Promise<ValidatePermissionsResponse> {
  const response = await api.post('/permissions/validate', data);
  return response.data;
}


// 获取权限组详情
export async function getPermissionGroupById(id: string): Promise<PermissionGroup> {
  const response = await api.get(`/permissions/groups/${id}`);
  return response.data.data;
}

// 创建权限组
export async function createPermissionGroup(
  data: CreatePermissionGroupInput
): Promise<PermissionGroup> {
  const response = await api.post('/permissions/groups', data);
  return response.data.data;
}

// 更新权限组
export async function updatePermissionGroup(
  id: string,
  data: UpdatePermissionGroupInput
): Promise<PermissionGroup> {
  const response = await api.put(`/permissions/groups/${id}`, data);
  return response.data.data;
}

// 删除权限组
export async function deletePermissionGroup(id: string): Promise<void> {
  await api.delete(`/permissions/groups/${id}`);
}

// 导出所有 API
export const permissionsApi = {
  getPermissionTree,
  getAllPermissions,
  validatePermissions,
  getPermissionGroups,
  getPermissionGroupById,
  createPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
};

export default permissionsApi;

