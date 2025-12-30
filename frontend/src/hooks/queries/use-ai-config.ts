/**
 * AI 配置 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAiTools,
    createAiTool,
    updateAiTool,
    deleteAiTool,
    getAiTemplates,
    createAiTemplate,
    updateAiTemplate,
    deleteAiTemplate,
    getAiMaps,
    createAiMap,
    updateAiMap,
    deleteAiMap,
    type AiTool,
    type AiTemplate,
    type AiMap,
} from '@/api/ai-config';

// ==================== 工具集 Hooks ====================

export function useAiTools() {
    return useQuery({
        queryKey: ['ai-tools'],
        queryFn: getAiTools,
    });
}

export function useCreateAiTool() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createAiTool,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-tools'] });
        },
    });
}

export function useUpdateAiTool() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AiTool> }) => updateAiTool(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-tools'] });
        },
    });
}

export function useDeleteAiTool() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAiTool,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-tools'] });
        },
    });
}

// ==================== 样例模板 Hooks ====================

export function useAiTemplates() {
    return useQuery({
        queryKey: ['ai-templates'],
        queryFn: getAiTemplates,
    });
}

export function useCreateAiTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createAiTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-templates'] });
        },
    });
}

export function useUpdateAiTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AiTemplate> }) => updateAiTemplate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-templates'] });
        },
    });
}

export function useDeleteAiTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAiTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-templates'] });
        },
    });
}

// ==================== AI 数据模型 Hook（已废弃，保留兼容） ====================

export function useAiDataModels() {
    // AiDataModel 已被 DataMapService 替代，返回空数组保持兼容
    return { data: [], isLoading: false };
}

// ==================== AI 地图 Hooks ====================

export function useAiMaps() {
    return useQuery({
        queryKey: ['ai-maps'],
        queryFn: getAiMaps,
    });
}

export function useCreateAiMap() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createAiMap,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-maps'] });
        },
    });
}

export function useUpdateAiMap() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AiMap> }) => updateAiMap(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-maps'] });
        },
    });
}

export function useDeleteAiMap() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAiMap,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-maps'] });
        },
    });
}

