import { Request, Response } from 'express';
import { auditLogService } from '../services/AuditLogService';

/**
 * 审计日志控制器
 */
class AuditController {
    /**
     * 查询审计日志
     * GET /api/audit/logs
     */
    async getLogs(req: Request, res: Response) {
        try {
            const {
                userId,
                toolId,
                success,
                reasonCode,
                startDate,
                endDate,
                page = '1',
                limit = '50',
            } = req.query;

            const result = await auditLogService.query({
                userId: userId as string,
                toolId: toolId as string,
                success: success !== undefined ? success === 'true' : undefined,
                reasonCode: reasonCode as string,
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined,
                page: parseInt(page as string, 10),
                limit: parseInt(limit as string, 10),
            });

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            console.error('[AuditController] 查询审计日志失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '查询失败',
            });
        }
    }

    /**
     * 获取统计数据
     * GET /api/audit/stats
     */
    async getStats(req: Request, res: Response) {
        try {
            const { startDate, endDate } = req.query;

            // 默认查询最近 7 天
            const end = endDate ? new Date(endDate as string) : new Date();
            const start = startDate
                ? new Date(startDate as string)
                : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

            const stats = await auditLogService.getStats({
                startDate: start,
                endDate: end,
            });

            return res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            console.error('[AuditController] 获取统计数据失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取统计失败',
            });
        }
    }

    /**
     * 获取最近的审计日志
     * GET /api/audit/recent
     */
    async getRecent(req: Request, res: Response) {
        try {
            const { limit = '100' } = req.query;
            const logs = await auditLogService.getRecent(parseInt(limit as string, 10));

            return res.json({
                success: true,
                data: logs,
            });
        } catch (error) {
            console.error('[AuditController] 获取最近日志失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取失败',
            });
        }
    }

    /**
     * 获取失败的审计日志
     * GET /api/audit/failed
     */
    async getFailed(req: Request, res: Response) {
        try {
            const {
                startDate,
                endDate,
                page = '1',
                limit = '50',
            } = req.query;

            const range = startDate || endDate
                ? {
                    startDate: startDate ? new Date(startDate as string) : new Date(0),
                    endDate: endDate ? new Date(endDate as string) : new Date(),
                }
                : undefined;

            const result = await auditLogService.getFailedLogs(range, {
                page: parseInt(page as string, 10),
                limit: parseInt(limit as string, 10),
            });

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            console.error('[AuditController] 获取失败日志失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取失败',
            });
        }
    }

    /**
     * 根据 requestId 获取单条日志
     * GET /api/audit/logs/:requestId
     */
    async getByRequestId(req: Request, res: Response) {
        try {
            const { requestId } = req.params;
            const log = await auditLogService.getByRequestId(requestId);

            if (!log) {
                return res.status(404).json({
                    success: false,
                    error: '审计日志不存在',
                });
            }

            return res.json({
                success: true,
                data: log,
            });
        } catch (error) {
            console.error('[AuditController] 获取日志详情失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取失败',
            });
        }
    }

    /**
     * 按用户查询审计日志
     * GET /api/audit/users/:userId/logs
     */
    async getByUser(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const {
                startDate,
                endDate,
                page = '1',
                limit = '50',
            } = req.query;

            const range = startDate || endDate
                ? {
                    startDate: startDate ? new Date(startDate as string) : new Date(0),
                    endDate: endDate ? new Date(endDate as string) : new Date(),
                }
                : undefined;

            const result = await auditLogService.getByUser(userId, range, {
                page: parseInt(page as string, 10),
                limit: parseInt(limit as string, 10),
            });

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            console.error('[AuditController] 按用户查询失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '查询失败',
            });
        }
    }

    /**
     * 按工具查询审计日志
     * GET /api/audit/tools/:toolId/logs
     */
    async getByTool(req: Request, res: Response) {
        try {
            const { toolId } = req.params;
            const {
                startDate,
                endDate,
                page = '1',
                limit = '50',
            } = req.query;

            const range = startDate || endDate
                ? {
                    startDate: startDate ? new Date(startDate as string) : new Date(0),
                    endDate: endDate ? new Date(endDate as string) : new Date(),
                }
                : undefined;

            const result = await auditLogService.getByTool(toolId, range, {
                page: parseInt(page as string, 10),
                limit: parseInt(limit as string, 10),
            });

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            console.error('[AuditController] 按工具查询失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '查询失败',
            });
        }
    }

    /**
     * 导出审计日志
     * GET /api/audit/export
     */
    async exportLogs(req: Request, res: Response) {
        try {
            const {
                userId,
                toolId,
                success,
                reasonCode,
                startDate,
                endDate,
                format = 'json',
            } = req.query;

            const result = await auditLogService.exportLogs({
                userId: userId as string,
                toolId: toolId as string,
                success: success !== undefined ? success === 'true' : undefined,
                reasonCode: reasonCode as string,
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined,
                format: format as 'json' | 'csv',
            });

            res.setHeader('Content-Type', result.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
            return res.send(result.data);
        } catch (error) {
            console.error('[AuditController] 导出失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '导出失败',
            });
        }
    }

    /**
     * 获取队列状态
     * GET /api/audit/queue-status
     */
    async getQueueStatus(_req: Request, res: Response) {
        try {
            const status = auditLogService.getQueueStatus();
            return res.json({
                success: true,
                data: status,
            });
        } catch (error) {
            console.error('[AuditController] 获取队列状态失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取失败',
            });
        }
    }
}

export default new AuditController();

