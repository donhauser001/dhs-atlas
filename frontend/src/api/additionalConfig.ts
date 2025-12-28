import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

export interface AdditionalConfig {
    _id: string
    name: string
    description: string
    initialDraftCount: number // 初稿方案数量
    maxDraftCount: number // 最多方案数量
    mainCreatorRatio: number // 主创绩效比例
    assistantRatio: number // 助理绩效比例
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
}

export interface CreateConfigData {
    name: string
    description: string
    initialDraftCount: number
    maxDraftCount: number
    mainCreatorRatio: number
    assistantRatio: number
}

export interface UpdateConfigData {
    name: string
    description: string
    initialDraftCount: number
    maxDraftCount: number
    mainCreatorRatio: number
    assistantRatio: number
}

// 获取所有附加配置
export const getAllAdditionalConfigs = async (): Promise<AdditionalConfig[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/additional-configs`)
        return response.data.data
    } catch (error) {
        console.error('获取附加配置列表失败:', error)
        throw error
    }
}

// 根据ID获取附加配置
export const getAdditionalConfigById = async (id: string): Promise<AdditionalConfig> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/additional-configs/${id}`)
        return response.data.data
    } catch (error) {
        console.error('获取附加配置详情失败:', error)
        throw error
    }
}

// 创建附加配置
export const createAdditionalConfig = async (data: CreateConfigData): Promise<AdditionalConfig> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/additional-configs`, data)
        return response.data.data
    } catch (error) {
        console.error('创建附加配置失败:', error)
        throw error
    }
}

// 更新附加配置
export const updateAdditionalConfig = async (id: string, data: UpdateConfigData): Promise<AdditionalConfig> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/additional-configs/${id}`, data)
        return response.data.data
    } catch (error) {
        console.error('更新附加配置失败:', error)
        throw error
    }
}

// 切换附加配置状态
export const toggleAdditionalConfigStatus = async (id: string): Promise<AdditionalConfig> => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/additional-configs/${id}/toggle-status`)
        return response.data.data
    } catch (error) {
        console.error('切换附加配置状态失败:', error)
        throw error
    }
}

// 删除附加配置
export const deleteAdditionalConfig = async (id: string): Promise<void> => {
    try {
        await axios.delete(`${API_BASE_URL}/additional-configs/${id}`)
    } catch (error) {
        console.error('删除附加配置失败:', error)
        throw error
    }
}

// 搜索附加配置
export const searchAdditionalConfigs = async (searchTerm: string): Promise<AdditionalConfig[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/additional-configs/search?search=${encodeURIComponent(searchTerm)}`)
        return response.data.data
    } catch (error) {
        console.error('搜索附加配置失败:', error)
        throw error
    }
}

// 复制附加配置
export const copyAdditionalConfig = async (id: string): Promise<AdditionalConfig> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/additional-configs/${id}/copy`)
        return response.data.data
    } catch (error) {
        console.error('复制附加配置失败:', error)
        throw error
    }
} 