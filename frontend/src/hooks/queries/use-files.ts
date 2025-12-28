import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FileQuery,
    getFiles,
    getProjectFiles,
    getClientFiles,
    uploadProjectFiles,
    deleteFile,
} from '@/api/files';
import { toast } from 'sonner';

// 查询 key
export const fileKeys = {
    all: ['files'] as const,
    lists: () => [...fileKeys.all, 'list'] as const,
    list: (params?: FileQuery) => [...fileKeys.lists(), params] as const,
    projectFiles: (projectId: string) => [...fileKeys.all, 'project', projectId] as const,
    clientFiles: (clientId: string) => [...fileKeys.all, 'client', clientId] as const,
};

// 获取文件列表
export function useFiles(params?: FileQuery) {
    return useQuery({
        queryKey: fileKeys.list(params),
        queryFn: () => getFiles(params),
    });
}

// 获取项目文件
export function useProjectFiles(projectId: string) {
    return useQuery({
        queryKey: fileKeys.projectFiles(projectId),
        queryFn: () => getProjectFiles(projectId),
        enabled: !!projectId,
    });
}

// 获取客户文件
export function useClientFiles(clientId: string) {
    return useQuery({
        queryKey: fileKeys.clientFiles(clientId),
        queryFn: () => getClientFiles(clientId),
        enabled: !!clientId,
    });
}

// 上传项目文件
export function useUploadProjectFiles() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            projectId,
            files,
            onProgress,
        }: {
            projectId: string;
            files: File[];
            onProgress?: (progress: number) => void;
        }) => uploadProjectFiles(projectId, files, onProgress),
        onSuccess: (_, { projectId }) => {
            queryClient.invalidateQueries({ queryKey: fileKeys.projectFiles(projectId) });
            queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
            toast.success('文件上传成功');
        },
        onError: (error: Error) => {
            toast.error(error.message || '上传失败');
        },
    });
}

// 删除文件
export function useDeleteFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (fileId: string) => deleteFile(fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
            queryClient.invalidateQueries({ queryKey: fileKeys.all });
            toast.success('文件删除成功');
        },
        onError: (error: Error) => {
            toast.error(error.message || '删除失败');
        },
    });
}

