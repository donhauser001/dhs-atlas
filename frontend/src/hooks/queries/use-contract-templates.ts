import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ContractTemplateQuery,
  CreateContractTemplateData,
  UpdateContractTemplateData,
  getContractTemplates,
  getContractTemplateById,
  createContractTemplate,
  updateContractTemplate,
  deleteContractTemplate,
  cloneContractTemplate,
  setDefaultContractTemplate,
  getContractTemplateStats,
  toggleContractTemplateStatus,
} from '@/api/contractTemplates';
import { toast } from 'sonner';

// 查询 key
export const contractTemplateKeys = {
  all: ['contract-templates'] as const,
  lists: () => [...contractTemplateKeys.all, 'list'] as const,
  list: (params?: ContractTemplateQuery) => [...contractTemplateKeys.lists(), params] as const,
  details: () => [...contractTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...contractTemplateKeys.details(), id] as const,
  stats: () => [...contractTemplateKeys.all, 'stats'] as const,
};

// 获取模板列表
export function useContractTemplates(params?: ContractTemplateQuery) {
  return useQuery({
    queryKey: contractTemplateKeys.list(params),
    queryFn: () => getContractTemplates(params),
  });
}

// 获取单个模板
export function useContractTemplate(id: string) {
  return useQuery({
    queryKey: contractTemplateKeys.detail(id),
    queryFn: () => getContractTemplateById(id),
    enabled: !!id,
  });
}

// 获取模板统计
export function useContractTemplateStats() {
  return useQuery({
    queryKey: contractTemplateKeys.stats(),
    queryFn: getContractTemplateStats,
  });
}

// 创建模板
export function useCreateContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContractTemplateData) => createContractTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractTemplateKeys.stats() });
      toast.success('模板创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败');
    },
  });
}

// 更新模板
export function useUpdateContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContractTemplateData }) =>
      updateContractTemplate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: contractTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractTemplateKeys.detail(id) });
      toast.success('模板更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 删除模板
export function useDeleteContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContractTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractTemplateKeys.stats() });
      toast.success('模板删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });
}

// 复制模板
export function useCloneContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) =>
      cloneContractTemplate(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractTemplateKeys.stats() });
      toast.success('模板复制成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '复制失败');
    },
  });
}

// 设置默认模板
export function useSetDefaultContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => setDefaultContractTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractTemplateKeys.lists() });
      toast.success('默认模板设置成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '设置失败');
    },
  });
}

// 切换模板状态
export function useToggleContractTemplateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'archived' }) =>
      toggleContractTemplateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: contractTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractTemplateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: contractTemplateKeys.stats() });
      toast.success('状态更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}
