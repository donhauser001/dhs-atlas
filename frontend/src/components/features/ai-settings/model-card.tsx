/**
 * AI 设置模块 - 模型卡片组件
 */

'use client';

import {
    CheckCircle,
    XCircle,
    Key,
    Star,
    MoreHorizontal,
    Pencil,
    Trash2,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSetDefaultModel } from '@/hooks/queries/use-ai-settings';
import { AI_PROVIDERS } from '@/api/ai-settings';
import { cn } from '@/lib/utils';
import { PROVIDER_ICONS } from './constants';
import type { ModelCardProps } from './types';

export function ModelCard({ model, onEdit, onDelete }: ModelCardProps) {
    const setDefault = useSetDefaultModel();
    const provider = AI_PROVIDERS[model.provider];

    return (
        <Card className={cn(model.isDefault && 'border-primary/30')}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-muted p-2">
                            {PROVIDER_ICONS[model.provider]}
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                {model.name}
                                {model.isDefault && (
                                    <Star className="h-3 w-3 fill-primary text-primary" />
                                )}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {provider?.name} / {model.model}
                            </CardDescription>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>
                                <Pencil className="mr-2 h-4 w-4" />
                                编辑
                            </DropdownMenuItem>
                            {!model.isDefault && (
                                <DropdownMenuItem
                                    onClick={() => setDefault.mutate(model._id)}
                                    disabled={setDefault.isPending}
                                >
                                    <Star className="mr-2 h-4 w-4" />
                                    设为默认
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={onDelete}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* 状态 */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">状态</span>
                        {model.isEnabled ? (
                            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                已启用
                            </Badge>
                        ) : (
                            <Badge variant="secondary">
                                <XCircle className="mr-1 h-3 w-3" />
                                已禁用
                            </Badge>
                        )}
                    </div>

                    {/* API Key 状态 - 仅非本地模型显示 */}
                    {model.provider !== 'ollama' && model.provider !== 'lmstudio' && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">API Key</span>
                            {model.apiKeySet ? (
                                <span className="flex items-center text-green-600">
                                    <Key className="mr-1 h-3 w-3" />
                                    已配置
                                </span>
                            ) : (
                                <span className="flex items-center text-amber-600">
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    未配置
                                </span>
                            )}
                        </div>
                    )}

                    {/* 参数 */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">温度</span>
                        <span>{model.temperature}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">最大 Token</span>
                        <span>{model.maxTokens?.toLocaleString()}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

