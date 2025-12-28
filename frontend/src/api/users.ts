import api from '@/lib/axios';

// 用户角色
export type UserRole = '超级管理员' | '项目经理' | '设计师' | '客户' | '员工';

// 用户接口
export interface User {
  _id: string;
  username: string;
  realName: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  status: 'active' | 'inactive';
  createTime: string;
  lastLogin?: string;
  enterpriseId?: string;
  enterpriseName?: string;
  departmentId?: string;
  departmentName?: string;
  position?: string;
  permissions?: string[];
  permissionGroups?: string[];
  // 联系人特有字段
  company?: string;
  shippingMethod?: string;
  description?: string;
  address?: string;
  contactPerson?: string;
}

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  password: string;
  realName: string;
  email?: string;
  phone: string;
  role: UserRole;
  department: string;
  enterpriseId?: string;
  enterpriseName?: string;
  departmentId?: string;
  departmentName?: string;
  position?: string;
}

// 更新用户请求
export interface UpdateUserRequest {
  realName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  department?: string;
  status?: 'active' | 'inactive';
  enterpriseId?: string;
  enterpriseName?: string;
  departmentId?: string;
  departmentName?: string;
  position?: string;
  permissions?: string[];
  permissionGroups?: string[];
}

// 用户列表查询参数
export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: 'active' | 'inactive';
  department?: string;
}

// API 响应
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// 用户 API
export const userApi = {
  // 获取用户列表
  async getList(params?: UserQueryParams): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/users', { params });
    return response.data;
  },

  // 获取单个用户
  async getById(id: string): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  // 创建用户
  async create(data: CreateUserRequest): Promise<ApiResponse<User>> {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data;
  },

  // 更新用户
  async update(id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  },

  // 删除用户
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/users/${id}`);
    return response.data;
  },

  // 获取员工列表（非客户角色）
  async getEmployees(): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/users', {
      params: { status: 'active', limit: 100 },
    });
    const employees = response.data.data.filter(
      (user) => user.role !== '客户'
    );
    return { ...response.data, data: employees };
  },

  // 获取客户用户列表
  async getClientUsers(): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/users', {
      params: { role: '客户', status: 'active', limit: 200 },
    });
    return response.data;
  },
};

export default userApi;
