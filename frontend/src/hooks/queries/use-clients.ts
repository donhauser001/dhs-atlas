import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi, ClientQueryParams, CreateClientRequest, UpdateClientRequest } from '@/api/clients';
import { toast } from 'sonner';

// 查询 key
export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (params?: ClientQueryParams) => [...clientKeys.lists(), params] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
};

// 获取客户列表
export function useClients(params?: ClientQueryParams) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: () => clientApi.getList(params),
  });
}

// 获取单个客户
export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientApi.getById(id),
    enabled: !!id,
  });
}

// 创建客户
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientRequest) => clientApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast.success('客户创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败');
    },
  });
}

// 更新客户
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientRequest }) =>
      clientApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) });
      toast.success('客户更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 删除客户
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast.success('客户删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });
}

