/**
 * AI 设置模块 - 本地模型状态组件
 * 支持 Ollama 和 LMStudio
 */

'use client';

import { useState } from 'react';
import {
    Server,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertCircle,
    ExternalLink,
    Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOllamaModels, useLMStudioModels } from '@/hooks/queries/use-ai-settings';
import { cn } from '@/lib/utils';

/**
 * Ollama 服务状态组件
 */
export function OllamaStatus() {
    const [baseUrl, setBaseUrl] = useState('http://localhost:11434');
    const { data: models, isLoading, error, refetch } = useOllamaModels(baseUrl, true);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Server className="h-4 w-4" />
                    Ollama 服务状态
                </CardTitle>
                <CardDescription>检测本地 Ollama 服务和已安装的模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <Input
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="http://localhost:11434"
                        className="flex-1"
                    />
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                    </Button>
                </div>

                {error ? (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        <XCircle className="h-4 w-4" />
                        无法连接到 Ollama 服务，请确保服务已启动
                    </div>
                ) : models && models.length > 0 ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            服务运行中，已检测到 {models.length} 个模型
                        </div>
                        <div className="grid gap-2">
                            {models.map((model) => (
                                <div
                                    key={model.name}
                                    className="flex items-center justify-between rounded-lg bg-muted/50 p-2 text-sm"
                                >
                                    <span className="font-medium">{model.name}</span>
                                    <span className="text-muted-foreground">
                                        {(model.size / 1024 / 1024 / 1024).toFixed(1)} GB
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        暂无已安装的模型，请使用 ollama pull 命令下载模型
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    <a
                        href="https://ollama.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                    >
                        了解更多关于 Ollama
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * LMStudio 服务状态组件
 */
export function LMStudioStatus() {
    const [baseUrl, setBaseUrl] = useState('http://192.168.31.178:1234');
    const { data: models, isLoading, error, refetch } = useLMStudioModels(baseUrl, true);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Cpu className="h-4 w-4" />
                    LMStudio 服务状态
                </CardTitle>
                <CardDescription>检测 LMStudio 服务和已加载的模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <Input
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="http://localhost:1234"
                        className="flex-1"
                    />
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                    </Button>
                </div>

                {error ? (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        <XCircle className="h-4 w-4" />
                        无法连接到 LMStudio 服务，请确保服务已启动并开启 API 服务器
                    </div>
                ) : models && models.length > 0 ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            服务运行中，已检测到 {models.length} 个模型
                        </div>
                        <div className="grid gap-2">
                            {models.map((model) => (
                                <div
                                    key={model.id}
                                    className="flex items-center justify-between rounded-lg bg-muted/50 p-2 text-sm"
                                >
                                    <span className="font-medium">{model.id}</span>
                                    <span className="text-muted-foreground">已加载</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        暂无已加载的模型，请在 LMStudio 中加载模型并启动服务器
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    <a
                        href="https://lmstudio.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                    >
                        了解更多关于 LMStudio
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * 本地模型状态 - 组合 Ollama 和 LMStudio
 */
export function LocalModelStatus() {
    return (
        <Tabs defaultValue="lmstudio" className="space-y-4">
            <TabsList>
                <TabsTrigger value="lmstudio" className="gap-2">
                    <Cpu className="h-4 w-4" />
                    LMStudio
                </TabsTrigger>
                <TabsTrigger value="ollama" className="gap-2">
                    <Server className="h-4 w-4" />
                    Ollama
                </TabsTrigger>
            </TabsList>
            <TabsContent value="lmstudio">
                <LMStudioStatus />
            </TabsContent>
            <TabsContent value="ollama">
                <OllamaStatus />
            </TabsContent>
        </Tabs>
    );
}

