import api from '@/lib/axios';

// 报价单接口
export interface Quotation {
  _id: string;
  name: string;
  status: 'active' | 'inactive';
  validUntil?: string;
  description: string;
  isDefault: boolean;
  selectedServices: string[];
  createTime: string;
  updateTime: string;
}

// 创建报价单数据
export interface CreateQuotationData {
  name: string;
  description: string;
  isDefault: boolean;
  selectedServices: string[];
  validUntil?: string;
}

// 更新报价单数据
export type UpdateQuotationData = Partial<CreateQuotationData>;

// API 响应
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 报价单 API
export const quotationApi = {
  // 获取所有报价单
  async getAll(params?: { limit?: number; status?: string }): Promise<ApiResponse<Quotation[]>> {
    const response = await api.get<ApiResponse<Quotation[]>>('/quotations', { params });
    return response.data;
  },

  // 根据ID获取报价单
  async getById(id: string): Promise<ApiResponse<Quotation>> {
    const response = await api.get<ApiResponse<Quotation>>(`/quotations/${id}`);
    return response.data;
  },

  // 根据客户ID获取关联的报价单
  async getByClientId(clientId: string): Promise<ApiResponse<Quotation[]>> {
    const response = await api.get<ApiResponse<Quotation[]>>(`/quotations/client/${clientId}`);
    return response.data;
  },

  // 创建报价单
  async create(data: CreateQuotationData): Promise<ApiResponse<Quotation>> {
    const response = await api.post<ApiResponse<Quotation>>('/quotations', data);
    return response.data;
  },

  // 更新报价单
  async update(id: string, data: UpdateQuotationData): Promise<ApiResponse<Quotation>> {
    const response = await api.put<ApiResponse<Quotation>>(`/quotations/${id}`, data);
    return response.data;
  },

  // 删除报价单
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/quotations/${id}`);
    return response.data;
  },

  // 切换报价单状态
  async toggleStatus(id: string): Promise<ApiResponse<Quotation>> {
    const response = await api.patch<ApiResponse<Quotation>>(`/quotations/${id}/toggle-status`);
    return response.data;
  },
};

// 向后兼容的导出
export const getAllQuotations = async (): Promise<Quotation[]> => {
  const response = await quotationApi.getAll({ limit: 500 });
  return response.success ? response.data : [];
};

export const getQuotationsByClientId = async (clientId: string): Promise<Quotation[]> => {
  const response = await quotationApi.getByClientId(clientId);
  return response.success ? response.data : [];
};

export default quotationApi;
