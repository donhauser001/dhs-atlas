/**
 * AI 工具集管理页面
 * 
 * 支持配置工具的元数据和执行逻辑
 */

'use client';

import { useState, useMemo } from 'react';
import { Plus, Wrench, Edit2, Trash2, ToggleLeft, ToggleRight, Code, CheckCircle, AlertCircle } from 'lucide-react';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    useAiTools,
    useCreateAiTool,
    useUpdateAiTool,
    useDeleteAiTool,
} from '@/hooks/queries/use-ai-config';
import type { AiTool } from '@/api/ai-config';
import { AiSettingsNav } from '../_components/ai-settings-nav';

// 预设工具分类
const TOOL_CATEGORIES = [
    { value: 'system', label: '系统 (System)' },
    { value: 'database', label: '数据库 (Database)' },
    { value: 'contract', label: '合同 (Contract)' },
    { value: 'crm', label: '客户关系 (CRM)' },
    { value: 'project', label: '项目 (Project)' },
    { value: 'finance', label: '财务 (Finance)' },
    { value: 'content', label: '内容 (Content)' },
    { value: 'ui', label: '界面 (UI)' },
    { value: 'general', label: '通用 (General)' },
];

interface FormData {
    toolId: string;
    name: string;
    description: string;
    usage: string;
    examples: string;
    category: string;
    enabled: boolean;
    execution: string;
    paramsSchema: string;
}

