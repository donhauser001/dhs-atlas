'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
  Copy,
  Star,
  Archive,
  CheckCircle,
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
import { ContractTemplate } from '@/api/contractTemplates';
import {
  useContractTemplates,
  useDeleteContractTemplate,
  useCloneContractTemplate,
  useSetDefaultContractTemplate,
  useToggleContractTemplateStatus,
  useContractTemplateStats,
} from '@/hooks/queries/use-contract-templates';
import { format } from 'date-fns';

export default function ContractTemplatesPage() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useContractTemplates({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 100,
  });
  const { data: statsData } = useContractTemplateStats();

  const deleteTemplate = useDeleteContractTemplate();
  const cloneTemplate = useCloneContractTemplate();
  const setDefault = useSetDefaultContractTemplate();
  const toggleStatus = useToggleContractTemplateStatus();

  // 安全获取数据，兼容不同的响应格式
  const templates = data?.data || (Array.isArray(data) ? data : []);
  const stats = statsData?.data || null;

  const handleDelete = () => {
    if (deleteId) {
      deleteTemplate.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const handleClone = (id: string, name: string) => {
    cloneTemplate.mutate({ id, name: `${name} - 副本` });
  };

  const handleSetDefault = (id: string) => {
    setDefault.mutate(id);
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    toggleStatus.mutate({ id, status: newStatus as 'active' | 'archived' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">启用</Badge>;
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>;
      case 'archived':
        return <Badge variant="outline">已归档</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<ContractTemplate>[] = [
    {
      accessorKey: 'name',
      header: '模板名称',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">{row.original.name}</span>
            {row.original.isDefault && (
              <Badge variant="outline" className="ml-2 text-xs">
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                默认
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: '分类',
      cell: ({ row }) => {
        const category = row.original.category;
        if (typeof category === 'object' && category !== null) {
          return (
            <Badge
              variant="outline"
              style={{ borderColor: category.color, color: category.color }}
            >
              {category.name}
            </Badge>
          );
        }
        return <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'version',
      header: '版本',
      cell: ({ row }) => <span>v{row.original.version}</span>,
    },
    {
      accessorKey: 'placeholders',
      header: '占位符数',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.placeholders?.length || 0}
        </span>
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
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/contracts/templates/${row.original._id}`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleClone(row.original._id, row.original.name)}
            >
              <Copy className="mr-2 h-4 w-4" />
              复制
            </DropdownMenuItem>
            {!row.original.isDefault && (
              <DropdownMenuItem onClick={() => handleSetDefault(row.original._id)}>
                <Star className="mr-2 h-4 w-4" />
                设为默认
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => handleToggleStatus(row.original._id, row.original.status)}
            >
              {row.original.status === 'active' ? (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  归档
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="合同模板"
        description="管理合同模板，支持占位符配置"
        action={{
          label: '新建模板',
          onClick: () => router.push('/dashboard/contracts/templates/create'),
        }}
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">启用</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="archived">已归档</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">模板总数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">启用中</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">草稿</CardTitle>
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.draft}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已归档</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.archived}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 模板列表 */}
      <DataTable
        columns={columns}
        data={templates}
        searchKey="name"
        searchPlaceholder="搜索模板名称..."
      />

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除模板</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，且使用该模板生成的合同不受影响。确定要删除吗？
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
