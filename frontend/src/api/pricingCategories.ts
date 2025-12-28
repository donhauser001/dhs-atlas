import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

export interface PricingCategory {
    _id: string
    name: string
    description: string
    status: 'active' | 'inactive'
    serviceCount: number
    createTime: string
    updateTime: string
}

export interface CreateCategoryData {
    name: string
    description?: string
    status?: 'active' | 'inactive'
}

export interface UpdateCategoryData {
    name?: string
    description?: string
    status?: 'active' | 'inactive'
}

// 获取所有定价分类
export const getAllPricingCategories = async (): Promise<PricingCategory[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/pricing-categories`)
        return response.data.data
    } catch (error) {
        console.error('获取定价分类列表失败:', error)
        throw error
    }
}

// 根据ID获取定价分类
export const getPricingCategoryById = async (id: string): Promise<PricingCategory> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/pricing-categories/${id}`)
        return response.data.data
    } catch (error) {
        console.error('获取定价分类详情失败:', error)
        throw error
    }
}

// 创建定价分类
export const createPricingCategory = async (data: CreateCategoryData): Promise<PricingCategory> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/pricing-categories`, data)
        return response.data.data
    } catch (error) {
        console.error('创建定价分类失败:', error)
        throw error
    }
}

// 更新定价分类
export const updatePricingCategory = async (id: string, data: UpdateCategoryData): Promise<PricingCategory> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/pricing-categories/${id}`, data)
        return response.data.data
    } catch (error) {
        console.error('更新定价分类失败:', error)
        throw error
    }
}

// 切换定价分类状态
export const togglePricingCategoryStatus = async (id: string): Promise<PricingCategory> => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/pricing-categories/${id}/toggle-status`)
        return response.data.data
    } catch (error) {
        console.error('切换定价分类状态失败:', error)
        throw error
    }
}

// 删除定价分类
export const deletePricingCategory = async (id: string): Promise<void> => {
    try {
        await axios.delete(`${API_BASE_URL}/pricing-categories/${id}`)
    } catch (error) {
        console.error('删除定价分类失败:', error)
        throw error
    }
}

// 搜索定价分类
export const searchPricingCategories = async (searchTerm: string): Promise<PricingCategory[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/pricing-categories/search?q=${encodeURIComponent(searchTerm)}`)
        return response.data.data
    } catch (error) {
        console.error('搜索定价分类失败:', error)
        throw error
    }
} 