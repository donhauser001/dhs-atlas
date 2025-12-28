import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateArticleRequest,
  UpdateArticleRequest,
  ArticleQuery,
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  toggleArticleStatus,
  toggleTopStatus,
  toggleRecommendStatus,
} from '@/api/articles';
import { toast } from 'sonner';

// 查询 key
export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  list: (params?: ArticleQuery) => [...articleKeys.lists(), params] as const,
  details: () => [...articleKeys.all, 'detail'] as const,
  detail: (id: string) => [...articleKeys.details(), id] as const,
};

// 获取文章列表
export function useArticles(params?: ArticleQuery) {
  return useQuery({
    queryKey: articleKeys.list(params),
    queryFn: () => getArticles(params),
  });
}

// 获取单个文章
export function useArticle(id: string) {
  return useQuery({
    queryKey: articleKeys.detail(id),
    queryFn: () => getArticleById(id),
    enabled: !!id,
  });
}

// 创建文章
export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateArticleRequest) => createArticle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      toast.success('文章创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败');
    },
  });
}

// 更新文章
export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArticleRequest }) =>
      updateArticle(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(id) });
      toast.success('文章更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 切换发布状态
export function useToggleArticleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleArticleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      toast.success('状态更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 切换置顶状态
export function useToggleTopStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleTopStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      toast.success('置顶状态更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 切换推荐状态
export function useToggleRecommendStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleRecommendStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      toast.success('推荐状态更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 删除文章
export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      toast.success('文章删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });
}
