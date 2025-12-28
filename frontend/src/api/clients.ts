import api from '@/lib/axios';

// 客户接口定义
export interface Client {
  _id: string;
  name: string;
  address: string;
  invoiceType: string;
  invoiceInfo: string;
  category: string;
  quotationId?: string;
  rating: number;
  files: Array<{
    path: string;
    originalName: string;
    size: number;
  }>;
  summary: string;
  status: 'active' | 'inactive';
  createTime: string;
  updateTime: string;
}

// 创建客户请求
export interface CreateClientRequest {
  name: string;
  address?: string;
  invoiceType?: string;
  invoiceInfo?: string;
  category?: string;
  rating?: number;
  summary?: string;
  status?: 'active' | 'inactive';
}

// 更新客户请求
export type UpdateClientRequest = Partial<CreateClientRequest>;

// 客户列表查询参数
export interface ClientQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: 'active' | 'inactive';
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
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 客户 API
export const clientApi = {
  // 获取客户列表
  async getList(params?: ClientQueryParams): Promise<PaginatedResponse<Client>> {
    const response = await api.get<PaginatedResponse<Client>>('/clients', { params });
    return response.data;
  },

  // 获取单个客户
  async getById(id: string): Promise<ApiResponse<Client>> {
    const response = await api.get<ApiResponse<Client>>(`/clients/${id}`);
    return response.data;
  },

  // 创建客户
  async create(data: CreateClientRequest): Promise<ApiResponse<Client>> {
    const response = await api.post<ApiResponse<Client>>('/clients', data);
    return response.data;
  },

  // 更新客户
  async update(id: string, data: UpdateClientRequest): Promise<ApiResponse<Client>> {
    const response = await api.put<ApiResponse<Client>>(`/clients/${id}`, data);
    return response.data;
  },

  // 删除客户
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/clients/${id}`);
    return response.data;
  },
};

export default clientApi;
