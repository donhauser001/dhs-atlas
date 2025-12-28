import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateConfigData,
  UpdateConfigData,
  getAllAdditionalConfigs,
  getAdditionalConfigById,
  createAdditionalConfig,
  updateAdditionalConfig,
  toggleAdditionalConfigStatus,
  deleteAdditionalConfig,
  copyAdditionalConfig,
} from '@/api/additionalConfig';
import { toast } from 'sonner';

// 查询 key
export const additionalConfigKeys = {
  all: ['additional-configs'] as const,
  lists: () => [...additionalConfigKeys.all, 'list'] as const,
  details: () => [...additionalConfigKeys.all, 'detail'] as const,
  detail: (id: string) => [...additionalConfigKeys.details(), id] as const,
};

// 获取所有附加配置
export function useAdditionalConfigs() {
  return useQuery({
    queryKey: additionalConfigKeys.lists(),
    queryFn: getAllAdditionalConfigs,
  });
}

// 获取单个附加配置
export function useAdditionalConfig(id: string) {
  return useQuery({
    queryKey: additionalConfigKeys.detail(id),
    queryFn: () => getAdditionalConfigById(id),
    enabled: !!id,
  });
}

// 创建附加配置
export function useCreateAdditionalConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConfigData) => createAdditionalConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: additionalConfigKeys.lists() });
      toast.success('配置创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败');
    },
  });
}

// 更新附加配置
export function useUpdateAdditionalConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConfigData }) =>
      updateAdditionalConfig(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: additionalConfigKeys.lists() });
      queryClient.invalidateQueries({ queryKey: additionalConfigKeys.detail(id) });
      toast.success('配置更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 切换配置状态
export function useToggleAdditionalConfigStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleAdditionalConfigStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: additionalConfigKeys.lists() });
      toast.success('状态更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 删除附加配置
export function useDeleteAdditionalConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdditionalConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: additionalConfigKeys.lists() });
      toast.success('配置删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });
}

// 复制附加配置
export function useCopyAdditionalConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => copyAdditionalConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: additionalConfigKeys.lists() });
      toast.success('配置复制成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '复制失败');
    },
  });
}
