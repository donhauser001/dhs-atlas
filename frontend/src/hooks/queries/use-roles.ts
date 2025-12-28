import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, RoleListParams, CreateRoleInput, UpdateRoleInput } from '@/api/roles';
import { toast } from 'sonner';

/**
 * 角色列表查询 Hook（分页）
 */
export function useRoles(params?: RoleListParams) {
  return useQuery({
    queryKey: ['roles', 'list', params],
    queryFn: () => rolesApi.getRoles(params),
  });
}

/**
 * 获取所有角色（不分页）
 */
export function useAllRoles() {
  return useQuery({
    queryKey: ['roles', 'all'],
    queryFn: () => rolesApi.getAllRoles(),
  });
}

/**
 * 角色详情查询 Hook
 */
export function useRole(id: string) {
  return useQuery({
    queryKey: ['roles', 'detail', id],
    queryFn: () => rolesApi.getRoleById(id),
    enabled: !!id,
  });
}

/**
 * 创建角色 Hook
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleInput) => rolesApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('角色创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '角色创建失败');
    },
  });
}

/**
 * 更新角色 Hook
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleInput }) =>
      rolesApi.updateRole(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', 'detail', variables.id] });
      toast.success('角色更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '角色更新失败');
    },
  });
}

/**
 * 删除角色 Hook
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rolesApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('角色删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '角色删除失败');
    },
  });
}

