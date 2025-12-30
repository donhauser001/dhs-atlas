/**
 * AI 对话历史页面
 * 
 * 功能：
 * - 查看对话会话列表
 * - 查看会话详情
 * - 对话统计分析
 * - 搜索对话内容
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    MessageSquare,
    Search,
    Calendar,
    Clock,
    Bot,
    User,
    Wrench,
    CheckCircle2,
    XCircle,
    ChevronRight,
    RefreshCw,
    BarChart3,
    Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AiSettingsNav } from '../_components/ai-settings-nav';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// 类型定义
// ============================================================================

interface ToolCall {
    toolId: string;
    params: Record<string, unknown>;
    success: boolean;
    reasonCode?: string;
    duration?: number;
}

interface Conversation {
    _id: string;
    userId: string;
    sessionId: string;
    timestamp: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    toolCalls?: ToolCall[];
    module?: string;
    pathname?: string;
}

interface SessionSummary {
    sessionId: string;
    startTime: string;
    endTime: string;
    messageCount: number;
    toolCallCount: number;
    modules: string[];
}

interface ConversationStats {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    totalToolCalls: number;
    successfulToolCalls: number;
    failedToolCalls: number;
    avgMessagesPerSession: number;
    topModules: Array<{ module: string; count: number }>;
}

// ============================================================================
// 辅助函数
// ============================================================================

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatFullDate(dateString: string): string {
    return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function getRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return formatDate(dateString);
}

// ============================================================================
// 主组件
// ============================================================================

export default function ConversationsPage() {
    // 状态
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [stats, setStats] = useState<ConversationStats | null>(null);
    const [selectedSession, setSelectedSession] = useState<string | null>(null);
    const [sessionMessages, setSessionMessages] = useState<Conversation[]>([]);
    const [sheetOpen, setSheetOpen] = useState(false);
    
    // 分页
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // 搜索和筛选
    const [searchQuery, setSearchQuery] = useState('');
    const [moduleFilter, setModuleFilter] = useState<string>('all');

    // ========================================================================
    // 数据加载
    // ========================================================================

    const loadSessions = useCallback(async () => {
        try {
            const response = await api.get('/conversations/sessions', {
                params: { page, limit: 20 },
            });
            setSessions(response.data.sessions || []);
            setTotalPages(Math.ceil((response.data.total || 0) / 20));
        } catch (error) {
            console.error('加载会话列表失败:', error);
            // 如果 API 不存在，使用空数据
            setSessions([]);
        }
    }, [page]);

    const loadStats = useCallback(async () => {
        try {
            const response = await api.get('/conversations/stats');
            setStats(response.data);
        } catch (error) {
            console.error('加载统计失败:', error);
            // 使用默认统计
            setStats({
                totalMessages: 0,
                userMessages: 0,
                assistantMessages: 0,
                totalToolCalls: 0,
                successfulToolCalls: 0,
                failedToolCalls: 0,
                avgMessagesPerSession: 0,
                topModules: [],
            });
        }
    }, []);

    const loadSessionMessages = useCallback(async (sessionId: string) => {
        try {
            const response = await api.get(`/conversations/session/${sessionId}`);
            setSessionMessages(response.data.messages || []);
        } catch (error) {
            console.error('加载会话消息失败:', error);
            setSessionMessages([]);
        }
    }, []);

    const loadAll = useCallback(async () => {
        setLoading(true);
        await Promise.all([loadSessions(), loadStats()]);
        setLoading(false);
    }, [loadSessions, loadStats]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // ========================================================================
    // 会话选择
    // ========================================================================

    const handleSelectSession = async (sessionId: string) => {
        setSelectedSession(sessionId);
        setSheetOpen(true);
        await loadSessionMessages(sessionId);
    };

    // ========================================================================
    // 搜索
    // ========================================================================

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadSessions();
            return;
        }

        try {
            const response = await api.get('/conversations/search', {
                params: { q: searchQuery, limit: 50 },
            });
            // 将搜索结果转换为会话格式
            const messages = response.data.results || [];
            const sessionMap = new Map<string, SessionSummary>();
            
            for (const msg of messages) {
                if (!sessionMap.has(msg.sessionId)) {
                    sessionMap.set(msg.sessionId, {
                        sessionId: msg.sessionId,
                        startTime: msg.timestamp,
                        endTime: msg.timestamp,
                        messageCount: 1,
                        toolCallCount: msg.toolCalls?.length || 0,
                        modules: msg.module ? [msg.module] : [],
                    });
                } else {
                    const session = sessionMap.get(msg.sessionId)!;
                    session.messageCount++;
                    session.toolCallCount += msg.toolCalls?.length || 0;
                    if (msg.module && !session.modules.includes(msg.module)) {
                        session.modules.push(msg.module);
                    }
                }
            }
            
            setSessions(Array.from(sessionMap.values()));
        } catch (error) {
            console.error('搜索失败:', error);
            toast.error('搜索失败');
        }
    };

    // ========================================================================
    // 渲染
    // ========================================================================

    if (loading) {
        return <PageLoading />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="对话历史"
                description="查看和分析 AI 对话记录，了解 AI 的使用情况"
            />

            <AiSettingsNav />

            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">总对话</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            用户: {stats?.userMessages || 0} / AI: {stats?.assistantMessages || 0}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">工具调用</CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalToolCalls || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            成功: {stats?.successfulToolCalls || 0} / 
                            失败: {stats?.failedToolCalls || 0}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">平均会话长度</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.avgMessagesPerSession?.toFixed(1) || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            每个会话的平均消息数
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">热门模块</CardTitle>
                        <Filter className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-1">
                            {stats?.topModules?.slice(0, 3).map(item => (
                                <Badge key={item.module} variant="secondary">
                                    {item.module}: {item.count}
                                </Badge>
                            ))}
                            {(!stats?.topModules || stats.topModules.length === 0) && (
                                <span className="text-xs text-muted-foreground">暂无数据</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 搜索和筛选 */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>会话列表</CardTitle>
                            <CardDescription>
                                按时间倒序显示所有对话会话
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="搜索对话内容..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-[250px]"
                                />
                                <Button variant="outline" size="icon" onClick={handleSearch}>
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button variant="outline" size="sm" onClick={loadAll}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                刷新
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">暂无对话记录</h3>
                            <p className="text-muted-foreground text-center max-w-md">
                                开始与 AI 对话后，这里将显示所有对话历史
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sessions.map(session => (
                                <div
                                    key={session.sessionId}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => handleSelectSession(session.sessionId)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                            <MessageSquare className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    会话 {session.sessionId.slice(-8)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {getRelativeTime(session.startTime)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>{session.messageCount} 条消息</span>
                                                {session.toolCallCount > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{session.toolCallCount} 次工具调用</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {session.modules.map(module => (
                                            <Badge key={module} variant="outline">
                                                {module}
                                            </Badge>
                                        ))}
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 分页 */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                上一页
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                下一页
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 会话详情侧边栏 */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-[500px] sm:max-w-[500px]">
                    <SheetHeader>
                        <SheetTitle>会话详情</SheetTitle>
                        <SheetDescription>
                            会话 ID: {selectedSession?.slice(-8)}
                        </SheetDescription>
                    </SheetHeader>
                    
                    <ScrollArea className="h-[calc(100vh-150px)] mt-4 pr-4">
                        <div className="space-y-4">
                            {sessionMessages.map((msg, index) => (
                                <div
                                    key={msg._id || index}
                                    className={cn(
                                        'flex gap-3',
                                        msg.role === 'user' && 'flex-row-reverse'
                                    )}
                                >
                                    <div className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                        msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                    )}>
                                        {msg.role === 'user' ? (
                                            <User className="h-4 w-4" />
                                        ) : (
                                            <Bot className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div className={cn(
                                        'flex-1 rounded-lg p-3',
                                        msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                    )}>
                                        <p className="text-sm whitespace-pre-wrap">
                                            {msg.content}
                                        </p>
                                        
                                        {/* 工具调用 */}
                                        {msg.toolCalls && msg.toolCalls.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {msg.toolCalls.map((tool, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-2 text-xs bg-background/50 rounded px-2 py-1"
                                                    >
                                                        <Wrench className="h-3 w-3" />
                                                        <span className="font-mono">
                                                            {tool.toolId}
                                                        </span>
                                                        {tool.success ? (
                                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                        ) : (
                                                            <XCircle className="h-3 w-3 text-red-500" />
                                                        )}
                                                        {tool.duration && (
                                                            <span className="text-muted-foreground">
                                                                {tool.duration}ms
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <div className="mt-1 text-xs opacity-70">
                                            {formatFullDate(msg.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {sessionMessages.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    暂无消息记录
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    );
}

