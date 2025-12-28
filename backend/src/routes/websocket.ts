import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getWebSocketService } from '../app';

const router = express.Router();

/**
 * 获取在线用户列表
 */
router.get('/online-users', authenticateToken, (req, res): void => {
    try {
        const webSocketService = getWebSocketService();

        if (!webSocketService) {
            res.status(503).json({
                success: false,
                message: 'WebSocket服务未初始化'
            });
        }

        const onlineUsers = webSocketService.getOnlineUsers();
        const onlineUserCount = webSocketService.getOnlineUserCount();

        res.json({
            success: true,
            data: {
                users: onlineUsers.map(user => ({
                    userId: user.userId,
                    username: user.username,
                    role: user.role,
                    departmentId: user.departmentId,
                    connectedAt: user.connectedAt,
                    lastActivity: user.lastActivity
                })),
                totalCount: onlineUserCount
            }
        });

    } catch (error) {
        console.error('获取在线用户失败:', error);
        res.status(500).json({
            success: false,
            message: '获取在线用户失败'
        });
    }
});

/**
 * 检查用户是否在线
 */
router.get('/user/:userId/status', authenticateToken, (req, res) => {
    try {
        const { userId } = req.params;
        const webSocketService = getWebSocketService();

        if (!webSocketService) {
            res.status(503).json({
                success: false,
                message: 'WebSocket服务未初始化'
            });
        }

        const isOnline = webSocketService.isUserOnline(userId);

        res.json({
            success: true,
            data: {
                userId,
                isOnline,
                checkedAt: new Date()
            }
        });

    } catch (error) {
        console.error('检查用户在线状态失败:', error);
        res.status(500).json({
            success: false,
            message: '检查用户在线状态失败'
        });
    }
});

/**
 * 发送系统广播消息
 */
router.post('/broadcast', authenticateToken, (req, res) => {
    try {
        const userRole = req.user?.role;

        // 只有管理员可以发送系统广播
        if (userRole !== 'admin' && userRole !== 'super_admin') {
            res.status(403).json({
                success: false,
                message: '无权限发送系统广播'
            });
        }

        const { event, data } = req.body;

        if (!event) {
            res.status(400).json({
                success: false,
                message: '缺少事件名称'
            });
        }

        const webSocketService = getWebSocketService();

        if (!webSocketService) {
            res.status(503).json({
                success: false,
                message: 'WebSocket服务未初始化'
            });
        }

        webSocketService.broadcast(event, data);

        res.json({
            success: true,
            message: '系统广播发送成功',
            data: {
                event,
                sentAt: new Date()
            }
        });

    } catch (error) {
        console.error('发送系统广播失败:', error);
        res.status(500).json({
            success: false,
            message: '发送系统广播失败'
        });
    }
});

/**
 * 发送消息给特定用户
 */
router.post('/send-to-user', authenticateToken, (req, res) => {
    try {
        const { userId, event, data } = req.body;

        if (!userId || !event) {
            res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }

        const webSocketService = getWebSocketService();

        if (!webSocketService) {
            res.status(503).json({
                success: false,
                message: 'WebSocket服务未初始化'
            });
        }

        webSocketService.sendToUser(userId, event, data);

        return res.json({
            success: true,
            message: '消息发送成功',
            data: {
                targetUserId: userId,
                event,
                sentAt: new Date()
            }
        });

    } catch (error) {
        console.error('发送用户消息失败:', error);
        return res.status(500).json({
            success: false,
            message: '发送用户消息失败'
        });
    }
});

/**
 * 发送消息给部门
 */
router.post('/send-to-department', authenticateToken, (req, res) => {
    try {
        const userRole = req.user?.role;

        // 只有管理员和部门经理可以发送部门消息
        if (!['admin', 'super_admin', 'manager'].includes(userRole || '')) {
            return res.status(403).json({
                success: false,
                message: '无权限发送部门消息'
            });
        }

        const { departmentId, event, data } = req.body;

        if (!departmentId || !event) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }

        const webSocketService = getWebSocketService();

        if (!webSocketService) {
            return res.status(503).json({
                success: false,
                message: 'WebSocket服务未初始化'
            });
        }

        webSocketService.sendToDepartment(departmentId, event, data);

        return res.json({
            success: true,
            message: '部门消息发送成功',
            data: {
                targetDepartmentId: departmentId,
                event,
                sentAt: new Date()
            }
        });

    } catch (error) {
        console.error('发送部门消息失败:', error);
        return res.status(500).json({
            success: false,
            message: '发送部门消息失败'
        });
    }
});

/**
 * 发送消息给角色
 */
router.post('/send-to-role', authenticateToken, (req, res) => {
    try {
        const userRole = req.user?.role;

        // 只有管理员可以发送角色消息
        if (userRole !== 'admin' && userRole !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: '无权限发送角色消息'
            });
        }

        const { role, event, data } = req.body;

        if (!role || !event) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }

        const webSocketService = getWebSocketService();

        if (!webSocketService) {
            return res.status(503).json({
                success: false,
                message: 'WebSocket服务未初始化'
            });
        }

        webSocketService.sendToRole(role, event, data);

        return res.json({
            success: true,
            message: '角色消息发送成功',
            data: {
                targetRole: role,
                event,
                sentAt: new Date()
            }
        });

    } catch (error) {
        console.error('发送角色消息失败:', error);
        return res.status(500).json({
            success: false,
            message: '发送角色消息失败'
        });
    }
});

export default router;
