import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    GeneratedContractQuery,
    CreateGeneratedContractData,
    UpdateGeneratedContractData,
    getGeneratedContracts,
    getGeneratedContractById,
    getContractsByRelatedIds,
    generateContractFromTemplate,
    generateContractFromFormData,
    updateGeneratedContract,
    updateGeneratedContractContent,
    updateGeneratedContractStatus,
    deleteGeneratedContract,
    uploadSignedFile,
    deleteSignedFile,
} from '@/api/generatedContracts';
import { toast } from 'sonner';

// 查询 key
export const contractKeys = {
    all: ['contracts'] as const,
    lists: () => [...contractKeys.all, 'list'] as const,
    list: (params?: GeneratedContractQuery) => [...contractKeys.lists(), params] as const,
    details: () => [...contractKeys.all, 'detail'] as const,
    detail: (id: string) => [...contractKeys.details(), id] as const,
    related: (params?: { projectId?: string; clientId?: string; contactId?: string }) =>
        [...contractKeys.all, 'related', params] as const,
};

// 获取合同列表
export function useContracts(params?: GeneratedContractQuery) {
    return useQuery({
        queryKey: contractKeys.list(params),
        queryFn: () => getGeneratedContracts(params),
    });
}

// 获取单个合同
export function useContract(id: string) {
    return useQuery({
        queryKey: contractKeys.detail(id),
        queryFn: () => getGeneratedContractById(id),
        enabled: !!id,
    });
}

// 根据关联ID获取合同
export function useContractsByRelatedIds(params?: {
    projectId?: string;
    clientId?: string;
    contactId?: string;
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
}) {
    return useQuery({
        queryKey: contractKeys.related(params),
        queryFn: () => getContractsByRelatedIds(params || {}),
        enabled: !!(params?.projectId || params?.clientId || params?.contactId),
    });
}

// 从模板生成合同
export function useGenerateContractFromTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ templateId, data }: { templateId: string; data: CreateGeneratedContractData }) =>
            generateContractFromTemplate(templateId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
            toast.success('合同生成成功');
        },
        onError: (error: Error) => {
            toast.error(error.message || '生成失败');
        },
    });
}

// 从表单数据生成合同
export function useGenerateContractFromFormData() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateId,
            formDataId,
            data,
        }: {
            templateId: string;
            formDataId: string;
            data: { name?: string; description?: string };
        }) => generateContractFromFormData(templateId, formDataId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
            toast.success('合同生成成功');
        },
        onError: (error: Error) => {
            toast.error(error.message || '生成失败');
        },
    });
}

// 更新合同
export function useUpdateContract() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateGeneratedContractData }) =>
            updateGeneratedContract(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
            queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) });
            toast.success('合同更新成功');
        },
        onError: (error: Error) => {
            toast.error(error.message || '更新失败');
        },
    });
}

// 更新合同内容
export function useUpdateContractContent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: { name?: string; description?: string; status?: string; content?: string };
        }) => updateGeneratedContractContent(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
            queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) });
            toast.success('合同更新成功');
        },
        onError: (error: Error) => {
            toast.error(error.message || '更新失败');
        },
    });
}

// 更新合同状态
export function useUpdateContractStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            updateGeneratedContractStatus(id, status),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
            queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) });
            toast.success('状态更新成功');
        },
        onError: (error: Error) => {
            toast.error(error.message || '更新失败');
        },
    });
}

// 删除合同
export function useDeleteContract() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteGeneratedContract(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
            toast.success('合同删除成功');
        },
        onError: (error: Error) => {
            toast.error(error.message || '删除失败');
        },
    });
}

// 上传签署文件
export function useUploadSignedFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, file }: { id: string; file: File }) => uploadSignedFile(id, file),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) });
            toast.success('文件上传成功');
        },
        onError: (error: Error) => {
            toast.error(error.message || '上传失败');
        },
    });
}

// 删除签署文件
export function useDeleteSignedFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteSignedFile(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) });
            toast.success('文件删除成功');
        },
        onError: (error: Error) => {
            toast.error(error.message || '删除失败');
        },
    });
}

