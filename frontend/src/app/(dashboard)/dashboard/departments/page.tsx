'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Building,
  CheckCircle,
  XCircle,
  Users,
  FolderTree,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Department,
  CreateDepartmentData,
  UpdateDepartmentData,
} from '@/api/departments';
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useToggleDepartmentStatus,
  useParentDepartmentOptions,
} from '@/hooks/queries/use-departments';
import { useActiveEnterprises } from '@/hooks/queries/use-enterprises';
import { format } from 'date-fns';

export default function DepartmentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [enterpriseFilter, setEnterpriseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState<CreateDepartmentData>({
    name: '',
    code: '',
    enterpriseId: '',
    parentId: undefined,
    description: '',
  });

  const { data, isLoading } = useDepartments({
    enterpriseId: enterpriseFilter === 'all' ? undefined : enterpriseFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const { data: enterprisesData } = useActiveEnterprises();
  const { data: parentOptions } = useParentDepartmentOptions(formData.enterpriseId);

  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();
  const toggleStatus = useToggleDepartmentStatus();

  const departments = data?.data || [];
  const enterprises = enterprisesData?.data || [];
  const parentDepts = parentOptions?.data || [];

  const handleCreate = () => {
    setEditingDepartment(null);
    setFormData({
      name: '',
      code: '',
      enterpriseId: '',
      parentId: undefined,
      description: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      enterpriseId: department.enterpriseId,
      parentId: department.parentId,
      description: department.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingDepartment) {
      updateDepartment.mutate(
        { id: editingDepartment._id, data: formData as UpdateDepartmentData },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      createDepartment.mutate(formData, {
        onSuccess: () => setModalOpen(false),
      });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteDepartment.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleStatus.mutate(id);
  };

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: 'name',
      header: '部门名称',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">{row.original.name}</span>
            <p className="text-xs text-muted-foreground">{row.original.code}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'enterpriseName',
      header: '所属企业',
      cell: ({ row }) =>
        row.original.enterpriseName ? (
          <Badge variant="outline">{row.original.enterpriseName}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'parentName',
      header: '上级部门',
      cell: ({ row }) =>
        row.original.parentName ? (
          <span className="text-sm">{row.original.parentName}</span>
        ) : (
          <Badge variant="secondary">顶级部门</Badge>
        ),
    },
    {
      accessorKey: 'managerName',
      header: '负责人',
      cell: ({ row }) =>
        row.original.managerName ? (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span>{row.original.managerName}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) =>
        row.original.status === 'active' ? (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            启用
          </Badge>
        ) : (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            禁用
          </Badge>
        ),
    },
    {
      accessorKey: 'updateTime',
      header: '更新时间',
      cell: ({ row }) =>
        row.original.updateTime
          ? format(new Date(row.original.updateTime), 'yyyy-MM-dd HH:mm')
          : '—',
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(row.original._id)}>
              {row.original.status === 'active' ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  禁用
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  启用
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteId(row.original._id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return <PageLoading />;
  }

  // 统计
  const totalDepartments = departments.length;
  const activeCount = departments.filter((d) => d.status === 'active').length;
  const topLevelCount = departments.filter((d) => !d.parentId).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="部门管理"
        description="管理企业的部门架构"
        action={{
          label: '新建部门',
          onClick: handleCreate,
        }}
      >
        <div className="flex items-center gap-2">
          <Select value={enterpriseFilter} onValueChange={setEnterpriseFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="企业筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部企业</SelectItem>
              {enterprises.map((e) => (
                <SelectItem key={e._id} value={e._id}>
                  {e.enterpriseName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="inactive">禁用</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">部门总数</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepartments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">启用中</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">顶级部门</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topLevelCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">关联企业</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enterprises.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* 部门列表 */}
      <DataTable
        columns={columns}
        data={departments}
        searchKey="name"
        searchPlaceholder="搜索部门名称..."
      />

      {/* 新建/编辑弹窗 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? '编辑部门' : '新建部门'}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? '修改部门信息'
                : '创建一个新的部门'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="enterpriseId">所属企业</Label>
              <Select
                value={formData.enterpriseId}
                onValueChange={(value) =>
                  setFormData({ ...formData, enterpriseId: value, parentId: undefined })
                }
                disabled={!!editingDepartment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择企业" />
                </SelectTrigger>
                <SelectContent>
                  {enterprises.map((e) => (
                    <SelectItem key={e._id} value={e._id}>
                      {e.enterpriseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">部门名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="输入部门名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">部门编码</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="输入部门编码"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentId">上级部门</Label>
              <Select
                value={formData.parentId || 'none'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    parentId: value === 'none' ? undefined : value,
                  })
                }
                disabled={!formData.enterpriseId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择上级部门（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无（顶级部门）</SelectItem>
                  {parentDepts
                    .filter((d) => d._id !== editingDepartment?._id)
                    .map((d) => (
                      <SelectItem key={d._id} value={d._id}>
                        {d.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="输入部门描述（可选）"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.name ||
                !formData.code ||
                !formData.enterpriseId ||
                createDepartment.isPending ||
                updateDepartment.isPending
              }
            >
              {createDepartment.isPending || updateDepartment.isPending
                ? '保存中...'
                : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除部门</AlertDialogTitle>
            <AlertDialogDescription>
              删除部门后，该部门下的子部门将变为顶级部门。确定要删除吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
