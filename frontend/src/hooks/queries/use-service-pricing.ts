import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicePricingApi, CreateServicePricingRequest } from '@/api/service-pricing';
import { toast } from 'sonner';

// 查询 key
export const servicePricingKeys = {
  all: ['service-pricing'] as const,
  lists: () => [...servicePricingKeys.all, 'list'] as const,
  list: (params?: { status?: string; limit?: number }) => [...servicePricingKeys.lists(), params] as const,
  details: () => [...servicePricingKeys.all, 'detail'] as const,
  detail: (id: string) => [...servicePricingKeys.details(), id] as const,
};

// 获取所有服务定价
export function useServicePricings(params?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: servicePricingKeys.list(params),
    queryFn: () => servicePricingApi.getAll(params),
  });
}

// 获取单个服务定价
export function useServicePricing(id: string) {
  return useQuery({
    queryKey: servicePricingKeys.detail(id),
    queryFn: () => servicePricingApi.getById(id),
    enabled: !!id,
  });
}

// 创建服务定价
export function useCreateServicePricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServicePricingRequest) => servicePricingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicePricingKeys.lists() });
      toast.success('服务定价创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败');
    },
  });
}

// 更新服务定价
export function useUpdateServicePricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateServicePricingRequest> }) =>
      servicePricingApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: servicePricingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: servicePricingKeys.detail(id) });
      toast.success('服务定价更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 删除服务定价
export function useDeleteServicePricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => servicePricingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicePricingKeys.lists() });
      toast.success('服务定价删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });
}
