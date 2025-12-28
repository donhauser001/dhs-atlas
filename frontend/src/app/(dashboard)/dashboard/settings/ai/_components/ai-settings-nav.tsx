/**
 * AI 设置页面导航
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Cpu, Wrench, Database, FileCode, Map } from 'lucide-react';

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
        href: '/dashboard/settings/ai/data-models',
        label: '数据模型',
        icon: Database,
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

