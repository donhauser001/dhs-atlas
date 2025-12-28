import api from '@/lib/axios';

export interface GeneratedContract {
    _id: string;
    name: string;
    description?: string;
    templateId: {
        _id: string;
        name: string;
        category: string;
    } | string;
    formDataId?: {
        _id: string;
        formName: string;
        submittedAt: string;
        submitterName?: string;
    } | string;
    content: string;
    originalPlaceholders: string[];
    replacedData: Record<string, unknown>;
    status: 'pending' | 'signed' | 'cancelled' | 'completed';
    contractNumber?: string;
    clientInfo?: {
        name: string;
        contact?: string;
        phone?: string;
        email?: string;
        address?: string;
    };
    projectInfo?: {
        name: string;
        description?: string;
        amount?: number;
        startDate?: string;
        endDate?: string;
    };
    relatedIds?: {
        projectId?: string;
        clientIds?: string[];
        contactIds?: string[];
        projectName?: string;
        clientNames?: string[];
        contactNames?: string[];
    };
    generatedBy: string;
    generateTime: string;
    signedTime?: string;
    expirationDate?: string;
    signedFile?: string;
    createTime: string;
    updateTime?: string;
}

export interface CreateGeneratedContractData {
    formData: Record<string, unknown>;
    name?: string;
    description?: string;
}

export interface UpdateGeneratedContractData {
    name?: string;
    description?: string;
    status?: string;
    clientInfo?: {
        name?: string;
        contact?: string;
        phone?: string;
        email?: string;
        address?: string;
    };
    projectInfo?: {
        name?: string;
        description?: string;
        amount?: number;
        startDate?: string;
        endDate?: string;
    };
    relatedIds?: {
        projectId?: string;
        clientIds?: string[];
        contactIds?: string[];
        projectName?: string;      // 项目名称
        clientNames?: string[];    // 客户名称列表
        contactNames?: string[];   // 联系人名称列表
    };
    signedTime?: string;
    expirationDate?: string;
}

export interface GeneratedContractQuery {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    templateId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GeneratedContractListResponse {
    success: boolean;
    data: GeneratedContract[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export interface GeneratedContractResponse {
    success: boolean;
    data: GeneratedContract;
    message?: string;
}

export interface GeneratedContractStats {
    overview: {
        total: number;
        pending: number;
        signed: number;
        cancelled: number;
    };
    templates: Array<{
        _id: string;
        templateName: string;
        count: number;
    }>;
}

// 获取生成的合同列表
export const getGeneratedContracts = async (params: GeneratedContractQuery = {}): Promise<GeneratedContractListResponse> => {
    const response = await api.get<GeneratedContractListResponse>('/generated-contracts', { params });
    return response.data;
};

// 根据ID获取合同详情
export const getGeneratedContractById = async (id: string): Promise<GeneratedContractResponse> => {
    const response = await api.get<GeneratedContractResponse>(`/generated-contracts/${id}`);
    return response.data;
};

// 从模板和表单数据生成合同
export const generateContractFromTemplate = async (templateId: string, data: CreateGeneratedContractData): Promise<GeneratedContractResponse> => {
    const response = await api.post<GeneratedContractResponse>(`/generated-contracts/generate/template/${templateId}`, data);
    return response.data;
};

// 从表单提交记录生成合同
export const generateContractFromFormData = async (templateId: string, formDataId: string, data: { name?: string; description?: string }): Promise<GeneratedContractResponse> => {
    const response = await api.post<GeneratedContractResponse>(`/generated-contracts/generate/form-data/${templateId}/${formDataId}`, data);
    return response.data;
};

// 更新合同信息
export const updateGeneratedContract = async (id: string, data: UpdateGeneratedContractData): Promise<GeneratedContractResponse> => {
    const response = await api.put<GeneratedContractResponse>(`/generated-contracts/${id}`, data);
    return response.data;
};

// 更新合同内容（包括名称、描述、状态和正文）
export const updateGeneratedContractContent = async (id: string, data: {
    name?: string;
    description?: string;
    status?: string;
    content?: string;
}): Promise<GeneratedContractResponse> => {
    const response = await api.put<GeneratedContractResponse>(`/generated-contracts/${id}/content`, data);
    return response.data;
};

// 下载合同PDF
export const downloadContractPDF = async (id: string): Promise<Blob> => {
    const response = await api.get(`/generated-contracts/${id}/download/pdf`, {
        responseType: 'blob'
    });
    return response.data;
};

// 更新合同状态
export const updateGeneratedContractStatus = async (id: string, status: string): Promise<GeneratedContractResponse> => {
    const response = await api.put<GeneratedContractResponse>(`/generated-contracts/${id}/status`, { status });
    return response.data;
};

// 删除合同
export const deleteGeneratedContract = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/generated-contracts/${id}`);
    return response.data;
};

// 上传签署文件
export const uploadSignedFile = async (id: string, file: File): Promise<GeneratedContractResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<GeneratedContractResponse>(`/generated-contracts/${id}/upload-signed-file`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

// 删除签署文件
export const deleteSignedFile = async (id: string): Promise<GeneratedContractResponse> => {
    const response = await api.delete<GeneratedContractResponse>(`/generated-contracts/${id}/signed-file`);
    return response.data;
};

// 下载签署文件
export const downloadSignedFile = async (id: string): Promise<Blob> => {
    const response = await api.get(`/generated-contracts/${id}/download-signed-file`, {
        responseType: 'blob'
    });
    return response.data;
};

// 根据关联ID获取合同列表
export const getContractsByRelatedIds = async (params: {
    projectId?: string;
    clientId?: string;
    contactId?: string;
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
}): Promise<GeneratedContractListResponse> => {
    const response = await api.get<GeneratedContractListResponse>('/generated-contracts/related', { params });
    return response.data;
};

// 获取合同统计
export const getGeneratedContractStats = async (): Promise<{ success: boolean; data: GeneratedContractStats }> => {
    const response = await api.get<{ success: boolean; data: GeneratedContractStats }>('/generated-contracts/stats');
    return response.data;
};

// 导出合同为PDF
export const exportContractPDF = async (id: string): Promise<Blob> => {
    const response = await api.get(`/generated-contracts/${id}/export/pdf`, {
        responseType: 'blob'
    });
    return response.data;
};

// 导出合同为Word
export const exportContractWord = async (id: string): Promise<Blob> => {
    const response = await api.get(`/generated-contracts/${id}/export/word`, {
        responseType: 'blob'
    });
    return response.data;
};
