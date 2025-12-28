import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    SettlementQuery,
    CreateSettlementData,
    getSettlements,
    getSettlementById,
    createSettlement,
    updateSettlement,
} from '@/api/settlements';
import { toast } from 'sonner';

// 查询 key
export const settlementKeys = {
    all: ['settlements'] as const,
    lists: () => [...settlementKeys.all, 'list'] as const,
    list: (params?: SettlementQuery) => [...settlementKeys.lists(), params] as const,
    details: () => [...settlementKeys.all, 'detail'] as const,
    detail: (id: string) => [...settlementKeys.details(), id] as const,
};

// 获取结算单列表
export function useSettlements(query?: SettlementQuery) {
    return useQuery({
        queryKey: settlementKeys.list(query),
        queryFn: () => getSettlements(query),
    });
}

// 获取单个结算单
export function useSettlement(id: string) {
    return useQuery({
        queryKey: settlementKeys.detail(id),
        queryFn: () => getSettlementById(id),
        enabled: !!id,
    });
}

// 创建结算单
export function useCreateSettlement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSettlementData) => createSettlement(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settlementKeys.lists() });
            toast.success('结算单创建成功');
        },
        onError: (error: Error) => {
            toast.error(error.message || '创建失败');
        },
    });
}

// 更新结算单
export function useUpdateSettlement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateSettlement>[1] }) =>
            updateSettlement(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: settlementKeys.lists() });
            queryClient.invalidateQueries({ queryKey: settlementKeys.detail(id) });
            toast.success('结算单更新成功');
        },
        onError: (error: Error) => {
            toast.error(error.message || '更新失败');
        },
    });
}

