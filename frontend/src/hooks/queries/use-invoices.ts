import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  InvoiceQuery,
  CreateInvoiceData,
  getInvoices,
  getInvoiceById,
  getInvoiceStats,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from '@/api/invoices';
import { toast } from 'sonner';

// 查询 key
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (params?: InvoiceQuery) => [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  stats: () => [...invoiceKeys.all, 'stats'] as const,
};

// 获取发票列表
export function useInvoices(params?: InvoiceQuery) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => getInvoices(params),
  });
}

// 获取单个发票
export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoiceById(id),
    enabled: !!id,
  });
}

// 获取发票统计
export function useInvoiceStats() {
  return useQuery({
    queryKey: invoiceKeys.stats(),
    queryFn: getInvoiceStats,
  });
}

// 创建发票
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceData) => createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
      toast.success('发票创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败');
    },
  });
}

// 更新发票
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateInvoiceData> }) =>
      updateInvoice(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
      toast.success('发票更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 删除发票
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
      toast.success('发票删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });
}
