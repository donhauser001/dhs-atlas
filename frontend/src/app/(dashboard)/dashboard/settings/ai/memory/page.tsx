/**
 * AI 记忆管理页面
 * 
 * 功能：
 * - 查看暂存记忆（待确认）
 * - 确认/拒绝暂存记忆
 * - 管理关键记忆（增删改）
 * - 查看记忆统计
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Brain,
    Clock,
    CheckCircle2,
    XCircle,
    Plus,
    Trash2,
    Edit2,
    RefreshCw,
    Star,
    AlertCircle,
    ChevronRight,
    User,
    Briefcase,
    Settings,
    Shield,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { AiSettingsNav } from '../_components/ai-settings-nav';
import api from '@/lib/axios';
import { toast } from 'sonner';

// ============================================================================
// 类型定义
// ============================================================================

type MemoryType = 'preference' | 'project' | 'role' | 'boundary';
type MemorySource = 'user_input' | 'ai_proposal' | 'system';

interface StagingMemory {
    _id: string;
    userId: string;
    content: string;
    memoryType: MemoryType;
    sourceEventId?: string;
    sourceQuote?: string;
    status: 'pending' | 'confirmed' | 'rejected';
    expiresAt: string;
    createdAt: string;
}

interface KeyMemory {
    _id: string;
    userId: string;
    content: string;
    memoryType: MemoryType;
    source: MemorySource;
    isActive: boolean;
    useCount: number;
    lastUsedAt?: string;
    createdAt: string;
    updatedAt: string;
}

interface MemoryStats {
    total: number;
    active: number;
    inactive: number;
    byType: Array<{ type: MemoryType; count: number }>;
    bySource: Array<{ source: MemorySource; count: number }>;
    mostUsed: Array<{ id: string; content: string; useCount: number }>;
}

// ============================================================================
// 辅助函数
// ============================================================================

const memoryTypeLabels: Record<MemoryType, { label: string; icon: React.ElementType; color: string }> = {
    preference: { label: '偏好', icon: Settings, color: 'bg-blue-100 text-blue-800' },
    project: { label: '项目', icon: Briefcase, color: 'bg-green-100 text-green-800' },
    role: { label: '角色', icon: User, color: 'bg-purple-100 text-purple-800' },
    boundary: { label: '边界', icon: Shield, color: 'bg-orange-100 text-orange-800' },
};

const memorySourceLabels: Record<MemorySource, string> = {
    user_input: '用户输入',
    ai_proposal: 'AI 提议',
    system: '系统',
};

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatExpiresIn(expiresAt: string): string {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return '已过期';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}天后过期`;
    return `${hours}小时后过期`;
}

// ============================================================================
// 主组件
// ============================================================================

export default function MemoryPage() {
    // 状态
    const [loading, setLoading] = useState(true);
    const [stagingMemories, setStagingMemories] = useState<StagingMemory[]>([]);
    const [keyMemories, setKeyMemories] = useState<KeyMemory[]>([]);
    const [stats, setStats] = useState<MemoryStats | null>(null);
    const [activeTab, setActiveTab] = useState('staging');
    
    // 筛选
    const [typeFilter, setTypeFilter] = useState<string>('all');
    
    // 对话框
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedMemory, setSelectedMemory] = useState<KeyMemory | null>(null);
    
    // 表单
    const [formContent, setFormContent] = useState('');
    const [formType, setFormType] = useState<MemoryType>('preference');

    // ========================================================================
    // 数据加载
    // ========================================================================

    const loadStagingMemories = useCallback(async () => {
        try {
            const response = await api.get('/memory/staging');
            setStagingMemories(response.data.memories || []);
        } catch (error) {
            console.error('加载暂存记忆失败:', error);
            toast.error('加载暂存记忆失败');
        }
    }, []);

    const loadKeyMemories = useCallback(async () => {
        try {
            const response = await api.get('/memory/key');
            setKeyMemories(response.data.memories || []);
        } catch (error) {
            console.error('加载关键记忆失败:', error);
            toast.error('加载关键记忆失败');
        }
    }, []);

    const loadStats = useCallback(async () => {
        try {
            const response = await api.get('/memory/key/stats');
            setStats(response.data);
        } catch (error) {
            console.error('加载统计失败:', error);
        }
    }, []);

    const loadAll = useCallback(async () => {
        setLoading(true);
        await Promise.all([loadStagingMemories(), loadKeyMemories(), loadStats()]);
        setLoading(false);
    }, [loadStagingMemories, loadKeyMemories, loadStats]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // ========================================================================
    // 暂存记忆操作
    // ========================================================================

    const handlePromoteMemory = async (id: string) => {
        try {
            await api.post(`/memory/staging/${id}/promote`);
            toast.success('记忆已确认并保存');
            await loadAll();
        } catch (error) {
            console.error('确认记忆失败:', error);
            toast.error('确认记忆失败');
        }
    };

    const handleRejectMemory = async (id: string) => {
        try {
            await api.delete(`/memory/staging/${id}`);
            toast.success('记忆已拒绝');
            await loadStagingMemories();
        } catch (error) {
            console.error('拒绝记忆失败:', error);
            toast.error('拒绝记忆失败');
        }
    };

    // ========================================================================
    // 关键记忆操作
    // ========================================================================

    const handleAddMemory = () => {
        setSelectedMemory(null);
        setFormContent('');
        setFormType('preference');
        setEditDialogOpen(true);
    };

    const handleEditMemory = (memory: KeyMemory) => {
        setSelectedMemory(memory);
        setFormContent(memory.content);
        setFormType(memory.memoryType);
        setEditDialogOpen(true);
    };

    const handleSaveMemory = async () => {
        if (!formContent.trim()) {
            toast.error('请输入记忆内容');
            return;
        }

        try {
            if (selectedMemory) {
                // 更新
                await api.put(`/memory/key/${selectedMemory._id}`, {
                    content: formContent,
                    memoryType: formType,
                });
                toast.success('记忆已更新');
            } else {
                // 创建
                await api.post('/memory/key', {
                    content: formContent,
                    memoryType: formType,
                });
                toast.success('记忆已添加');
            }
            setEditDialogOpen(false);
            await loadAll();
        } catch (error) {
            console.error('保存记忆失败:', error);
            toast.error('保存记忆失败');
        }
    };

    const handleDeleteMemory = async () => {
        if (!selectedMemory) return;

        try {
            await api.delete(`/memory/key/${selectedMemory._id}`);
            toast.success('记忆已删除');
            setDeleteDialogOpen(false);
            setSelectedMemory(null);
            await loadAll();
        } catch (error) {
            console.error('删除记忆失败:', error);
            toast.error('删除记忆失败');
        }
    };

    const confirmDelete = (memory: KeyMemory) => {
        setSelectedMemory(memory);
        setDeleteDialogOpen(true);
    };

    // ========================================================================
    // 筛选
    // ========================================================================

    const filteredKeyMemories = keyMemories.filter(m => {
        if (typeFilter !== 'all' && m.memoryType !== typeFilter) return false;
        return true;
    });

    // ========================================================================
    // 渲染
    // ========================================================================

    if (loading) {
        return <PageLoading />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="AI 记忆"
                description="管理 AI 对你的了解，包括偏好、项目信息、角色定义和边界约束"
            />

            <AiSettingsNav />

            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">待确认记忆</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stagingMemories.length}</div>
                        <p className="text-xs text-muted-foreground">
                            AI 提议的记忆，等待你的确认
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">已确认记忆</CardTitle>
                        <Brain className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.active || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            AI 会在对话中使用这些记忆
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">最常使用</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.mostUsed?.[0]?.useCount || 0}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                            {stats?.mostUsed?.[0]?.content || '暂无数据'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">记忆分布</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-1">
                            {stats?.byType?.map(item => (
                                <Badge
                                    key={item.type}
                                    variant="secondary"
                                    className={memoryTypeLabels[item.type]?.color}
                                >
                                    {memoryTypeLabels[item.type]?.label}: {item.count}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 标签页 */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="staging" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            待确认
                            {stagingMemories.length > 0 && (
                                <Badge variant="destructive" className="ml-1">
                                    {stagingMemories.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="confirmed" className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            已确认记忆
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadAll}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            刷新
                        </Button>
                        {activeTab === 'confirmed' && (
                            <Button size="sm" onClick={handleAddMemory}>
                                <Plus className="h-4 w-4 mr-2" />
                                添加记忆
                            </Button>
                        )}
                    </div>
                </div>

                {/* 待确认记忆 */}
                <TabsContent value="staging" className="mt-4">
                    {stagingMemories.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">没有待确认的记忆</h3>
                                <p className="text-muted-foreground text-center max-w-md">
                                    当 AI 在对话中发现值得记住的信息时，会提议添加到这里。
                                    你可以选择确认或拒绝这些提议。
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {stagingMemories.map(memory => {
                                const typeInfo = memoryTypeLabels[memory.memoryType];
                                const TypeIcon = typeInfo?.icon || Settings;
                                
                                return (
                                    <Card key={memory._id} className="border-l-4 border-l-orange-400">
                                        <CardContent className="py-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge className={typeInfo?.color}>
                                                            <TypeIcon className="h-3 w-3 mr-1" />
                                                            {typeInfo?.label}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatExpiresIn(memory.expiresAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm mb-2">{memory.content}</p>
                                                    {memory.sourceQuote && (
                                                        <p className="text-xs text-muted-foreground italic border-l-2 pl-2">
                                                            来源: &quot;{memory.sourceQuote}&quot;
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleRejectMemory(memory._id)}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        拒绝
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handlePromoteMemory(memory._id)}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                                        确认
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* 已确认记忆 */}
                <TabsContent value="confirmed" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>关键记忆</CardTitle>
                                    <CardDescription>
                                        这些是 AI 在对话时会参考的长期记忆
                                    </CardDescription>
                                </div>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="筛选类型" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">全部类型</SelectItem>
                                        <SelectItem value="preference">偏好</SelectItem>
                                        <SelectItem value="project">项目</SelectItem>
                                        <SelectItem value="role">角色</SelectItem>
                                        <SelectItem value="boundary">边界</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredKeyMemories.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium mb-2">暂无记忆</h3>
                                    <p className="text-muted-foreground text-center max-w-md mb-4">
                                        添加一些记忆，让 AI 更好地了解你的偏好和工作方式
                                    </p>
                                    <Button onClick={handleAddMemory}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        添加第一条记忆
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">类型</TableHead>
                                            <TableHead>内容</TableHead>
                                            <TableHead className="w-[80px]">使用</TableHead>
                                            <TableHead className="w-[100px]">来源</TableHead>
                                            <TableHead className="w-[120px]">更新时间</TableHead>
                                            <TableHead className="w-[100px] text-right">操作</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredKeyMemories.map(memory => {
                                            const typeInfo = memoryTypeLabels[memory.memoryType];
                                            const TypeIcon = typeInfo?.icon || Settings;
                                            
                                            return (
                                                <TableRow key={memory._id}>
                                                    <TableCell>
                                                        <Badge className={typeInfo?.color}>
                                                            <TypeIcon className="h-3 w-3 mr-1" />
                                                            {typeInfo?.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-[400px]">
                                                        <p className="truncate">{memory.content}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-muted-foreground">
                                                            {memory.useCount}次
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-xs text-muted-foreground">
                                                            {memorySourceLabels[memory.source]}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {formatDate(memory.updatedAt)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEditMemory(memory)}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => confirmDelete(memory)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* 编辑对话框 */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedMemory ? '编辑记忆' : '添加记忆'}
                        </DialogTitle>
                        <DialogDescription>
                            添加或编辑 AI 应该记住的信息
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">记忆类型</label>
                            <Select value={formType} onValueChange={(v) => setFormType(v as MemoryType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="preference">
                                        <div className="flex items-center gap-2">
                                            <Settings className="h-4 w-4" />
                                            偏好 - 你的工作习惯和喜好
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="project">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4" />
                                            项目 - 当前项目的重要信息
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="role">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            角色 - 你的职责和权限
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="boundary">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            边界 - AI 不应该做的事情
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">记忆内容</label>
                            <Textarea
                                value={formContent}
                                onChange={(e) => setFormContent(e.target.value)}
                                placeholder="例如：我喜欢简洁的报告格式，不需要太多细节"
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSaveMemory}>
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 删除确认对话框 */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除这条记忆吗？删除后 AI 将不再记住这些信息。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteMemory}>
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

