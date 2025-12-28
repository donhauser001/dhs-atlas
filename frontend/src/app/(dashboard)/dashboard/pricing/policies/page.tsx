'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Percent,
  CheckCircle,
  XCircle,
  Layers,
  Calculator,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PricingPolicy } from '@/api/pricingPolicy';
import {
  usePricingPolicies,
  useCreatePricingPolicy,
  useDeletePricingPolicy,
  useTogglePricingPolicyStatus,
} from '@/hooks/queries/use-pricing-policies';
import { format } from 'date-fns';

export default function PricingPoliciesPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 新建状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    alias: '',
    type: 'uniform_discount' as 'uniform_discount' | 'tiered_discount',
    summary: '',
    discountRatio: 100,
    validUntil: null as string | null,
  });

  const { data: policies, isLoading } = usePricingPolicies();
  const createPolicy = useCreatePricingPolicy();
  const deletePolicy = useDeletePricingPolicy();
  const toggleStatus = useTogglePricingPolicyStatus();

  const handleDelete = () => {
    if (deleteId) {
      deletePolicy.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleStatus.mutate(id);
  };

  const handleCreatePolicy = () => {
    if (!newPolicy.name.trim()) {
      return;
    }

    createPolicy.mutate(
      {
        name: newPolicy.name,
        alias: newPolicy.alias,
        type: newPolicy.type,
        summary: newPolicy.summary,
        discountRatio: newPolicy.type === 'uniform_discount' ? newPolicy.discountRatio / 100 : undefined,
        validUntil: newPolicy.validUntil,
        tierSettings: newPolicy.type === 'tiered_discount' ? [] : undefined,
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setNewPolicy({
            name: '',
            alias: '',
            type: 'uniform_discount',
            summary: '',
            discountRatio: 100,
            validUntil: null,
          });
        },
      }
    );
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'uniform_discount':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
            <Percent className="h-3 w-3 mr-1" />
            统一折扣
          </Badge>
        );
      case 'tiered_discount':
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600">
            <Layers className="h-3 w-3 mr-1" />
            阶梯折扣
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const columns: ColumnDef<PricingPolicy>[] = [
    {
      accessorKey: 'name',
      header: '策略名称',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.name}</span>
          {row.original.alias && (
            <p className="text-xs text-muted-foreground">{row.original.alias}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: '类型',
      cell: ({ row }) => getTypeBadge(row.original.type),
    },
    {
      accessorKey: 'discountRatio',
      header: '折扣',
      cell: ({ row }) => {
        if (row.original.type === 'uniform_discount' && row.original.discountRatio) {
          return (
            <span className="font-medium text-green-600">
              {(row.original.discountRatio * 100).toFixed(0)}%
            </span>
          );
        }
        if (row.original.type === 'tiered_discount' && row.original.tierSettings) {
          const tiers = row.original.tierSettings;
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-muted-foreground cursor-help">
                    {tiers.length} 个阶梯
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    {tiers.map((tier, i) => (
                      <div key={i} className="text-xs">
                        {tier.startQuantity || 0} - {tier.endQuantity || '∞'}：
                        {(tier.discountRatio * 100).toFixed(0)}%
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        return <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: 'validUntil',
      header: '有效期',
      cell: ({ row }) =>
        row.original.validUntil ? (
          <span className="text-sm">
            {format(new Date(row.original.validUntil), 'yyyy-MM-dd')}
          </span>
        ) : (
          <Badge variant="secondary">永久有效</Badge>
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

  const policyList = policies || [];

  // 筛选
  let filteredPolicies = policyList;
  if (typeFilter !== 'all') {
    filteredPolicies = filteredPolicies.filter((p) => p.type === typeFilter);
  }
  if (statusFilter !== 'all') {
    filteredPolicies = filteredPolicies.filter((p) => p.status === statusFilter);
  }

  // 统计
  const uniformCount = policyList.filter((p) => p.type === 'uniform_discount').length;
  const tieredCount = policyList.filter((p) => p.type === 'tiered_discount').length;
  const activeCount = policyList.filter((p) => p.status === 'active').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="定价策略"
        description="管理折扣和阶梯定价策略"
        action={{
          label: '新建策略',
          onClick: () => setCreateDialogOpen(true),
        }}
      >
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="类型筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="uniform_discount">统一折扣</SelectItem>
              <SelectItem value="tiered_discount">阶梯折扣</SelectItem>
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
            <CardTitle className="text-sm font-medium">策略总数</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policyList.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">统一折扣</CardTitle>
            <Percent className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniformCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">阶梯折扣</CardTitle>
            <Layers className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tieredCount}</div>
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
      </div>

      {/* 策略列表 */}
      <DataTable
        columns={columns}
        data={filteredPolicies}
        searchKey="name"
        searchPlaceholder="搜索策略名称..."
      />

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除策略</AlertDialogTitle>
            <AlertDialogDescription>
              删除后使用该策略的服务将不再享受折扣。确定要删除吗？
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

      {/* 新建策略对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建定价策略</DialogTitle>
            <DialogDescription>
              创建新的折扣策略
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="policy-name">策略名称 *</Label>
              <Input
                id="policy-name"
                value={newPolicy.name}
                onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                placeholder="请输入策略名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-alias">别名</Label>
              <Input
                id="policy-alias"
                value={newPolicy.alias}
                onChange={(e) => setNewPolicy({ ...newPolicy, alias: e.target.value })}
                placeholder="请输入别名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-type">策略类型</Label>
              <Select
                value={newPolicy.type}
                onValueChange={(value) => setNewPolicy({ ...newPolicy, type: value as 'uniform_discount' | 'tiered_discount' })}
              >
                <SelectTrigger id="policy-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uniform_discount">统一折扣</SelectItem>
                  <SelectItem value="tiered_discount">阶梯折扣</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newPolicy.type === 'uniform_discount' && (
              <div className="space-y-2">
                <Label htmlFor="policy-discount">折扣比例 (%)</Label>
                <Input
                  id="policy-discount"
                  type="number"
                  min={1}
                  max={100}
                  value={newPolicy.discountRatio}
                  onChange={(e) => setNewPolicy({ ...newPolicy, discountRatio: Number(e.target.value) })}
                  placeholder="如 90 表示九折"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="policy-summary">说明</Label>
              <Input
                id="policy-summary"
                value={newPolicy.summary}
                onChange={(e) => setNewPolicy({ ...newPolicy, summary: e.target.value })}
                placeholder="策略说明"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreatePolicy} disabled={createPolicy.isPending || !newPolicy.name.trim()}>
              {createPolicy.isPending ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
