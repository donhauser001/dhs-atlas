import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

export interface ServicePricing {
    _id: string
    serviceName: string // 服务名称（用于外部显示）
    alias: string // 别名（用于内部查看）
    categoryId: string // 分类ID
    categoryName?: string // 分类名称（用于显示）
    unitPrice: number // 单价
    unit: string // 计价单位
    priceDescription: string // 价格说明
    link: string // 链接
    additionalConfigId?: string // 附加配置ID
    additionalConfigName?: string // 附加配置名称（用于显示）
    serviceProcessId?: string // 服务流程ID
    serviceProcessName?: string // 服务流程名称（用于显示）
    pricingPolicyIds?: string[] // 价格政策ID数组
    pricingPolicyNames?: string[] // 价格政策名称数组（用于显示）
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
}

export interface CreateServicePricingData {
    serviceName: string
    alias: string
    categoryId: string
    unitPrice: number
    unit: string
    priceDescription: string
    link: string
    additionalConfigId?: string
    serviceProcessId?: string
    pricingPolicyIds?: string[]
}

export interface UpdateServicePricingData {
    serviceName: string
    alias: string
    categoryId: string
    unitPrice: number
    unit: string
    priceDescription: string
    link: string
    additionalConfigId?: string
    serviceProcessId?: string
    pricingPolicyIds?: string[]
}

// 获取所有服务定价
export const getAllServicePricing = async (): Promise<ServicePricing[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/service-pricing`)
        return response.data.data
    } catch (error) {
        console.error('获取服务定价列表失败:', error)
        throw error
    }
}

// 根据ID获取服务定价
export const getServicePricingById = async (id: string): Promise<ServicePricing> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/service-pricing/${id}`)
        return response.data.data
    } catch (error) {
        console.error('获取服务定价详情失败:', error)
        throw error
    }
}

// 创建服务定价
export const createServicePricing = async (data: CreateServicePricingData): Promise<ServicePricing> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/service-pricing`, data)
        return response.data.data
    } catch (error) {
        console.error('创建服务定价失败:', error)
        throw error
    }
}

// 更新服务定价
export const updateServicePricing = async (id: string, data: UpdateServicePricingData): Promise<ServicePricing> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/service-pricing/${id}`, data)
        return response.data.data
    } catch (error) {
        console.error('更新服务定价失败:', error)
        throw error
    }
}

// 切换服务定价状态
export const toggleServicePricingStatus = async (id: string): Promise<ServicePricing> => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/service-pricing/${id}/toggle-status`)
        return response.data.data
    } catch (error) {
        console.error('切换服务定价状态失败:', error)
        throw error
    }
}

// 删除服务定价
export const deleteServicePricing = async (id: string): Promise<void> => {
    try {
        await axios.delete(`${API_BASE_URL}/service-pricing/${id}`)
    } catch (error) {
        console.error('删除服务定价失败:', error)
        throw error
    }
}

// 搜索服务定价
export const searchServicePricing = async (searchTerm: string): Promise<ServicePricing[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/service-pricing/search?search=${encodeURIComponent(searchTerm)}`)
        return response.data.data
    } catch (error) {
        console.error('搜索服务定价失败:', error)
        throw error
    }
}

// 复制服务定价
export const copyServicePricing = async (id: string): Promise<ServicePricing> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/service-pricing/${id}/copy`)
        return response.data.data
    } catch (error) {
        console.error('复制服务定价失败:', error)
        throw error
    }
} 