'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  Wallet,
  Tags,
  Building2,
  FolderOpen,
  FileEdit,
  Bell,
  Settings,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';

const navigation = [
  {
    title: '工作台',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    title: '项目管理',
    icon: FolderKanban,
    href: '/dashboard/projects',
  },
  {
    title: '客户管理',
    icon: Building2,
    items: [
      { title: '联系人', href: '/dashboard/contacts' },
      { title: '客户列表', href: '/dashboard/clients' },
      { title: '客户分类', href: '/dashboard/clients/categories' },
    ],
  },
  {
    title: '合同管理',
    icon: FileText,
    items: [
      { title: '合同模板', href: '/dashboard/contracts/templates' },
      { title: '模板分类', href: '/dashboard/contracts/categories' },
      { title: '已生成合同', href: '/dashboard/contracts/generated' },
    ],
  },
  {
    title: '财务管理',
    icon: Wallet,
    items: [
      { title: '收入管理', href: '/dashboard/incomes' },
      { title: '发票管理', href: '/dashboard/invoices' },
      { title: '订单管理', href: '/dashboard/orders' },
      { title: '结算管理', href: '/dashboard/settlements' },
    ],
  },
  {
    title: '定价管理',
    icon: Tags,
    items: [
      { title: '报价单', href: '/dashboard/pricing/quotations' },
      { title: '服务定价', href: '/dashboard/pricing/services' },
      { title: '定价分类', href: '/dashboard/pricing/categories' },
      { title: '定价策略', href: '/dashboard/pricing/policies' },
      { title: '服务流程', href: '/dashboard/pricing/process' },
    ],
  },
  {
    title: '组织管理',
    icon: Building2,
    items: [
      { title: '企业信息', href: '/dashboard/enterprises' },
      { title: '部门管理', href: '/dashboard/departments' },
      { title: '员工管理', href: '/dashboard/employees' },
    ],
  },
  {
    title: '文件中心',
    icon: FolderOpen,
    href: '/dashboard/files',
  },
  {
    title: '内容管理',
    icon: FileEdit,
    items: [
      { title: '文章管理', href: '/dashboard/articles' },
      { title: '文章分类', href: '/dashboard/articles/categories' },
      { title: '文章标签', href: '/dashboard/articles/tags' },
    ],
  },
];

const systemNavigation = [
  {
    title: '用户管理',
    icon: Users,
    items: [
      { title: '用户列表', href: '/dashboard/users' },
      { title: '角色管理', href: '/dashboard/users/roles' },
      { title: '权限设置', href: '/dashboard/users/permissions' },
    ],
  },
  {
    title: '消息中心',
    icon: Bell,
    items: [
      { title: '消息列表', href: '/dashboard/notifications' },
      { title: '消息模板', href: '/dashboard/messages/templates' },
    ],
  },
  {
    title: '系统设置',
    icon: Settings,
    items: [
      { title: '邮件配置', href: '/dashboard/settings/email' },
      { title: '附加配置', href: '/dashboard/settings/additional' },
    ],
  },
];

// 可折叠菜单项组件 - 解决 hydration 问题
function CollapsibleNavItem({
  item,
  pathname,
}: {
  item: { title: string; icon: React.ComponentType<{ className?: string }>; items: { title: string; href: string }[] };
  pathname: string;
}) {
  const isActive = (href: string) => pathname.startsWith(href);
  const isGroupActive = item.items.some((subItem) => isActive(subItem.href));

  // 使用 useState 延迟设置初始状态，避免 hydration 不匹配
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isGroupActive);
  }, [isGroupActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.href}>
                <SidebarMenuSubButton asChild isActive={isActive(subItem.href)}>
                  <Link href={subItem.href}>{subItem.title}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: typeof navigation[0]) => {
    if ('items' in item && item.items) {
      return (
        <CollapsibleNavItem
          key={item.title}
          item={item as { title: string; icon: React.ComponentType<{ className?: string }>; items: { title: string; href: string }[] }}
          pathname={pathname}
        />
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive(item.href!)}>
          <Link href={item.href!}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">D</span>
          </div>
          <span className="text-lg font-bold">唐好思</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>业务管理</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>系统管理</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavigation.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{user?.name || '用户'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings/profile">个人设置</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
