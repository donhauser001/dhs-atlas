'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  Building2,
  CheckCircle,
  XCircle,
  Phone,
  MapPin,
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
import { Enterprise } from '@/api/enterprises';
import { useEnterprises, useCreateEnterprise } from '@/hooks/queries/use-enterprises';
import { format } from 'date-fns';

export default function EnterprisesPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 新建状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEnterprise, setNewEnterprise] = useState({
    enterpriseName: '',
    enterpriseAlias: '',
    creditCode: '',
    legalRepresentative: '',
    contactPerson: '',
    contactPhone: '',
    companyAddress: '',
  });

  const { data, isLoading } = useEnterprises({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 100,
  });
  const createEnterprise = useCreateEnterprise();

  const enterprises = data?.data || [];

  const handleCreateEnterprise = () => {
    if (!newEnterprise.enterpriseName.trim()) {
      return;
    }
    if (!newEnterprise.creditCode.trim()) {
      return;
    }

    createEnterprise.mutate(
      {
        enterpriseName: newEnterprise.enterpriseName,
        enterpriseAlias: newEnterprise.enterpriseAlias || undefined,
        creditCode: newEnterprise.creditCode,
        legalRepresentative: newEnterprise.legalRepresentative,
        contactPerson: newEnterprise.contactPerson,
        contactPhone: newEnterprise.contactPhone || undefined,
        companyAddress: newEnterprise.companyAddress || undefined,
        status: 'active',
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setNewEnterprise({
            enterpriseName: '',
            enterpriseAlias: '',
            creditCode: '',
            legalRepresentative: '',
            contactPerson: '',
            contactPhone: '',
            companyAddress: '',
          });
        },
      }
    );
  };

  const columns: ColumnDef<Enterprise>[] = [
    {
      accessorKey: 'enterpriseName',
      header: '企业名称',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.enterpriseName}</span>
          </div>
          {row.original.enterpriseAlias && (
            <p className="text-xs text-muted-foreground ml-6">
              {row.original.enterpriseAlias}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'creditCode',
      header: '统一社会信用代码',
      cell: ({ row }) => (
        <span className="text-sm font-mono">{row.original.creditCode}</span>
      ),
    },
    {
      accessorKey: 'legalRepresentative',
      header: '法定代表人',
    },
    {
      accessorKey: 'contactPerson',
      header: '联系人',
      cell: ({ row }) => (
        <div className="space-y-1">
          <span>{row.original.contactPerson}</span>
          {row.original.contactPhone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {row.original.contactPhone}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'companyAddress',
      header: '地址',
      cell: ({ row }) =>
        row.original.companyAddress ? (
          <div className="flex items-center gap-1 text-sm text-muted-foreground max-w-[200px] truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{row.original.companyAddress}</span>
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
            正常
          </Badge>
        ) : (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            禁用
          </Badge>
        ),
    },
    {
      accessorKey: 'createTime',
      header: '创建时间',
      cell: ({ row }) =>
        row.original.createTime
          ? format(new Date(row.original.createTime), 'yyyy-MM-dd')
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
              onClick={() =>
                router.push(`/dashboard/enterprises/${row.original._id}`)
              }
            >
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return <PageLoading />;
  }

  // 统计
  const totalEnterprises = enterprises.length;
  const activeCount = enterprises.filter((e) => e.status === 'active').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="企业管理"
        description="管理系统中的企业信息"
        action={{
          label: '新建企业',
          onClick: () => setCreateDialogOpen(true),
        }}
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">正常</SelectItem>
            <SelectItem value="inactive">禁用</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">企业总数</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnterprises}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">正常</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">禁用</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalEnterprises - activeCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 企业列表 */}
      <DataTable
        columns={columns}
        data={enterprises}
        searchKey="enterpriseName"
        searchPlaceholder="搜索企业名称..."
      />

      {/* 新建企业对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建企业</DialogTitle>
            <DialogDescription>
              创建新的企业信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="enterprise-name">企业名称 *</Label>
                <Input
                  id="enterprise-name"
                  value={newEnterprise.enterpriseName}
                  onChange={(e) => setNewEnterprise({ ...newEnterprise, enterpriseName: e.target.value })}
                  placeholder="请输入企业名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enterprise-alias">企业简称</Label>
                <Input
                  id="enterprise-alias"
                  value={newEnterprise.enterpriseAlias}
                  onChange={(e) => setNewEnterprise({ ...newEnterprise, enterpriseAlias: e.target.value })}
                  placeholder="请输入简称"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-code">统一社会信用代码 *</Label>
              <Input
                id="credit-code"
                value={newEnterprise.creditCode}
                onChange={(e) => setNewEnterprise({ ...newEnterprise, creditCode: e.target.value })}
                placeholder="请输入18位信用代码"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legal-rep">法定代表人</Label>
                <Input
                  id="legal-rep"
                  value={newEnterprise.legalRepresentative}
                  onChange={(e) => setNewEnterprise({ ...newEnterprise, legalRepresentative: e.target.value })}
                  placeholder="请输入法定代表人"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-person">联系人</Label>
                <Input
                  id="contact-person"
                  value={newEnterprise.contactPerson}
                  onChange={(e) => setNewEnterprise({ ...newEnterprise, contactPerson: e.target.value })}
                  placeholder="请输入联系人"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">联系电话</Label>
              <Input
                id="contact-phone"
                value={newEnterprise.contactPhone}
                onChange={(e) => setNewEnterprise({ ...newEnterprise, contactPhone: e.target.value })}
                placeholder="请输入联系电话"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">公司地址</Label>
              <Input
                id="company-address"
                value={newEnterprise.companyAddress}
                onChange={(e) => setNewEnterprise({ ...newEnterprise, companyAddress: e.target.value })}
                placeholder="请输入公司地址"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreateEnterprise}
              disabled={createEnterprise.isPending || !newEnterprise.enterpriseName.trim() || !newEnterprise.creditCode.trim()}
            >
              {createEnterprise.isPending ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
