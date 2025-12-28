/**
 * AI 设置路由
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getAllAiModels,
  getAiModel,
  createAiModel,
  updateAiModel,
  deleteAiModel,
  setDefaultModel,
  testConnection,
  getOllamaModels,
  getLMStudioModels,
} from '../controllers/AiSettingsController';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 特定路径路由（必须在 :id 参数路由之前）
// 测试连接
router.post('/test', testConnection);

// 本地模型列表
router.get('/ollama/models', getOllamaModels);
router.get('/lmstudio/models', getLMStudioModels);

// 模型配置 CRUD
router.get('/', getAllAiModels);
router.post('/', createAiModel);

// 带 ID 参数的路由（放在最后）
router.get('/:id', getAiModel);
router.put('/:id', updateAiModel);
router.delete('/:id', deleteAiModel);
router.post('/:id/set-default', setDefaultModel);

export default router;

