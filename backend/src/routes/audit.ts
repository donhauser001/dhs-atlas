import { Router } from 'express';
import AuditController from '../controllers/AuditController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticateJWT);

// GET /api/audit/logs - 查询审计日志
router.get('/logs', AuditController.getLogs);

// GET /api/audit/stats - 获取统计数据
router.get('/stats', AuditController.getStats);

// GET /api/audit/recent - 获取最近的审计日志
router.get('/recent', AuditController.getRecent);

// GET /api/audit/failed - 获取失败的审计日志
router.get('/failed', AuditController.getFailed);

// GET /api/audit/logs/:requestId - 根据 requestId 获取单条日志
router.get('/logs/:requestId', AuditController.getByRequestId);

// GET /api/audit/users/:userId/logs - 按用户查询审计日志
router.get('/users/:userId/logs', AuditController.getByUser);

// GET /api/audit/tools/:toolId/logs - 按工具查询审计日志
router.get('/tools/:toolId/logs', AuditController.getByTool);

// GET /api/audit/export - 导出审计日志
router.get('/export', AuditController.exportLogs);

// GET /api/audit/queue-status - 获取队列状态
router.get('/queue-status', AuditController.getQueueStatus);

export default router;

