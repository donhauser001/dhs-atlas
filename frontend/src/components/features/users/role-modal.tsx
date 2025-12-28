'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Role, CreateRoleInput, UpdateRoleInput } from '@/api/roles';
import { usePermissionTree } from '@/hooks/queries/use-permissions';

// 表单验证 Schema
const roleFormSchema = z.object({
  name: z.string().min(1, '请输入角色名称').max(50, '角色名称不能超过50个字符'),
  description: z.string().max(200, '描述不能超过200个字符').optional(),
  permissions: z.array(z.string()),
  isDefault: z.boolean().optional(),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

interface RoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
  onSubmit: (data: CreateRoleInput | UpdateRoleInput) => void;
  isLoading?: boolean;
}

export function RoleModal({
  open,
  onOpenChange,
  role,
  onSubmit,
  isLoading,
}: RoleModalProps) {
  const { data: permissionTreeData } = usePermissionTree();
  // 确保 permissionTree 是数组
  const permissionTree = Array.isArray(permissionTreeData) ? permissionTreeData : [];
  const isEdit = !!role;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
      isDefault: false,
    },
  });

  // 编辑时填充表单
  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || [],
        isDefault: role.isDefault || false,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        permissions: [],
        isDefault: false,
      });
    }
  }, [role, form]);

  const handleSubmit = (data: RoleFormValues) => {
    onSubmit(data);
  };

  // 处理权限全选/取消
  const handleModuleToggle = (
    modulePermissions: { code: string }[],
    checked: boolean
  ) => {
    const currentPermissions = form.getValues('permissions');
    const moduleCodes = modulePermissions.map((p) => p.code);

    if (checked) {
      // 添加该模块的所有权限
      const newPermissions = [...new Set([...currentPermissions, ...moduleCodes])];
      form.setValue('permissions', newPermissions);
    } else {
      // 移除该模块的所有权限
      const newPermissions = currentPermissions.filter(
        (p) => !moduleCodes.includes(p)
      );
      form.setValue('permissions', newPermissions);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑角色' : '新建角色'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改角色信息和权限配置' : '创建新的角色并配置权限'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色名称</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入角色名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入角色描述（可选）"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>设为默认角色</FormLabel>
                    <FormDescription>
                      新用户注册时将自动分配此角色
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permissions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>权限配置</FormLabel>
                  <ScrollArea className="h-[300px] rounded-md border p-4">
                    <div className="space-y-4">
                      {permissionTree?.map((module) => {
                        const modulePermissions = module.permissions;
                        const selectedCount = modulePermissions.filter((p) =>
                          field.value.includes(p.code)
                        ).length;
                        const isAllSelected =
                          selectedCount === modulePermissions.length;
                        const isPartialSelected =
                          selectedCount > 0 && !isAllSelected;

                        return (
                          <div key={module.module} className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={isAllSelected}
                                ref={
                                  isPartialSelected
                                    ? (el) => {
                                      if (el) el.dataset.state = 'indeterminate';
                                    }
                                    : undefined
                                }
                                onCheckedChange={(checked) =>
                                  handleModuleToggle(
                                    modulePermissions,
                                    checked as boolean
                                  )
                                }
                              />
                              <span className="font-medium">
                                {module.moduleName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({selectedCount}/{modulePermissions.length})
                              </span>
                            </div>
                            <div className="ml-6 grid grid-cols-2 gap-2">
                              {modulePermissions.map((permission) => (
                                <div
                                  key={permission.code}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    checked={field.value.includes(permission.code)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([
                                          ...field.value,
                                          permission.code,
                                        ]);
                                      } else {
                                        field.onChange(
                                          field.value.filter(
                                            (p) => p !== permission.code
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  <span className="text-sm">
                                    {permission.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {!permissionTree?.length && (
                        <div className="text-center text-muted-foreground py-4">
                          暂无可配置的权限
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default RoleModal;

