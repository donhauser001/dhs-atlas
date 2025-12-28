import axios from '@/lib/axios';

// 文件项接口
export interface FileItem {
  _id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  thumbnailPath?: string;
  fileSize: number;
  mimeType: string;
  category: string;
  subDirectory?: string;
  uploadedBy: string;
  uploaderName: string;
  uploadTime: string;
  lastModified: string;
  isPublic: boolean;
  description?: string;
  tags: string[];
  downloadCount: number;
  status: 'active' | 'deleted';
}

// 客户文件接口
export interface ClientFile {
  path: string;
  originalName: string;
  size: number;
}

// 文件查询参数
export interface FileQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  uploadedBy?: string;
  isPublic?: boolean;
  tags?: string[];
  sortBy?: 'uploadTime' | 'lastModified' | 'fileSize' | 'downloadCount';
  sortOrder?: 'asc' | 'desc';
}

// 文件列表响应
export interface FileListResponse {
  success: boolean;
  data: {
    files: FileItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
}

// 获取文件列表
export async function getFiles(params?: FileQuery): Promise<FileListResponse> {
  const response = await axios.get<FileListResponse>('/file-center/files', { params });
  return response.data;
}

// 获取项目文件
export async function getProjectFiles(projectId: string): Promise<FileItem[]> {
  const response = await axios.get<FileListResponse>('/file-center/files', {
    params: {
      category: 'projects',
      limit: 100,
    },
  });

  if (response.data.success) {
    // 过滤出属于当前项目的文件
    return response.data.data.files.filter(
      (file) => file.subDirectory === projectId
    );
  }
  return [];
}

// 上传项目文件（支持进度回调）
export async function uploadProjectFiles(
  projectId: string,
  files: File[],
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; message: string }> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('file', file);
  });

  const response = await axios.post(`/upload/projects/${projectId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
  return response.data;
}

// 下载文件
export async function downloadFile(fileId: string): Promise<void> {
  const response = await axios.get(`/file-center/download/${fileId}`, {
    responseType: 'blob',
  });

  // 从响应头获取文件名
  const contentDisposition = response.headers['content-disposition'];
  let filename = 'download';
  if (contentDisposition) {
    const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
    if (filenameStarMatch) {
      filename = decodeURIComponent(filenameStarMatch[1]);
    } else {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        try {
          filename = decodeURIComponent(filenameMatch[1]);
        } catch {
          filename = filenameMatch[1];
        }
      }
    }
  }

  // 创建下载链接
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// 删除文件
export async function deleteFile(fileId: string): Promise<{ success: boolean; message: string }> {
  const response = await axios.delete(`/file-center/files/${fileId}`);
  return response.data;
}

// 获取客户文件（从客户详情中获取）
export async function getClientFiles(clientId: string): Promise<ClientFile[]> {
  const response = await axios.get(`/clients/${clientId}`);
  if (response.data.success && response.data.data?.files) {
    return response.data.data.files;
  }
  return [];
}

// 获取文件URL
export function getFileUrl(filePath: string): string {
  if (!filePath) return '';

  // 如果是完整的URL，直接返回
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // 如果路径以 /uploads 开头
  if (filePath.startsWith('/uploads')) {
    return filePath;
  }

  // 如果路径以 uploads 开头
  if (filePath.startsWith('uploads/')) {
    return `/${filePath}`;
  }

  // 如果路径以 / 开头
  if (filePath.startsWith('/')) {
    return filePath;
  }

  // 其他相对路径
  return `/uploads/${filePath}`;
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// 判断是否为图片文件
export function isImageFile(fileName: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const lowerFileName = fileName.toLowerCase();
  return imageExtensions.some((ext) => lowerFileName.endsWith(ext));
}

// 获取缩略图 URL（如果存在）
export function getThumbnailUrl(file: FileItem | { filePath: string; thumbnailPath?: string }): string {
  // 如果有缩略图路径，使用缩略图
  if (file.thumbnailPath) {
    return getFileUrl(file.thumbnailPath);
  }
  // 否则返回原图路径
  return getFileUrl(file.filePath);
}

