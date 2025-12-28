/**
 * AI 设置模块 - 空状态组件
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { EmptyStateProps } from './types';

export function EmptyState({
    icon,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 text-muted-foreground/50">{icon}</div>
                <h3 className="mb-1 font-medium">{title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{description}</p>
                {action}
            </CardContent>
        </Card>
    );
}

