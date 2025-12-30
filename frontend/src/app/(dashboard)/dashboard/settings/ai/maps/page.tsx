/**
 * AI 地图管理页面
 * 
 * 定义场景与工具、数据、模板的映射关系
 */

'use client';

import { useState } from 'react';
import { Plus, Map, Edit2, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    useAiMaps,
    useCreateAiMap,
    useUpdateAiMap,
    useDeleteAiMap,
    useAiTools,
    useAiDataModels,
    useAiTemplates,
} from '@/hooks/queries/use-ai-config';
import type { AiMap, AiMapStep } from '@/api/ai-config';
import { AiSettingsNav } from '../_components/ai-settings-nav';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const defaultStep: AiMapStep = {
    order: 1,
    action: '',
    toolId: '',
    dataModel: '',
    templateId: '',
    condition: '',
    note: '',
};

export default function AiMapsPage() {
    const { data: maps, isLoading } = useAiMaps();
    const { data: tools } = useAiTools();
    const { data: templates } = useAiTemplates();
    // V2 架构：DataModel 已被 DataMapService 替代
    const dataModels: Array<{ _id: string; name: string; collection: string }> = [];
    const createMutation = useCreateAiMap();
    const updateMutation = useUpdateAiMap();
    const deleteMutation = useDeleteAiMap();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingMap, setEditingMap] = useState<AiMap | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [expandedMap, setExpandedMap] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        mapId: '',
        name: '',
        description: '',
        triggers: [] as string[],
        steps: [{ ...defaultStep }] as AiMapStep[],
        examples: '',
        enabled: true,
        priority: 0,
        module: 'general',
    });
    const [triggersInput, setTriggersInput] = useState('');

    const handleAdd = () => {
        setEditingMap(null);
        setFormData({
            mapId: '',
            name: '',
            description: '',
            triggers: [],
            steps: [{ ...defaultStep }],
            examples: '',
            enabled: true,
            priority: 0,
            module: 'general',
        });
        setTriggersInput('');
        setModalOpen(true);
    };

    const handleEdit = (map: AiMap) => {
        setEditingMap(map);
        setFormData({
            mapId: map.mapId,
            name: map.name,
            description: map.description || '',
            triggers: map.triggers || [],
            steps: map.steps?.length ? map.steps : [{ ...defaultStep }],
            examples: map.examples || '',
            enabled: map.enabled,
            priority: map.priority || 0,
            module: map.module || 'general',
        });
        setTriggersInput((map.triggers || []).join(', '));
        setModalOpen(true);
    };

    const handleToggle = async (map: AiMap) => {
        await updateMutation.mutateAsync({
            id: map._id,
            data: { enabled: !map.enabled },
        });
    };

    const handleAddStep = () => {
        setFormData({
            ...formData,
            steps: [
                ...formData.steps,
                { ...defaultStep, order: formData.steps.length + 1 },
            ],
        });
    };

    const handleRemoveStep = (index: number) => {
        const newSteps = formData.steps.filter((_, i) => i !== index);
        // 重新排序
        newSteps.forEach((step, i) => {
            step.order = i + 1;
        });
        setFormData({ ...formData, steps: newSteps });
    };

    const handleStepChange = (index: number, field: keyof AiMapStep, value: string | number) => {
        const newSteps = [...formData.steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setFormData({ ...formData, steps: newSteps });
    };

    const handleSubmit = async () => {
        const triggers = triggersInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        const data = { ...formData, triggers };

        if (editingMap) {
            await updateMutation.mutateAsync({
                id: editingMap._id,
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
                title="AI 地图"
                description="定义场景与工具、数据、模板的映射关系，指导 AI 如何处理特定任务"
            >
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加地图
                </Button>
            </PageHeader>

            <AiSettingsNav />

            <div className="space-y-4">
                {maps?.map((map) => (
                    <Card key={map._id} className={!map.enabled ? 'opacity-60' : ''}>
                        <Collapsible
                            open={expandedMap === map._id}
                            onOpenChange={(open) => setExpandedMap(open ? map._id : null)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm" className="p-0 h-auto">
                                                {expandedMap === map._id ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </CollapsibleTrigger>
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <Map className="h-4 w-4" />
                                                {map.name}
                                            </CardTitle>
                                            <CardDescription className="font-mono text-xs mt-1">
                                                {map.mapId}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{map.module}</Badge>
                                        <Badge variant={map.enabled ? 'default' : 'secondary'}>
                                            {map.enabled ? '启用' : '禁用'}
                                        </Badge>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEdit(map)}
                                        >
                                            <Edit2 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setDeleteId(map._id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleToggle(map)}
                                        >
                                            {map.enabled ? (
                                                <ToggleRight className="h-4 w-4 text-primary" />
                                            ) : (
                                                <ToggleLeft className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {map.description}
                                </p>
                                {map.triggers?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {map.triggers.map((trigger) => (
                                            <Badge key={trigger} variant="secondary" className="text-xs">
                                                {trigger}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardHeader>
                            <CollapsibleContent>
                                <CardContent className="pt-0">
                                    <div className="border-t pt-4">
                                        <h4 className="text-sm font-medium mb-3">执行步骤</h4>
                                        <div className="space-y-2">
                                            {map.steps?.map((step, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                                                >
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                                                        {step.order}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-sm font-medium">{step.action}</p>
                                                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                            {step.toolId && (
                                                                <span className="bg-background px-2 py-0.5 rounded">
                                                                    工具: {step.toolId}
                                                                </span>
                                                            )}
                                                            {step.dataModel && (
                                                                <span className="bg-background px-2 py-0.5 rounded">
                                                                    数据: {step.dataModel}
                                                                </span>
                                                            )}
                                                            {step.templateId && (
                                                                <span className="bg-background px-2 py-0.5 rounded">
                                                                    模板: {step.templateId}
                                                                </span>
                                                            )}
                                                            {step.condition && (
                                                                <span className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded">
                                                                    条件: {step.condition}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {step.note && (
                                                            <p className="text-xs text-muted-foreground italic">
                                                                {step.note}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>
                ))}

                {!maps?.length && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Map className="h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-muted-foreground">暂无 AI 地图配置</p>
                            <Button className="mt-4" onClick={handleAdd}>
                                <Plus className="mr-2 h-4 w-4" />
                                添加第一个地图
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* 编辑/新增弹窗 */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingMap ? '编辑 AI 地图' : '添加 AI 地图'}
                        </DialogTitle>
                        <DialogDescription>
                            定义场景触发词和执行步骤
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="mapId">地图 ID</Label>
                                <Input
                                    id="mapId"
                                    placeholder="如：query_client"
                                    value={formData.mapId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, mapId: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">地图名称</Label>
                                <Input
                                    id="name"
                                    placeholder="如：查询客户"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="module">所属模块</Label>
                                <Input
                                    id="module"
                                    placeholder="如：crm, project"
                                    value={formData.module}
                                    onChange={(e) =>
                                        setFormData({ ...formData, module: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">场景描述</Label>
                            <Input
                                id="description"
                                placeholder="描述这个地图适用的场景..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="triggers">触发关键词（逗号分隔）</Label>
                            <Input
                                id="triggers"
                                placeholder="如：查询客户, 找客户, 搜索客户"
                                value={triggersInput}
                                onChange={(e) => setTriggersInput(e.target.value)}
                            />
                        </div>

                        {/* 步骤编辑器 */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>执行步骤</Label>
                                <Button size="sm" variant="outline" onClick={handleAddStep}>
                                    <Plus className="h-3 w-3 mr-1" />
                                    添加步骤
                                </Button>
                            </div>
                            {formData.steps.map((step, index) => (
                                <div
                                    key={index}
                                    className="border rounded-lg p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">步骤 {index + 1}</span>
                                        {formData.steps.length > 1 && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleRemoveStep(index)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2 space-y-2">
                                            <Label>动作描述</Label>
                                            <Input
                                                placeholder="如：使用 db.query 查询客户表"
                                                value={step.action}
                                                onChange={(e) =>
                                                    handleStepChange(index, 'action', e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>工具 ID</Label>
                                            <Select
                                                value={step.toolId || ''}
                                                onValueChange={(value) =>
                                                    handleStepChange(index, 'toolId', value === '_none_' ? '' : value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择工具" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="_none_">无</SelectItem>
                                                    {tools?.map((tool) => (
                                                        <SelectItem key={tool._id} value={tool.toolId}>
                                                            {tool.name} ({tool.toolId})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>数据模型</Label>
                                            <Select
                                                value={step.dataModel || ''}
                                                onValueChange={(value) =>
                                                    handleStepChange(index, 'dataModel', value === '_none_' ? '' : value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择数据模型" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="_none_">无</SelectItem>
                                                    {dataModels?.map((model) => (
                                                        <SelectItem key={model._id} value={model.collection}>
                                                            {model.name} ({model.collection})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>输出模板</Label>
                                            <Select
                                                value={step.templateId || ''}
                                                onValueChange={(value) =>
                                                    handleStepChange(index, 'templateId', value === '_none_' ? '' : value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择模板" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="_none_">无</SelectItem>
                                                    {templates?.map((template) => (
                                                        <SelectItem key={template._id} value={template.templateId}>
                                                            {template.name} ({template.templateId})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>条件</Label>
                                            <Input
                                                placeholder="如：结果为空时"
                                                value={step.condition || ''}
                                                onChange={(e) =>
                                                    handleStepChange(index, 'condition', e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>备注</Label>
                                            <Input
                                                placeholder="步骤说明..."
                                                value={step.note || ''}
                                                onChange={(e) =>
                                                    handleStepChange(index, 'note', e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="examples">完整示例 (Markdown)</Label>
                            <Textarea
                                id="examples"
                                placeholder="提供一个完整的对话示例..."
                                rows={6}
                                className="font-mono text-sm"
                                value={formData.examples}
                                onChange={(e) =>
                                    setFormData({ ...formData, examples: e.target.value })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Label htmlFor="priority">优先级</Label>
                                <Input
                                    id="priority"
                                    type="number"
                                    className="w-24"
                                    value={formData.priority}
                                    onChange={(e) =>
                                        setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
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
                            {editingMap ? '保存' : '添加'}
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
                            删除后无法恢复，确定要删除这个 AI 地图吗？
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

