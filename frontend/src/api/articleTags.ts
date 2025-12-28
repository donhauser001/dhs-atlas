import axios from 'axios'

const API_BASE_URL = '/api'

export interface ArticleTag {
    _id: string
    name: string
    description?: string
    slug: string
    color?: string
    articleCount: number
    isActive: boolean
    createTime: string
    updateTime: string
}

export interface CreateTagRequest {
    name: string
    description?: string
    slug: string
    color?: string
}

export interface UpdateTagRequest {
    name?: string
    description?: string
    slug?: string
    color?: string
    isActive?: boolean
}

export interface TagQuery {
    searchText?: string
    isActive?: boolean
    page?: number
    pageSize?: number
}

export interface TagListResponse {
    tags: ArticleTag[]
    total: number
    stats: {
        total: number
        active: number
        totalArticles: number
    }
}

export interface TagStats {
    total: number
    active: number
    totalArticles: number
}

// 获取标签列表
export const getTags = async (query: TagQuery = {}): Promise<TagListResponse> => {
    const params = new URLSearchParams()
    if (query.searchText) params.append('searchText', query.searchText)
    if (query.isActive !== undefined) params.append('isActive', query.isActive.toString())
    if (query.page) params.append('page', query.page.toString())
    if (query.pageSize) params.append('pageSize', query.pageSize.toString())

    const response = await axios.get(`${API_BASE_URL}/article-tags?${params}`)
    return response.data.data
}

// 根据ID获取标签
export const getTagById = async (id: string): Promise<ArticleTag> => {
    const response = await axios.get(`${API_BASE_URL}/article-tags/${id}`)
    return response.data.data
}

// 创建标签
export const createTag = async (data: CreateTagRequest): Promise<ArticleTag> => {
    const response = await axios.post(`${API_BASE_URL}/article-tags`, data)
    return response.data.data
}

// 更新标签
export const updateTag = async (id: string, data: UpdateTagRequest): Promise<ArticleTag> => {
    const response = await axios.put(`${API_BASE_URL}/article-tags/${id}`, data)
    return response.data.data
}

// 删除标签
export const deleteTag = async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/article-tags/${id}`)
}

// 切换标签状态
export const toggleTagStatus = async (id: string): Promise<ArticleTag> => {
    const response = await axios.put(`${API_BASE_URL}/article-tags/${id}/toggle-status`)
    return response.data.data
}

// 获取标签统计
export const getTagStats = async (): Promise<TagStats> => {
    const response = await axios.get(`${API_BASE_URL}/article-tags/stats`)
    return response.data.data
}

// 获取所有启用的标签
export const getActiveTags = async (): Promise<ArticleTag[]> => {
    const response = await axios.get(`${API_BASE_URL}/article-tags/active`)
    return response.data.data
}

// 批量获取标签
export const getTagsByIds = async (ids: string[]): Promise<ArticleTag[]> => {
    const params = new URLSearchParams()
    params.append('ids', ids.join(','))

    const response = await axios.get(`${API_BASE_URL}/article-tags/batch?${params}`)
    return response.data.data
} 