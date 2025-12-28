/**
 * AI 设置模块 - 连接配置表单区域
 */

'use client';

import { Key, RefreshCw, Zap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AI_PROVIDERS, type AiProvider } from '@/api/ai-settings';
import type { FormData, AiModelConfig } from '../types';

interface ConnectionSectionProps {
    formData: FormData;
    setFormData: (data: FormData) => void;
    provider: (typeof AI_PROVIDERS)[AiProvider];
    isLocalProvider: boolean;
    isEditMode: boolean;
    initialData: AiModelConfig | null;
    showApiKey: boolean;
    setShowApiKey: (show: boolean) => void;
    onTest: () => void;
    isTestPending: boolean;
}

export function ConnectionSection({
    formData,
    setFormData,
    provider,
    isLocalProvider,
    isEditMode,
    initialData,
    showApiKey,
    setShowApiKey,
    onTest,
    isTestPending,
}: ConnectionSectionProps) {
    return (
        <section className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-medium">
                <Key className="h-4 w-4" />
                连接配置
            </h4>

            {!isLocalProvider && (
                <div className="space-y-2">
                    <Label htmlFor="apiKey">
                        API Key
                        {isEditMode && initialData?.apiKeySet && (
                            <span className="ml-2 text-muted-foreground">
                                (已配置，留空保持不变)
                            </span>
                        )}
                    </Label>
                    <div className="relative">
                        <Input
                            id="apiKey"
                            type={showApiKey ? 'text' : 'password'}
                            value={formData.apiKey}
                            onChange={(e) =>
                                setFormData({ ...formData, apiKey: e.target.value })
                            }
                            placeholder="sk-..."
                            className="pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowApiKey(!showApiKey)}
                        >
                            {showApiKey ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="baseUrl">
                    API 地址
                    {provider.defaultBaseUrl && (
                        <span className="ml-2 text-muted-foreground">
                            (默认: {provider.defaultBaseUrl})
                        </span>
                    )}
                </Label>
                <Input
                    id="baseUrl"
                    value={formData.baseUrl}
                    onChange={(e) =>
                        setFormData({ ...formData, baseUrl: e.target.value })
                    }
                    placeholder={provider.defaultBaseUrl || 'https://api.example.com'}
                />
            </div>

            <Button
                variant="outline"
                onClick={onTest}
                disabled={isTestPending}
                className="w-full"
            >
                {isTestPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Zap className="mr-2 h-4 w-4" />
                )}
                测试连接
            </Button>
        </section>
    );
}