export default function AiToolsPage() {
    const { data: tools, isLoading } = useAiTools();
    const createMutation = useCreateAiTool();
    const updateMutation = useUpdateAiTool();
    const deleteMutation = useDeleteAiTool();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingTool, setEditingTool] = useState<AiTool | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('basic');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        toolId: '',
        name: '',
        description: '',
        usage: '',
        examples: '',
        category: '',
        enabled: true,
        execution: '',
        paramsSchema: '',
    });

    // 验证 JSON 格式
    const validateJson = (value: string, fieldName: string): boolean => {
        if (!value.trim()) return true;
        try {
            JSON.parse(value);
            setJsonError(null);
            return true;
        } catch (e) {
            setJsonError(`${fieldName} JSON 格式错误: ${(e as Error).message}`);
            return false;
        }
    };

    const handleAdd = () => {
        setEditingTool(null);
        setActiveTab('basic');
        setJsonError(null);
        setFormData({
            toolId: '',
            name: '',
            description: '',
            usage: '',
            examples: '',
            category: '',
            enabled: true,
            execution: '',
            paramsSchema: '',
        });
        setModalOpen(true);
    };

    const handleEdit = (tool: AiTool) => {
        setEditingTool(tool);
        setActiveTab('basic');
        setJsonError(null);
        setFormData({
            toolId: tool.toolId,
            name: tool.name,
            description: tool.description,
            usage: tool.usage || '',
            examples: tool.examples || '',
            category: tool.category || '',
            enabled: tool.enabled,
            execution: tool.execution ? JSON.stringify(tool.execution, null, 2) : '',
            paramsSchema: tool.paramsSchema ? JSON.stringify(tool.paramsSchema, null, 2) : '',
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
        // 验证 JSON 字段
        if (formData.execution && !validateJson(formData.execution, '执行配置')) {
            return;
        }
        if (formData.paramsSchema && !validateJson(formData.paramsSchema, '参数 Schema')) {
            return;
        }

        const submitData: Record<string, unknown> = {
            toolId: formData.toolId,
            name: formData.name,
            description: formData.description,
            usage: formData.usage,
            examples: formData.examples,
            category: formData.category,
            enabled: formData.enabled,
        };

        // 解析 JSON 字段
        if (formData.execution.trim()) {
            submitData.execution = JSON.parse(formData.execution);
        }
        if (formData.paramsSchema.trim()) {
            submitData.paramsSchema = JSON.parse(formData.paramsSchema);
        }

        if (editingTool) {
            await updateMutation.mutateAsync({
                id: editingTool._id,
                data: submitData,
            });
        } else {
            await createMutation.mutateAsync(submitData);
        }
        setModalOpen(false);
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    // 按分类分组工具
    const groupedTools = useMemo(() => {
        if (!tools) return {};
        return tools.reduce((acc, tool) => {
            const category = tool.category || 'general';
            if (!acc[category]) acc[category] = [];
            acc[category].push(tool);
            return acc;
        }, {} as Record<string, AiTool[]>);
    }, [tools]);

    if (isLoading) {
        return <PageLoading />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="AI 工具集"
                description="管理 AI 可调用的工具，定义工具的功能、调用方式和执行逻辑"
            >
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加工具
                </Button>
            </PageHeader>

            <AiSettingsNav />

            {/* 按分类显示工具 */}
            {Object.entries(groupedTools).map(([category, categoryTools]) => (
                <div key={category} className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {category}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {categoryTools.map((tool) => (
                            <Card key={tool._id} className={!tool.enabled ? 'opacity-60' : ''}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Wrench className="h-4 w-4" />
                                            {tool.name}
                                        </CardTitle>
                                        <div className="flex items-center gap-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        {tool.execution ? (
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                                                        )}
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {tool.execution ? '已配置执行逻辑' : '未配置执行逻辑'}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <Badge variant={tool.enabled ? 'default' : 'secondary'}>
                                                {tool.enabled ? '启用' : '禁用'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardDescription className="font-mono text-xs">
                                        {tool.toolId}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {tool.description}
                                    </p>
                                    {tool.execution && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Code className="h-3 w-3" />
                                            <span>
                                                {tool.execution.type === 'pipeline' 
                                                    ? `管道模式 (${tool.execution.steps?.length || 0} 步骤)` 
                                                    : `简单模式 (${tool.execution.operation || 'find'})`
                                                }
                                            </span>
                                        </div>
                                    )}
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
                    </div>
                </div>
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

            {/* 编辑/新增弹窗 */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTool ? '编辑工具' : '添加工具'}
                        </DialogTitle>
                        <DialogDescription>
                            定义工具的元数据和执行逻辑，配置执行逻辑后工具可被 AI 自动调用
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic">基本信息</TabsTrigger>
                            <TabsTrigger value="usage">使用说明</TabsTrigger>
                            <TabsTrigger value="execution">执行配置</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="toolId">工具 ID</Label>
                                    <Input
                                        id="toolId"
                                        placeholder="如：contract.template.list"
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
                                        placeholder="如：获取合同范本列表"
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
                                    placeholder="描述工具的用途和功能，这会出现在 AI 的 system prompt 中..."
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Label htmlFor="category">分类</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, category: value })
                                        }
                                    >
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="选择分类" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TOOL_CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                        </TabsContent>

                        <TabsContent value="usage" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="usage">调用方式 (Markdown)</Label>
                                <Textarea
                                    id="usage"
                                    placeholder="```tool_call&#10;{&quot;toolId&quot;: &quot;contract.template.list&quot;, &quot;params&quot;: {...}}&#10;```"
                                    rows={8}
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
                                    rows={6}
                                    className="font-mono text-sm"
                                    value={formData.examples}
                                    onChange={(e) =>
                                        setFormData({ ...formData, examples: e.target.value })
                                    }
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="execution" className="space-y-4 mt-4">
                            <div className="rounded-md bg-muted/50 p-3 text-sm">
                                <p className="font-medium">执行配置说明</p>
                                <p className="text-muted-foreground mt-1">
                                    配置工具的执行逻辑，支持声明式定义。配置后工具可被 AI 自动调用执行。
                                </p>
                                <ul className="text-muted-foreground mt-2 list-disc list-inside space-y-1">
                                    <li><code>type: &quot;simple&quot;</code> - 单步数据库操作</li>
                                    <li><code>type: &quot;pipeline&quot;</code> - 多步骤流程</li>
                                    <li>支持模板变量：<code>{"{{params.xxx}}"}</code>, <code>{"{{steps.stepName.xxx}}"}</code></li>
                                </ul>
                            </div>

                            {jsonError && (
                                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                    {jsonError}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="execution">执行配置 (JSON)</Label>
                                <Textarea
                                    id="execution"
                                    placeholder={`{
  "type": "simple",
  "collection": "contracttemplates",
  "operation": "find",
  "query": { "status": "{{params.status}}" },
  "limit": "{{params.limit || 20}}"
}`}
                                    rows={12}
                                    className="font-mono text-sm"
                                    value={formData.execution}
                                    onChange={(e) => {
                                        setFormData({ ...formData, execution: e.target.value });
                                        if (e.target.value.trim()) {
                                            validateJson(e.target.value, '执行配置');
                                        } else {
                                            setJsonError(null);
                                        }
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paramsSchema">参数 Schema (JSON Schema)</Label>
                                <Textarea
                                    id="paramsSchema"
                                    placeholder={`{
  "type": "object",
  "properties": {
    "status": { "type": "string", "enum": ["active", "inactive"] },
    "limit": { "type": "number", "default": 20 }
  }
}`}
                                    rows={8}
                                    className="font-mono text-sm"
                                    value={formData.paramsSchema}
                                    onChange={(e) => {
                                        setFormData({ ...formData, paramsSchema: e.target.value });
                                        if (e.target.value.trim()) {
                                            validateJson(e.target.value, '参数 Schema');
                                        } else {
                                            setJsonError(null);
                                        }
                                    }}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSubmit} disabled={!!jsonError}>
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

