import axios from '@/lib/axios';

export interface ContractTemplate {
    _id: string;
    name: string;
    contractTitle?: string; // 合同标题
    description?: string;
    category: {
        _id: string;
        name: string;
        color?: string;
        isDefault: boolean;
    } | string; // 兼容旧格式和新格式
    content: string;
    placeholders: string[];
    associatedForm?: {
        _id: string;
        name: string;
        description?: string;
    } | string; // 关联的表单
    bindingConfigs?: Record<string, unknown>; // 绑定配置（合作方设置、签章设置等）
    status: 'draft' | 'active' | 'archived';
    version: number;
    isDefault: boolean;
    tags: string[];
    createdBy: string;
    createTime: string;
    updateTime: string;
}

export interface CreateContractTemplateData {
    name: string;
    contractTitle?: string;
    description?: string;
    category: string;
    content: string;
    associatedForm?: string; // 关联的表单ID
    bindingConfigs?: Record<string, unknown>; // 绑定配置
    status?: string;
    tags?: string[];
}

export interface UpdateContractTemplateData {
    name?: string;
    contractTitle?: string;
    description?: string;
    category?: string;
    content?: string;
    associatedForm?: string; // 关联的表单ID
    bindingConfigs?: Record<string, unknown>; // 绑定配置
    status?: string;
    tags?: string[];
}

export interface ContractTemplateQuery {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ContractTemplateListResponse {
    success: boolean;
    data: ContractTemplate[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export interface ContractTemplateResponse {
    success: boolean;
    data: ContractTemplate;
    message?: string;
}

export interface ContractTemplateStats {
    overview: {
        total: number;
        active: number;
        draft: number;
        archived: number;
    };
    categories: Array<{
        _id: string;
        count: number;
    }>;
}

// 获取模板列表
export const getContractTemplates = async (params: ContractTemplateQuery = {}): Promise<ContractTemplateListResponse> => {
    const response = await axios.get('/contract-templates', { params });
    return response.data;
};

// 根据ID获取模板
export const getContractTemplateById = async (id: string): Promise<ContractTemplateResponse> => {
    const response = await axios.get(`/contract-templates/${id}`);
    return response.data;
};

// 创建模板
export const createContractTemplate = async (data: CreateContractTemplateData): Promise<ContractTemplateResponse> => {
    const response = await axios.post('/contract-templates', data);
    return response.data;
};

// 更新模板
export const updateContractTemplate = async (id: string, data: UpdateContractTemplateData): Promise<ContractTemplateResponse> => {
    const response = await axios.put(`/contract-templates/${id}`, data);
    return response.data;
};

// 删除模板
export const deleteContractTemplate = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`/contract-templates/${id}`);
    return response.data;
};

// 复制模板
export const cloneContractTemplate = async (id: string, name?: string): Promise<ContractTemplateResponse> => {
    const response = await axios.post(`/contract-templates/${id}/clone`, { name });
    return response.data;
};

// 设置默认模板
export const setDefaultContractTemplate = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.put(`/contract-templates/${id}/default`);
    return response.data;
};

// 获取模板统计
export const getContractTemplateStats = async (): Promise<{ success: boolean; data: ContractTemplateStats }> => {
    const response = await axios.get('/contract-templates/stats');
    return response.data;
};

// 切换模板状态
export const toggleContractTemplateStatus = async (id: string, status: 'active' | 'archived'): Promise<ContractTemplateResponse> => {
    const response = await axios.put(`/contract-templates/${id}/status`, { status });
    return response.data;
};
