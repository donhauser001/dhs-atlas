/**
 * AI 审计日志页面
 * 
 * 功能：
 * - 查看 AI 工具调用的完整审计记录
 * - 日志详情展开
 * - 时间范围筛选
 * - 导出功能（JSON/CSV）
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    RefreshCw,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    Database,
    Shield,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Download,
    Calendar,
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
// 移除 Collapsible，改用简单条件渲染（避免表格结构问题）
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AiSettingsNav } from '../_components/ai-settings-nav';
import api from '@/lib/axios';

interface AuditLog {
    _id: string;
    userId: string;
    toolId: string;
    params: Record<string, unknown>;
    success: boolean;
    error?: string;
    reasonCode?: string;
    duration: number;
    timestamp: string;
    sessionId?: string;
    requestId: string;
    targetCollection?: string;
    operation?: string;
    module?: string;
}

interface AuditStats {
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
    successRate: number;
    avgDuration: number;
    byTool: Array<{
        toolId: string;
        count: number;
        successCount: number;
        failedCount: number;
        avgDuration: number;
    }>;
    byReasonCode: Array<{
        reasonCode: string;
        count: number;
    }>;
}

// 时间范围选项
const TIME_RANGES = [
    { value: '1h', label: '最近 1 小时' },
    { value: '24h', label: '最近 24 小时' },
    { value: '7d', label: '最近 7 天' },
    { value: '30d', label: '最近 30 天' },
    { value: 'all', label: '全部' },
];

function getDateRange(range: string): { startDate?: string; endDate?: string } {
    const now = new Date();
    switch (range) {
        case '1h':
            return {
                startDate: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
                endDate: now.toISOString(),
            };
        case '24h':
            return {
                startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
                endDate: now.toISOString(),
            };
        case '7d':
            return {
                startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: now.toISOString(),
            };
        case '30d':
            return {
                startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: now.toISOString(),
            };
        default:
            return {};
    }
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTool, setSearchTool] = useState('');
    const [filterSuccess, setFilterSuccess] = useState<string>('all');
    const [timeRange, setTimeRange] = useState<string>('7d');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [exporting, setExporting] = useState(false);
    const limit = 20;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {
                page: page.toString(),
                limit: limit.toString(),
            };
            if (searchTool) {
                params.toolId = searchTool;
            }
            if (filterSuccess !== 'all') {
                params.success = filterSuccess;
            }
            const dateRange = getDateRange(timeRange);
            if (dateRange.startDate) params.startDate = dateRange.startDate;
            if (dateRange.endDate) params.endDate = dateRange.endDate;

            const response = await api.get('/audit/logs', { params });
            if (response.data.success) {
                setLogs(response.data.data.logs);
                setTotal(response.data.data.total);
            }
        } catch (error) {
            console.error('获取审计日志失败:', error);
        } finally {
            setLoading(false);
        }
    }, [page, searchTool, filterSuccess, timeRange]);

    const fetchStats = useCallback(async () => {
        try {
            const dateRange = getDateRange(timeRange);
            const params: Record<string, string> = {};
            if (dateRange.startDate) params.startDate = dateRange.startDate;
            if (dateRange.endDate) params.endDate = dateRange.endDate;

            const response = await api.get('/audit/stats', { params });
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('获取统计数据失败:', error);
        }
    }, [timeRange]);

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [fetchLogs, fetchStats]);

    const handleExport = async (format: 'json' | 'csv') => {
        setExporting(true);
        try {
            const params: Record<string, string> = { format };
            if (searchTool) params.toolId = searchTool;
            if (filterSuccess !== 'all') params.success = filterSuccess;
            const dateRange = getDateRange(timeRange);
            if (dateRange.startDate) params.startDate = dateRange.startDate;
            if (dateRange.endDate) params.endDate = dateRange.endDate;

            const response = await api.get('/audit/export', {
                params,
                responseType: 'blob',
            });

            // 创建下载链接
            const blob = new Blob([response.data], {
                type: format === 'csv' ? 'text/csv' : 'application/json',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('导出失败:', error);
        } finally {
            setExporting(false);
        }
    };

    const toggleRow = (id: string) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const getReasonCodeBadge = (reasonCode?: string) => {
        if (!reasonCode) return null;

        const isBlocked = reasonCode.startsWith('BLOCKED_');
        const displayCode = reasonCode.replace('BLOCKED_', '').replace('ERROR_', '');

        return (
            <Badge variant={isBlocked ? 'destructive' : 'secondary'} className="text-xs">
                {displayCode}
            </Badge>
        );
    };

    const totalPages = Math.ceil(total / limit);

    if (loading && logs.length === 0) {
        return <PageLoading />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="AI 审计日志"
                description="查看 AI 工具调用的完整审计记录，包括成功/失败状态、耗时、参数等"
            >
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" disabled={exporting}>
                                <Download className="mr-2 h-4 w-4" />
                                {exporting ? '导出中...' : '导出'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleExport('json')}>
                                导出为 JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('csv')}>
                                导出为 CSV
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="outline"
                        onClick={() => {
                            fetchLogs();
                            fetchStats();
                        }}
                        disabled={loading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        刷新
                    </Button>
                </div>
            </PageHeader>

            <AiSettingsNav />

            {/* 统计卡片 */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">总调用</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalCalls}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">成功率</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.successRate}%</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">失败次数</CardTitle>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.failedCalls}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">平均耗时</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.avgDuration}ms</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* 失败原因分布 */}
            {stats && stats.byReasonCode.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            失败原因分布
                        </CardTitle>
                        <CardDescription>当前时间范围内的失败原因统计</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {stats.byReasonCode.map((item) => (
                                <div key={item.reasonCode} className="flex items-center gap-2">
                                    {getReasonCodeBadge(item.reasonCode)}
                                    <span className="text-sm text-muted-foreground">{item.count} 次</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 筛选和搜索 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="按工具 ID 搜索..."
                                value={searchTool}
                                onChange={(e) => setSearchTool(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={filterSuccess} onValueChange={setFilterSuccess}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="状态筛选" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部状态</SelectItem>
                                <SelectItem value="true">仅成功</SelectItem>
                                <SelectItem value="false">仅失败</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[160px]">
                                <Calendar className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="时间范围" />
                            </SelectTrigger>
                            <SelectContent>
                                {TIME_RANGES.map((range) => (
                                    <SelectItem key={range.value} value={range.value}>
                                        {range.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* 日志表格 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Shield className="h-4 w-4" />
                        调用记录
                        <span className="text-sm font-normal text-muted-foreground">
                            （点击行可展开详情）
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]"></TableHead>
                                <TableHead>时间</TableHead>
                                <TableHead>工具</TableHead>
                                <TableHead>集合</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead>原因</TableHead>
                                <TableHead className="text-right">耗时</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <React.Fragment key={log._id}>
                                    <TableRow
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => toggleRow(log._id)}
                                    >
                                        <TableCell>
                                            {expandedRows.has(log._id) ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-mono text-xs">
                                            {formatTime(log.timestamp)}
                                        </TableCell>
                                        <TableCell>
                                            <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
                                                {log.toolId}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {log.targetCollection || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {log.success ? (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                    成功
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    <XCircle className="mr-1 h-3 w-3" />
                                                    失败
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {getReasonCodeBadge(log.reasonCode)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">
                                            {log.duration}ms
                                        </TableCell>
                                    </TableRow>
                                    {expandedRows.has(log._id) && (
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableCell colSpan={7} className="p-4">
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div>
                                                        <h4 className="text-sm font-medium mb-2">调用参数</h4>
                                                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-[200px]">
                                                            {JSON.stringify(log.params, null, 2)}
                                                        </pre>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="text-sm font-medium mb-1">请求 ID</h4>
                                                            <code className="text-xs text-muted-foreground">
                                                                {log.requestId}
                                                            </code>
                                                        </div>
                                                        {log.sessionId && (
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-1">会话 ID</h4>
                                                                <code className="text-xs text-muted-foreground">
                                                                    {log.sessionId}
                                                                </code>
                                                            </div>
                                                        )}
                                                        {log.module && (
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-1">模块</h4>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {log.module}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {log.error && (
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-1 text-red-500">错误信息</h4>
                                                                <p className="text-sm text-red-500">
                                                                    {log.error}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                            {logs.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        暂无审计日志
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* 分页 */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                上一页
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                第 {page} / {totalPages} 页，共 {total} 条
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                下一页
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
