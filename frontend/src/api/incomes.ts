import axios from 'axios';

// 回款接口定义
export interface Income {
    _id: string;
    incomeNo: string;
    settlementId: string;
    settlementNo: string;
    projectId: string;
    projectName: string;
    clientId: string;
    clientName: string;
    contactIds: string[];
    contactNames: string[];
    amount: number;
    paymentType: 'full' | 'half' | 'tail' | 'custom' | 'customPercent';
    paymentChannel: 'company' | 'check' | 'wechat' | 'alipay' | 'cash';
    payerName?: string;
    transactionNo?: string;
    checkNo?: string;
    payee?: string;
    paymentDate: string;
    remark?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateIncomeData {
    settlementId: string;
    settlementNo: string;
    projectId: string;
    projectName: string;
    clientId: string;
    clientName: string;
    contactIds: string[];
    contactNames: string[];
    amount: number;
    paymentType: 'full' | 'half' | 'tail' | 'custom' | 'customPercent';
    paymentChannel: 'company' | 'check' | 'wechat' | 'alipay' | 'cash';
    payerName?: string;
    transactionNo?: string;
    checkNo?: string;
    payee?: string;
    paymentDate: string;
    remark?: string;
}

export interface IncomeQuery {
    page?: number;
    limit?: number;
    search?: string;
    projectId?: string;
    clientId?: string;
    settlementId?: string;
    startDate?: string;
    endDate?: string;
    paymentChannel?: string;
}

// 创建回款
export const createIncome = async (data: CreateIncomeData): Promise<{ success: boolean; data: Income }> => {
    try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.post('/api/incomes', data, { headers });
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('创建回款失败:', error);
        throw error;
    }
};

// 获取回款列表
export const getIncomes = async (query?: IncomeQuery): Promise<{ success: boolean; data: Income[]; total: number }> => {
    try {
        const params = new URLSearchParams();
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());
        if (query?.search) params.append('search', query.search);
        if (query?.projectId) params.append('projectId', query.projectId);
        if (query?.clientId) params.append('clientId', query.clientId);
        if (query?.settlementId) params.append('settlementId', query.settlementId);
        if (query?.startDate) params.append('startDate', query.startDate);
        if (query?.endDate) params.append('endDate', query.endDate);
        if (query?.paymentChannel) params.append('paymentChannel', query.paymentChannel);

        const response = await axios.get(`/api/incomes?${params.toString()}`);
        return {
            success: true,
            data: response.data.data || [],
            total: response.data.total || 0
        };
    } catch (error) {
        console.error('获取回款列表失败:', error);
        throw error;
    }
};

// 获取回款统计
export const getIncomeStats = async (startDate?: string, endDate?: string): Promise<{ success: boolean; data: { total: number; thisMonth: number; lastMonth: number; thisYear: number } }> => {
    try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await axios.get(`/api/incomes/stats?${params.toString()}`);
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('获取回款统计失败:', error);
        throw error;
    }
};

// 根据ID获取回款详情
export const getIncomeById = async (id: string): Promise<{ success: boolean; data: Income }> => {
    try {
        const response = await axios.get(`/api/incomes/${id}`);
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('获取回款详情失败:', error);
        throw error;
    }
};

// 更新回款
export interface UpdateIncomeData {
    amount?: number;
    paymentType?: 'full' | 'half' | 'tail' | 'custom' | 'customPercent';
    paymentChannel?: 'company' | 'check' | 'wechat' | 'alipay' | 'cash';
    payerName?: string;
    transactionNo?: string;
    checkNo?: string;
    payee?: string;
    paymentDate?: string;
    remark?: string;
}

export const updateIncome = async (id: string, data: UpdateIncomeData): Promise<{ success: boolean; data: Income }> => {
    try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.put(`/api/incomes/${id}`, data, { headers });
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('更新回款失败:', error);
        throw error;
    }
};

// 更新回款备注
export const updateIncomeRemark = async (id: string, remark: string): Promise<{ success: boolean; data: Income }> => {
    try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.patch(`/api/incomes/${id}/remark`, { remark }, { headers });
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('更新回款备注失败:', error);
        throw error;
    }
};

// 删除回款
export const deleteIncome = async (id: string): Promise<{ success: boolean }> => {
    try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.delete(`/api/incomes/${id}`, { headers });
        return {
            success: response.data.success || true
        };
    } catch (error) {
        console.error('删除回款失败:', error);
        throw error;
    }
};

