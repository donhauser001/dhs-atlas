import axios from 'axios'

const API_BASE_URL = '/api'

export interface ArticleCategory {
    _id: string
    name: string
    description?: string
    slug: string
    color?: string
    articleCount: number
    isActive: boolean
    parentId?: string
    level: number
    path: string[]
    children?: ArticleCategory[]
    createTime: string
    updateTime: string
}

export interface CreateCategoryRequest {
    name: string
    description?: string
    slug: string
    color?: string
    parentId?: string
}

export interface UpdateCategoryRequest {
    name?: string
    description?: string
    slug?: string
    color?: string
    isActive?: boolean
    parentId?: string
}

export interface CategoryQuery {
    searchText?: string
    isActive?: boolean
    parentId?: string
    level?: number
}

export interface CategoryListResponse {
    categories: ArticleCategory[]
    stats: {
        total: number
        active: number
        totalArticles: number
    }
}

export interface CategoryStats {
    total: number
    active: number
    totalArticles: number
}

// 获取分类列表
export const getCategories = async (query: CategoryQuery = {}): Promise<CategoryListResponse> => {
    const params = new URLSearchParams()
    if (query.searchText) params.append('searchText', query.searchText)
    if (query.isActive !== undefined) params.append('isActive', query.isActive.toString())
    if (query.parentId) params.append('parentId', query.parentId)
    if (query.level) params.append('level', query.level.toString())

    const response = await axios.get(`${API_BASE_URL}/article-categories?${params}`)
    return response.data.data
}

// 根据ID获取分类
export const getCategoryById = async (id: string): Promise<ArticleCategory> => {
    const response = await axios.get(`${API_BASE_URL}/article-categories/${id}`)
    return response.data.data
}

// 创建分类
export const createCategory = async (data: CreateCategoryRequest): Promise<ArticleCategory> => {
    const response = await axios.post(`${API_BASE_URL}/article-categories`, data)
    return response.data.data
}

// 更新分类
export const updateCategory = async (id: string, data: UpdateCategoryRequest): Promise<ArticleCategory> => {
    const response = await axios.put(`${API_BASE_URL}/article-categories/${id}`, data)
    return response.data.data
}

// 删除分类
export const deleteCategory = async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/article-categories/${id}`)
}

// 切换分类状态
export const toggleCategoryStatus = async (id: string): Promise<ArticleCategory> => {
    const response = await axios.put(`${API_BASE_URL}/article-categories/${id}/toggle-status`)
    return response.data.data
}

// 获取分类统计
export const getCategoryStats = async (): Promise<CategoryStats> => {
    const response = await axios.get(`${API_BASE_URL}/article-categories/stats`)
    return response.data.data
}

// 获取可用的父分类
export const getAvailableParentCategories = async (excludeId?: string): Promise<ArticleCategory[]> => {
    const params = new URLSearchParams()
    if (excludeId) params.append('excludeId', excludeId)

    const response = await axios.get(`${API_BASE_URL}/article-categories/available-parents?${params}`)
    return response.data.data
} 