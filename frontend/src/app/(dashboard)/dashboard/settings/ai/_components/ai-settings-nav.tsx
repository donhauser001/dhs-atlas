/**
 * AI 设置页面导航
 * 
 * V2 架构：简化导航，新增记忆管理和对话历史
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Cpu, Wrench, FileCode, Map, Shield, Brain, MessageSquare } from 'lucide-react';

// 注意：数据模型已移除，现在由 DataMapService 自动从 Schema 提取

const navItems = [
    {
        href: '/dashboard/settings/ai',
        label: 'AI 模型',
        icon: Cpu,
        exact: true,
    },
    {
        href: '/dashboard/settings/ai/tools',
        label: '工具集',
        icon: Wrench,
    },
    {
        href: '/dashboard/settings/ai/templates',
        label: '样例模板',
        icon: FileCode,
    },
    {
        href: '/dashboard/settings/ai/maps',
        label: 'AI 地图',
        icon: Map,
    },
    {
        href: '/dashboard/settings/ai/memory',
        label: 'AI 记忆',
        icon: Brain,
    },
    {
        href: '/dashboard/settings/ai/conversations',
        label: '对话历史',
        icon: MessageSquare,
    },
    {
        href: '/dashboard/settings/ai/audit',
        label: '审计日志',
        icon: Shield,
    },
];

export function AiSettingsNav() {
    const pathname = usePathname();

    return (
        <nav className="flex items-center gap-2 border-b pb-4">
            {navItems.map((item) => {
                const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                            isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
