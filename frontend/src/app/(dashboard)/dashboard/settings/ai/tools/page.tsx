/**
 * AI 工具集管理页面
 */

'use client';

import { useState } from 'react';
import { Plus, Wrench, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
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
    useAiTools,
    useCreateAiTool,
    useUpdateAiTool,
    useDeleteAiTool,
} from '@/hooks/queries/use-ai-config';
import type { AiTool } from '@/api/ai-config';
import { AiSettingsNav } from '../_components/ai-settings-nav';

export default function AiToolsPage() {
    const { data: tools, isLoading } = useAiTools();
    const createMutation = useCreateAiTool();
    const updateMutation = useUpdateAiTool();
    const deleteMutation = useDeleteAiTool();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingTool, setEditingTool] = useState<AiTool | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        toolId: '',
        name: '',
        description: '',
        usage: '',
        examples: '',
        category: '',
        enabled: true,
    });

    const handleAdd = () => {
        setEditingTool(null);
        setFormData({
            toolId: '',
            name: '',
            description: '',
            usage: '',
            examples: '',
            category: '',
            enabled: true,
        });
        setModalOpen(true);
    };

    const handleEdit = (tool: AiTool) => {
        setEditingTool(tool);
        setFormData({
            toolId: tool.toolId,
            name: tool.name,
            description: tool.description,
            usage: tool.usage || '',
            examples: tool.examples || '',
            category: tool.category || '',
            enabled: tool.enabled,
        });
        setModalOpen(true);
    };

    const handleToggle = async (tool: AiTool) => {
        await updateMutation.mutateAsync({
            id: tool._id,
            data: { enabled: !tool.enabled },
        });
    };

    const handleSubmit = async () => {
        if (editingTool) {
            await updateMutation.mutateAsync({
                id: editingTool._id,
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
                title="AI 工具集"
                description="管理 AI 可调用的工具，定义工具的功能和调用方式"
            >
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加工具
                </Button>
            </PageHeader>

            <AiSettingsNav />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tools?.map((tool) => (
                    <Card key={tool._id} className={!tool.enabled ? 'opacity-60' : ''}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Wrench className="h-4 w-4" />
                                    {tool.name}
                                </CardTitle>
                                <Badge variant={tool.enabled ? 'default' : 'secondary'}>
                                    {tool.enabled ? '启用' : '禁用'}
                                </Badge>
                            </div>
                            <CardDescription className="font-mono text-xs">
                                {tool.toolId}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {tool.description}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEdit(tool)}
                                    >
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setDeleteId(tool._id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggle(tool)}
                                >
                                    {tool.enabled ? (
                                        <ToggleRight className="h-4 w-4 text-primary" />
                                    ) : (
                                        <ToggleLeft className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {!tools?.length && (
                    <Card className="col-span-full">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Wrench className="h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-muted-foreground">暂无工具配置</p>
                            <Button className="mt-4" onClick={handleAdd}>
                                <Plus className="mr-2 h-4 w-4" />
                                添加第一个工具
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
                            {editingTool ? '编辑工具' : '添加工具'}
                        </DialogTitle>
                        <DialogDescription>
                            定义工具的 ID、名称、描述和调用示例
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="toolId">工具 ID</Label>
                                <Input
                                    id="toolId"
                                    placeholder="如：db.query"
                                    value={formData.toolId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, toolId: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">工具名称</Label>
                                <Input
                                    id="name"
                                    placeholder="如：数据库查询"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">功能描述</Label>
                            <Textarea
                                id="description"
                                placeholder="描述工具的用途和功能..."
                                rows={3}
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="usage">调用方式 (Markdown)</Label>
                            <Textarea
                                id="usage"
                                placeholder="```tool_call&#10;{&quot;toolId&quot;: &quot;db.query&quot;, ...}&#10;```"
                                rows={6}
                                className="font-mono text-sm"
                                value={formData.usage}
                                onChange={(e) =>
                                    setFormData({ ...formData, usage: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="examples">使用示例 (Markdown)</Label>
                            <Textarea
                                id="examples"
                                placeholder="提供一些具体的使用示例..."
                                rows={4}
                                className="font-mono text-sm"
                                value={formData.examples}
                                onChange={(e) =>
                                    setFormData({ ...formData, examples: e.target.value })
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Label htmlFor="category">分类</Label>
                                <Input
                                    id="category"
                                    placeholder="如：database, crm, ui"
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData({ ...formData, category: e.target.value })
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
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingTool ? '保存' : '添加'}
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
                            删除后无法恢复，确定要删除这个工具吗？
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

