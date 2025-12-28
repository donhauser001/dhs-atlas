import api from '@/lib/axios';

// 项目状态
export type ProgressStatus = 'consulting' | 'in-progress' | 'partial-delivery' | 'completed' | 'on-hold' | 'cancelled';
export type SettlementStatus = 'unpaid' | 'prepaid' | 'partial-paid' | 'fully-paid';

// 项目接口
export interface Project {
  _id: string;
  projectName: string;
  clientId: string;
  clientName: string;
  contactIds: string[];
  contactNames: string[];
  contactPhones: string[];
  undertakingTeam: string;
  mainDesigners: string[];
  assistantDesigners: string[];
  progressStatus: ProgressStatus;
  settlementStatus: SettlementStatus;
  createdAt: string;
  startedAt?: string;
  deliveredAt?: string;
  settledAt?: string;
  clientRequirements?: Array<{ content: string; createdAt: string }>;
  quotationId?: string;
  remark?: Array<{ content: string; createdAt: string }>;
  taskIds: string[];
  fileIds: string[];
  clientFileIds: string[];
  contractIds: string[];
  invoiceIds: string[];
  proposalIds: string[];
  settlementIds: string[];
  logIds: string[];
}

// 项目统计
export interface ProjectStats {
  total: number;
  consulting: number;
  inProgress: number;
  completed: number;
  onHold: number;
}

// 创建项目请求
export interface CreateProjectRequest {
  projectName: string;
  clientId: string;
  clientName: string;
  contactIds: string[];
  contactNames: string[];
  contactPhones?: string[];
  undertakingTeam: string;
  mainDesigners?: string[];
  assistantDesigners?: string[];
  clientRequirements?: string;
  remark?: string;
}

// 更新项目请求
export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  progressStatus?: ProgressStatus;
  settlementStatus?: SettlementStatus;
}

// 项目列表查询参数
export interface ProjectQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  progressStatus?: ProgressStatus;
  settlementStatus?: SettlementStatus;
  clientId?: string;
  undertakingTeam?: string;
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
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 项目 API
export const projectApi = {
  // 获取项目列表
  async getList(params?: ProjectQueryParams): Promise<PaginatedResponse<Project>> {
    const response = await api.get<PaginatedResponse<Project>>('/projects', { params });
    return response.data;
  },

  // 获取项目统计
  async getStats(): Promise<ApiResponse<ProjectStats>> {
    const response = await api.get<ApiResponse<ProjectStats>>('/projects/stats');
    return response.data;
  },

  // 获取单个项目
  async getById(id: string): Promise<ApiResponse<Project>> {
    const response = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    return response.data;
  },

  // 创建项目
  async create(data: CreateProjectRequest): Promise<ApiResponse<Project>> {
    const response = await api.post<ApiResponse<Project>>('/projects', data);
    return response.data;
  },

  // 更新项目
  async update(id: string, data: UpdateProjectRequest): Promise<ApiResponse<Project>> {
    const response = await api.put<ApiResponse<Project>>(`/projects/${id}`, data);
    return response.data;
  },

  // 更新项目状态
  async updateStatus(id: string, status: ProgressStatus): Promise<ApiResponse<Project>> {
    const response = await api.patch<ApiResponse<Project>>(`/projects/${id}/status`, { progressStatus: status });
    return response.data;
  },

  // 更新结算状态
  async updateSettlement(id: string, status: SettlementStatus): Promise<ApiResponse<Project>> {
    const response = await api.patch<ApiResponse<Project>>(`/projects/${id}/settlement`, { settlementStatus: status });
    return response.data;
  },

  // 删除项目
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/projects/${id}`);
    return response.data;
  },

  // 获取项目日志
  async getLogs(id: string): Promise<ApiResponse<unknown[]>> {
    const response = await api.get<ApiResponse<unknown[]>>(`/projects/${id}/logs`);
    return response.data;
  },
};

export default projectApi;

