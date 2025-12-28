import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  permissionsApi,
  CreatePermissionGroupInput,
  UpdatePermissionGroupInput,
} from '@/api/permissions';
import { toast } from 'sonner';

/**
 * 权限树查询 Hook
 */
export function usePermissionTree() {
  return useQuery({
    queryKey: ['permissions', 'tree'],
    queryFn: () => permissionsApi.getPermissionTree(),
  });
}

/**
 * 所有权限查询 Hook
 */
export function useAllPermissions() {
  return useQuery({
    queryKey: ['permissions', 'all'],
    queryFn: () => permissionsApi.getAllPermissions(),
  });
}

/**
 * 权限组列表查询 Hook
 */
export function usePermissionGroups() {
  return useQuery({
    queryKey: ['permissions', 'groups'],
    queryFn: () => permissionsApi.getPermissionGroups(),
  });
}

/**
 * 权限组详情查询 Hook
 */
export function usePermissionGroup(id: string) {
  return useQuery({
    queryKey: ['permissions', 'groups', id],
    queryFn: () => permissionsApi.getPermissionGroupById(id),
    enabled: !!id,
  });
}

/**
 * 创建权限组 Hook
 */
export function useCreatePermissionGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePermissionGroupInput) =>
      permissionsApi.createPermissionGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'groups'] });
      toast.success('权限组创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '权限组创建失败');
    },
  });
}

/**
 * 更新权限组 Hook
 */
export function useUpdatePermissionGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePermissionGroupInput }) =>
      permissionsApi.updatePermissionGroup(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'groups'] });
      queryClient.invalidateQueries({
        queryKey: ['permissions', 'groups', variables.id],
      });
      toast.success('权限组更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '权限组更新失败');
    },
  });
}

/**
 * 删除权限组 Hook
 */
export function useDeletePermissionGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => permissionsApi.deletePermissionGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'groups'] });
      toast.success('权限组删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '权限组删除失败');
    },
  });
}

/**
 * 验证权限 Hook
 */
export function useValidatePermissions() {
  return useMutation({
    mutationFn: (permissions: string[]) =>
      permissionsApi.validatePermissions({ permissions }),
  });
}

