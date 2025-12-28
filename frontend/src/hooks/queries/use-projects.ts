import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, ProjectQueryParams, CreateProjectRequest, UpdateProjectRequest, ProgressStatus, SettlementStatus } from '@/api/projects';
import { toast } from 'sonner';

// 查询 key
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params?: ProjectQueryParams) => [...projectKeys.lists(), params] as const,
  stats: () => [...projectKeys.all, 'stats'] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  logs: (id: string) => [...projectKeys.all, 'logs', id] as const,
};

// 获取项目列表
export function useProjects(params?: ProjectQueryParams) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => projectApi.getList(params),
  });
}

// 获取项目统计
export function useProjectStats() {
  return useQuery({
    queryKey: projectKeys.stats(),
    queryFn: () => projectApi.getStats(),
  });
}

// 获取单个项目
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectApi.getById(id),
    enabled: !!id,
  });
}

// 获取项目日志
export function useProjectLogs(id: string) {
  return useQuery({
    queryKey: projectKeys.logs(id),
    queryFn: () => projectApi.getLogs(id),
    enabled: !!id,
  });
}

// 创建项目
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() });
      toast.success('项目创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败');
    },
  });
}

// 更新项目
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      projectApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      toast.success('项目更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 更新项目状态
export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProgressStatus }) =>
      projectApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() });
      toast.success('状态更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '状态更新失败');
    },
  });
}

// 更新结算状态
export function useUpdateSettlementStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SettlementStatus }) =>
      projectApi.updateSettlement(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      toast.success('结算状态更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '结算状态更新失败');
    },
  });
}

// 删除项目
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() });
      toast.success('项目删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });
}

