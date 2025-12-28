import axios from 'axios';

// 结算单接口定义
export interface SettlementItem {
    taskId: string;
    taskName: string;
    unitPrice: number;
    quantity: number;
    unit?: string;
    settlementUnitPrice: number;
    settlementQuantity: number;
    subtotal: number;
    remarks?: string;
    mainDesigners?: string[];
    mainDesignerNames?: string[];
    assistantDesigners?: string[];
    assistantDesignerNames?: string[];
    isDamaged?: boolean;
    damagedPercentage?: number;
}

export interface Settlement {
    _id: string;
    settlementNo: string;
    projectId: string;
    projectName: string;
    clientId: string;
    clientName: string;
    contactIds: string[];
    contactNames: string[];
    items: SettlementItem[];
    totalAmount: number;
    totalAmountInWords: string;
    isSettled: boolean;
    settledAmount?: number;
    settledDate?: string;
    status: 'pending' | 'partial' | 'completed';
    remark?: string; // 备注
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    totalIncomeAmount?: number; // 关联的回款金额总和
}

export interface CreateSettlementData {
    projectId: string;
    items: Array<{
        taskId: string;
        settlementUnitPrice: number;
        settlementQuantity: number;
    }>;
}

export interface SettlementQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    isSettled?: boolean;
    projectId?: string;
    clientId?: string;
}

// 创建结算单
export const createSettlement = async (data: CreateSettlementData): Promise<{ success: boolean; data: Settlement }> => {
    try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.post('/api/settlements', data, { headers });
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('创建结算单失败:', error);
        throw error;
    }
};

// 获取结算单列表
export const getSettlements = async (query?: SettlementQuery): Promise<{ success: boolean; data: Settlement[]; total: number }> => {
    try {
        const params = new URLSearchParams();
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());
        if (query?.search) params.append('search', query.search);
        if (query?.status) params.append('status', query.status);
        if (query?.isSettled !== undefined) params.append('isSettled', query.isSettled.toString());
        if (query?.projectId) params.append('projectId', query.projectId);
        if (query?.clientId) params.append('clientId', query.clientId);

        const response = await axios.get(`/api/settlements?${params.toString()}`);
        return {
            success: true,
            data: response.data.data || [],
            total: response.data.total || 0
        };
    } catch (error) {
        console.error('获取结算单列表失败:', error);
        throw error;
    }
};

// 获取结算单详情
export const getSettlementById = async (id: string): Promise<{ success: boolean; data: Settlement }> => {
    try {
        const response = await axios.get(`/api/settlements/${id}`);
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('获取结算单详情失败:', error);
        throw error;
    }
};

// 更新结算单
export const updateSettlement = async (id: string, data: {
    isSettled?: boolean;
    settledAmount?: number;
    settledDate?: string;
    status?: 'pending' | 'partial' | 'completed';
    items?: SettlementItem[];
    remark?: string;
}): Promise<{ success: boolean; data: Settlement }> => {
    try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.put(`/api/settlements/${id}`, data, { headers });
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('更新结算单失败:', error);
        throw error;
    }
};

// 删除结算单
export const deleteSettlement = async (id: string): Promise<{ success: boolean }> => {
    try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.delete(`/api/settlements/${id}`, { headers });
        return {
            success: response.data.success || true
        };
    } catch (error) {
        console.error('删除结算单失败:', error);
        throw error;
    }
};

