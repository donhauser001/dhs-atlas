import express from 'express';
import { MessageTemplateController } from '../controllers/MessageTemplateController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const messageTemplateController = new MessageTemplateController();

// 获取消息模板列表
router.get('/', authenticateToken, (req, res) => {
    messageTemplateController.getTemplates(req, res);
});

// 根据触发器获取模板
router.get('/trigger/:trigger', authenticateToken, (req, res) => {
    messageTemplateController.getTemplatesByTrigger(req, res);
});

// 根据代码获取模板
router.get('/code/:code', authenticateToken, (req, res) => {
    messageTemplateController.getTemplateByCode(req, res);
});

// 获取消息模板详情
router.get('/:id', authenticateToken, (req, res) => {
    messageTemplateController.getTemplateById(req, res);
});

// 创建消息模板
router.post('/', authenticateToken, (req, res) => {
    messageTemplateController.createTemplate(req, res);
});

// 更新消息模板
router.put('/:id', authenticateToken, (req, res) => {
    messageTemplateController.updateTemplate(req, res);
});

// 启用/禁用消息模板
router.patch('/:id/toggle', authenticateToken, (req, res) => {
    messageTemplateController.toggleTemplate(req, res);
});

// 删除消息模板
router.delete('/:id', authenticateToken, (req, res) => {
    messageTemplateController.deleteTemplate(req, res);
});

export default router;
