import express from 'express';
import { MessageController } from '../controllers/MessageController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const messageController = new MessageController();

// 获取消息列表
router.get('/', authenticateToken, (req, res) => {
    messageController.getMessages(req, res);
});

// 获取未读消息数量
router.get('/unread-count', authenticateToken, (req, res) => {
    messageController.getUnreadCount(req, res);
});

// 标记所有消息为已读
router.patch('/mark-all-read', authenticateToken, (req, res) => {
    messageController.markAllAsRead(req, res);
});

// 批量操作消息
router.patch('/batch', authenticateToken, (req, res) => {
    messageController.batchUpdateMessages(req, res);
});

// 获取消息详情
router.get('/:id', authenticateToken, (req, res) => {
    messageController.getMessageById(req, res);
});

// 创建消息
router.post('/', authenticateToken, (req, res) => {
    messageController.createMessage(req, res);
});

// 更新消息状态
router.patch('/:id/status', authenticateToken, (req, res) => {
    messageController.updateMessageStatus(req, res);
});

// 删除消息
router.delete('/:id', authenticateToken, (req, res) => {
    messageController.deleteMessage(req, res);
});

export default router;
