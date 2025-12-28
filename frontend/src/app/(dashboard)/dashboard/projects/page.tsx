'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
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
import { useProjects, useDeleteProject } from '@/hooks/queries/use-projects';
import { Project, ProgressStatus, SettlementStatus } from '@/api/projects';
import { format } from 'date-fns';

// 状态映射
const progressStatusMap: Record<ProgressStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  consulting: { label: '咨询中', variant: 'secondary' },
  'in-progress': { label: '进行中', variant: 'default' },
  'partial-delivery': { label: '部分交付', variant: 'outline' },
  completed: { label: '已完成', variant: 'default' },
  'on-hold': { label: '已暂停', variant: 'destructive' },
  cancelled: { label: '已取消', variant: 'destructive' },
};

const settlementStatusMap: Record<SettlementStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  unpaid: { label: '未付款', variant: 'destructive' },
  prepaid: { label: '已预付', variant: 'secondary' },
  'partial-paid': { label: '部分付款', variant: 'outline' },
  'fully-paid': { label: '已结清', variant: 'default' },
};

export default function ProjectsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useProjects({
    progressStatus: statusFilter !== 'all' ? statusFilter as ProgressStatus : undefined,
  });
  const deleteProject = useDeleteProject();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProject.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: 'projectName',
      header: '项目名称',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('projectName')}</div>
      ),
    },
    {
      accessorKey: 'clientName',
      header: '客户',
    },
    {
      accessorKey: 'progressStatus',
      header: '项目状态',
      cell: ({ row }) => {
        const status = row.getValue('progressStatus') as ProgressStatus;
        const config = progressStatusMap[status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'settlementStatus',
      header: '结算状态',
      cell: ({ row }) => {
        const status = row.getValue('settlementStatus') as SettlementStatus;
        const config = settlementStatusMap[status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return format(new Date(date), 'yyyy-MM-dd');
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const project = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/projects/${project._id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                查看详情
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/projects/${project._id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteId(project._id)}
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
        title="项目管理"
        description="管理和跟踪所有项目"
        action={{
          label: '新建项目',
          onClick: () => router.push('/dashboard/projects/create'),
        }}
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="consulting">咨询中</SelectItem>
            <SelectItem value="in-progress">进行中</SelectItem>
            <SelectItem value="partial-delivery">部分交付</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="on-hold">已暂停</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data?.data || []}
        searchKey="projectName"
        searchPlaceholder="搜索项目名称..."
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，确定要删除这个项目吗？
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

