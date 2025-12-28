/**
 * AI 样例模板管理页面
 */

'use client';

import { useState } from 'react';
import { Plus, FileCode, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
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
    useAiTemplates,
    useCreateAiTemplate,
    useUpdateAiTemplate,
    useDeleteAiTemplate,
} from '@/hooks/queries/use-ai-config';
import type { AiTemplate } from '@/api/ai-config';
import { AiSettingsNav } from '../_components/ai-settings-nav';

export default function AiTemplatesPage() {
    const { data: templates, isLoading } = useAiTemplates();
    const createMutation = useCreateAiTemplate();
    const updateMutation = useUpdateAiTemplate();
    const deleteMutation = useDeleteAiTemplate();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<AiTemplate | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        templateId: '',
        name: '',
        scenario: '',
        template: '',
        tags: [] as string[],
        enabled: true,
    });
    const [tagsInput, setTagsInput] = useState('');

    const handleAdd = () => {
        setEditingTemplate(null);
        setFormData({
            templateId: '',
            name: '',
            scenario: '',
            template: '',
            tags: [],
            enabled: true,
        });
        setTagsInput('');
        setModalOpen(true);
    };

    const handleEdit = (template: AiTemplate) => {
        setEditingTemplate(template);
        setFormData({
            templateId: template.templateId,
            name: template.name,
            scenario: template.scenario || '',
            template: template.template || '',
            tags: template.tags || [],
            enabled: template.enabled,
        });
        setTagsInput((template.tags || []).join(', '));
        setModalOpen(true);
    };

    const handleToggle = async (template: AiTemplate) => {
        await updateMutation.mutateAsync({
            id: template._id,
            data: { enabled: !template.enabled },
        });
    };

    const handleSubmit = async () => {
        const tags = tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        const data = { ...formData, tags };

        if (editingTemplate) {
            await updateMutation.mutateAsync({
                id: editingTemplate._id,
                data,
            });
        } else {
            await createMutation.mutateAsync(data);
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
                title="AI 样例模板"
                description="定义 AI 输出的格式模板，确保输出一致性和可读性"
            >
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加模板
                </Button>
            </PageHeader>

            <AiSettingsNav />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates?.map((template) => (
                    <Card key={template._id} className={!template.enabled ? 'opacity-60' : ''}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileCode className="h-4 w-4" />
                                    {template.name}
                                </CardTitle>
                                <Badge variant={template.enabled ? 'default' : 'secondary'}>
                                    {template.enabled ? '启用' : '禁用'}
                                </Badge>
                            </div>
                            <CardDescription className="font-mono text-xs">
                                {template.templateId}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {template.scenario || '暂无使用场景描述'}
                            </p>
                            {template.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {template.tags.map((tag) => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEdit(template)}
                                    >
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setDeleteId(template._id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggle(template)}
                                >
                                    {template.enabled ? (
                                        <ToggleRight className="h-4 w-4 text-primary" />
                                    ) : (
                                        <ToggleLeft className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {!templates?.length && (
                    <Card className="col-span-full">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileCode className="h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-muted-foreground">暂无样例模板配置</p>
                            <Button className="mt-4" onClick={handleAdd}>
                                <Plus className="mr-2 h-4 w-4" />
                                添加第一个样例模板
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
                            {editingTemplate ? '编辑样例模板' : '添加样例模板'}
                        </DialogTitle>
                        <DialogDescription>
                            定义输出模板的格式和使用场景
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="templateId">模板 ID</Label>
                                <Input
                                    id="templateId"
                                    placeholder="如：client_info_table"
                                    value={formData.templateId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, templateId: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">模板名称</Label>
                                <Input
                                    id="name"
                                    placeholder="如：客户信息表格"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="scenario">使用场景</Label>
                            <Input
                                id="scenario"
                                placeholder="如：查询客户信息时使用"
                                value={formData.scenario}
                                onChange={(e) =>
                                    setFormData({ ...formData, scenario: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="template">模板内容 (Markdown)</Label>
                            <Textarea
                                id="template"
                                placeholder="### 客户信息&#10;| 字段 | 内容 |&#10;|---|---|&#10;| 客户名称 | {{name}} |&#10;..."
                                rows={12}
                                className="font-mono text-sm"
                                value={formData.template}
                                onChange={(e) =>
                                    setFormData({ ...formData, template: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tags">标签（逗号分隔）</Label>
                            <Input
                                id="tags"
                                placeholder="如：客户, 表格, 查询"
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
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
                            {editingTemplate ? '保存' : '添加'}
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
                            删除后无法恢复，确定要删除这个样例模板吗？
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

