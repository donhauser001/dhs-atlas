'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  FileCheck,
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
import { GeneratedContract, downloadContractPDF } from '@/api/generatedContracts';
import {
  useContracts,
  useDeleteContract,
  useUpdateContractStatus,
} from '@/hooks/queries/use-contracts';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function GeneratedContractsPage() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useContracts({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 100,
  });

  const deleteContract = useDeleteContract();
  const updateStatus = useUpdateContractStatus();

  // 安全获取数据，兼容不同的响应格式
  const contracts = data?.data || (Array.isArray(data) ? data : []);

  const handleDelete = () => {
    if (deleteId) {
      deleteContract.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ id, status });
  };

  const handleDownloadPDF = async (id: string, name: string) => {
    try {
      const blob = await downloadContractPDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('下载成功');
    } catch {
      toast.error('下载失败');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            待签署
          </Badge>
        );
      case 'signed':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
            <FileCheck className="h-3 w-3 mr-1" />
            已签署
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            已完成
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            已取消
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<GeneratedContract>[] = [
    {
      accessorKey: 'name',
      header: '合同名称',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">{row.original.name}</span>
            {row.original.contractNumber && (
              <p className="text-xs text-muted-foreground">
                {row.original.contractNumber}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'template',
      header: '模板',
      cell: ({ row }) => {
        const template = row.original.templateId;
        if (typeof template === 'object' && template !== null) {
          return <span>{template.name}</span>;
        }
        return <span className="text-muted-foreground">—</span>;
      },
    },
    {
      id: 'client',
      header: '客户',
      cell: ({ row }) => {
        const relatedIds = row.original.relatedIds;
        if (relatedIds?.clientNames && relatedIds.clientNames.length > 0) {
          return <span>{relatedIds.clientNames.join(', ')}</span>;
        }
        if (row.original.clientInfo?.name) {
          return <span>{row.original.clientInfo.name}</span>;
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
      accessorKey: 'generateTime',
      header: '生成时间',
      cell: ({ row }) =>
        row.original.generateTime
          ? format(new Date(row.original.generateTime), 'yyyy-MM-dd HH:mm')
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
              onClick={() => router.push(`/dashboard/contracts/${row.original._id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              查看
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/contracts/${row.original._id}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDownloadPDF(row.original._id, row.original.name)}
            >
              <Download className="mr-2 h-4 w-4" />
              下载PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.status === 'pending' && (
              <DropdownMenuItem
                onClick={() => handleStatusChange(row.original._id, 'signed')}
              >
                <FileCheck className="mr-2 h-4 w-4" />
                标记已签署
              </DropdownMenuItem>
            )}
            {row.original.status === 'signed' && (
              <DropdownMenuItem
                onClick={() => handleStatusChange(row.original._id, 'completed')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                标记已完成
              </DropdownMenuItem>
            )}
            {row.original.status !== 'cancelled' && (
              <DropdownMenuItem
                onClick={() => handleStatusChange(row.original._id, 'cancelled')}
                className="text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                取消合同
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
    total: contracts.length,
    pending: contracts.filter((c) => c.status === 'pending').length,
    signed: contracts.filter((c) => c.status === 'signed').length,
    completed: contracts.filter((c) => c.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="已生成合同"
        description="管理通过模板生成的合同"
        action={{
          label: '生成合同',
          onClick: () => router.push('/dashboard/contracts/templates'),
        }}
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待签署</SelectItem>
            <SelectItem value="signed">已签署</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">合同总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待签署</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已签署</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.signed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* 合同列表 */}
      <DataTable
        columns={columns}
        data={contracts}
        searchKey="name"
        searchPlaceholder="搜索合同名称..."
      />

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除合同</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除这份合同吗？
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
