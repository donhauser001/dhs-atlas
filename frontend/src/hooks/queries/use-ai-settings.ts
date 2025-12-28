/**
 * AI 设置 React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getAllAiModels,
    getAiModel,
    createAiModel,
    updateAiModel,
    deleteAiModel,
    setDefaultModel,
    testConnection,
    getOllamaModels,
    getLMStudioModels,
    type CreateAiModelRequest,
    type UpdateAiModelRequest,
    type TestConnectionRequest,
} from '@/api/ai-settings';

// Query keys
const AI_SETTINGS_KEYS = {
    all: ['ai-settings'] as const,
    lists: () => [...AI_SETTINGS_KEYS.all, 'list'] as const,
    list: () => [...AI_SETTINGS_KEYS.lists()] as const,
    details: () => [...AI_SETTINGS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...AI_SETTINGS_KEYS.details(), id] as const,
    ollama: (baseUrl?: string) => [...AI_SETTINGS_KEYS.all, 'ollama', baseUrl] as const,
    lmstudio: (baseUrl?: string) => [...AI_SETTINGS_KEYS.all, 'lmstudio', baseUrl] as const,
};

/**
 * 获取所有 AI 模型配置
 */
export function useAiModels() {
    return useQuery({
        queryKey: AI_SETTINGS_KEYS.list(),
        queryFn: getAllAiModels,
    });
}

/**
 * 获取单个 AI 模型配置
 */
export function useAiModel(id: string) {
    return useQuery({
        queryKey: AI_SETTINGS_KEYS.detail(id),
        queryFn: () => getAiModel(id),
        enabled: !!id,
    });
}

/**
 * 创建 AI 模型配置
 */
export function useCreateAiModel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAiModelRequest) => createAiModel(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: AI_SETTINGS_KEYS.lists() });
            toast.success('模型配置创建成功');
        },
        onError: (error: Error) => {
            toast.error(`创建失败: ${error.message}`);
        },
    });
}

/**
 * 更新 AI 模型配置
 */
export function useUpdateAiModel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAiModelRequest }) =>
            updateAiModel(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: AI_SETTINGS_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: AI_SETTINGS_KEYS.detail(id) });
            toast.success('模型配置更新成功');
        },
        onError: (error: Error) => {
            toast.error(`更新失败: ${error.message}`);
        },
    });
}

/**
 * 删除 AI 模型配置
 */
export function useDeleteAiModel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteAiModel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: AI_SETTINGS_KEYS.lists() });
            toast.success('模型配置已删除');
        },
        onError: (error: Error) => {
            toast.error(`删除失败: ${error.message}`);
        },
    });
}

/**
 * 设置默认模型
 */
export function useSetDefaultModel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => setDefaultModel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: AI_SETTINGS_KEYS.lists() });
            toast.success('默认模型已设置');
        },
        onError: (error: Error) => {
            toast.error(`设置失败: ${error.message}`);
        },
    });
}

/**
 * 测试模型连接
 */
export function useTestConnection() {
    return useMutation({
        mutationFn: (data: TestConnectionRequest) => testConnection(data),
        onSuccess: (result) => {
            if (result.success) {
                toast.success(`连接成功! 响应时间: ${result.responseTime}ms`);
            } else {
                toast.error(`连接失败: ${result.message}`);
            }
        },
        onError: (error: Error) => {
            toast.error(`测试失败: ${error.message}`);
        },
    });
}

/**
 * 获取 Ollama 本地模型列表
 */
export function useOllamaModels(baseUrl?: string, enabled = true) {
    return useQuery({
        queryKey: AI_SETTINGS_KEYS.ollama(baseUrl),
        queryFn: () => getOllamaModels(baseUrl),
        enabled,
        retry: false,
    });
}

/**
 * 获取 LMStudio 本地模型列表
 */
export function useLMStudioModels(baseUrl?: string, enabled = true) {
    return useQuery({
        queryKey: AI_SETTINGS_KEYS.lmstudio(baseUrl),
        queryFn: () => getLMStudioModels(baseUrl),
        enabled,
        retry: false,
    });
}

