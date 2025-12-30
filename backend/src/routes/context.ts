/**
 * 上下文 API 路由
 */

import { Router } from 'express';
import MemoryController from '../controllers/MemoryController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticateJWT);

// POST /api/context/bootstrap - 执行上下文初始化
router.post('/bootstrap', MemoryController.bootstrap);

// GET /api/context/current - 获取当前上下文包
router.get('/current', MemoryController.getCurrentContext);

// GET /api/context/prompt - 获取格式化的上下文提示词片段
router.get('/prompt', MemoryController.getContextPrompt);

export default router;

