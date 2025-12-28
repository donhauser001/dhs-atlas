'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Copy,
  Download,
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

// 报价单类型
interface Quotation {
  _id: string;
  quotationNo: string;
  clientName: string;
  projectName: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

// 模拟数据
const mockQuotations: Quotation[] = [
  {
    _id: '1',
    quotationNo: 'QT-2024-001',
    clientName: '阿里巴巴集团',
    projectName: '品牌VI设计',
    totalAmount: 50000,
    status: 'sent',
    validUntil: '2024-03-01',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    _id: '2',
    quotationNo: 'QT-2024-002',
    clientName: '腾讯科技',
    projectName: '官网改版设计',
    totalAmount: 80000,
    status: 'accepted',
    validUntil: '2024-02-28',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-25',
  },
  {
    _id: '3',
    quotationNo: 'QT-2024-003',
    clientName: '字节跳动',
    projectName: '产品包装设计',
    totalAmount: 35000,
    status: 'draft',
    validUntil: '2024-03-15',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01',
  },
];

export default function QuotationsPage() {
  const [quotations] = useState<Quotation[]>(mockQuotations);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newQuotation, setNewQuotation] = useState({
    clientName: '',
    projectName: '',
    totalAmount: 0,
    validDays: 30,
    notes: '',
  });

  const getStatusBadge = (status: Quotation['status']) => {
    const configs = {
      draft: { label: '草稿', variant: 'secondary' as const, icon: FileText },
      sent: { label: '已发送', variant: 'default' as const, icon: Send },
      accepted: { label: '已接受', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: '已拒绝', variant: 'destructive' as const, icon: XCircle },
      expired: { label: '已过期', variant: 'secondary' as const, icon: Clock },
    };
    const config = configs[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={status === 'accepted' ? 'bg-green-500/10 text-green-600' : ''}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleCreate = () => {
    if (!newQuotation.clientName || !newQuotation.projectName) {
      toast.error('请填写客户名称和项目名称');
      return;
    }
    toast.success('报价单创建成功');
    setCreateDialogOpen(false);
    setNewQuotation({
      clientName: '',
      projectName: '',
      totalAmount: 0,
      validDays: 30,
      notes: '',
    });
  };

  const handleDelete = () => {
    if (deleteId) {
      toast.success('报价单已删除');
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Quotation>[] = [
    {
      accessorKey: 'quotationNo',
      header: '报价单号',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.quotationNo}</span>
      ),
    },
    {
      accessorKey: 'clientName',
      header: '客户',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.clientName}</span>
          <p className="text-xs text-muted-foreground">{row.original.projectName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: '报价金额',
      cell: ({ row }) => (
        <span className="font-medium">
          ¥{row.original.totalAmount.toLocaleString('zh-CN')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'validUntil',
      header: '有效期至',
      cell: ({ row }) => format(new Date(row.original.validUntil), 'yyyy-MM-dd'),
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
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              复制
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              导出PDF
            </DropdownMenuItem>
            {row.original.status === 'draft' && (
              <DropdownMenuItem>
                <Send className="mr-2 h-4 w-4" />
                发送给客户
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

  // 筛选
  const filteredQuotations = statusFilter === 'all'
    ? quotations
    : quotations.filter((q) => q.status === statusFilter);

  // 统计
  const totalAmount = quotations.reduce((sum, q) => sum + q.totalAmount, 0);
  const acceptedAmount = quotations
    .filter((q) => q.status === 'accepted')
    .reduce((sum, q) => sum + q.totalAmount, 0);
  const draftCount = quotations.filter((q) => q.status === 'draft').length;

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="报价单"
        description="管理项目报价单"
        action={{
          label: '新建报价单',
          onClick: () => setCreateDialogOpen(true),
        }}
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="sent">已发送</SelectItem>
            <SelectItem value="accepted">已接受</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">报价单总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">报价总额</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已成交金额</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{acceptedAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 报价单列表 */}
      <DataTable
        columns={columns}
        data={filteredQuotations}
        searchKey="quotationNo"
        searchPlaceholder="搜索报价单号..."
      />

      {/* 新建对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建报价单</DialogTitle>
            <DialogDescription>创建新的项目报价单</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">客户名称 *</Label>
              <Input
                id="clientName"
                value={newQuotation.clientName}
                onChange={(e) => setNewQuotation({ ...newQuotation, clientName: e.target.value })}
                placeholder="请输入客户名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectName">项目名称 *</Label>
              <Input
                id="projectName"
                value={newQuotation.projectName}
                onChange={(e) => setNewQuotation({ ...newQuotation, projectName: e.target.value })}
                placeholder="请输入项目名称"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">报价金额</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={newQuotation.totalAmount}
                  onChange={(e) => setNewQuotation({ ...newQuotation, totalAmount: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validDays">有效期（天）</Label>
                <Input
                  id="validDays"
                  type="number"
                  value={newQuotation.validDays}
                  onChange={(e) => setNewQuotation({ ...newQuotation, validDays: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                value={newQuotation.notes}
                onChange={(e) => setNewQuotation({ ...newQuotation, notes: e.target.value })}
                placeholder="请输入备注信息"
                rows={3}
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
              确定要删除这个报价单吗？此操作不可恢复。
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
