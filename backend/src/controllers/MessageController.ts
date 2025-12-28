import { Request, Response } from 'express';
import { Message, IMessage, MessageType, MessageCategory, MessagePriority, MessageStatus } from '../models/Message';
import { MessageSubscription } from '../models/MessageSubscription';

// 查询参数接口
interface MessageQueryParams {
    page?: string;
    limit?: string;
    type?: MessageType;
    category?: MessageCategory;
    status?: MessageStatus;
    priority?: MessagePriority;
    search?: string;
    startDate?: string;
    endDate?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
}

// 创建消息DTO
interface CreateMessageDto {
    title: string;
    content: string;
    summary?: string;
    type: MessageType;
    category: MessageCategory;
    priority?: MessagePriority;
    recipientId: string;
    recipientType?: 'user' | 'role' | 'department';
    relatedEntityType?: string;
    relatedEntityId?: string;
    relatedEntityName?: string;
    attachments?: any[];
    actions?: any[];
    metadata?: Record<string, any>;
    expiresAt?: Date;
    pushSettings?: {
        email?: boolean;
        sms?: boolean;
        push?: boolean;
    };
}

// 批量操作DTO
interface BatchOperationDto {
    messageIds: string[];
    action: 'read' | 'unread' | 'archive' | 'delete';
    data?: any;
}

