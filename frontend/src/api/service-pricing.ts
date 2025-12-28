import api from '@/lib/axios';

// 价格政策接口
export interface PricingPolicy {
  _id: string;
  name: string;
  alias?: string;
  type: 'uniform_discount' | 'tiered_discount';
  status: 'active' | 'inactive';
  discountRatio?: number;
  tierSettings?: Array<{
    startQuantity?: number;
    endQuantity?: number;
    discountRatio: number;
  }>;
}

// 服务定价接口
export interface ServicePricing {
  _id: string;
  serviceName: string;
  alias: string;
  categoryId: string;
  categoryName?: string;
  unitPrice: number;
  unit: string;
  priceDescription: string;
  link: string;
  additionalConfigId?: string;
  additionalConfigName?: string;
  serviceProcessId?: string;
  serviceProcessName?: string;
  pricingPolicyIds?: string[];
  pricingPolicyNames?: string[];
  status: 'active' | 'inactive';
  createTime: string;
  updateTime: string;
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
  total: number;
  page: number;
  limit: number;
}

// 创建服务定价请求
export interface CreateServicePricingRequest {
  serviceName: string;
  alias?: string;
  categoryId?: string;
  unitPrice: number;
  unit: string;
  priceDescription?: string;
  link?: string;
  pricingPolicyIds?: string[];
  status?: 'active' | 'inactive';
}

// 服务定价 API
export const servicePricingApi = {
  // 获取所有服务定价
  async getAll(params?: { status?: string; limit?: number }): Promise<PaginatedResponse<ServicePricing>> {
    const response = await api.get<PaginatedResponse<ServicePricing>>('/service-pricing', { params });
    return response.data;
  },

  // 获取单个服务定价
  async getById(id: string): Promise<ApiResponse<ServicePricing>> {
    const response = await api.get<ApiResponse<ServicePricing>>(`/service-pricing/${id}`);
    return response.data;
  },

  // 创建服务定价
  async create(data: CreateServicePricingRequest): Promise<ApiResponse<ServicePricing>> {
    const response = await api.post<ApiResponse<ServicePricing>>('/service-pricing', data);
    return response.data;
  },

  // 更新服务定价
  async update(id: string, data: Partial<CreateServicePricingRequest>): Promise<ApiResponse<ServicePricing>> {
    const response = await api.put<ApiResponse<ServicePricing>>(`/service-pricing/${id}`, data);
    return response.data;
  },

  // 删除服务定价
  async delete(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/service-pricing/${id}`);
    return response.data;
  },
};

// 价格政策 API
export const pricingPolicyApi = {
  // 获取所有价格政策
  async getAll(params?: { status?: string; limit?: number }): Promise<PaginatedResponse<PricingPolicy>> {
    const response = await api.get<PaginatedResponse<PricingPolicy>>('/pricing-policies', { params });
    return response.data;
  },
};

export default servicePricingApi;

