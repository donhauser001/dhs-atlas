import { Message, IMessage, MessageType, MessageCategory, MessagePriority, MessageStatus } from '../models/Message';
import { MessageTemplate, IMessageTemplate } from '../models/MessageTemplate';
import { MessageSubscription } from '../models/MessageSubscription';
import User from '../models/User';
import mongoose from 'mongoose';
import { getWebSocketService } from '../app';

// 创建消息DTO
export interface CreateMessageDto {
    title: string;
    content: string;
    summary?: string;
    type: MessageType;
    category: MessageCategory;
    priority?: MessagePriority;
    senderId?: string;
    senderName: string;
    senderType?: 'system' | 'user';
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

// 消息过滤器
export interface MessageFilters {
    type?: MessageType;
    category?: MessageCategory;
    status?: MessageStatus;
    priority?: MessagePriority;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    relatedEntityType?: string;
    relatedEntityId?: string;
}

// 分页结果
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        current: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    statistics?: {
        unreadCount: number;
        totalCount: number;
        typeCount: Record<string, number>;
    };
}

// 批量操作结果
export interface BatchResult {
    updated: number;
    failed: number;
    errors?: string[];
}

// 消息统计
export interface MessageStatistics {
    totalCount: number;
    unreadCount: number;
    readCount: number;
    archivedCount: number;
    typeDistribution: Record<MessageType, number>;
    categoryDistribution: Record<MessageCategory, number>;
    priorityDistribution: Record<MessagePriority, number>;
    recentActivity: {
        date: string;
        count: number;
    }[];
}

// 批量操作类型
export type BatchAction = 'read' | 'unread' | 'archive' | 'delete';

