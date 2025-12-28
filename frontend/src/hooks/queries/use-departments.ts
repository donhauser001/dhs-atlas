import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Department,
  DepartmentQueryParams,
  CreateDepartmentData,
  UpdateDepartmentData,
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
  getParentDepartmentOptions,
} from '@/api/departments';
import { toast } from 'sonner';

// 查询 key
export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: (params?: DepartmentQueryParams) => [...departmentKeys.lists(), params] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
  parentOptions: (enterpriseId: string) =>
    [...departmentKeys.all, 'parent-options', enterpriseId] as const,
};

// 获取部门列表
export function useDepartments(params?: DepartmentQueryParams) {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: () => getDepartments(params),
  });
}

// 获取单个部门
export function useDepartment(id: string) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => getDepartmentById(id),
    enabled: !!id,
  });
}

// 获取上级部门选项
export function useParentDepartmentOptions(enterpriseId: string) {
  return useQuery({
    queryKey: departmentKeys.parentOptions(enterpriseId),
    queryFn: () => getParentDepartmentOptions(enterpriseId),
    enabled: !!enterpriseId,
  });
}

// 创建部门
export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDepartmentData) => createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      toast.success('部门创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败');
    },
  });
}

// 更新部门
export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentData }) =>
      updateDepartment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(id) });
      toast.success('部门更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 切换部门状态
export function useToggleDepartmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleDepartmentStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      toast.success('状态更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败');
    },
  });
}

// 删除部门
export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      toast.success('部门删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });
}

// 导出类型
export type { Department, DepartmentQueryParams, CreateDepartmentData, UpdateDepartmentData };
