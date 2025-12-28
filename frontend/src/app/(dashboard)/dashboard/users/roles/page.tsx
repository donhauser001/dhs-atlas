'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2, Shield } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RoleModal } from '@/components/features/users/role-modal';
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '@/hooks/queries/use-roles';
import { Role, CreateRoleInput, UpdateRoleInput } from '@/api/roles';

export default function RolesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const handleCreate = () => {
    setEditingRole(null);
    setModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setModalOpen(true);
  };

  const handleSubmit = async (data: CreateRoleInput | UpdateRoleInput) => {
    if (editingRole) {
      await updateRole.mutateAsync({ id: editingRole._id, data });
    } else {
      await createRole.mutateAsync(data as CreateRoleInput);
    }
    setModalOpen(false);
    setEditingRole(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteRole.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: 'name',
      header: '角色名称',
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{role.name}</span>
            {role.isDefault && (
              <Badge variant="secondary" className="text-xs">
                默认
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: '描述',
      cell: ({ row }) => row.getValue('description') || '-',
    },
    {
      accessorKey: 'permissions',
      header: '权限数量',
      cell: ({ row }) => {
        const permissions = row.getValue('permissions') as string[];
        return (
          <Badge variant="outline">
            {permissions?.length || 0} 项权限
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return date ? new Date(date).toLocaleDateString('zh-CN') : '-';
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const role = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(role)}>
                <Pencil className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteId(role._id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="角色管理"
        description="管理系统角色和权限配置"
        action={{
          label: '新建角色',
          onClick: handleCreate,
        }}
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        searchKey="name"
        searchPlaceholder="搜索角色名称..."
      />

      {/* 角色编辑弹窗 */}
      <RoleModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingRole(null);
        }}
        role={editingRole}
        onSubmit={handleSubmit}
        isLoading={createRole.isPending || updateRole.isPending}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，删除角色后，拥有此角色的用户将失去相应权限。确定要删除吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

