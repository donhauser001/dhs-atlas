/**
 * AI 设置页面
 *
 * 配置 AI 模型，支持多种在线服务和本地部署
 */

'use client';

import { useState, useMemo } from 'react';
import { Plus, Globe, Server, Star, Cpu } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAiModels } from '@/hooks/queries/use-ai-settings';
import { AI_PROVIDERS, type AiModelConfig } from '@/api/ai-settings';
import {
    EmptyState,
    ModelCard,
    ModelConfigModal,
    LocalModelStatus,
    DeleteConfirmDialog,
    type ModalMode,
} from '@/components/features/ai-settings';
import { AiSettingsNav } from './_components/ai-settings-nav';

export default function AiSettingsPage() {
    const { data: models, isLoading } = useAiModels();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('create');
    const [editingModel, setEditingModel] = useState<AiModelConfig | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // 分类模型：在线模型 vs 本地模型
    const { onlineModels, localModels } = useMemo(() => {
        if (!models) return { onlineModels: [], localModels: [] };
        return {
            onlineModels: models.filter(
                (m) => m.provider !== 'ollama' && m.provider !== 'lmstudio'
            ),
            localModels: models.filter(
                (m) => m.provider === 'ollama' || m.provider === 'lmstudio'
            ),
        };
    }, [models]);

    const defaultModel = useMemo(
        () => models?.find((m) => m.isDefault),
        [models]
    );

    const handleAdd = () => {
        setEditingModel(null);
        setModalMode('create');
        setModalOpen(true);
    };

    const handleEdit = (model: AiModelConfig) => {
        setEditingModel(model);
        setModalMode('edit');
        setModalOpen(true);
    };

    if (isLoading) {
        return <PageLoading />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="AI 设置"
                description="配置 AI 模型，支持多种在线服务和本地部署"
            >
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加模型
                </Button>
            </PageHeader>

            <AiSettingsNav />

            {/* 默认模型概览 */}
            {defaultModel && (
                <DefaultModelCard model={defaultModel} />
            )}

            {/* 模型列表 Tabs */}
            <Tabs defaultValue="local" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="local" className="gap-2">
                        <Cpu className="h-4 w-4" />
                        本地模型
                        {localModels.length > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {localModels.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="online" className="gap-2">
                        <Globe className="h-4 w-4" />
                        在线模型
                        {onlineModels.length > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {onlineModels.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="local" className="space-y-4">
                    {localModels.length === 0 ? (
                        <EmptyState
                            icon={<Server className="h-12 w-12" />}
                            title="暂无本地模型配置"
                            description="添加 LMStudio 或 Ollama 等本地部署的 AI 模型"
                            action={
                                <Button onClick={handleAdd}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    添加本地模型
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {localModels.map((model) => (
                                <ModelCard
                                    key={model._id}
                                    model={model}
                                    onEdit={() => handleEdit(model)}
                                    onDelete={() => setDeleteId(model._id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* 本地模型服务状态 */}
                    <LocalModelStatus />
                </TabsContent>

                <TabsContent value="online" className="space-y-4">
                    {onlineModels.length === 0 ? (
                        <EmptyState
                            icon={<Globe className="h-12 w-12" />}
                            title="暂无在线模型配置"
                            description="添加 OpenAI、Anthropic、Google 等在线 AI 服务"
                            action={
                                <Button onClick={handleAdd}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    添加在线模型
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {onlineModels.map((model) => (
                                <ModelCard
                                    key={model._id}
                                    model={model}
                                    onEdit={() => handleEdit(model)}
                                    onDelete={() => setDeleteId(model._id)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* 模型配置弹窗 */}
            <ModelConfigModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                mode={modalMode}
                initialData={editingModel}
            />

            {/* 删除确认 */}
            <DeleteConfirmDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                modelId={deleteId}
            />
        </div>
    );
}

/**
 * 默认模型卡片
 */
function DefaultModelCard({ model }: { model: AiModelConfig }) {
    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        当前默认模型
                    </CardTitle>
                    <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/10 text-primary"
                    >
                        {AI_PROVIDERS[model.provider]?.name}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">{model.name}</p>
                        <p className="text-sm text-muted-foreground">{model.model}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>温度: {model.temperature}</span>
                        <span className="text-muted-foreground/50">|</span>
                        <span>最大 Token: {model.maxTokens}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
