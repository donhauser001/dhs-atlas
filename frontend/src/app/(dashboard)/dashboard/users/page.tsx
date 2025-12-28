'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Pencil, Trash2, Shield, Lock } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUsers, useDeleteUser, useCreateUser } from '@/hooks/queries/use-users';
import { User, UserRole } from '@/api/users';
import { toast } from 'sonner';

// 角色颜色映射
const roleVariantMap: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  '超级管理员': 'destructive',
  '项目经理': 'default',
  '设计师': 'secondary',
  '员工': 'outline',
  '客户': 'outline',
};

export default function UsersPage() {
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 新建用户状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    realName: '',
    email: '',
    phone: '',
    role: '员工' as UserRole,
    department: '',
  });

  const { data, isLoading } = useUsers({
    role: roleFilter !== 'all' ? roleFilter as UserRole : undefined,
  });
  const deleteUser = useDeleteUser();
  const createUser = useCreateUser();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteUser.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username.trim()) {
      toast.error('请输入用户名');
      return;
    }
    if (!newUser.password || newUser.password.length < 6) {
      toast.error('密码至少6个字符');
      return;
    }
    if (!newUser.realName.trim()) {
      toast.error('请输入姓名');
      return;
    }

    try {
      await createUser.mutateAsync({
        username: newUser.username,
        password: newUser.password,
        realName: newUser.realName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        department: newUser.department,
        status: 'active',
      });
      setCreateDialogOpen(false);
      setNewUser({
        username: '',
        password: '',
        realName: '',
        email: '',
        phone: '',
        role: '员工',
        department: '',
      });
    } catch {
      // 错误已在 hook 中处理
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'realName',
      header: '用户',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{user.realName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.realName}</div>
              <div className="text-xs text-muted-foreground">{user.username}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: '邮箱',
      cell: ({ row }) => row.getValue('email') || '-',
    },
    {
      accessorKey: 'phone',
      header: '电话',
    },
    {
      accessorKey: 'role',
      header: '角色',
      cell: ({ row }) => {
        const role = row.getValue('role') as UserRole;
        return <Badge variant={roleVariantMap[role]}>{role}</Badge>;
      },
    },
    {
      accessorKey: 'department',
      header: '部门',
      cell: ({ row }) => row.getValue('department') || '-',
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status === 'active' ? '正常' : '禁用'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/users/${user._id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                查看详情
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/users/${user._id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteId(user._id)}
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
        title="用户管理"
        description="管理系统用户和权限"
        action={{
          label: '新建用户',
          onClick: () => setCreateDialogOpen(true),
        }}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/users/roles')}
          >
            <Shield className="mr-2 h-4 w-4" />
            角色管理
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/users/permissions')}
          >
            <Lock className="mr-2 h-4 w-4" />
            权限设置
          </Button>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="筛选角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部角色</SelectItem>
              <SelectItem value="超级管理员">超级管理员</SelectItem>
              <SelectItem value="项目经理">项目经理</SelectItem>
              <SelectItem value="设计师">设计师</SelectItem>
              <SelectItem value="员工">员工</SelectItem>
              <SelectItem value="客户">客户</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data || []}
        searchKey="realName"
        searchPlaceholder="搜索用户姓名..."
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，确定要删除这个用户吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 新建用户对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建用户</DialogTitle>
            <DialogDescription>
              创建新的系统用户
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-username">用户名 *</Label>
                <Input
                  id="create-username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="请输入用户名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">密码 *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="至少6位"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-realName">姓名 *</Label>
                <Input
                  id="create-realName"
                  value={newUser.realName}
                  onChange={(e) => setNewUser({ ...newUser, realName: e.target.value })}
                  placeholder="请输入姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-role">角色</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value as UserRole })}
                >
                  <SelectTrigger id="create-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="超级管理员">超级管理员</SelectItem>
                    <SelectItem value="项目经理">项目经理</SelectItem>
                    <SelectItem value="设计师">设计师</SelectItem>
                    <SelectItem value="员工">员工</SelectItem>
                    <SelectItem value="客户">客户</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">邮箱</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="请输入邮箱"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">电话</Label>
                <Input
                  id="create-phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="请输入电话"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-department">部门</Label>
              <Input
                id="create-department"
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                placeholder="请输入部门"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewUser({
                  username: '',
                  password: '',
                  realName: '',
                  email: '',
                  phone: '',
                  role: '员工',
                  department: '',
                });
              }}
            >
              取消
            </Button>
            <Button onClick={handleCreateUser} disabled={createUser.isPending}>
              {createUser.isPending ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

