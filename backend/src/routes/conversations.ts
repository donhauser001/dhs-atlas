/**
 * 对话历史 API 路由
 */

import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { conversationService } from '../services/ConversationService';

const router = Router();

// 所有路由需要认证
router.use(authenticateJWT);

interface AuthUser {
    id: string;
    userId: string;
    username: string;
    realName: string;
    role?: string;
    [key: string]: any;
}

interface AuthRequest extends Request {
    user?: AuthUser;
}

// =========================================================================
// 会话路由
// =========================================================================

/**
 * GET /api/conversations/sessions
 * 获取用户的会话列表
 */
router.get('/sessions', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未认证' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await conversationService.getUserSessions(userId, { page, limit });
        return res.json(result);
    } catch (error) {
        console.error('[Conversations] 获取会话列表失败:', error);
        return res.status(500).json({ error: '获取会话列表失败' });
    }
});

/**
 * GET /api/conversations/session/:sessionId
 * 获取单个会话的消息
 */
router.get('/session/:sessionId', async (req: AuthRequest, res: Response) => {
    try {
        const { sessionId } = req.params;
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;

        const messages = await conversationService.getSessionHistory(sessionId, { limit, offset });
        return res.json({ messages });
    } catch (error) {
        console.error('[Conversations] 获取会话消息失败:', error);
        return res.status(500).json({ error: '获取会话消息失败' });
    }
});

/**
 * GET /api/conversations/stats
 * 获取对话统计
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未认证' });
        }

        const stats = await conversationService.getStats(userId);
        return res.json(stats);
    } catch (error) {
        console.error('[Conversations] 获取统计失败:', error);
        return res.status(500).json({ error: '获取统计失败' });
    }
});

/**
 * GET /api/conversations/search
 * 搜索对话内容
 */
router.get('/search', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未认证' });
        }

        const q = req.query.q as string;
        if (!q) {
            return res.status(400).json({ error: '搜索关键词不能为空' });
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const results = await conversationService.search(userId, q, { limit });
        return res.json({ results });
    } catch (error) {
        console.error('[Conversations] 搜索失败:', error);
        return res.status(500).json({ error: '搜索失败' });
    }
});

/**
 * GET /api/conversations/recent
 * 获取最近的对话
 */
router.get('/recent', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未认证' });
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const messages = await conversationService.getUserRecentConversations(userId, limit);
        return res.json({ messages });
    } catch (error) {
        console.error('[Conversations] 获取最近对话失败:', error);
        return res.status(500).json({ error: '获取最近对话失败' });
    }
});

export default router;

