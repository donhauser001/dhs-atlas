import express from 'express';
import ContractTemplateController from '../controllers/ContractTemplateController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取模板列表
router.get('/', ContractTemplateController.getTemplates);

// 获取模板统计
router.get('/stats', ContractTemplateController.getTemplateStats);

// 根据ID获取模板
router.get('/:id', ContractTemplateController.getTemplateById);

// 创建模板
router.post('/', ContractTemplateController.createTemplate);

// 更新模板
router.put('/:id', ContractTemplateController.updateTemplate);

// 删除模板
router.delete('/:id', ContractTemplateController.deleteTemplate);

// 复制模板
router.post('/:id/clone', ContractTemplateController.cloneTemplate);

// 设置默认模板
router.put('/:id/default', ContractTemplateController.setDefaultTemplate);

// 切换模板状态
router.put('/:id/status', ContractTemplateController.toggleStatus);

export default router;
