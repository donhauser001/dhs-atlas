'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  DollarSign,
  CheckCircle,
  XCircle,
  Tag,
  ExternalLink,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServicePricing } from '@/api/service-pricing';
import { useServicePricings, useCreateServicePricing } from '@/hooks/queries/use-service-pricing';
import { usePricingCategories } from '@/hooks/queries/use-pricing-categories';

export default function ServicePricingPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // 新建状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newService, setNewService] = useState({
    serviceName: '',
    alias: '',
    categoryId: '',
    unitPrice: 0,
    unit: '项',
    priceDescription: '',
    link: '',
  });

  const { data, isLoading } = useServicePricings({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 1000,
  });
  const { data: categories } = usePricingCategories();
  const createService = useCreateServicePricing();

  // 安全获取数据
  const services = data?.data || (Array.isArray(data) ? data : []);
  const categoryList = categories || [];

  const handleCreateService = () => {
    if (!newService.serviceName.trim()) {
      return;
    }

    createService.mutate(
      {
        serviceName: newService.serviceName,
        alias: newService.alias,
        categoryId: newService.categoryId || undefined,
        unitPrice: newService.unitPrice,
        unit: newService.unit,
        priceDescription: newService.priceDescription,
        link: newService.link,
        status: 'active',
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setNewService({
            serviceName: '',
            alias: '',
            categoryId: '',
            unitPrice: 0,
            unit: '项',
            priceDescription: '',
            link: '',
          });
        },
      }
    );
  };

  // 按分类筛选
  const filteredServices =
    categoryFilter === 'all'
      ? services
      : services.filter((s) => s.categoryId === categoryFilter);

  const columns: ColumnDef<ServicePricing>[] = [
    {
      accessorKey: 'serviceName',
      header: '服务名称',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.serviceName}</span>
          {row.original.alias && (
            <p className="text-xs text-muted-foreground">{row.original.alias}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: '分类',
      cell: ({ row }) =>
        row.original.categoryName ? (
          <Badge variant="outline">{row.original.categoryName}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'unitPrice',
      header: '单价',
      cell: ({ row }) => (
        <span className="font-medium">
          ¥{row.original.unitPrice.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          <span className="text-muted-foreground text-xs">/{row.original.unit}</span>
        </span>
      ),
    },
    {
      accessorKey: 'pricingPolicyNames',
      header: '适用策略',
      cell: ({ row }) =>
        row.original.pricingPolicyNames && row.original.pricingPolicyNames.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.original.pricingPolicyNames.slice(0, 2).map((name, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {name}
              </Badge>
            ))}
            {row.original.pricingPolicyNames.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{row.original.pricingPolicyNames.length - 2}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
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
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/pricing/services/${row.original._id}`)
              }
            >
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            {row.original.link && (
              <DropdownMenuItem
                onClick={() => window.open(row.original.link, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                查看参考链接
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return <PageLoading />;
  }

  // 统计
  const totalServices = services.length;
  const activeServices = services.filter((s) => s.status === 'active').length;
  const avgPrice =
    services.length > 0
      ? services.reduce((sum, s) => sum + s.unitPrice, 0) / services.length
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="服务定价"
        description="查看所有服务的定价信息"
        action={{
          label: '新建服务',
          onClick: () => setCreateDialogOpen(true),
        }}
      >
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="分类筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categoryList.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  {cat.name}
                </SelectItem>
              ))}
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
            <CardTitle className="text-sm font-medium">服务总数</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">启用中</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">分类数</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryList.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均单价</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{avgPrice.toLocaleString('zh-CN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 服务列表 */}
      <DataTable
        columns={columns}
        data={filteredServices}
        searchKey="serviceName"
        searchPlaceholder="搜索服务名称..."
      />

      {/* 新建服务对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建服务定价</DialogTitle>
            <DialogDescription>
              创建新的服务定价项目
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-name">服务名称 *</Label>
                <Input
                  id="service-name"
                  value={newService.serviceName}
                  onChange={(e) => setNewService({ ...newService, serviceName: e.target.value })}
                  placeholder="请输入服务名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-alias">别名</Label>
                <Input
                  id="service-alias"
                  value={newService.alias}
                  onChange={(e) => setNewService({ ...newService, alias: e.target.value })}
                  placeholder="请输入别名"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-price">单价 (元) *</Label>
                <Input
                  id="service-price"
                  type="number"
                  min={0}
                  value={newService.unitPrice}
                  onChange={(e) => setNewService({ ...newService, unitPrice: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-unit">单位</Label>
                <Input
                  id="service-unit"
                  value={newService.unit}
                  onChange={(e) => setNewService({ ...newService, unit: e.target.value })}
                  placeholder="如：项、个、次"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-category">分类</Label>
              <Select
                value={newService.categoryId}
                onValueChange={(value) => setNewService({ ...newService, categoryId: value })}
              >
                <SelectTrigger id="service-category">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categoryList.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-desc">价格说明</Label>
              <Textarea
                id="service-desc"
                value={newService.priceDescription}
                onChange={(e) => setNewService({ ...newService, priceDescription: e.target.value })}
                placeholder="请输入价格说明"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-link">参考链接</Label>
              <Input
                id="service-link"
                value={newService.link}
                onChange={(e) => setNewService({ ...newService, link: e.target.value })}
                placeholder="https://"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateService} disabled={createService.isPending || !newService.serviceName.trim()}>
              {createService.isPending ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
