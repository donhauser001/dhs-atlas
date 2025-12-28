import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationApi, CreateQuotationData, UpdateQuotationData } from '@/api/quotations';
import { toast } from 'sonner';

// 查询 key
export const quotationKeys = {
  all: ['quotations'] as const,
  lists: () => [...quotationKeys.all, 'list'] as const,
  list: (params?: { limit?: number; status?: string }) => [...quotationKeys.lists(), params] as const,
  details: () => [...quotationKeys.all, 'detail'] as const,
  detail: (id: string) => [...quotationKeys.details(), id] as const,
  byClient: (clientId: string) => [...quotationKeys.all, 'client', clientId] as const,
};

// 获取所有报价单
export function useQuotations(params?: { limit?: number; status?: string }) {
  return useQuery({
    queryKey: quotationKeys.list(params),
    queryFn: () => quotationApi.getAll(params),
  });
}

// 获取单个报价单
export function useQuotation(id: string) {
  return useQuery({
    queryKey: quotationKeys.detail(id),
    queryFn: () => quotationApi.getById(id),
    enabled: !!id,
  });
}

// 根据客户ID获取报价单
export function useQuotationsByClient(clientId: string) {
  return useQuery({
    queryKey: quotationKeys.byClient(clientId),
    queryFn: () => quotationApi.getByClientId(clientId),
    enabled: !!clientId,
  });
}

// 创建报价单
export function useCreateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuotationData) => quotationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      toast.success('报价单创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败');
    },
  });
}

// 更新报价单
export function useUpdateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuotationData }) =>
      quotationApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
      toast.success('报价单更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 删除报价单
export function useDeleteQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => quotationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      toast.success('报价单删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });
}

