'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  Trash2,
  FileText,
  Download,
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
import { Invoice } from '@/api/invoices';
import { useInvoices, useDeleteInvoice, useInvoiceStats } from '@/hooks/queries/use-invoices';
import { format } from 'date-fns';

export default function InvoicesPage() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [feeTypeFilter, setFeeTypeFilter] = useState<string>('all');

  const { data, isLoading } = useInvoices({
    invoiceType: typeFilter === 'all' ? undefined : typeFilter,
    feeType: feeTypeFilter === 'all' ? undefined : feeTypeFilter,
    limit: 100,
  });
  const { data: statsData } = useInvoiceStats();

  const deleteInvoice = useDeleteInvoice();

  const invoices = data?.success ? data.data : [];
  const stats = statsData?.success ? statsData.data : null;

  const handleDelete = () => {
    if (deleteId) {
      deleteInvoice.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const getInvoiceTypeBadge = (type: string) => {
    switch (type) {
      case '增值税普通发票':
        return <Badge variant="outline">普票</Badge>;
      case '增值税专用发票':
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">专票</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getFeeTypeBadge = (type: string) => {
    switch (type) {
      case '预付金':
        return <Badge variant="secondary">预付金</Badge>;
      case '尾款':
        return <Badge variant="outline">尾款</Badge>;
      case '全款':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">全款</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNo',
      header: '发票号码',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.invoiceNo}</span>
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
      accessorKey: 'invoiceAmount',
      header: '金额',
      cell: ({ row }) => (
        <span className="font-medium">
          ¥{row.original.invoiceAmount.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      accessorKey: 'invoiceType',
      header: '发票类型',
      cell: ({ row }) => getInvoiceTypeBadge(row.original.invoiceType),
    },
    {
      accessorKey: 'feeType',
      header: '费用类型',
      cell: ({ row }) => getFeeTypeBadge(row.original.feeType),
    },
    {
      accessorKey: 'invoiceDate',
      header: '开票日期',
      cell: ({ row }) =>
        format(new Date(row.original.invoiceDate), 'yyyy-MM-dd'),
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
              onClick={() => router.push(`/dashboard/invoices/${row.original._id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            {row.original.files && row.original.files.length > 0 && (
              <DropdownMenuItem
                onClick={() => {
                  const file = row.original.files[0];
                  window.open(file.path, '_blank');
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                下载发票
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="发票管理"
        description="管理项目发票记录"
      >
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="发票类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="增值税普通发票">普票</SelectItem>
              <SelectItem value="增值税专用发票">专票</SelectItem>
            </SelectContent>
          </Select>
          <Select value={feeTypeFilter} onValueChange={setFeeTypeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="费用类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="预付金">预付金</SelectItem>
              <SelectItem value="尾款">尾款</SelectItem>
              <SelectItem value="全款">全款</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">发票总数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总金额</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">本月开票</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonthCount}</div>
              <p className="text-xs text-muted-foreground">
                ¥{stats.thisMonthAmount.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">上月开票</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lastMonthCount}</div>
              <p className="text-xs text-muted-foreground">
                ¥{stats.lastMonthAmount.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 发票列表 */}
      <DataTable
        columns={columns}
        data={invoices}
        searchKey="invoiceNo"
        searchPlaceholder="搜索发票号码..."
      />

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除发票</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除这张发票吗？
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
