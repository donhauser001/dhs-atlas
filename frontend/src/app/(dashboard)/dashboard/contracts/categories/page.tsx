'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderOpen,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import { format } from 'date-fns';

// 模板分类类型
interface TemplateCategory {
  _id: string;
  name: string;
  description: string;
  templateCount: number;
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: string;
}

// 模拟数据
const mockCategories: TemplateCategory[] = [
  {
    _id: '1',
    name: '设计服务合同',
    description: '适用于各类设计服务的合同模板',
    templateCount: 5,
    status: 'active',
    sortOrder: 1,
    createdAt: '2024-01-15',
  },
  {
    _id: '2',
    name: '咨询服务合同',
    description: '适用于咨询顾问类服务的合同模板',
    templateCount: 3,
    status: 'active',
    sortOrder: 2,
    createdAt: '2024-01-20',
  },
  {
    _id: '3',
    name: '技术开发合同',
    description: '适用于技术开发项目的合同模板',
    templateCount: 2,
    status: 'inactive',
    sortOrder: 3,
    createdAt: '2024-02-01',
  },
];

export default function ContractCategoriesPage() {
  const [loading] = useState(false);
  const [categories] = useState<TemplateCategory[]>(mockCategories);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    sortOrder: 0,
  });

  const handleCreate = () => {
    if (!newCategory.name) {
      toast.error('请填写类型名称');
      return;
    }
    toast.success('范本类型创建成功');
    setCreateDialogOpen(false);
    setNewCategory({ name: '', description: '', sortOrder: 0 });
  };

  const handleDelete = () => {
    if (deleteId) {
      toast.success('范本类型已删除');
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<TemplateCategory>[] = [
    {
      accessorKey: 'sortOrder',
      header: '排序',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.sortOrder}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: '分类名称',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: '描述',
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1">
          {row.original.description || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'templateCount',
      header: '范本数量',
      cell: ({ row }) => (
        <Badge variant="secondary">
          <FileText className="h-3 w-3 mr-1" />
          {row.original.templateCount} 个
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) =>
        row.original.status === 'active' ? (
          <Badge className="bg-green-500/10 text-green-600">
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
      accessorKey: 'createdAt',
      header: '创建时间',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'yyyy-MM-dd'),
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
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem>
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

  // 筛选
  const filteredCategories = statusFilter === 'all'
    ? categories
    : categories.filter((c) => c.status === statusFilter);

  // 统计
  const activeCount = categories.filter((c) => c.status === 'active').length;
  const totalTemplates = categories.reduce((sum, c) => sum + c.templateCount, 0);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="范本类型"
        description="管理合同范本的类型分类"
        action={{
          label: '新建类型',
          onClick: () => setCreateDialogOpen(true),
        }}
      >
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
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">类型总数</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
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
            <CardTitle className="text-sm font-medium">范本总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTemplates}</div>
          </CardContent>
        </Card>
      </div>

      {/* 类型列表 */}
      <DataTable
        columns={columns}
        data={filteredCategories}
        searchKey="name"
        searchPlaceholder="搜索类型名称..."
      />

      {/* 新建对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建范本类型</DialogTitle>
            <DialogDescription>创建新的合同范本类型</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">类型名称 *</Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="请输入类型名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="请输入类型描述"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">排序</Label>
              <Input
                id="sortOrder"
                type="number"
                value={newCategory.sortOrder}
                onChange={(e) => setNewCategory({ ...newCategory, sortOrder: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个类型吗？该类型下的范本将变为未分类状态。
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
