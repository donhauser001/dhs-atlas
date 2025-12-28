/**
 * AI 配置 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAiTools,
    createAiTool,
    updateAiTool,
    deleteAiTool,
    getAiDataModels,
    createAiDataModel,
    updateAiDataModel,
    deleteAiDataModel,
    getAiTemplates,
    createAiTemplate,
    updateAiTemplate,
    deleteAiTemplate,
    getAiMaps,
    createAiMap,
    updateAiMap,
    deleteAiMap,
    type AiTool,
    type AiDataModel,
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

// ==================== 数据模型 Hooks ====================

export function useAiDataModels() {
    return useQuery({
        queryKey: ['ai-data-models'],
        queryFn: getAiDataModels,
    });
}

export function useCreateAiDataModel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createAiDataModel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-data-models'] });
        },
    });
}

export function useUpdateAiDataModel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AiDataModel> }) => updateAiDataModel(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-data-models'] });
        },
    });
}

export function useDeleteAiDataModel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAiDataModel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-data-models'] });
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

