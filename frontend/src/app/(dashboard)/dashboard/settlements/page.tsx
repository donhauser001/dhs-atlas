'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  Trash2,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
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
import { Settlement, deleteSettlement } from '@/api/settlements';
import { useSettlements, useUpdateSettlement } from '@/hooks/queries/use-settlements';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settlementKeys } from '@/hooks/queries/use-settlements';

export default function SettlementsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useSettlements({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 100,
  });

  const updateSettlement = useUpdateSettlement();

  const deleteSettlementMutation = useMutation({
    mutationFn: (id: string) => deleteSettlement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settlementKeys.lists() });
      toast.success('结算单删除成功');
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败');
    },
  });

  const settlements = data?.success ? data.data : [];

  const handleDelete = () => {
    if (deleteId) {
      deleteSettlementMutation.mutate(deleteId);
    }
  };

  const handleStatusChange = (id: string, status: 'pending' | 'partial' | 'completed') => {
    updateSettlement.mutate({
      id,
      data: { status },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            待结算
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            部分结算
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            已结算
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<Settlement>[] = [
    {
      accessorKey: 'settlementNo',
      header: '结算单号',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.settlementNo}</span>
      ),
    },
    {
      accessorKey: 'projectName',
      header: '项目名称',
    },
    {
      accessorKey: 'clientName',
      header: '客户',
    },
    {
      accessorKey: 'totalAmount',
      header: '金额',
      cell: ({ row }) => (
        <span className="font-medium">
          ¥{row.original.totalAmount.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      cell: ({ row }) =>
        format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm'),
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
              onClick={() => router.push(`/dashboard/settlements/${row.original._id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.status === 'pending' && (
              <DropdownMenuItem
                onClick={() => handleStatusChange(row.original._id, 'partial')}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                标记部分结算
              </DropdownMenuItem>
            )}
            {row.original.status !== 'completed' && (
              <DropdownMenuItem
                onClick={() => handleStatusChange(row.original._id, 'completed')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                标记已结算
              </DropdownMenuItem>
            )}
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

  // 统计数据
  const stats = {
    total: settlements.length,
    totalAmount: settlements.reduce((sum, s) => sum + s.totalAmount, 0),
    pending: settlements.filter((s) => s.status === 'pending').length,
    completed: settlements.filter((s) => s.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="结算单管理"
        description="管理项目结算单和付款记录"
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待结算</SelectItem>
            <SelectItem value="partial">部分结算</SelectItem>
            <SelectItem value="completed">已结算</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">结算单总数</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总金额</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{stats.totalAmount.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待结算</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已结算</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* 结算单列表 */}
      <DataTable
        columns={columns}
        data={settlements}
        searchKey="settlementNo"
        searchPlaceholder="搜索结算单号..."
      />

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除结算单</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，关联的发票和回款记录不会被删除。确定要删除吗？
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