export class MessageService {
    /**
     * 创建单个消息
     */
    async createMessage(messageData: CreateMessageDto): Promise<IMessage> {
        try {
            // 验证接收者是否存在
            await this.validateRecipient(messageData.recipientId, messageData.recipientType || 'user');

            // 创建消息
            const message = new Message({
                ...messageData,
                senderType: messageData.senderType || 'system',
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

            // 触发实时推送（这里先预留接口，后续实现WebSocket推送）
            await this.triggerRealTimePush(message);

            return message;

        } catch (error) {
            console.error('创建消息失败:', error);
            throw new Error('创建消息失败');
        }
    }

    /**
     * 批量创建消息
     */
    async createBulkMessages(messages: CreateMessageDto[]): Promise<IMessage[]> {
        try {
            const createdMessages: IMessage[] = [];
            const errors: string[] = [];

            for (const messageData of messages) {
                try {
                    const message = await this.createMessage(messageData);
                    createdMessages.push(message);
                } catch (error) {
                    errors.push(`创建消息失败: ${messageData.title} - ${error}`);
                }
            }

            if (errors.length > 0) {
                console.warn('批量创建消息部分失败:', errors);
            }

            return createdMessages;

        } catch (error) {
            console.error('批量创建消息失败:', error);
            throw new Error('批量创建消息失败');
        }
    }

    /**
     * 获取用户消息列表
     */
    async getUserMessages(
        userId: string,
        filters: MessageFilters = {},
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedResult<IMessage>> {
        try {
            // 构建查询条件
            const query: any = {
                recipientId: userId,
                status: { $ne: MessageStatus.DELETED }
            };

            // 添加过滤条件
            if (filters.type) query.type = filters.type;
            if (filters.category) query.category = filters.category;
            if (filters.status) query.status = filters.status;
            if (filters.priority) query.priority = filters.priority;
            if (filters.relatedEntityType) query.relatedEntityType = filters.relatedEntityType;
            if (filters.relatedEntityId) query.relatedEntityId = filters.relatedEntityId;

            // 搜索条件
            if (filters.search) {
                query.$or = [
                    { title: { $regex: filters.search, $options: 'i' } },
                    { content: { $regex: filters.search, $options: 'i' } },
                    { summary: { $regex: filters.search, $options: 'i' } }
                ];
            }

            // 时间范围过滤
            if (filters.startDate || filters.endDate) {
                query.createdAt = {};
                if (filters.startDate) query.createdAt.$gte = filters.startDate;
                if (filters.endDate) query.createdAt.$lte = filters.endDate;
            }

            // 分页参数
            const skip = (page - 1) * limit;

            // 执行查询
            const [messages, total] = await Promise.all([
                Message.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Message.countDocuments(query)
            ]);

            // 获取统计信息
            const statistics = await this.getMessageStatistics(userId);

            return {
                data: messages,
                pagination: {
                    current: page,
                    pageSize: limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                statistics: {
                    unreadCount: statistics.unreadCount,
                    totalCount: statistics.totalCount,
                    typeCount: statistics.typeDistribution
                }
            };

        } catch (error) {
            console.error('获取用户消息失败:', error);
            throw new Error('获取用户消息失败');
        }
    }

    /**
     * 更新消息状态
     */
    async updateMessageStatus(messageId: string, status: MessageStatus, userId?: string): Promise<IMessage> {
        try {
            const message = await Message.findById(messageId);

            if (!message) {
                throw new Error('消息不存在');
            }

            // 检查权限（如果提供了userId）
            if (userId && message.recipientId !== userId) {
                throw new Error('无权限操作此消息');
            }

            // 更新状态
            message.status = status;

            // 设置相关时间戳
            const now = new Date();
            if (status === MessageStatus.READ && !message.readAt) {
                message.readAt = now;
            } else if (status === MessageStatus.ARCHIVED && !message.archivedAt) {
                message.archivedAt = now;
            }

            await message.save();

            return message;

        } catch (error) {
            console.error('更新消息状态失败:', error);
            throw error;
        }
    }

    /**
     * 批量更新消息
     */
    async batchUpdateMessages(
        messageIds: string[],
        action: BatchAction,
        userId?: string
    ): Promise<BatchResult> {
        try {
            let updateQuery: any = {};
            const currentTime = new Date();

            // 构建更新查询
            switch (action) {
                case 'read':
                    updateQuery = {
                        status: MessageStatus.READ,
                        readAt: currentTime
                    };
                    break;
                case 'unread':
                    updateQuery = {
                        status: MessageStatus.UNREAD,
                        $unset: { readAt: 1 }
                    };
                    break;
                case 'archive':
                    updateQuery = {
                        status: MessageStatus.ARCHIVED,
                        archivedAt: currentTime
                    };
                    break;
                case 'delete':
                    updateQuery = {
                        status: MessageStatus.DELETED
                    };
                    break;
                default:
                    throw new Error('无效的操作类型');
            }

            // 构建查询条件
            const query: any = {
                _id: { $in: messageIds },
                status: { $ne: MessageStatus.DELETED }
            };

            // 如果提供了userId，只能操作自己的消息
            if (userId) {
                query.recipientId = userId;
            }

            // 执行批量更新
            const result = await Message.updateMany(query, updateQuery);

            return {
                updated: result.modifiedCount,
                failed: messageIds.length - result.modifiedCount
            };

        } catch (error) {
            console.error('批量更新消息失败:', error);
            throw error;
        }
    }

    /**
     * 删除过期消息
     */
    async cleanupExpiredMessages(): Promise<number> {
        try {
            const result = await Message.deleteMany({
                expiresAt: { $lt: new Date() }
            });

            console.log(`清理了 ${result.deletedCount} 条过期消息`);
            return result.deletedCount;

        } catch (error) {
            console.error('清理过期消息失败:', error);
            throw new Error('清理过期消息失败');
        }
    }

    /**
     * 获取消息统计信息
     */
    async getMessageStatistics(userId: string): Promise<MessageStatistics> {
        try {
            const baseQuery = { recipientId: userId, status: { $ne: MessageStatus.DELETED } };

            // 基础统计
            const [
                totalCount,
                unreadCount,
                readCount,
                archivedCount
            ] = await Promise.all([
                Message.countDocuments(baseQuery),
                Message.countDocuments({ ...baseQuery, status: MessageStatus.UNREAD }),
                Message.countDocuments({ ...baseQuery, status: MessageStatus.READ }),
                Message.countDocuments({ ...baseQuery, status: MessageStatus.ARCHIVED })
            ]);

            // 类型分布统计
            const typeDistribution = await this.getDistributionStats(userId, 'type');
            const categoryDistribution = await this.getDistributionStats(userId, 'category');
            const priorityDistribution = await this.getDistributionStats(userId, 'priority');

            // 最近活动统计（最近7天）
            const recentActivity = await this.getRecentActivityStats(userId, 7);

            return {
                totalCount,
                unreadCount,
                readCount,
                archivedCount,
                typeDistribution: typeDistribution as Record<MessageType, number>,
                categoryDistribution: categoryDistribution as Record<MessageCategory, number>,
                priorityDistribution: priorityDistribution as Record<MessagePriority, number>,
                recentActivity
            };

        } catch (error) {
            console.error('获取消息统计失败:', error);
            throw new Error('获取消息统计失败');
        }
    }

    /**
     * 根据模板创建消息
     */
    async createMessageFromTemplate(
        templateCode: string,
        data: Record<string, any>,
        recipientId: string,
        recipientType: 'user' | 'role' | 'department' = 'user'
    ): Promise<IMessage[]> {
        try {
            console.log(`🔍 [MessageService] 查找模板: ${templateCode.toUpperCase()}`);
            const template = await MessageTemplate.findOne({ code: templateCode.toUpperCase(), enabled: true });

            if (!template) {
                console.error(`❌ [MessageService] 模板不存在: ${templateCode.toUpperCase()}`);
                throw new Error('消息模板不存在');
            }

            if (!template.enabled) {
                console.error(`❌ [MessageService] 模板已禁用: ${templateCode.toUpperCase()}`);
                throw new Error('消息模板已禁用');
            }

            console.log(`✅ [MessageService] 找到模板: ${template.name}, recipientRules:`, JSON.stringify(template.recipientRules, null, 2));

            // 渲染模板内容
            console.log(`🎨 [MessageService] 开始渲染模板内容...`);
            const renderedContent = await this.renderTemplate(template, data);
            console.log(`✅ [MessageService] 模板内容渲染完成:`, {
                title: renderedContent.title,
                summary: renderedContent.summary?.substring(0, 50) + '...',
                content: renderedContent.content?.substring(0, 100) + '...'
            });

            // 获取接收者列表
            console.log(`👥 [MessageService] 开始获取接收者列表...`);
            const recipients = await this.getRecipients(template.recipientRules, data, recipientId, recipientType);
            console.log(`📋 [MessageService] 接收者列表:`, recipients.length, '个接收者', recipients);

            if (recipients.length === 0) {
                console.warn(`⚠️ [MessageService] 没有找到任何接收者，跳过消息创建`);
                return [];
            }

            // 批量创建消息
            console.log(`📝 [MessageService] 开始创建 ${recipients.length} 条消息...`);
            const messagePromises = recipients.map(recipient => {
                // 根据业务模块映射消息类型和分类
                const { type, category } = this.getMessageTypeFromBusinessModule(template.businessModule);

                const messageData: CreateMessageDto = {
                    title: renderedContent.title,
                    content: renderedContent.content,
                    summary: renderedContent.summary,
                    type,
                    category,
                    priority: template.priority as MessagePriority,
                    senderName: '系统',
                    senderType: 'system',
                    recipientId: recipient.id,
                    recipientType: recipient.type as 'user' | 'role' | 'department',
                    expiresAt: template.expiresIn ? new Date(Date.now() + template.expiresIn * 60 * 60 * 1000) : undefined,
                    pushSettings: this.getDefaultPushSettings(template.sendTargets),
                    metadata: {
                        templateCode: template.code,
                        templateVersion: template.version,
                        businessModule: template.businessModule,
                        triggerCondition: template.triggerCondition,
                        ...data
                    }
                };

                return this.createMessage(messageData);
            });

            const messages = await Promise.all(messagePromises);
            console.log(`✅ [MessageService] 成功创建 ${messages.length} 条消息`);
            messages.forEach((msg, index) => {
                console.log(`  消息 ${index + 1}: ${msg.title} -> ${msg.recipientId} (状态: ${msg.status})`);
            });

            // 更新模板使用统计
            template.usageCount += 1;
            template.lastUsedAt = new Date();
            await template.save();

            return messages;

        } catch (error: any) {
            console.error('根据模板创建消息失败:', error);
            console.error('错误详情:', {
                templateCode,
                recipientId,
                recipientType,
                errorMessage: error?.message,
                errorStack: error?.stack
            });
            throw error;
        }
    }

    /**
     * 根据业务模块映射消息类型和分类
     */
    private getMessageTypeFromBusinessModule(businessModule: string): { type: MessageType, category: MessageCategory } {
        const moduleMapping: Record<string, { type: MessageType, category: MessageCategory }> = {
            'client': { type: MessageType.CLIENT, category: MessageCategory.NOTIFICATION },
            'project': { type: MessageType.PROJECT, category: MessageCategory.NOTIFICATION },
            'finance': { type: MessageType.WORKFLOW, category: MessageCategory.NOTIFICATION },
            'pricing': { type: MessageType.WORKFLOW, category: MessageCategory.NOTIFICATION },
            'contract': { type: MessageType.WORKFLOW, category: MessageCategory.NOTIFICATION },
            'form': { type: MessageType.WORKFLOW, category: MessageCategory.NOTIFICATION },
            'content': { type: MessageType.ANNOUNCEMENT, category: MessageCategory.INFO },
            'file': { type: MessageType.WORKFLOW, category: MessageCategory.NOTIFICATION },
            'user': { type: MessageType.SYSTEM, category: MessageCategory.NOTIFICATION },
            'organization': { type: MessageType.SYSTEM, category: MessageCategory.NOTIFICATION },
            'system': { type: MessageType.SYSTEM, category: MessageCategory.NOTIFICATION }
        };

        return moduleMapping[businessModule] || { type: MessageType.SYSTEM, category: MessageCategory.NOTIFICATION };
    }

    /**
     * 根据发送目标生成推送设置
     */
    private getDefaultPushSettings(sendTargets: string[]): { email: boolean, sms: boolean, push: boolean } {
        return {
            email: sendTargets.includes('email'),
            sms: sendTargets.includes('sms'),
            push: sendTargets.includes('message') || sendTargets.includes('push')
        };
    }

    // 私有辅助方法

    /**
     * 验证接收者是否存在
     */
    private async validateRecipient(recipientId: string, recipientType: string): Promise<void> {
        if (recipientType === 'user') {
            try {
                const objectId = new mongoose.Types.ObjectId(recipientId);
                const user = await User.findById(objectId);
                if (!user) {
                    throw new Error('接收者用户不存在');
                }
            } catch (error) {
                console.error('❌ validateRecipient - ObjectId creation failed:', error);
                throw error;
            }
        }
        // 这里可以添加对role和department的验证
    }

    /**
     * 触发实时推送
     */
    private async triggerRealTimePush(message: IMessage): Promise<void> {
        try {
            const webSocketService = getWebSocketService();
            if (webSocketService) {
                // 使用WebSocket推送消息
                webSocketService.pushMessage(message);
            } else {
                console.log(`WebSocket服务未初始化，跳过实时推送: ${message.title}`);
            }
        } catch (error) {
            console.error('实时推送失败:', error);
            // 推送失败不影响消息创建，只记录错误
        }
    }

    /**
     * 渲染模板内容
     */
    private async renderTemplate(
        template: IMessageTemplate,
        data: Record<string, any>
    ): Promise<{ title: string; content: string; summary?: string }> {
        try {
            // 简单的模板渲染（使用字符串替换）
            // 后续可以集成更强大的模板引擎如Handlebars
            const title = this.replaceTemplateVariables(template.titleTemplate, data);
            const content = this.replaceTemplateVariables(template.contentTemplate, data);
            const summary = template.summaryTemplate
                ? this.replaceTemplateVariables(template.summaryTemplate, data)
                : undefined;

            return { title, content, summary };

        } catch (error) {
            console.error('渲染模板失败:', error);
            throw new Error('渲染模板失败');
        }
    }

    /**
     * 替换模板变量
     */
    private replaceTemplateVariables(template: string, data: Record<string, any>): string {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] !== undefined ? String(data[key]) : match;
        });
    }

    /**
     * 获取接收者列表
     */
    private async getRecipients(
        rules: any[],
        data: Record<string, any>,
        defaultRecipientId: string,
        defaultRecipientType: string
    ): Promise<Array<{ id: string; type: string }>> {
        // 如果没有规则，使用默认接收者
        if (!rules || rules.length === 0) {
            return [{ id: defaultRecipientId, type: defaultRecipientType }];
        }

        const recipients: Array<{ id: string; type: string }> = [];

        for (const rule of rules) {
            switch (rule.type) {
                case 'user':
                    if (Array.isArray(rule.value)) {
                        rule.value.forEach((userId: string) => {
                            recipients.push({ id: userId, type: 'user' });
                        });
                    } else {
                        recipients.push({ id: rule.value, type: 'user' });
                    }
                    break;
                case 'role':
                    recipients.push({ id: rule.value, type: 'role' });
                    break;
                case 'department':
                    recipients.push({ id: rule.value, type: 'department' });
                    break;
                case 'custom':
                    // 自定义规则处理
                    const customRecipients = await this.processCustomRule(rule, data);
                    recipients.push(...customRecipients);
                    break;
            }
        }

        return recipients;
    }

    /**
     * 处理自定义接收者规则
     */
    private async processCustomRule(
        rule: any,
        data: Record<string, any>
    ): Promise<Array<{ id: string; type: string }>> {
        // 这里可以实现复杂的自定义规则逻辑
        // 例如根据数据中的条件动态确定接收者
        return [];
    }

    /**
     * 获取分布统计
     */
    private async getDistributionStats(userId: string, field: string): Promise<Record<string, number>> {
        const result = await Message.aggregate([
            {
                $match: {
                    recipientId: userId,
                    status: { $ne: MessageStatus.DELETED }
                }
            },
            {
                $group: {
                    _id: `$${field}`,
                    count: { $sum: 1 }
                }
            }
        ]);

        const distribution: Record<string, number> = {};
        result.forEach(item => {
            distribution[item._id] = item.count;
        });

        return distribution;
    }

    /**
     * 获取最近活动统计
     */
    private async getRecentActivityStats(userId: string, days: number): Promise<Array<{ date: string; count: number }>> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const result = await Message.aggregate([
            {
                $match: {
                    recipientId: userId,
                    status: { $ne: MessageStatus.DELETED },
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        return result.map(item => ({
            date: item._id,
            count: item.count
        }));
    }
}

export default new MessageService();
