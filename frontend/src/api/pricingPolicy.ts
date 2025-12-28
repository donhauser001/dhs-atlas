import axios from 'axios'

export interface PricingPolicy {
    _id: string
    name: string
    alias: string
    type: 'tiered_discount' | 'uniform_discount'
    summary: string
    validUntil: string | null // null表示永久有效
    discountRatio?: number // 统一折扣比例
    tierSettings?: TierSetting[] // 阶梯设置
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
}

export interface TierSetting {
    id: string
    startQuantity?: number // 起始数量
    endQuantity?: number // 结束数量（可选，表示无上限）
    minQuantity?: number // 向后兼容
    maxQuantity?: number // 向后兼容
    minAmount?: number // 向后兼容
    maxAmount?: number // 向后兼容
    discountRatio: number // 折扣比例
}

export interface CreatePolicyData {
    name: string
    alias: string
    type: 'tiered_discount' | 'uniform_discount'
    summary: string
    validUntil: string | null
    discountRatio?: number
    tierSettings?: TierSetting[]
}

export interface UpdatePolicyData {
    name: string
    alias: string
    type: 'tiered_discount' | 'uniform_discount'
    summary: string
    validUntil: string | null
    discountRatio?: number
    tierSettings?: TierSetting[]
}

// 获取所有价格政策
export const getAllPricingPolicies = async (): Promise<PricingPolicy[]> => {
    try {
        const response = await axios.get('/api/pricing-policies')
        return response.data.data
    } catch (error) {
        console.error('获取价格政策列表失败:', error)
        throw error
    }
}

// 根据ID获取价格政策
export const getPricingPolicyById = async (id: string): Promise<PricingPolicy> => {
    try {
        const response = await axios.get(`/api/pricing-policies/${id}`)
        return response.data.data
    } catch (error) {
        console.error('获取价格政策详情失败:', error)
        throw error
    }
}

// 创建价格政策
export const createPricingPolicy = async (data: CreatePolicyData): Promise<PricingPolicy> => {
    try {
        const response = await axios.post('/api/pricing-policies', data)
        return response.data.data
    } catch (error) {
        console.error('创建价格政策失败:', error)
        throw error
    }
}

// 更新价格政策
export const updatePricingPolicy = async (id: string, data: UpdatePolicyData): Promise<PricingPolicy> => {
    try {
        const response = await axios.put(`/api/pricing-policies/${id}`, data)
        return response.data.data
    } catch (error) {
        console.error('更新价格政策失败:', error)
        throw error
    }
}

// 切换价格政策状态
export const togglePricingPolicyStatus = async (id: string): Promise<PricingPolicy> => {
    try {
        const response = await axios.patch(`/api/pricing-policies/${id}/toggle-status`)
        return response.data.data
    } catch (error) {
        console.error('切换价格政策状态失败:', error)
        throw error
    }
}

// 删除价格政策
export const deletePricingPolicy = async (id: string): Promise<void> => {
    try {
        await axios.delete(`/api/pricing-policies/${id}`)
    } catch (error) {
        console.error('删除价格政策失败:', error)
        throw error
    }
}

// 搜索价格政策
export const searchPricingPolicies = async (searchTerm: string): Promise<PricingPolicy[]> => {
    try {
        const response = await axios.get(`/api/pricing-policies/search?search=${encodeURIComponent(searchTerm)}`)
        return response.data.data
    } catch (error) {
        console.error('搜索价格政策失败:', error)
        throw error
    }
} 