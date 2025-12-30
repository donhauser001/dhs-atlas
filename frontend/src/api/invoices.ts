import axios from 'axios';

// UploadFile 类型（兼容 antd）
interface UploadFile {
    uid: string;
    name: string;
    size?: number;
    status?: 'uploading' | 'done' | 'error' | 'removed';
    url?: string;
    response?: {
        path?: string;
        url?: string;
        data?: {
            url?: string;
            path?: string;
        };
    };
}

// 发票接口定义
export interface Invoice {
    _id: string;
    invoiceNo: string; // 发票号码
    settlementId: string; // 关联结算单ID
    settlementNo: string; // 结算单号
    projectId: string; // 关联项目ID
    projectName: string; // 项目名称
    clientId: string; // 客户ID
    clientName: string; // 客户名称
    contactIds: string[]; // 联系人ID数组
    contactNames: string[]; // 联系人名称数组
    invoiceDate: string; // 开票日期
    invoiceAmount: number; // 开票金额
    invoiceType: '增值税普通发票' | '增值税专用发票'; // 发票类型
    feeType: '预付金' | '尾款' | '全款'; // 费用类型
    files: Array<{
        path: string; // 文件路径
        originalName: string; // 原始文件名
        size: number; // 文件大小（字节）
    }>; // 发票文件
    remark?: string; // 备注
    createdBy: string; // 创建人
    createdAt: string;
    updatedAt: string;
}

export interface CreateInvoiceData {
    invoiceNo: string;
    settlementId: string;
    settlementNo: string;
    projectId: string;
    projectName: string;
    clientId: string;
    clientName: string;
    contactIds: string[];
    contactNames: string[];
    invoiceDate: string; // YYYY-MM-DD格式
    invoiceAmount: number;
    invoiceType: '增值税普通发票' | '增值税专用发票';
    feeType: '预付金' | '尾款' | '全款';
    files: Array<{
        path: string;
        originalName: string;
        size: number;
    }>;
    remark?: string;
}

export interface InvoiceQuery {
    page?: number;
    limit?: number;
    search?: string;
    settlementId?: string;
    projectId?: string;
    clientId?: string;
    invoiceType?: string;
    feeType?: string;
    startDate?: string;
    endDate?: string;
}

export interface InvoiceStats {
    total: number;
    totalAmount: number;
    thisMonthCount: number;
    thisMonthAmount: number;
    lastMonthCount: number;
    lastMonthAmount: number;
}

// 创建发票
export const createInvoice = async (data: CreateInvoiceData): Promise<{ success: boolean; data: Invoice }> => {
    try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.post('/api/invoices', data, { headers });
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('创建发票失败:', error);
        throw error;
    }
};

// 获取发票列表
export const getInvoices = async (query?: InvoiceQuery): Promise<{ success: boolean; data: Invoice[]; total: number }> => {
    try {
        const params = new URLSearchParams();
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());
        if (query?.search) params.append('search', query.search);
        if (query?.settlementId) params.append('settlementId', query.settlementId);
        if (query?.projectId) params.append('projectId', query.projectId);
        if (query?.clientId) params.append('clientId', query.clientId);
        if (query?.invoiceType) params.append('invoiceType', query.invoiceType);
        if (query?.feeType) params.append('feeType', query.feeType);
        if (query?.startDate) params.append('startDate', query.startDate);
        if (query?.endDate) params.append('endDate', query.endDate);

        const response = await axios.get(`/api/invoices?${params.toString()}`);
        return {
            success: true,
            data: response.data.data || [],
            total: response.data.total || 0
        };
    } catch (error) {
        console.error('获取发票列表失败:', error);
        throw error;
    }
};

// 获取发票详情
export const getInvoiceById = async (id: string): Promise<{ success: boolean; data: Invoice }> => {
    try {
        const response = await axios.get(`/api/invoices/${id}`);
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('获取发票详情失败:', error);
        throw error;
    }
};

// 获取发票统计
export const getInvoiceStats = async (): Promise<{ success: boolean; data: InvoiceStats }> => {
    try {
        const response = await axios.get('/api/invoices/stats');
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('获取发票统计失败:', error);
        throw error;
    }
};

// 更新发票
export const updateInvoice = async (id: string, data: Partial<CreateInvoiceData>): Promise<{ success: boolean; data: Invoice }> => {
    try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.put(`/api/invoices/${id}`, data, { headers });
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('更新发票失败:', error);
        throw error;
    }
};

// 删除发票
export const deleteInvoice = async (id: string): Promise<{ success: boolean }> => {
    try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.delete(`/api/invoices/${id}`, { headers });
        return {
            success: response.data.success || true
        };
    } catch (error) {
        console.error('删除发票失败:', error);
        throw error;
    }
};

// 将UploadFile转换为文件信息格式
export const convertUploadFilesToFileInfo = (fileList: UploadFile[]): Array<{ path: string; originalName: string; size: number }> => {
    if (!fileList || fileList.length === 0) {
        return [];
    }

    return fileList
        .filter(file => {
            // 只处理已上传完成的文件
            if (file.status !== 'done') {
                console.warn('文件未上传完成，跳过:', file.name, file.status);
                return false;
            }
            // 检查是否有URL或response
            const hasUrl = !!(file.url || file.response);
            if (!hasUrl) {
                console.warn('文件缺少URL信息，跳过:', file.name);
            }
            return hasUrl;
        })
        .map(file => {
            // 尝试从多个可能的路径获取URL
            let url = '';
            if (file.response) {
                if (file.response.data) {
                    url = file.response.data.url || file.response.data.path || '';
                } else {
                    url = file.response.url || file.response.path || '';
                }
            }
            if (!url) {
                url = file.url || '';
            }

            const fileInfo = {
                path: url,
                originalName: file.name || '',
                size: file.size || 0
            };

            return fileInfo;
        });
};

