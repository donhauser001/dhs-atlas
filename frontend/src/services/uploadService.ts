import axios, { AxiosError } from 'axios'

const API_BASE_URL = '/api'

// API 错误响应类型
interface ApiErrorResponse {
    message?: string
    error?: string
}

export interface UploadResponse {
    success: boolean
    data: {
        url: string
        filename: string
        size: number
    }
    message?: string
}

// 上传图片到服务器
export const uploadImage = async (file: File): Promise<UploadResponse> => {
    try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await axios.post(`${API_BASE_URL}/upload/article-image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })

        return response.data
    } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>
        console.error('图片上传失败:', error)
        throw new Error(axiosError.response?.data?.message || '图片上传失败')
    }
}

// 检查文件类型
export const checkFileType = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    return allowedTypes.includes(file.type)
}

// 检查文件大小
export const checkFileSize = (file: File, maxSize: number = 5 * 1024 * 1024): boolean => {
    return file.size <= maxSize
}

// 压缩图片
export const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            // 计算新的尺寸
            let { width, height } = img
            if (width > maxWidth) {
                height = (height * maxWidth) / width
                width = maxWidth
            }

            canvas.width = width
            canvas.height = height

            // 绘制图片
            ctx?.drawImage(img, 0, 0, width, height)

            // 转换为blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        })
                        resolve(compressedFile)
                    } else {
                        reject(new Error('图片压缩失败'))
                    }
                },
                file.type,
                quality
            )
        }

        img.onerror = () => {
            reject(new Error('图片加载失败'))
        }

        img.src = URL.createObjectURL(file)
    })
}

// 从URL中提取文件名
export const extractFilenameFromUrl = (url: string): string | null => {
    try {
        const urlObj = new URL(url, window.location.origin)
        const pathname = urlObj.pathname
        const filename = pathname.split('/').pop()
        return filename || null
    } catch (error) {
        console.error('解析URL失败:', error)
        return null
    }
}

// 删除图片文件
export const deleteImage = async (imageUrl: string): Promise<{ success: boolean; message: string }> => {
    try {
        const filename = extractFilenameFromUrl(imageUrl)
        if (!filename) {
            throw new Error('无法从URL中提取文件名')
        }

        // 从URL路径中提取category（例如：/uploads/article-image/filename.jpg -> article-image）
        const urlPath = new URL(imageUrl, window.location.origin).pathname
        const pathParts = urlPath.split('/')
        const categoryIndex = pathParts.findIndex(part => part === 'uploads')
        const category = categoryIndex !== -1 && categoryIndex + 1 < pathParts.length ? pathParts[categoryIndex + 1] : 'article-image'

        const response = await axios.delete(`${API_BASE_URL}/upload/${category}/${filename}`)

        return {
            success: response.data.success,
            message: response.data.message
        }
    } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>
        console.error('删除图片失败:', error)
        throw new Error(axiosError.response?.data?.message || '删除图片失败')
    }
} 