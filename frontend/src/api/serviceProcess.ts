import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

export interface ProcessStep {
    id: string
    name: string
    description: string
    order: number
    progressRatio: number
    lossBillingRatio: number
    cycle: number
}

export interface ServiceProcess {
    _id: string
    name: string
    description: string
    steps: ProcessStep[]
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
}

export interface CreateProcessData {
    name: string
    description: string
    steps: ProcessStep[]
}

export interface UpdateProcessData {
    name: string
    description: string
    steps: ProcessStep[]
}

// 获取所有服务流程
export const getAllServiceProcesses = async (): Promise<ServiceProcess[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/service-processes`)
        return response.data.data
    } catch (error) {
        console.error('获取服务流程列表失败:', error)
        throw error
    }
}

// 根据ID获取服务流程
export const getServiceProcessById = async (id: string): Promise<ServiceProcess> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/service-processes/${id}`)
        return response.data.data
    } catch (error) {
        console.error('获取服务流程详情失败:', error)
        throw error
    }
}

// 创建服务流程
export const createServiceProcess = async (data: CreateProcessData): Promise<ServiceProcess> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/service-processes`, data)
        return response.data.data
    } catch (error) {
        console.error('创建服务流程失败:', error)
        throw error
    }
}

// 更新服务流程
export const updateServiceProcess = async (id: string, data: UpdateProcessData): Promise<ServiceProcess> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/service-processes/${id}`, data)
        return response.data.data
    } catch (error) {
        console.error('更新服务流程失败:', error)
        throw error
    }
}

// 切换服务流程状态
export const toggleServiceProcessStatus = async (id: string): Promise<ServiceProcess> => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/service-processes/${id}/toggle-status`)
        return response.data.data
    } catch (error) {
        console.error('切换服务流程状态失败:', error)
        throw error
    }
}

// 删除服务流程
export const deleteServiceProcess = async (id: string): Promise<void> => {
    try {
        await axios.delete(`${API_BASE_URL}/service-processes/${id}`)
    } catch (error) {
        console.error('删除服务流程失败:', error)
        throw error
    }
}

// 搜索服务流程
export const searchServiceProcesses = async (searchTerm: string): Promise<ServiceProcess[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/service-processes/search?search=${encodeURIComponent(searchTerm)}`)
        return response.data.data
    } catch (error) {
        console.error('搜索服务流程失败:', error)
        throw error
    }
}

// 复制服务流程
export const copyServiceProcess = async (id: string): Promise<ServiceProcess> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/service-processes/${id}/copy`)
        return response.data.data
    } catch (error) {
        console.error('复制服务流程失败:', error)
        throw error
    }
} 