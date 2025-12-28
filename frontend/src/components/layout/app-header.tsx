'use client';

import { Fragment } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// 路由到面包屑映射
const routeLabels: Record<string, string> = {
  dashboard: '工作台',
  projects: '项目管理',
  clients: '客户管理',
  categories: '分类',
  contacts: '联系人',
  contracts: '合同管理',
  templates: '模板',
  generated: '已生成',
  finance: '财务管理',
  income: '收入管理',
  invoices: '发票管理',
  orders: '订单管理',
  settlements: '结算管理',
  pricing: '定价管理',
  quotations: '报价单',
  services: '服务定价',
  policies: '定价策略',
  process: '服务流程',
  organization: '组织管理',
  enterprises: '企业信息',
  departments: '部门管理',
  employees: '员工管理',
  files: '文件中心',
  content: '内容管理',
  articles: '文章管理',
  tags: '标签',
  users: '用户管理',
  roles: '角色管理',
  permissions: '权限设置',
  messages: '消息中心',
  settings: '系统设置',
};

export function AppHeader() {
  const pathname = usePathname();

  // 解析路径生成面包屑
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = routeLabels[segment] || segment;
    const isLast = index === pathSegments.length - 1;

    return { href, label, isLast };
  });

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      {/* Breadcrumb */}
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="搜索..."
          className="w-64 pl-8"
        />
      </div>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
          3
        </span>
      </Button>
    </header>
  );
}

