/**
 * AI 数据模型管理页面
 */

'use client';

import { useState } from 'react';
import { Plus, Database, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    useAiDataModels,
    useCreateAiDataModel,
    useUpdateAiDataModel,
    useDeleteAiDataModel,
} from '@/hooks/queries/use-ai-config';
import type { AiDataModel } from '@/api/ai-config';
import { AiSettingsNav } from '../_components/ai-settings-nav';

export default function AiDataModelsPage() {
    const { data: models, isLoading } = useAiDataModels();
    const createMutation = useCreateAiDataModel();
    const updateMutation = useUpdateAiDataModel();
    const deleteMutation = useDeleteAiDataModel();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<AiDataModel | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        collection: '',
        name: '',
        description: '',
        fields: '',
        relations: '',
        queryExamples: '',
        enabled: true,
    });

    const handleAdd = () => {
        setEditingModel(null);
        setFormData({
            collection: '',
            name: '',
            description: '',
            fields: '',
            relations: '',
            queryExamples: '',
            enabled: true,
        });
        setModalOpen(true);
    };

    const handleEdit = (model: AiDataModel) => {
        setEditingModel(model);
        setFormData({
            collection: model.collection,
            name: model.name,
            description: model.description || '',
            fields: model.fields || '',
            relations: model.relations || '',
            queryExamples: model.queryExamples || '',
            enabled: model.enabled,
        });
        setModalOpen(true);
    };

    const handleToggle = async (model: AiDataModel) => {
        await updateMutation.mutateAsync({
            id: model._id,
            data: { enabled: !model.enabled },
        });
    };

    const handleSubmit = async () => {
        if (editingModel) {
            await updateMutation.mutateAsync({
                id: editingModel._id,
                data: formData,
            });
        } else {
            await createMutation.mutateAsync(formData);
        }
        setModalOpen(false);
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    if (isLoading) {
        return <PageLoading />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="AI 数据模型"
                description="定义数据表结构和关系，让 AI 理解数据库 schema"
            >
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加模型
                </Button>
            </PageHeader>

            <AiSettingsNav />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {models?.map((model) => (
                    <Card key={model._id} className={!model.enabled ? 'opacity-60' : ''}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Database className="h-4 w-4" />
                                    {model.name}
                                </CardTitle>
                                <Badge variant={model.enabled ? 'default' : 'secondary'}>
                                    {model.enabled ? '启用' : '禁用'}
                                </Badge>
                            </div>
                            <CardDescription className="font-mono text-xs">
                                {model.collection}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {model.description || '暂无描述'}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEdit(model)}
                                    >
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setDeleteId(model._id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggle(model)}
                                >
                                    {model.enabled ? (
                                        <ToggleRight className="h-4 w-4 text-primary" />
                                    ) : (
                                        <ToggleLeft className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {!models?.length && (
                    <Card className="col-span-full">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Database className="h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-muted-foreground">暂无数据模型配置</p>
                            <Button className="mt-4" onClick={handleAdd}>
                                <Plus className="mr-2 h-4 w-4" />
                                添加第一个数据模型
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* 编辑/新增弹窗 */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingModel ? '编辑数据模型' : '添加数据模型'}
                        </DialogTitle>
                        <DialogDescription>
                            定义数据表的字段结构、关系和查询示例
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="collection">集合名称</Label>
                                <Input
                                    id="collection"
                                    placeholder="如：clients"
                                    value={formData.collection}
                                    onChange={(e) =>
                                        setFormData({ ...formData, collection: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">显示名称</Label>
                                <Input
                                    id="name"
                                    placeholder="如：客户表"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">描述</Label>
                            <Input
                                id="description"
                                placeholder="简要描述这个数据表的用途"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fields">字段定义 (Markdown)</Label>
                            <Textarea
                                id="fields"
                                placeholder="- `_id`: ObjectId&#10;- `name`: string (客户名称)&#10;- `status`: 'active' | 'inactive'"
                                rows={8}
                                className="font-mono text-sm"
                                value={formData.fields}
                                onChange={(e) =>
                                    setFormData({ ...formData, fields: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="relations">关联关系 (Markdown)</Label>
                            <Textarea
                                id="relations"
                                placeholder="- `projects`: 通过 clientId 关联&#10;- `quotations`: 通过 clientId 关联"
                                rows={4}
                                className="font-mono text-sm"
                                value={formData.relations}
                                onChange={(e) =>
                                    setFormData({ ...formData, relations: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="queryExamples">查询示例 (Markdown)</Label>
                            <Textarea
                                id="queryExamples"
                                placeholder="提供一些常用的查询示例..."
                                rows={4}
                                className="font-mono text-sm"
                                value={formData.queryExamples}
                                onChange={(e) =>
                                    setFormData({ ...formData, queryExamples: e.target.value })
                                }
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="enabled">启用</Label>
                            <Switch
                                id="enabled"
                                checked={formData.enabled}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, enabled: checked })
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingModel ? '保存' : '添加'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 删除确认 */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            删除后无法恢复，确定要删除这个数据模型吗？
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

