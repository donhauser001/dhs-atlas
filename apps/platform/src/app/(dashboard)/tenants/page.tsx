'use client';

import { useRouter } from 'next/navigation';
import { EntityList, type EntityListConfig } from '@dhs-atlas/ui';
import { Eye, Edit, Ban, CheckCircle } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  userCount: number;
  createdAt: string;
}

// Mock data
const mockTenants: Tenant[] = [
  { id: '1', name: '北京科技有限公司', slug: 'beijing-tech', status: 'active', plan: 'pro', userCount: 15, createdAt: '2024-01-15' },
  { id: '2', name: '上海贸易集团', slug: 'shanghai-trade', status: 'active', plan: 'enterprise', userCount: 42, createdAt: '2024-01-10' },
  { id: '3', name: '深圳创新科技', slug: 'shenzhen-innovation', status: 'suspended', plan: 'basic', userCount: 5, createdAt: '2024-01-08' },
];

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: '正常', className: 'bg-green-500/10 text-green-500' },
  suspended: { label: '已暂停', className: 'bg-yellow-500/10 text-yellow-600' },
  deleted: { label: '已删除', className: 'bg-destructive/10 text-destructive' },
};

const planMap: Record<string, { label: string; className: string }> = {
  basic: { label: '基础版', className: 'bg-muted text-muted-foreground' },
  pro: { label: '专业版', className: 'bg-blue-500/10 text-blue-500' },
  enterprise: { label: '企业版', className: 'bg-violet-500/10 text-violet-500' },
};

export default function TenantsPage() {
  const router = useRouter();

  const config: EntityListConfig<Tenant> = {
    title: '租户管理',
    columns: [
      { key: 'name', header: '租户名称' },
      { key: 'slug', header: '标识' },
      {
        key: 'plan',
        header: '套餐',
        render: (item) => {
          const plan = planMap[item.plan];
          return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${plan.className}`}>
              {plan.label}
            </span>
          );
        },
      },
      { key: 'userCount', header: '用户数' },
      {
        key: 'status',
        header: '状态',
        render: (item) => {
          const status = statusMap[item.status];
          return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
              {status.label}
            </span>
          );
        },
      },
      { key: 'createdAt', header: '创建时间' },
    ],
    actions: [
      { key: 'view', label: '查看', icon: Eye, onClick: (item) => router.push(`/tenants/${item.id}`) },
      { key: 'edit', label: '编辑', icon: Edit, onClick: (item) => router.push(`/tenants/${item.id}/edit`) },
      { key: 'activate', label: '激活', icon: CheckCircle, onClick: (item) => console.log('activate', item.id) },
      { key: 'suspend', label: '暂停', icon: Ban, variant: 'destructive', onClick: (item) => console.log('suspend', item.id) },
    ],
    primaryAction: {
      label: '新建租户',
      onClick: () => router.push('/tenants/new'),
    },
    emptyState: {
      title: '暂无租户',
      description: '创建第一个租户',
    },
    getRowId: (item) => item.id,
  };

  return (
    <EntityList
      config={config}
      data={mockTenants}
      pagination={{ page: 1, limit: 20, total: 3, totalPages: 1 }}
    />
  );
}

