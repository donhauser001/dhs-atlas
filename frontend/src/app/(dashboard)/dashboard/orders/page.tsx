'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  Package,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

// 订单类型
interface Order {
  _id: string;
  orderNo: string;
  clientName: string;
  projectName: string;
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  createdAt: string;
}

// 模拟数据
const mockOrders: Order[] = [
  {
    _id: '1',
    orderNo: 'ORD-2024-001',
    clientName: '阿里巴巴集团',
    projectName: '品牌VI设计',
    totalAmount: 50000,
    paidAmount: 25000,
    status: 'processing',
    paymentStatus: 'partial',
    createdAt: '2024-01-15',
  },
  {
    _id: '2',
    orderNo: 'ORD-2024-002',
    clientName: '腾讯科技',
    projectName: '官网改版设计',
    totalAmount: 80000,
    paidAmount: 80000,
    status: 'completed',
    paymentStatus: 'paid',
    createdAt: '2024-01-20',
  },
  {
    _id: '3',
    orderNo: 'ORD-2024-003',
    clientName: '字节跳动',
    projectName: '产品包装设计',
    totalAmount: 35000,
    paidAmount: 0,
    status: 'pending',
    paymentStatus: 'unpaid',
    createdAt: '2024-02-01',
  },
];

export default function OrdersPage() {
  const [loading] = useState(false);
  const [orders] = useState<Order[]>(mockOrders);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    clientName: '',
    projectName: '',
    totalAmount: 0,
  });

  const getStatusBadge = (status: Order['status']) => {
    const configs = {
      pending: { label: '待确认', variant: 'secondary' as const, icon: Clock },
      confirmed: { label: '已确认', variant: 'default' as const, icon: CheckCircle },
      processing: { label: '进行中', variant: 'default' as const, icon: Package },
      completed: { label: '已完成', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: '已取消', variant: 'destructive' as const, icon: XCircle },
    };
    const config = configs[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={status === 'completed' ? 'bg-green-500/10 text-green-600' : ''}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: Order['paymentStatus']) => {
    const configs = {
      unpaid: { label: '未付款', className: 'bg-red-500/10 text-red-600' },
      partial: { label: '部分付款', className: 'bg-orange-500/10 text-orange-600' },
      paid: { label: '已付清', className: 'bg-green-500/10 text-green-600' },
    };
    const config = configs[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleCreate = () => {
    if (!newOrder.clientName || !newOrder.projectName) {
      toast.error('请填写客户名称和项目名称');
      return;
    }
    toast.success('订单创建成功');
    setCreateDialogOpen(false);
    setNewOrder({ clientName: '', projectName: '', totalAmount: 0 });
  };

  const handleDelete = () => {
    if (deleteId) {
      toast.success('订单已删除');
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'orderNo',
      header: '订单号',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.orderNo}</span>
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
      header: '订单金额',
      cell: ({ row }) => (
        <span className="font-medium">
          ¥{row.original.totalAmount.toLocaleString('zh-CN')}
        </span>
      ),
    },
    {
      accessorKey: 'paidAmount',
      header: '已付款',
      cell: ({ row }) => (
        <span>¥{row.original.paidAmount.toLocaleString('zh-CN')}</span>
      ),
    },
    {
      accessorKey: 'paymentStatus',
      header: '付款状态',
      cell: ({ row }) => getPaymentBadge(row.original.paymentStatus),
    },
    {
      accessorKey: 'status',
      header: '订单状态',
      cell: ({ row }) => getStatusBadge(row.original.status),
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
            {row.original.status === 'pending' && (
              <DropdownMenuItem>
                <CheckCircle className="mr-2 h-4 w-4" />
                确认订单
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
  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  // 统计
  const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const paidAmount = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="订单管理"
        description="管理项目订单"
        action={{
          label: '新建订单',
          onClick: () => setCreateDialogOpen(true),
        }}
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待确认</SelectItem>
            <SelectItem value="confirmed">已确认</SelectItem>
            <SelectItem value="processing">进行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">订单总数</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">订单总额</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已收款</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{paidAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 订单列表 */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        searchKey="orderNo"
        searchPlaceholder="搜索订单号..."
      />

      {/* 新建对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建订单</DialogTitle>
            <DialogDescription>创建新的项目订单</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">客户名称 *</Label>
              <Input
                id="clientName"
                value={newOrder.clientName}
                onChange={(e) => setNewOrder({ ...newOrder, clientName: e.target.value })}
                placeholder="请输入客户名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectName">项目名称 *</Label>
              <Input
                id="projectName"
                value={newOrder.projectName}
                onChange={(e) => setNewOrder({ ...newOrder, projectName: e.target.value })}
                placeholder="请输入项目名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">订单金额</Label>
              <Input
                id="totalAmount"
                type="number"
                value={newOrder.totalAmount}
                onChange={(e) => setNewOrder({ ...newOrder, totalAmount: Number(e.target.value) })}
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
              确定要删除这个订单吗？此操作不可恢复。
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
