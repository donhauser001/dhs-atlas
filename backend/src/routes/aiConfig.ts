/**
 * AI 配置管理路由
 */

import { Router } from 'express';
import AiConfigController from '../controllers/AiConfigController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticateToken);

// 工具集管理
router.get('/tools', AiConfigController.getTools);
router.post('/tools', AiConfigController.createTool);
router.put('/tools/:id', AiConfigController.updateTool);
router.delete('/tools/:id', AiConfigController.deleteTool);

// 样例模板管理
router.get('/templates', AiConfigController.getTemplates);
router.post('/templates', AiConfigController.createTemplate);
router.put('/templates/:id', AiConfigController.updateTemplate);
router.delete('/templates/:id', AiConfigController.deleteTemplate);

// AI 地图管理
router.get('/maps', AiConfigController.getMaps);
router.post('/maps', AiConfigController.createMap);
router.put('/maps/:id', AiConfigController.updateMap);
router.delete('/maps/:id', AiConfigController.deleteMap);

export default router;

