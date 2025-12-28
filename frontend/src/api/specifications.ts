import api from '@/lib/axios';

// 规格接口
export interface Specification {
  _id: string;
  name: string;
  length: number;
  width: number;
  height?: number;
  unit: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

// API 响应
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

// 规格 API
export const specificationApi = {
  // 获取规格列表
  async getAll(params?: { limit?: number; page?: number }): Promise<ApiResponse<Specification[]>> {
    const response = await api.get<ApiResponse<Specification[]>>('/specifications', { params });
    return response.data;
  },

  // 获取单个规格
  async getById(id: string): Promise<ApiResponse<Specification>> {
    const response = await api.get<ApiResponse<Specification>>(`/specifications/${id}`);
    return response.data;
  },

  // 创建规格
  async create(data: Omit<Specification, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Specification>> {
    const response = await api.post<ApiResponse<Specification>>('/specifications', data);
    return response.data;
  },

  // 更新规格
  async update(id: string, data: Partial<Specification>): Promise<ApiResponse<Specification>> {
    const response = await api.put<ApiResponse<Specification>>(`/specifications/${id}`, data);
    return response.data;
  },

  // 删除规格
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/specifications/${id}`);
    return response.data;
  },
};

// 格式化规格显示
export function formatSpecification(spec: Specification | { length: number; width: number; height?: number; unit: string }): string {
  if (spec.height) {
    return `${spec.length}×${spec.width}×${spec.height}${spec.unit}`;
  }
  return `${spec.length}×${spec.width}${spec.unit}`;
}

export default specificationApi;
