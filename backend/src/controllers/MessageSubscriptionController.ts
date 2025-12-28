import { Request, Response } from 'express';
import { MessageSubscription, IMessageSubscription } from '../models/MessageSubscription';

export class MessageSubscriptionController {
    /**
     * 获取用户订阅设置
     */
    async getSubscription(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            let subscription = await MessageSubscription.findOne({ userId });

            // 如果用户没有订阅设置，创建默认设置
            if (!subscription) {
                subscription = new MessageSubscription({
                    userId,
                    globalSettings: {
                        enabled: true,
                        emailNotifications: true,
                        smsNotifications: false,
                        pushNotifications: true,
                        doNotDisturb: {
                            enabled: false,
                            startTime: '22:00',
                            endTime: '08:00'
                        }
                    },
                    categorySettings: {},
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await subscription.save();
            }

            res.json({
                success: true,
                data: subscription
            });

        } catch (error) {
            console.error('获取订阅设置失败:', error);
            res.status(500).json({
                success: false,
                message: '获取订阅设置失败'
            });
        }
    }

    /**
     * 更新用户订阅设置
     */
    async updateSubscription(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            const subscriptionData = req.body;

            // 查找现有订阅设置
            let subscription = await MessageSubscription.findOne({ userId });

            if (subscription) {
                // 更新现有设置
                Object.assign(subscription, subscriptionData);
                await subscription.save();
            } else {
                // 创建新的订阅设置
                subscription = new MessageSubscription({
                    userId,
                    ...subscriptionData
                });
                await subscription.save();
            }

            res.json({
                success: true,
                data: subscription,
                message: '订阅设置更新成功'
            });

        } catch (error) {
            console.error('更新订阅设置失败:', error);
            res.status(500).json({
                success: false,
                message: '更新订阅设置失败'
            });
        }
    }

    /**
     * 重置为默认订阅设置
     */
    async resetToDefault(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            // 删除现有设置
            await MessageSubscription.findOneAndDelete({ userId });

            // 创建默认设置
            const subscription = new MessageSubscription({
                userId,
                globalSettings: {
                    enabled: true,
                    emailNotifications: true,
                    smsNotifications: false,
                    pushNotifications: true,
                    doNotDisturb: {
                        enabled: false,
                        startTime: '22:00',
                        endTime: '08:00'
                    }
                },
                categorySettings: {},
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await subscription.save();

            res.json({
                success: true,
                data: subscription,
                message: '订阅设置已重置为默认值'
            });

        } catch (error) {
            console.error('重置订阅设置失败:', error);
            res.status(500).json({
                success: false,
                message: '重置订阅设置失败'
            });
        }
    }

    /**
     * 更新免打扰设置
     */
    async updateDoNotDisturb(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            const doNotDisturbData = req.body;

            let subscription = await MessageSubscription.findOne({ userId });

            if (!subscription) {
                subscription = new MessageSubscription({
                    userId,
                    globalSettings: {
                        enabled: true,
                        emailNotifications: true,
                        smsNotifications: false,
                        pushNotifications: true,
                        doNotDisturb: {
                            enabled: false,
                            startTime: '22:00',
                            endTime: '08:00'
                        }
                    },
                    categorySettings: {},
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await subscription.save();
            }

            // 更新免打扰设置
            subscription.doNotDisturb = {
                ...subscription.doNotDisturb,
                ...doNotDisturbData
            };

            await subscription.save();

            res.json({
                success: true,
                data: subscription.doNotDisturb,
                message: '免打扰设置更新成功'
            });

        } catch (error) {
            console.error('更新免打扰设置失败:', error);
            res.status(500).json({
                success: false,
                message: '更新免打扰设置失败'
            });
        }
    }

    /**
     * 更新全局设置
     */
    async updateGlobalSettings(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            const globalSettingsData = req.body;

            let subscription = await MessageSubscription.findOne({ userId });

            if (!subscription) {
                subscription = new MessageSubscription({
                    userId,
                    globalSettings: {
                        enabled: true,
                        emailNotifications: true,
                        smsNotifications: false,
                        pushNotifications: true,
                        doNotDisturb: {
                            enabled: false,
                            startTime: '22:00',
                            endTime: '08:00'
                        }
                    },
                    categorySettings: {},
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await subscription.save();
            }

            // 更新全局设置
            subscription.globalSettings = {
                ...subscription.globalSettings,
                ...globalSettingsData
            };

            await subscription.save();

            res.json({
                success: true,
                data: subscription.globalSettings,
                message: '全局设置更新成功'
            });

        } catch (error) {
            console.error('更新全局设置失败:', error);
            res.status(500).json({
                success: false,
                message: '更新全局设置失败'
            });
        }
    }

    /**
     * 检查用户是否订阅了特定消息类型
     */
    async checkSubscription(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const { type, category, priority } = req.query;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            const subscription = await MessageSubscription.findOne({ userId });

            if (!subscription) {
                res.json({
                    success: true,
                    data: { subscribed: false }
                });
                return;
            }

            // 检查订阅状态逻辑 - 简化实现
            let isSubscribed = false;
            
            // 检查是否有匹配的订阅设置
            if (subscription.subscriptions && subscription.subscriptions.length > 0) {
                isSubscribed = subscription.subscriptions.some(sub => {
                    const typeMatch = !type || sub.type === type;
                    const categoryMatch = !category || sub.categories.includes(category as any);
                    const priorityMatch = !priority || sub.priority.includes(priority as any);
                    return typeMatch && categoryMatch && priorityMatch;
                });
            }

            res.json({
                success: true,
                data: { subscribed: isSubscribed }
            });

        } catch (error) {
            console.error('检查订阅状态失败:', error);
            res.status(500).json({
                success: false,
                message: '检查订阅状态失败'
            });
        }
    }
}
