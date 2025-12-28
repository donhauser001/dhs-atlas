import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreatePolicyData,
  UpdatePolicyData,
  getAllPricingPolicies,
  getPricingPolicyById,
  createPricingPolicy,
  updatePricingPolicy,
  togglePricingPolicyStatus,
  deletePricingPolicy,
} from '@/api/pricingPolicy';
import { toast } from 'sonner';

// 查询 key
export const pricingPolicyKeys = {
  all: ['pricing-policies'] as const,
  lists: () => [...pricingPolicyKeys.all, 'list'] as const,
  details: () => [...pricingPolicyKeys.all, 'detail'] as const,
  detail: (id: string) => [...pricingPolicyKeys.details(), id] as const,
};

// 获取所有定价策略
export function usePricingPolicies() {
  return useQuery({
    queryKey: pricingPolicyKeys.lists(),
    queryFn: getAllPricingPolicies,
  });
}

// 获取单个定价策略
export function usePricingPolicy(id: string) {
  return useQuery({
    queryKey: pricingPolicyKeys.detail(id),
    queryFn: () => getPricingPolicyById(id),
    enabled: !!id,
  });
}

// 创建定价策略
export function useCreatePricingPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePolicyData) => createPricingPolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingPolicyKeys.lists() });
      toast.success('策略创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败');
    },
  });
}

// 更新定价策略
export function useUpdatePricingPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePolicyData }) =>
      updatePricingPolicy(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: pricingPolicyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pricingPolicyKeys.detail(id) });
      toast.success('策略更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 切换定价策略状态
export function useTogglePricingPolicyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => togglePricingPolicyStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingPolicyKeys.lists() });
      toast.success('状态更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 删除定价策略
export function useDeletePricingPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePricingPolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingPolicyKeys.lists() });
      toast.success('策略删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });
}
