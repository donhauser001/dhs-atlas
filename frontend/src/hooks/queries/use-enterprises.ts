import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Enterprise,
  EnterpriseQueryParams,
  CreateEnterpriseRequest,
  getEnterprises,
  getActiveEnterprises,
  createEnterprise,
  updateEnterprise,
  deleteEnterprise,
} from '@/api/enterprises';
import { toast } from 'sonner';

// 查询 key
export const enterpriseKeys = {
  all: ['enterprises'] as const,
  lists: () => [...enterpriseKeys.all, 'list'] as const,
  list: (params?: EnterpriseQueryParams) => [...enterpriseKeys.lists(), params] as const,
  active: () => [...enterpriseKeys.all, 'active'] as const,
  details: () => [...enterpriseKeys.all, 'detail'] as const,
  detail: (id: string) => [...enterpriseKeys.details(), id] as const,
};

// 获取企业列表
export function useEnterprises(params?: EnterpriseQueryParams) {
  return useQuery({
    queryKey: enterpriseKeys.list(params),
    queryFn: () => getEnterprises(params),
  });
}

// 获取活跃企业列表
export function useActiveEnterprises() {
  return useQuery({
    queryKey: enterpriseKeys.active(),
    queryFn: getActiveEnterprises,
  });
}

// 创建企业
export function useCreateEnterprise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEnterpriseRequest) => createEnterprise(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enterpriseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: enterpriseKeys.active() });
      toast.success('企业创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败');
    },
  });
}

// 更新企业
export function useUpdateEnterprise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEnterpriseRequest> }) =>
      updateEnterprise(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: enterpriseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: enterpriseKeys.active() });
      queryClient.invalidateQueries({ queryKey: enterpriseKeys.detail(id) });
      toast.success('企业更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 删除企业
export function useDeleteEnterprise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEnterprise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enterpriseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: enterpriseKeys.active() });
      toast.success('企业删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });
}

// 导出类型
export type { Enterprise, EnterpriseQueryParams };
