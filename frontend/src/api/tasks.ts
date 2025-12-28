import api from '@/lib/axios';

// 任务优先级
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'completed';

// 任务状态
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

// 结算状态
export type TaskSettlementStatus = 'unpaid' | 'partial-paid' | 'fully-paid';

// 流程步骤
export interface ProcessStep {
  id: string;
  name: string;
  progressRatio: number;
  cycle?: number;
}

// 价格政策
export interface PricingPolicy {
  policyId: string;
  policyName: string;
  policyType: string;
  discountRatio: number;
  calculationDetails: string;
}

// 任务接口
export interface Task {
  _id: string;
  taskName: string;
  projectId: string;
  serviceId: string;
  serviceName?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  subtotal: number;
  billingDescription?: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  settlementStatus: TaskSettlementStatus;
  mainDesigners: string[];
  mainDesignerNames?: string[];
  assistantDesigners: string[];
  assistantDesignerNames?: string[];
  processSteps?: ProcessStep[];
  currentProcessStep?: ProcessStep;
  processStepId?: string;
  pricingPolicies?: PricingPolicy[];
  specificationId?: string;
  specificationName?: string;
  dueDate?: string;
  remarks?: string;
  attachmentIds: string[];
  createdAt: string;
  updatedAt: string;
}

// 创建任务请求中的价格政策
export interface TaskPricingPolicy {
  policyId: string;
  policyName: string;
  policyType: string;
  discountRatio: number;
  calculationDetails: string;
}

// 创建任务请求
export interface CreateTaskRequest {
  taskName: string;
  projectId: string;
  serviceId: string;
  quantity: number;
  unit: string;
  subtotal: number;
  billingDescription: string; // 后端必填
  priority?: TaskPriority;
  status?: TaskStatus;
  progress?: number;
  settlementStatus?: TaskSettlementStatus;
  mainDesigners?: string[];
  assistantDesigners?: string[];
  pricingPolicies?: TaskPricingPolicy[];
  attachmentIds?: string[];
}

// 更新任务请求
export interface UpdateTaskRequest {
  taskName?: string;
  quantity?: number;
  subtotal?: number;
  billingDescription?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  progress?: number;
  settlementStatus?: TaskSettlementStatus;
  mainDesigners?: string[];
  mainDesignerNames?: string[];
  assistantDesigners?: string[];
  assistantDesignerNames?: string[];
  processStepId?: string;
  specificationId?: string;
  specificationName?: string;
  dueDate?: string | null;
}

// API 响应
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 任务 API
export const taskApi = {
  // 获取项目的任务列表
  async getByProject(projectId: string): Promise<ApiResponse<Task[]>> {
    const response = await api.get<ApiResponse<Task[]>>(`/tasks/project/${projectId}`);
    return response.data;
  },

  // 获取单个任务
  async getById(id: string): Promise<ApiResponse<Task>> {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data;
  },

  // 创建任务
  async create(data: CreateTaskRequest): Promise<ApiResponse<Task>> {
    const response = await api.post<ApiResponse<Task>>('/tasks', data);
    return response.data;
  },

  // 更新任务
  async update(id: string, data: UpdateTaskRequest): Promise<ApiResponse<Task>> {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    return response.data;
  },

  // 删除任务
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/tasks/${id}`);
    return response.data;
  },
};

export default taskApi;

