import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IncomeQuery,
  CreateIncomeData,
  UpdateIncomeData,
  getIncomes,
  getIncomeById,
  getIncomeStats,
  createIncome,
  updateIncome,
  updateIncomeRemark,
  deleteIncome,
} from '@/api/incomes';
import { toast } from 'sonner';

// 查询 key
export const incomeKeys = {
  all: ['incomes'] as const,
  lists: () => [...incomeKeys.all, 'list'] as const,
  list: (params?: IncomeQuery) => [...incomeKeys.lists(), params] as const,
  details: () => [...incomeKeys.all, 'detail'] as const,
  detail: (id: string) => [...incomeKeys.details(), id] as const,
  stats: (startDate?: string, endDate?: string) => [...incomeKeys.all, 'stats', startDate, endDate] as const,
};

// 获取回款列表
export function useIncomes(params?: IncomeQuery) {
  return useQuery({
    queryKey: incomeKeys.list(params),
    queryFn: () => getIncomes(params),
  });
}

// 获取单个回款
export function useIncome(id: string) {
  return useQuery({
    queryKey: incomeKeys.detail(id),
    queryFn: () => getIncomeById(id),
    enabled: !!id,
  });
}

// 获取回款统计
export function useIncomeStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: incomeKeys.stats(startDate, endDate),
    queryFn: () => getIncomeStats(startDate, endDate),
  });
}

// 创建回款
export function useCreateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIncomeData) => createIncome(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incomeKeys.all });
      toast.success('回款记录创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败');
    },
  });
}

// 更新回款
export function useUpdateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncomeData }) =>
      updateIncome(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incomeKeys.detail(id) });
      toast.success('回款记录更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 更新回款备注
export function useUpdateIncomeRemark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, remark }: { id: string; remark: string }) =>
      updateIncomeRemark(id, remark),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.detail(id) });
      toast.success('备注更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 删除回款
export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteIncome(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() });
      toast.success('回款记录删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });
}
