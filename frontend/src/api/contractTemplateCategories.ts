import axios from '@/lib/axios';

export interface ContractTemplateCategory {
    _id: string;
    name: string;
    description?: string;
    color?: string;
    isDefault: boolean;
    templateCount: number;
    createdBy: string;
    createTime: string;
    updateTime: string;
}

export interface CreateContractTemplateCategoryData {
    name: string;
    description?: string;
    color?: string;
    isDefault?: boolean;
}

export interface UpdateContractTemplateCategoryData {
    name?: string;
    description?: string;
    color?: string;
    isDefault?: boolean;
}

export interface ContractTemplateCategoryQuery {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ContractTemplateCategoryListResponse {
    success: boolean;
    data: ContractTemplateCategory[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export interface ContractTemplateCategoryResponse {
    success: boolean;
    data: ContractTemplateCategory;
    message?: string;
}

// 获取分类列表
export const getContractTemplateCategories = async (params: ContractTemplateCategoryQuery = {}): Promise<ContractTemplateCategoryListResponse> => {
    const response = await axios.get('/contract-template-categories', { params });
    return response.data;
};

// 根据ID获取分类
export const getContractTemplateCategoryById = async (id: string): Promise<ContractTemplateCategoryResponse> => {
    const response = await axios.get(`/contract-template-categories/${id}`);
    return response.data;
};

// 创建分类
export const createContractTemplateCategory = async (data: CreateContractTemplateCategoryData): Promise<ContractTemplateCategoryResponse> => {
    const response = await axios.post('/contract-template-categories', data);
    return response.data;
};

// 更新分类
export const updateContractTemplateCategory = async (id: string, data: UpdateContractTemplateCategoryData): Promise<ContractTemplateCategoryResponse> => {
    const response = await axios.put(`/contract-template-categories/${id}`, data);
    return response.data;
};

// 删除分类
export const deleteContractTemplateCategory = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`/contract-template-categories/${id}`);
    return response.data;
};
