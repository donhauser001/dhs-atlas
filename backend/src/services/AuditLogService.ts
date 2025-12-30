import AuditLog, {
    IAuditLog,
    CreateAuditLogInput,
    AuditLogQuery,
    AuditStats,
} from '../models/AuditLog';

/**
 * 日期范围接口
 */
interface DateRange {
    startDate: Date;
    endDate: Date;
}

// ============================================================================
// 批量写入配置
// ============================================================================

const BATCH_SIZE = 50;              // 批量写入阈值
const FLUSH_INTERVAL = 5000;        // 刷新间隔（毫秒）
const MAX_QUEUE_SIZE = 500;         // 队列最大容量（防止内存溢出）

/**
 * 审计日志服务
 * 
 * 功能：
 * - 异步批量写入审计日志（高性能）
 * - 查询审计日志
 * - 统计分析
 * - 导出功能
 * 
 * 优化：
 * - 使用内存队列缓冲日志
 * - 定时批量写入减少数据库压力
 */
export class AuditLogService {
    private queue: CreateAuditLogInput[] = [];
    private flushTimer: NodeJS.Timeout | null = null;
    private isFlushing = false;

    constructor() {
        // 启动定时刷新
        this.startFlushTimer();
        
        // 进程退出时刷新队列
        process.on('beforeExit', () => this.flush());
        process.on('SIGINT', () => this.flush());
        process.on('SIGTERM', () => this.flush());
    }

    /**
     * 启动定时刷新
     */
    private startFlushTimer(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flushTimer = setInterval(() => {
            if (this.queue.length > 0) {
                this.flush();
            }
        }, FLUSH_INTERVAL);
    }

    /**
     * 记录审计日志（异步批量写入）
     * 
     * @param entry 审计日志条目
     */
    log(entry: CreateAuditLogInput): void {
        // 添加到队列
        this.queue.push({
            ...entry,
            timestamp: entry.timestamp || new Date(),
        });

        // 检查是否需要立即刷新
        if (this.queue.length >= BATCH_SIZE) {
            this.flush();
        }

        // 防止队列过大
        if (this.queue.length > MAX_QUEUE_SIZE) {
            console.warn(`[AuditLogService] 队列过大 (${this.queue.length})，强制刷新`);
            this.flush();
        }
    }

    /**
     * 刷新队列（批量写入）
     */
    async flush(): Promise<void> {
        if (this.isFlushing || this.queue.length === 0) {
            return;
        }

        this.isFlushing = true;
        const batch = this.queue.splice(0, BATCH_SIZE);

        try {
            await AuditLog.insertMany(batch, { ordered: false });
        } catch (error: any) {
            // insertMany 的 ordered: false 允许部分成功
            // 只有完全失败才记录错误
            if (error.writeErrors?.length === batch.length) {
                console.error('[AuditLogService] 批量写入完全失败:', error.message);
            } else if (error.writeErrors?.length > 0) {
                console.warn(`[AuditLogService] 批量写入部分失败: ${error.writeErrors.length}/${batch.length}`);
            }
        } finally {
            this.isFlushing = false;
            
            // 如果还有积压，继续刷新
            if (this.queue.length >= BATCH_SIZE) {
                setImmediate(() => this.flush());
            }
        }
    }

    /**
     * 同步记录审计日志（等待写入完成）
     * 用于需要确保日志写入的场景
     */
    async logSync(entry: CreateAuditLogInput): Promise<IAuditLog | null> {
        try {
            const log = await AuditLog.create({
                ...entry,
                timestamp: entry.timestamp || new Date(),
            });
            return log;
        } catch (error) {
            console.error('[AuditLogService] 写入审计日志失败:', error);
            return null;
        }
    }

    /**
     * 获取队列状态
     */
    getQueueStatus(): { queueSize: number; isFlushing: boolean } {
        return {
            queueSize: this.queue.length,
            isFlushing: this.isFlushing,
        };
    }

