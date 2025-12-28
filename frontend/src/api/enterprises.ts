import axios from 'axios'

// 企业接口
export interface Enterprise {
    _id: string
    id?: string // 兼容旧代码
    enterpriseName: string
    enterpriseAlias?: string
    creditCode: string
    businessLicense: string
    bankPermit?: string
    bankPermitNumber?: string
    legalRepresentative: string
    legalRepresentativeId: string
    legalRepIdCard?: string
    companyAddress: string
    shippingAddress: string
    contactPerson: string
    contactPhone: string
    invoiceInfo: string
    status: 'active' | 'inactive'
    createTime: string
}

// 企业列表查询参数
export interface EnterpriseQueryParams {
    page?: number
    limit?: number
    search?: string
    status?: string
}

// 企业列表响应
export interface EnterpriseListResponse {
    success: boolean
    data: Enterprise[]
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
}

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api'

/**
 * 获取企业列表
 */
export const getEnterprises = async (params: EnterpriseQueryParams = {}): Promise<EnterpriseListResponse> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/enterprises`, { params })
        return response.data
    } catch (error) {
        console.error('获取企业列表失败:', error)
        throw error
    }
}

/**
 * 获取活跃企业列表
 */
export const getActiveEnterprises = async (): Promise<{ success: boolean; data: Enterprise[] }> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/enterprises`, {
            params: {
                status: 'active',
                limit: 100
            }
        })
        return response.data
    } catch (error) {
        console.error('获取活跃企业列表失败:', error)
        throw error
    }
}

/**
 * 获取组织企业列表（用于承接团队选择）
 */
export const getOrganizationEnterprises = async (): Promise<{ success: boolean; data: Enterprise[] }> => {
    try {
        // 使用现有的企业API，获取活跃企业列表
        const response = await axios.get(`${API_BASE_URL}/enterprises`, {
            params: {
                status: 'active',
                limit: 100
            }
        })

        // 转换响应格式以匹配预期的数据结构
        return {
            success: true,
            data: response.data.data || []
        }
    } catch (error) {
        console.error('获取组织企业列表失败:', error)
        throw error
    }
}

// 创建企业请求参数
export interface CreateEnterpriseRequest {
    enterpriseName: string
    enterpriseAlias?: string
    creditCode: string
    businessLicense?: string
    legalRepresentative: string
    legalRepresentativeId?: string
    companyAddress?: string
    shippingAddress?: string
    contactPerson: string
    contactPhone?: string
    invoiceInfo?: string
    status?: 'active' | 'inactive'
}

/**
 * 创建企业
 */
export const createEnterprise = async (data: CreateEnterpriseRequest): Promise<{ success: boolean; data: Enterprise }> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/enterprises`, data)
        return response.data
    } catch (error) {
        console.error('创建企业失败:', error)
        throw error
    }
}

/**
 * 更新企业
 */
export const updateEnterprise = async (id: string, data: Partial<CreateEnterpriseRequest>): Promise<{ success: boolean; data: Enterprise }> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/enterprises/${id}`, data)
        return response.data
    } catch (error) {
        console.error('更新企业失败:', error)
        throw error
    }
}

/**
 * 删除企业
 */
export const deleteEnterprise = async (id: string): Promise<{ success: boolean }> => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/enterprises/${id}`)
        return response.data
    } catch (error) {
        console.error('删除企业失败:', error)
        throw error
    }
}
