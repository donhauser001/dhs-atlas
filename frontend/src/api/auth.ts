import axios, { AxiosError } from 'axios'
import { getApiBaseURL } from '@/config/axios'

// API 错误响应类型
interface ApiErrorResponse {
  message?: string
  error?: string
}

// 认证相关的接口类型定义
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    user: UserInfo
    token: string
  }
}

export interface RegisterRequest {
  username: string
  password: string
  realName: string
  email?: string
  phone: string
  role: '超级管理员' | '项目经理' | '设计师' | '客户' | '员工'
  department: string
}

export interface UserInfo {
  id: string
  username: string
  realName: string
  email?: string
  phone: string
  role: '超级管理员' | '项目经理' | '设计师' | '客户' | '员工'
  department: string
  enterpriseId?: string
  enterpriseName?: string
  departmentId?: string
  departmentName?: string
  position?: string
  permissions?: string[]
  permissionGroups?: string[]
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  error?: string
}

const authApi = axios.create({
  baseURL: `${getApiBaseURL()}/auth`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// 请求拦截器 - 添加token
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理token过期
authApi.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 对于401错误，只返回错误，让AuthContext处理状态清除和跳转
    if (error.response?.status === 401) {
    }
    return Promise.reject(error)
  }
)

// 认证API方法
export const authService = {
  // 用户登录
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await authApi.post<LoginResponse>('/login', credentials)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || '登录失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  },

  // 用户注册
  async register(userData: RegisterRequest): Promise<ApiResponse<UserInfo>> {
    try {
      const response = await authApi.post<ApiResponse<UserInfo>>('/register', userData)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || '注册失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  },

  // 验证token
  async verifyToken(): Promise<ApiResponse<UserInfo>> {
    try {
      const response = await authApi.get<ApiResponse<UserInfo>>('/verify')
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || 'token验证失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  },

  // 刷新token
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    try {
      const response = await authApi.post<ApiResponse<{ token: string }>>('/refresh')
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || 'token刷新失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  },

  // 退出登录
  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await authApi.post<ApiResponse<void>>('/logout')
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || '退出登录失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  }
}

export default authService
