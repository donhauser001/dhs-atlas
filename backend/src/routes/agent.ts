/**
 * Agent API 路由
 * 
 * V2 架构：简化路由，移除规则匹配相关接口
 */

import { Router } from 'express';
import AgentController from '../controllers/AgentController';
import AgentStreamController from '../controllers/AgentStreamController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticateJWT);

// POST /api/agent/chat - AI 对话
router.post('/chat', AgentController.chat);

// POST /api/agent/chat/stream - SSE 流式对话（实时反馈）
router.post('/chat/stream', AgentStreamController.streamChat);

// POST /api/agent/confirm - 确认并执行工具
router.post('/confirm', AgentController.confirmTools);

// GET /api/agent/status - 获取服务状态
router.get('/status', AgentController.status);

// GET /api/agent/tools - 获取可用工具
router.get('/tools', AgentController.getTools);

export default router;