export class MessageController {
    /**
     * 获取消息列表
     */
    async getMessages(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            const {
                page = '1',
                limit = '20',
                type,
                category,
                status,
                priority,
                search,
                startDate,
                endDate,
                relatedEntityType,
                relatedEntityId
            } = req.query as MessageQueryParams;

            // 构建查询条件 - 管理员可以看到所有消息，普通用户只能看到自己的消息
            const query: any = {
                status: { $ne: MessageStatus.DELETED }
            };

            // 如果不是管理员，只能看到自己的消息
            if (userRole !== '超级管理员' && userRole !== '项目经理') {
                query.recipientId = userId;
            }

            // 添加过滤条件
            if (type) query.type = type;
            if (category) query.category = category;
            if (status) query.status = status;
            if (priority) query.priority = priority;
            if (relatedEntityType) query.relatedEntityType = relatedEntityType;
            if (relatedEntityId) query.relatedEntityId = relatedEntityId;

            // 搜索条件
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { content: { $regex: search, $options: 'i' } },
                    { summary: { $regex: search, $options: 'i' } }
                ];
            }

            // 时间范围过滤
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            // 分页参数
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            // 执行查询
            console.log(`🔍 消息查询条件 (用户: ${userId}, 角色: ${userRole}):`, JSON.stringify(query, null, 2));

            const [messages, total] = await Promise.all([
                Message.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                Message.countDocuments(query)
            ]);

            console.log(`📊 查询结果: ${messages.length} 条消息, 总计: ${total} 条`);

            // 获取统计信息 - 管理员统计所有消息，普通用户只统计自己的消息
            const statsQuery: any = { status: { $ne: MessageStatus.DELETED } };
            const unreadStatsQuery: any = { status: MessageStatus.UNREAD };

            if (userRole !== '超级管理员' && userRole !== '项目经理') {
                statsQuery.recipientId = userId;
                unreadStatsQuery.recipientId = userId;
            }

            const [unreadCount, typeCount] = await Promise.all([
                Message.countDocuments(unreadStatsQuery),
                Message.aggregate([
                    { $match: statsQuery },
                    { $group: { _id: '$type', count: { $sum: 1 } } }
                ])
            ]);

            // 格式化类型统计
            const typeStats: Record<string, number> = {};
            typeCount.forEach(item => {
                typeStats[item._id] = item.count;
            });

            res.json({
                success: true,
                data: {
                    messages,
                    pagination: {
                        current: pageNum,
                        pageSize: limitNum,
                        total,
                        totalPages: Math.ceil(total / limitNum)
                    },
                    statistics: {
                        unreadCount,
                        totalCount: total,
                        typeCount: typeStats
                    }
                }
            });

        } catch (error) {
            console.error('获取消息列表失败:', error);
            res.status(500).json({
                success: false,
                message: '获取消息列表失败'
            });
        }
    }

    /**
     * 获取消息详情
     */
    async getMessageById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            // 构建查询条件 - 管理员可以查看所有消息，普通用户只能查看自己的消息
            const query: any = {
                _id: id,
                status: { $ne: MessageStatus.DELETED }
            };

            if (userRole !== '超级管理员' && userRole !== '项目经理') {
                query.recipientId = userId;
            }

            const message = await Message.findOne(query);

            if (!message) {
                res.status(404).json({
                    success: false,
                    message: '消息不存在'
                });
                return;
            }

            // 自动标记为已读
            if (message.status === MessageStatus.UNREAD) {
                message.status = MessageStatus.READ;
                message.readAt = new Date();
                await message.save();
            }

            res.json({
                success: true,
                data: message
            });

        } catch (error) {
            console.error('获取消息详情失败:', error);
            res.status(500).json({
                success: false,
                message: '获取消息详情失败'
            });
        }
    }

    /**
     * 创建消息
     */
    async createMessage(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const userName = req.user?.realName || req.user?.username || '系统';

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            const messageData: CreateMessageDto = req.body;

            // 验证必填字段
            if (!messageData.title || !messageData.content || !messageData.recipientId) {
                res.status(400).json({
                    success: false,
                    message: '标题、内容和接收者为必填项'
                });
                return;
            }

            // 创建消息
            const message = new Message({
                ...messageData,
                senderId: userId,
                senderName: userName,
                senderType: 'user',
                recipientType: messageData.recipientType || 'user',
                priority: messageData.priority || MessagePriority.MEDIUM,
                status: MessageStatus.UNREAD,
                pushSettings: {
                    email: messageData.pushSettings?.email || false,
                    sms: messageData.pushSettings?.sms || false,
                    push: messageData.pushSettings?.push || true
                }
            });

            await message.save();

            res.status(201).json({
                success: true,
                data: message,
                message: '消息创建成功'
            });

        } catch (error) {
            console.error('创建消息失败:', error);
            res.status(500).json({
                success: false,
                message: '创建消息失败'
            });
        }
    }

    /**
     * 更新消息状态
     */
    async updateMessageStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            if (!Object.values(MessageStatus).includes(status)) {
                res.status(400).json({
                    success: false,
                    message: '无效的消息状态'
                });
                return;
            }

            // 构建查询条件 - 管理员可以操作所有消息，普通用户只能操作自己的消息
            const query: any = {
                _id: id,
                status: { $ne: MessageStatus.DELETED }
            };

            if (userRole !== '超级管理员' && userRole !== '项目经理') {
                query.recipientId = userId;
            }

            const message = await Message.findOne(query);

            if (!message) {
                res.status(404).json({
                    success: false,
                    message: '消息不存在'
                });
                return;
            }

            // 更新状态
            message.status = status;
            if (status === MessageStatus.READ && !message.readAt) {
                message.readAt = new Date();
            } else if (status === MessageStatus.ARCHIVED && !message.archivedAt) {
                message.archivedAt = new Date();
            }

            await message.save();

            res.json({
                success: true,
                data: message,
                message: '消息状态更新成功'
            });

        } catch (error) {
            console.error('更新消息状态失败:', error);
            res.status(500).json({
                success: false,
                message: '更新消息状态失败'
            });
        }
    }

    /**
     * 批量操作消息
     */
    async batchUpdateMessages(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const { messageIds, action, data }: BatchOperationDto = req.body;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
                res.status(400).json({
                    success: false,
                    message: '消息ID列表不能为空'
                });
                return;
            }

            if (!['read', 'unread', 'archive', 'delete'].includes(action)) {
                res.status(400).json({
                    success: false,
                    message: '无效的操作类型'
                });
                return;
            }

            // 构建更新条件
            const updateQuery: any = {};
            const currentTime = new Date();

            switch (action) {
                case 'read':
                    updateQuery.status = MessageStatus.READ;
                    updateQuery.readAt = currentTime;
                    break;
                case 'unread':
                    updateQuery.status = MessageStatus.UNREAD;
                    updateQuery.$unset = { readAt: 1 };
                    break;
                case 'archive':
                    updateQuery.status = MessageStatus.ARCHIVED;
                    updateQuery.archivedAt = currentTime;
                    break;
                case 'delete':
                    updateQuery.status = MessageStatus.DELETED;
                    break;
            }

            // 构建查询条件 - 管理员可以操作所有消息，普通用户只能操作自己的消息
            const batchQuery: any = {
                _id: { $in: messageIds },
                status: { $ne: MessageStatus.DELETED }
            };

            if (userRole !== '超级管理员' && userRole !== '项目经理') {
                batchQuery.recipientId = userId;
            }

            // 执行批量更新
            const result = await Message.updateMany(batchQuery, updateQuery);

            res.json({
                success: true,
                data: {
                    updated: result.modifiedCount,
                    failed: messageIds.length - result.modifiedCount
                },
                message: `成功${action === 'read' ? '标记已读' : action === 'unread' ? '标记未读' : action === 'archive' ? '归档' : '删除'} ${result.modifiedCount} 条消息`
            });

        } catch (error) {
            console.error('批量操作消息失败:', error);
            res.status(500).json({
                success: false,
                message: '批量操作消息失败'
            });
        }
    }

    /**
     * 删除消息
     */
    async deleteMessage(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            // 构建查询条件 - 管理员可以删除所有消息，普通用户只能删除自己的消息
            const query: any = {
                _id: id,
                status: { $ne: MessageStatus.DELETED }
            };

            if (userRole !== '超级管理员' && userRole !== '项目经理') {
                query.recipientId = userId;
            }

            const message = await Message.findOne(query);

            if (!message) {
                res.status(404).json({
                    success: false,
                    message: '消息不存在'
                });
                return;
            }

            // 软删除
            message.status = MessageStatus.DELETED;
            await message.save();

            res.json({
                success: true,
                message: '消息删除成功'
            });

        } catch (error) {
            console.error('删除消息失败:', error);
            res.status(500).json({
                success: false,
                message: '删除消息失败'
            });
        }
    }

    /**
     * 获取未读消息数量
     */
    async getUnreadCount(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            const count = await Message.countDocuments({
                recipientId: userId,
                status: MessageStatus.UNREAD
            });

            res.json({
                success: true,
                data: { count }
            });

        } catch (error) {
            console.error('获取未读消息数量失败:', error);
            res.status(500).json({
                success: false,
                message: '获取未读消息数量失败'
            });
        }
    }

    /**
     * 标记所有消息为已读
     */
    async markAllAsRead(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            const result = await Message.updateMany(
                {
                    recipientId: userId,
                    status: MessageStatus.UNREAD
                },
                {
                    status: MessageStatus.READ,
                    readAt: new Date()
                }
            );

            res.json({
                success: true,
                data: { updated: result.modifiedCount },
                message: `成功标记 ${result.modifiedCount} 条消息为已读`
            });

        } catch (error) {
            console.error('标记所有消息为已读失败:', error);
            res.status(500).json({
                success: false,
                message: '标记所有消息为已读失败'
            });
        }
    }
}
