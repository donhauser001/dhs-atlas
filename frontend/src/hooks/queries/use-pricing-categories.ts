import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateCategoryData,
  UpdateCategoryData,
  getAllPricingCategories,
  getPricingCategoryById,
  createPricingCategory,
  updatePricingCategory,
  togglePricingCategoryStatus,
  deletePricingCategory,
} from '@/api/pricingCategories';
import { toast } from 'sonner';

// 查询 key
export const pricingCategoryKeys = {
  all: ['pricing-categories'] as const,
  lists: () => [...pricingCategoryKeys.all, 'list'] as const,
  details: () => [...pricingCategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...pricingCategoryKeys.details(), id] as const,
};

// 获取所有定价分类
export function usePricingCategories() {
  return useQuery({
    queryKey: pricingCategoryKeys.lists(),
    queryFn: getAllPricingCategories,
  });
}

// 获取单个定价分类
export function usePricingCategory(id: string) {
  return useQuery({
    queryKey: pricingCategoryKeys.detail(id),
    queryFn: () => getPricingCategoryById(id),
    enabled: !!id,
  });
}

// 创建定价分类
export function useCreatePricingCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryData) => createPricingCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingCategoryKeys.lists() });
      toast.success('分类创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败');
    },
  });
}

// 更新定价分类
export function useUpdatePricingCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) =>
      updatePricingCategory(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: pricingCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pricingCategoryKeys.detail(id) });
      toast.success('分类更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 切换定价分类状态
export function useTogglePricingCategoryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => togglePricingCategoryStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingCategoryKeys.lists() });
      toast.success('状态更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 删除定价分类
export function useDeletePricingCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePricingCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingCategoryKeys.lists() });
      toast.success('分类删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });
}
