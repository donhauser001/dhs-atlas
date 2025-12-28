import api from '@/lib/axios';

// 角色类型定义
export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface RoleListResponse {
  data: Role[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: string[];
  isDefault?: boolean;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
  isDefault?: boolean;
}

// 获取角色列表（分页）
export async function getRoles(params?: RoleListParams): Promise<RoleListResponse> {
  const response = await api.get('/roles', { params });
  return response.data;
}

// 获取所有角色（不分页）
export async function getAllRoles(): Promise<Role[]> {
  const response = await api.get('/roles/all');
  return response.data.data || [];
}

// 获取角色详情
export async function getRoleById(id: string): Promise<Role> {
  const response = await api.get(`/roles/${id}`);
  return response.data.data;
}

// 创建角色
export async function createRole(data: CreateRoleInput): Promise<Role> {
  const response = await api.post('/roles', data);
  return response.data.data;
}

// 更新角色
export async function updateRole(id: string, data: UpdateRoleInput): Promise<Role> {
  const response = await api.put(`/roles/${id}`, data);
  return response.data.data;
}

// 删除角色
export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/roles/${id}`);
}

// 导出所有 API
export const rolesApi = {
  getRoles,
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};

export default rolesApi;

