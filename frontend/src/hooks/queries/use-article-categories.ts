import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryQuery,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} from '@/api/articleCategories';
import { toast } from 'sonner';

// 查询 key
export const articleCategoryKeys = {
  all: ['article-categories'] as const,
  lists: () => [...articleCategoryKeys.all, 'list'] as const,
  list: (params?: CategoryQuery) => [...articleCategoryKeys.lists(), params] as const,
  details: () => [...articleCategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...articleCategoryKeys.details(), id] as const,
};

// 获取分类列表
export function useArticleCategories(params?: CategoryQuery) {
  return useQuery({
    queryKey: articleCategoryKeys.list(params),
    queryFn: () => getCategories(params),
  });
}

// 获取单个分类
export function useArticleCategory(id: string) {
  return useQuery({
    queryKey: articleCategoryKeys.detail(id),
    queryFn: () => getCategoryById(id),
    enabled: !!id,
  });
}

// 创建分类
export function useCreateArticleCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleCategoryKeys.lists() });
      toast.success('分类创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败');
    },
  });
}

// 更新分类
export function useUpdateArticleCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      updateCategory(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: articleCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleCategoryKeys.detail(id) });
      toast.success('分类更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 切换分类状态
export function useToggleArticleCategoryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleCategoryStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleCategoryKeys.lists() });
      toast.success('状态更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 删除分类
export function useDeleteArticleCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleCategoryKeys.lists() });
      toast.success('分类删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });
}
