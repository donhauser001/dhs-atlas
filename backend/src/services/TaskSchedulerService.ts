import cron from 'node-cron';
import Task from '../models/Task';
import { BusinessMessageService } from './BusinessMessageService';

/**
 * 任务调度服务
 * 负责定时检查任务状态并发送相关通知
 */
export class TaskSchedulerService {
    private businessMessageService = new BusinessMessageService();
    private isRunning = false;

    /**
     * 启动定时任务
     */
    start(): void {
        if (this.isRunning) {
            console.log('⚠️ 任务调度服务已在运行中');
            return;
        }

        console.log('🚀 启动任务调度服务...');

        // 每天上午9点检查任务到期情况
        cron.schedule('0 9 * * *', async () => {
            console.log('⏰ 开始检查任务到期情况...');
            await this.checkTasksDueSoon();
            await this.checkOverdueTasks();
        });

        // 每小时检查一次逾期任务（工作时间内）
        cron.schedule('0 9-18 * * 1-5', async () => {
            await this.checkOverdueTasks();
        });

        this.isRunning = true;
        console.log('✅ 任务调度服务已启动');
    }

    /**
     * 停止定时任务
     */
    stop(): void {
        if (!this.isRunning) {
            console.log('⚠️ 任务调度服务未在运行');
            return;
        }

        // 停止所有定时任务
        cron.getTasks().forEach(task => task.stop());
        this.isRunning = false;
        console.log('🛑 任务调度服务已停止');
    }

    /**
     * 检查即将到期的任务
     */
    private async checkTasksDueSoon(): Promise<void> {
        try {
            const now = new Date();
            const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            const oneDayLater = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

            // 查找3天内到期的未完成任务
            const tasksDueSoon = await Task.find({
                dueDate: {
                    $gte: now,
                    $lte: threeDaysLater
                },
                status: { $nin: ['completed', 'cancelled'] }
            });

            console.log(`📋 发现 ${tasksDueSoon.length} 个即将到期的任务`);

            for (const task of tasksDueSoon) {
                const dueDate = new Date(task.dueDate!);
                const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                // 只对1天和3天到期的任务发送提醒
                if (daysUntilDue === 1 || daysUntilDue === 3) {
                    await this.businessMessageService.notifyTaskDueSoon(task, daysUntilDue);
                }
            }
        } catch (error) {
            console.error('检查即将到期任务失败:', error);
        }
    }

    /**
     * 检查逾期任务
     */
    private async checkOverdueTasks(): Promise<void> {
        try {
            const now = new Date();

            // 查找已逾期的未完成任务
            const overdueTasks = await Task.find({
                dueDate: { $lt: now },
                status: { $nin: ['completed', 'cancelled'] }
            });

            console.log(`⚠️ 发现 ${overdueTasks.length} 个逾期任务`);

            for (const task of overdueTasks) {
                // 检查是否已经发送过逾期通知（避免重复发送）
                const lastNotificationKey = `overdue_notification_${task._id}`;
                const lastNotificationTime = await this.getLastNotificationTime(lastNotificationKey);

                // 如果超过24小时没有发送过逾期通知，则发送
                if (!lastNotificationTime || (now.getTime() - lastNotificationTime.getTime()) > 24 * 60 * 60 * 1000) {
                    await this.businessMessageService.notifyTaskOverdue(task);
                    await this.setLastNotificationTime(lastNotificationKey, now);
                }
            }
        } catch (error) {
            console.error('检查逾期任务失败:', error);
        }
    }

    /**
     * 手动触发任务检查（用于测试）
     */
    async triggerTaskCheck(): Promise<void> {
        console.log('🔧 手动触发任务检查...');
        await this.checkTasksDueSoon();
        await this.checkOverdueTasks();
        console.log('✅ 任务检查完成');
    }

    /**
     * 获取上次通知时间（简单的内存存储，生产环境可以使用Redis）
     */
    private notificationCache = new Map<string, Date>();

    private async getLastNotificationTime(key: string): Promise<Date | null> {
        return this.notificationCache.get(key) || null;
    }

    private async setLastNotificationTime(key: string, time: Date): Promise<void> {
        this.notificationCache.set(key, time);
    }

    /**
     * 获取服务状态
     */
    getStatus(): { isRunning: boolean; activeTasks: number } {
        return {
            isRunning: this.isRunning,
            activeTasks: cron.getTasks().size
        };
    }
}

export default TaskSchedulerService;
