import api from '@/lib/axios';

// 客户分类接口
export interface ClientCategory {
  _id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  clientCount: number;
  createTime: string;
}

// 创建客户分类请求
export interface CreateClientCategoryRequest {
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
}

// 更新客户分类请求
export type UpdateClientCategoryRequest = Partial<CreateClientCategoryRequest>;

// API 响应
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

// 客户分类 API
export const clientCategoryApi = {
  // 获取所有分类
  async getAll(params?: { status?: string; limit?: number }): Promise<PaginatedResponse<ClientCategory>> {
    const response = await api.get<PaginatedResponse<ClientCategory>>('/client-categories', { params });
    return response.data;
  },

  // 获取单个分类
  async getById(id: string): Promise<ApiResponse<ClientCategory>> {
    const response = await api.get<ApiResponse<ClientCategory>>(`/client-categories/${id}`);
    return response.data;
  },

  // 创建分类
  async create(data: CreateClientCategoryRequest): Promise<ApiResponse<ClientCategory>> {
    const response = await api.post<ApiResponse<ClientCategory>>('/client-categories', data);
    return response.data;
  },

  // 更新分类
  async update(id: string, data: UpdateClientCategoryRequest): Promise<ApiResponse<ClientCategory>> {
    const response = await api.put<ApiResponse<ClientCategory>>(`/client-categories/${id}`, data);
    return response.data;
  },

  // 删除分类
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/client-categories/${id}`);
    return response.data;
  },
};

export default clientCategoryApi;

