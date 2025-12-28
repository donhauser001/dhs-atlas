import axios from 'axios';

// API基础URL
const API_BASE_URL = '/api';

export interface Article {
    _id: string;
    title: string;
    content: string;
    summary?: string;
    category: string;
    tags: string[];
    author: string;
    authorId: string;
    status: 'draft' | 'published' | 'archived';
    publishTime?: string;
    coverImage?: string;
    viewCount: number;
    isTop: boolean;
    isRecommend: boolean;
    seoTitle?: string;
    seoKeywords?: string;
    seoDescription?: string;
    createTime: string;
    updateTime: string;
}

export interface CreateArticleRequest {
    title: string;
    content: string;
    summary?: string;
    category: string;
    tags?: string[];
    author: string;
    authorId: string;
    coverImage?: string;
    seoTitle?: string;
    seoKeywords?: string;
    seoDescription?: string;
}

export interface UpdateArticleRequest {
    title?: string;
    content?: string;
    summary?: string;
    category?: string;
    tags?: string[];
    status?: 'draft' | 'published' | 'archived';
    coverImage?: string;
    isTop?: boolean;
    isRecommend?: boolean;
    seoTitle?: string;
    seoKeywords?: string;
    seoDescription?: string;
}

export interface ArticleQuery {
    search?: string;
    category?: string;
    status?: string;
    authorId?: string;
    page?: number;
    limit?: number;
}

export interface ArticleListResponse {
    success: boolean;
    data: Article[];
    total: number;
    page: number;
    limit: number;
}

export interface ArticleResponse {
    success: boolean;
    data: Article;
    message?: string;
}

export interface CategoryStats {
    category: string;
    count: number;
}

// 获取文章列表
export const getArticles = async (params?: ArticleQuery): Promise<ArticleListResponse> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/articles`, { params });
        return response.data;
    } catch (error) {
        console.error('获取文章列表失败:', error);
        throw error;
    }
};

// 获取文章详情
export const getArticleById = async (id: string): Promise<ArticleResponse> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/articles/${id}`);
        return response.data;
    } catch (error) {
        console.error('获取文章详情失败:', error);
        throw error;
    }
};

// 创建文章
export const createArticle = async (data: CreateArticleRequest): Promise<ArticleResponse> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/articles`, data);
        return response.data;
    } catch (error) {
        console.error('创建文章失败:', error);
        throw error;
    }
};

// 更新文章
export const updateArticle = async (id: string, data: UpdateArticleRequest): Promise<ArticleResponse> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/articles/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('更新文章失败:', error);
        throw error;
    }
};

// 删除文章
export const deleteArticle = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/articles/${id}`);
        return response.data;
    } catch (error) {
        console.error('删除文章失败:', error);
        throw error;
    }
};

// 切换文章状态
export const toggleArticleStatus = async (id: string): Promise<ArticleResponse> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/articles/${id}/toggle-status`);
        return response.data;
    } catch (error) {
        console.error('切换文章状态失败:', error);
        throw error;
    }
};

// 设置置顶状态
export const toggleTopStatus = async (id: string): Promise<ArticleResponse> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/articles/${id}/toggle-top`);
        return response.data;
    } catch (error) {
        console.error('切换置顶状态失败:', error);
        throw error;
    }
};

// 设置推荐状态
export const toggleRecommendStatus = async (id: string): Promise<ArticleResponse> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/articles/${id}/toggle-recommend`);
        return response.data;
    } catch (error) {
        console.error('切换推荐状态失败:', error);
        throw error;
    }
};

// 增加浏览量
export const incrementViewCount = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/articles/${id}/increment-view`);
        return response.data;
    } catch (error) {
        console.error('增加浏览量失败:', error);
        throw error;
    }
};

// 获取分类统计
export const getCategoryStats = async (): Promise<{ success: boolean; data: CategoryStats[] }> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/articles/stats/categories`);
        return response.data;
    } catch (error) {
        console.error('获取分类统计失败:', error);
        throw error;
    }
};

// 获取热门文章
export const getPopularArticles = async (limit?: number): Promise<{ success: boolean; data: Article[] }> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/articles/popular/list`, { params: { limit } });
        return response.data;
    } catch (error) {
        console.error('获取热门文章失败:', error);
        throw error;
    }
};

// 获取推荐文章
export const getRecommendedArticles = async (limit?: number): Promise<{ success: boolean; data: Article[] }> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/articles/recommended/list`, { params: { limit } });
        return response.data;
    } catch (error) {
        console.error('获取推荐文章失败:', error);
        throw error;
    }
}; 