import express from 'express';
import { MessageSubscriptionController } from '../controllers/MessageSubscriptionController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const messageSubscriptionController = new MessageSubscriptionController();

// 获取用户订阅设置
router.get('/', authenticateToken, (req, res) => {
    messageSubscriptionController.getSubscription(req, res);
});

// 检查订阅状态
router.get('/check', authenticateToken, (req, res) => {
    messageSubscriptionController.checkSubscription(req, res);
});

// 更新用户订阅设置
router.put('/', authenticateToken, (req, res) => {
    messageSubscriptionController.updateSubscription(req, res);
});

// 重置为默认订阅设置
router.post('/reset', authenticateToken, (req, res) => {
    messageSubscriptionController.resetToDefault(req, res);
});

// 更新免打扰设置
router.patch('/do-not-disturb', authenticateToken, (req, res) => {
    messageSubscriptionController.updateDoNotDisturb(req, res);
});

// 更新全局设置
router.patch('/global-settings', authenticateToken, (req, res) => {
    messageSubscriptionController.updateGlobalSettings(req, res);
});

export default router;
