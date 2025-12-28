import axios, { AxiosError } from 'axios'

// API 错误响应类型
interface ApiErrorResponse {
  message?: string
  error?: string
}

// 扫描进度类型
interface ScanProgress {
  total: number
  processed: number
  status: 'pending' | 'running' | 'completed' | 'error'
  message?: string
}

// 扫描状态类型
interface ScanStatus {
  scanId: string
  startTime: string
  endTime?: string
  status: 'pending' | 'running' | 'completed' | 'error'
  progress?: ScanProgress
}

// 文件项接口
export interface FileItem {
  _id: string
  originalName: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  category: string
  subDirectory?: string
  uploadedBy: string
  uploaderName: string
  uploadTime: string
  lastModified: string
  isPublic: boolean
  description?: string
  tags: string[]
  downloadCount: number
  status: 'active' | 'deleted'
  permissions?: {
    canView: boolean
    canEdit: boolean
    canDelete: boolean
    canDownload: boolean
    canShare: boolean
  }
}

// 文件查询参数
export interface FileQuery {
  page?: number
  limit?: number
  search?: string
  category?: string
  uploadedBy?: string
  isPublic?: boolean
  tags?: string[]
  sortBy?: 'uploadTime' | 'lastModified' | 'fileSize' | 'downloadCount'
  sortOrder?: 'asc' | 'desc'
  userId?: number
}

// 文件列表响应
export interface FileListResponse {
  success: boolean
  data: {
    files: FileItem[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
  message?: string
}

// 文件详情响应
export interface FileDetailResponse {
  success: boolean
  data: FileItem
  message?: string
}

// 文件统计响应
export interface FileStatsResponse {
  success: boolean
  data: {
    totalFiles: number
    totalSize: number
    categoryStats: Array<{
      _id: string
      count: number
      totalSize: number
    }>
    userStats?: Array<{
      _id: string
      username: string
      realName: string
      count: number
      totalSize: number
    }>
  }
  message?: string
}

// 文件上传参数
export interface FileUploadData {
  description?: string
  tags?: string[]
  isPublic?: boolean
}

// 文件更新参数
export interface FileUpdateData {
  originalName?: string
  description?: string
  tags?: string[]
  isPublic?: boolean
}

// 创建axios实例
const fileCenterApi = axios.create({
  baseURL: '/api/file-center',
  timeout: 30000, // 文件操作可能需要更长时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加token
fileCenterApi.interceptors.request.use(
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

// 响应拦截器 - 处理错误
fileCenterApi.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
    }
    return Promise.reject(error)
  }
)

// 文件中心API服务
export const fileCenterService = {
  // 获取文件列表
  async getFiles(params?: FileQuery): Promise<FileListResponse> {
    try {
      const response = await fileCenterApi.get<FileListResponse>('/files', { params })
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || '获取文件列表失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  },



  // 下载文件
  async downloadFile(id: string): Promise<void> {
    try {
      const response = await fileCenterApi.get(`/download/${id}`, {
        responseType: 'blob'
      })

      // 从响应头获取文件名
      const contentDisposition = response.headers['content-disposition']
      let filename = 'download'
      if (contentDisposition) {
        // 尝试匹配 filename*=UTF-8''编码格式 (RFC 6266)
        const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/)
        if (filenameStarMatch) {
          filename = decodeURIComponent(filenameStarMatch[1])
        } else {
          // 回退到传统格式，并解码
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
          if (filenameMatch) {
            try {
              filename = decodeURIComponent(filenameMatch[1])
            } catch {
              // 如果解码失败，使用原始值
              filename = filenameMatch[1]
            }
          }
        }
      }

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || '下载文件失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  },

  // 更新文件信息
  async updateFile(id: string, data: FileUpdateData): Promise<FileDetailResponse> {
    try {
      const response = await fileCenterApi.put<FileDetailResponse>(`/files/${id}`, data)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || '更新文件失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  },

  // 删除文件
  async deleteFile(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fileCenterApi.delete<{ success: boolean; message: string }>(`/files/${id}`)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || '删除文件失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  },

  // 获取文件统计信息
  async getFileStats(): Promise<FileStatsResponse> {
    try {
      const response = await fileCenterApi.get<FileStatsResponse>('/stats')
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || '获取文件统计失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  },

  // 上传用户文件
  async uploadUserFile(file: File, data: FileUploadData): Promise<FileDetailResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      if (data.description) {
        formData.append('description', data.description)
      }
      if (data.tags && data.tags.length > 0) {
        formData.append('tags', JSON.stringify(data.tags))
      }
      if (data.isPublic !== undefined) {
        formData.append('isPublic', data.isPublic.toString())
      }

      // 使用fileCenterApi实例，但需要修改URL路径和Content-Type
      const response = await fileCenterApi.post<FileDetailResponse>('../upload/user-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 上传可能需要更长时间
      })

      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || '上传文件失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  },

  // 扫描uploads目录
  async scanUploadsDirectory(): Promise<{
    success: boolean;
    message: string;
    data?: {
      scanId: string;
      progress: ScanProgress;
    };
  }> {
    try {
      const response = await fileCenterApi.post<{
        success: boolean;
        message: string;
        data?: {
          scanId: string;
          progress: ScanProgress;
        };
      }>('/scan')
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || '启动文件扫描失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  },

  // 获取扫描状态
  async getScanStatus(): Promise<{
    success: boolean;
    data: {
      activeScan: ScanStatus | null;
      recentScan: ScanStatus | null;
      totalScannedFiles: number;
      recentScanFiles: Array<{
        _id: string;
        originalName: string;
        category: string;
        uploadTime: string;
        fileSize: number;
      }>;
    };
  }> {
    try {
      const response = await fileCenterApi.get<{
        success: boolean;
        data: {
          activeScan: ScanStatus | null;
          recentScan: ScanStatus | null;
          totalScannedFiles: number;
          recentScanFiles: Array<{
            _id: string;
            originalName: string;
            category: string;
            uploadTime: string;
            fileSize: number;
          }>;
        };
      }>('/scan/status')
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || '获取扫描状态失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  },

  // 获取扫描进度
  async getScanProgress(scanId: string): Promise<{
    success: boolean;
    data: ScanProgress;
  }> {
    try {
      const response = await fileCenterApi.get<{
        success: boolean;
        data: ScanProgress;
      }>(`/scan/progress/${scanId}`)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || '获取扫描进度失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  },

  // 获取文件详情
  async getFileById(fileId: string): Promise<{
    success: boolean;
    data: {
      id: string;
      originalName: string;
      mimeType: string;
      fileSize: number;
      uploadTime: string;
      downloadUrl: string;
      previewUrl?: string;
    };
  }> {
    try {
      const response = await fileCenterApi.get<{
        success: boolean;
        data: {
          id: string;
          originalName: string;
          mimeType: string;
          fileSize: number;
          uploadTime: string;
          downloadUrl: string;
          previewUrl?: string;
        };
      }>(`/${fileId}`)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data) {
        throw new Error(axiosError.response.data.message || '获取文件详情失败')
      }
      throw new Error('网络错误，请检查网络连接')
    }
  }
}

export default fileCenterService