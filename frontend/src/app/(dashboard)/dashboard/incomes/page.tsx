'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  Trash2,
  Wallet,
  Building2,
  CreditCard,
  Banknote,
  Smartphone,
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
import { Income } from '@/api/incomes';
import { useIncomes, useDeleteIncome, useIncomeStats } from '@/hooks/queries/use-incomes';
import { format } from 'date-fns';

export default function IncomesPage() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const { data, isLoading } = useIncomes({
    paymentChannel: channelFilter === 'all' ? undefined : channelFilter,
    limit: 100,
  });
  const { data: statsData } = useIncomeStats();

  const deleteIncome = useDeleteIncome();

  const incomes = data?.success ? data.data : [];
  const stats = statsData?.success ? statsData.data : null;

  const handleDelete = () => {
    if (deleteId) {
      deleteIncome.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'company':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
            <Building2 className="h-3 w-3 mr-1" />
            对公
          </Badge>
        );
      case 'check':
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600">
            <CreditCard className="h-3 w-3 mr-1" />
            支票
          </Badge>
        );
      case 'wechat':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600">
            <Smartphone className="h-3 w-3 mr-1" />
            微信
          </Badge>
        );
      case 'alipay':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
            <Smartphone className="h-3 w-3 mr-1" />
            支付宝
          </Badge>
        );
      case 'cash':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
            <Banknote className="h-3 w-3 mr-1" />
            现金
          </Badge>
        );
      default:
        return <Badge variant="outline">{channel}</Badge>;
    }
  };

  const getPaymentTypeBadge = (type: string) => {
    switch (type) {
      case 'full':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">全款</Badge>;
      case 'half':
        return <Badge variant="secondary">半款</Badge>;
      case 'tail':
        return <Badge variant="outline">尾款</Badge>;
      case 'custom':
        return <Badge variant="outline">自定义</Badge>;
      case 'customPercent':
        return <Badge variant="outline">自定义比例</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const columns: ColumnDef<Income>[] = [
    {
      accessorKey: 'incomeNo',
      header: '回款单号',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.incomeNo}</span>
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
      accessorKey: 'amount',
      header: '金额',
      cell: ({ row }) => (
        <span className="font-medium text-green-600">
          +¥{row.original.amount.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      accessorKey: 'paymentType',
      header: '付款类型',
      cell: ({ row }) => getPaymentTypeBadge(row.original.paymentType),
    },
    {
      accessorKey: 'paymentChannel',
      header: '支付渠道',
      cell: ({ row }) => getChannelBadge(row.original.paymentChannel),
    },
    {
      accessorKey: 'paymentDate',
      header: '回款日期',
      cell: ({ row }) =>
        format(new Date(row.original.paymentDate), 'yyyy-MM-dd'),
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
              onClick={() => router.push(`/dashboard/incomes/${row.original._id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              查看详情
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

  // 计算本地统计（如果API统计不可用）
  const localStats = {
    total: incomes.reduce((sum, i) => sum + i.amount, 0),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="回款管理"
        description="管理项目回款记录"
      >
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="支付渠道" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部渠道</SelectItem>
            <SelectItem value="company">对公</SelectItem>
            <SelectItem value="check">支票</SelectItem>
            <SelectItem value="wechat">微信</SelectItem>
            <SelectItem value="alipay">支付宝</SelectItem>
            <SelectItem value="cash">现金</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">回款总额</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ¥{(stats?.total || localStats.total).toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月回款</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{(stats?.thisMonth || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">上月回款</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{(stats?.lastMonth || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本年回款</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{(stats?.thisYear || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 回款列表 */}
      <DataTable
        columns={columns}
        data={incomes}
        searchKey="incomeNo"
        searchPlaceholder="搜索回款单号..."
      />

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除回款记录</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除这条回款记录吗？
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