    /**
     * 按用户查询审计日志
     */
    async getByUser(
        userId: string,
        range?: DateRange,
        options?: { page?: number; limit?: number }
    ): Promise<{ logs: IAuditLog[]; total: number }> {
        const query: any = { userId };
        
        if (range) {
            query.timestamp = {
                $gte: range.startDate,
                $lte: range.endDate,
            };
        }

        const page = options?.page || 1;
        const limit = options?.limit || 50;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(query),
        ]);

        return { logs, total };
    }

    /**
     * 按工具查询审计日志
     */
    async getByTool(
        toolId: string,
        range?: DateRange,
        options?: { page?: number; limit?: number }
    ): Promise<{ logs: IAuditLog[]; total: number }> {
        const query: any = { toolId };
        
        if (range) {
            query.timestamp = {
                $gte: range.startDate,
                $lte: range.endDate,
            };
        }

        const page = options?.page || 1;
        const limit = options?.limit || 50;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(query),
        ]);

        return { logs, total };
    }

    /**
     * 通用查询接口
     */
    async query(
        params: AuditLogQuery
    ): Promise<{ logs: IAuditLog[]; total: number; page: number; limit: number }> {
        const query: any = {};

        if (params.userId) {
            query.userId = params.userId;
        }
        if (params.toolId) {
            query.toolId = params.toolId;
        }
        if (params.success !== undefined) {
            query.success = params.success;
        }
        if (params.reasonCode) {
            query.reasonCode = params.reasonCode;
        }
        if (params.startDate || params.endDate) {
            query.timestamp = {};
            if (params.startDate) {
                query.timestamp.$gte = params.startDate;
            }
            if (params.endDate) {
                query.timestamp.$lte = params.endDate;
            }
        }

        const page = params.page || 1;
        const limit = params.limit || 50;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(query),
        ]);

        return { logs, total, page, limit };
    }

    /**
     * 获取统计数据
     */
    async getStats(range: DateRange): Promise<AuditStats> {
        const matchStage = {
            $match: {
                timestamp: {
                    $gte: range.startDate,
                    $lte: range.endDate,
                },
            },
        };

        // 总体统计
        const overallStats = await AuditLog.aggregate([
            matchStage,
            {
                $group: {
                    _id: null,
                    totalCalls: { $sum: 1 },
                    successCalls: {
                        $sum: { $cond: ['$success', 1, 0] },
                    },
                    failedCalls: {
                        $sum: { $cond: ['$success', 0, 1] },
                    },
                    avgDuration: { $avg: '$duration' },
                },
            },
        ]);

        // 按工具统计
        const byTool = await AuditLog.aggregate([
            matchStage,
            {
                $group: {
                    _id: '$toolId',
                    count: { $sum: 1 },
                    successCount: {
                        $sum: { $cond: ['$success', 1, 0] },
                    },
                    failedCount: {
                        $sum: { $cond: ['$success', 0, 1] },
                    },
                    avgDuration: { $avg: '$duration' },
                },
            },
            {
                $project: {
                    _id: 0,
                    toolId: '$_id',
                    count: 1,
                    successCount: 1,
                    failedCount: 1,
                    avgDuration: { $round: ['$avgDuration', 2] },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 20 },
        ]);

        // 按 reasonCode 统计
        const byReasonCode = await AuditLog.aggregate([
            matchStage,
            { $match: { reasonCode: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$reasonCode',
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    reasonCode: '$_id',
                    count: 1,
                },
            },
            { $sort: { count: -1 } },
            { $limit: 20 },
        ]);

        const overall = overallStats[0] || {
            totalCalls: 0,
            successCalls: 0,
            failedCalls: 0,
            avgDuration: 0,
        };

        return {
            totalCalls: overall.totalCalls,
            successCalls: overall.successCalls,
            failedCalls: overall.failedCalls,
            successRate:
                overall.totalCalls > 0
                    ? Math.round((overall.successCalls / overall.totalCalls) * 10000) / 100
                    : 0,
            avgDuration: Math.round((overall.avgDuration || 0) * 100) / 100,
            byTool,
            byReasonCode,
        };
    }

    /**
     * 获取最近的审计日志
     */
    async getRecent(limit: number = 100): Promise<IAuditLog[]> {
        return AuditLog.find()
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
    }

    /**
     * 根据 requestId 获取单条日志
     */
    async getByRequestId(requestId: string): Promise<IAuditLog | null> {
        return AuditLog.findOne({ requestId }).lean();
    }

    /**
     * 获取失败的审计日志
     */
    async getFailedLogs(
        range?: DateRange,
        options?: { page?: number; limit?: number }
    ): Promise<{ logs: IAuditLog[]; total: number }> {
        const query: any = { success: false };
        
        if (range) {
            query.timestamp = {
                $gte: range.startDate,
                $lte: range.endDate,
            };
        }

        const page = options?.page || 1;
        const limit = options?.limit || 50;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(query),
        ]);

        return { logs, total };
    }

    /**
     * 导出审计日志（JSON 格式）
     */
    async exportLogs(
        params: AuditLogQuery & { format?: 'json' | 'csv' }
    ): Promise<{ data: string; filename: string; contentType: string }> {
        // 获取所有匹配的日志（不分页）
        const query: any = {};

        if (params.userId) query.userId = params.userId;
        if (params.toolId) query.toolId = params.toolId;
        if (params.success !== undefined) query.success = params.success;
        if (params.reasonCode) query.reasonCode = params.reasonCode;
        if (params.startDate || params.endDate) {
            query.timestamp = {};
            if (params.startDate) query.timestamp.$gte = params.startDate;
            if (params.endDate) query.timestamp.$lte = params.endDate;
        }

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(10000) // 最多导出 1 万条
            .lean();

        const format = params.format || 'json';
        const dateStr = new Date().toISOString().split('T')[0];

        if (format === 'csv') {
            // CSV 格式
            const headers = ['时间', '用户ID', '工具ID', '集合', '操作', '状态', '原因码', '耗时(ms)'];
            const rows = logs.map(log => [
                new Date(log.timestamp).toISOString(),
                log.userId,
                log.toolId,
                log.targetCollection || '',
                log.operation || '',
                log.success ? '成功' : '失败',
                log.reasonCode || '',
                log.duration.toString(),
            ]);

            const csv = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
            ].join('\n');

            return {
                data: csv,
                filename: `audit-logs-${dateStr}.csv`,
                contentType: 'text/csv; charset=utf-8',
            };
        }

        // JSON 格式
        return {
            data: JSON.stringify(logs, null, 2),
            filename: `audit-logs-${dateStr}.json`,
            contentType: 'application/json; charset=utf-8',
        };
    }
}

// 导出单例
export const auditLogService = new AuditLogService();
export default auditLogService;
