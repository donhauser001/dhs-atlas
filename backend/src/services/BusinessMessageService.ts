import MessageService from './MessageService';
import { ITask } from '../models/Task';
import { IProject } from '../models/Project';
import { IUser } from '../models/User';
import { MessageType, MessageCategory, MessagePriority } from '../models/Message';
import mongoose from 'mongoose';

/**
 * 业务消息集成服务
 * 负责将业务流程事件转换为消息通知
 */
export class BusinessMessageService {
    private messageService = MessageService;

    /**
     * 任务相关消息通知
     */

    /**
     * 任务分配通知
     */
    async notifyTaskAssignment(task: ITask, assignedUsers: string[], assignedBy: string): Promise<void> {
        try {
            // 获取分配者信息
            const assignerUser = await this.getUserInfo(assignedBy);
            const assignerName = assignerUser?.username || '系统';

            // 为每个被分配的用户发送通知
            for (const userId of assignedUsers) {
                await this.messageService.createMessageFromTemplate(
                    'TASK_ASSIGNED',
                    {
                        taskName: task.taskName,
                        projectName: await this.getProjectName(task.projectId),
                        assignerName,
                        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString('zh-CN') : '未设定',
                        priority: this.getPriorityText(task.priority),
                        taskId: (task._id as any).toString(),
                        projectId: task.projectId
                    },
                    userId,
                    'user'
                );
            }

            console.log(`✅ 任务分配通知已发送: ${task.taskName} -> ${assignedUsers.length}个用户`);
        } catch (error) {
            console.error('发送任务分配通知失败:', error);
        }
    }

    /**
     * 任务状态变更通知
     */
    async notifyTaskStatusChange(
        task: ITask,
        oldStatus: string,
        newStatus: string,
        updatedBy: string
    ): Promise<void> {
        try {
            const updaterUser = await this.getUserInfo(updatedBy);
            const updaterName = updaterUser?.username || '系统';

            // 获取需要通知的用户（任务相关人员）
            const notifyUsers = await this.getTaskRelatedUsers(task);

            // 根据状态变更类型选择不同的模板
            let templateCode = 'TASK_STATUS_CHANGED';
            let priority: MessagePriority = MessagePriority.MEDIUM;

            if (newStatus === 'completed') {
                templateCode = 'TASK_COMPLETED';
                priority = MessagePriority.HIGH;
            } else if (newStatus === 'cancelled') {
                templateCode = 'TASK_CANCELLED';
                priority = MessagePriority.HIGH;
            } else if (newStatus === 'on-hold') {
                templateCode = 'TASK_ON_HOLD';
                priority = MessagePriority.MEDIUM;
            }

            for (const userId of notifyUsers) {
                await this.messageService.createMessage({
                    type: MessageType.TASK,
                    category: MessageCategory.NOTIFICATION,
                    priority,
                    title: `任务状态变更：${task.taskName}`,
                    content: `任务"${task.taskName}"的状态已从"${this.getStatusText(oldStatus)}"变更为"${this.getStatusText(newStatus)}"`,
                    summary: `${updaterName}更新了任务状态`,
                    senderId: updatedBy,
                    senderName: updaterName,
                    recipientId: userId,
                    recipientType: 'user',
                    metadata: {
                        taskId: (task._id as any).toString(),
                        projectId: task.projectId,
                        oldStatus,
                        newStatus,
                        businessType: 'task_status_change'
                    }
                });
            }

            console.log(`✅ 任务状态变更通知已发送: ${task.taskName} (${oldStatus} -> ${newStatus})`);
        } catch (error) {
            console.error('发送任务状态变更通知失败:', error);
        }
    }

    /**
     * 任务逾期提醒
     */
    async notifyTaskOverdue(task: ITask): Promise<void> {
        try {
            const notifyUsers = await this.getTaskRelatedUsers(task);
            const overdueDays = Math.ceil((Date.now() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24));

            for (const userId of notifyUsers) {
                await this.messageService.createMessage({
                    type: MessageType.TASK,
                    category: MessageCategory.ALERT,
                    priority: MessagePriority.URGENT,
                    title: `任务逾期提醒：${task.taskName}`,
                    content: `任务"${task.taskName}"已逾期${overdueDays}天，请及时处理。`,
                    summary: `逾期${overdueDays}天`,
                    senderId: 'system',
                    senderName: '系统',
                    recipientId: userId,
                    recipientType: 'user',
                    metadata: {
                        taskId: (task._id as any).toString(),
                        projectId: task.projectId,
                        overdueDays,
                        businessType: 'task_overdue'
                    }
                });
            }

            console.log(`⚠️ 任务逾期提醒已发送: ${task.taskName} (逾期${overdueDays}天)`);
        } catch (error) {
            console.error('发送任务逾期提醒失败:', error);
        }
    }

    /**
     * 任务即将到期提醒
     */
    async notifyTaskDueSoon(task: ITask, daysUntilDue: number): Promise<void> {
        try {
            const notifyUsers = await this.getTaskRelatedUsers(task);

            for (const userId of notifyUsers) {
                await this.messageService.createMessage({
                    type: MessageType.TASK,
                    category: MessageCategory.REMINDER,
                    priority: daysUntilDue <= 1 ? MessagePriority.HIGH : MessagePriority.MEDIUM,
                    title: `任务即将到期：${task.taskName}`,
                    content: `任务"${task.taskName}"将在${daysUntilDue}天后到期，请注意安排进度。`,
                    summary: `${daysUntilDue}天后到期`,
                    senderId: 'system',
                    senderName: '系统',
                    recipientId: userId,
                    recipientType: 'user',
                    metadata: {
                        taskId: (task._id as any).toString(),
                        projectId: task.projectId,
                        daysUntilDue,
                        businessType: 'task_due_soon'
                    }
                });
            }

            console.log(`⏰ 任务到期提醒已发送: ${task.taskName} (${daysUntilDue}天后到期)`);
        } catch (error) {
            console.error('发送任务到期提醒失败:', error);
        }
    }

    /**
     * 项目相关消息通知
     */

    /**
     * 项目状态变更通知
     */
    async notifyProjectStatusChange(
        project: IProject,
        oldStatus: string,
        newStatus: string,
        updatedBy: string
    ): Promise<void> {
        try {
            const updaterUser = await this.getUserInfo(updatedBy);
            const updaterName = updaterUser?.username || '系统';

            // 获取项目相关人员
            const notifyUsers = await this.getProjectRelatedUsers(project);

            let priority: MessagePriority = MessagePriority.HIGH;
            if (newStatus === 'completed') {
                priority = MessagePriority.URGENT;
            } else if (newStatus === 'cancelled') {
                priority = MessagePriority.HIGH;
            }

            for (const userId of notifyUsers) {
                await this.messageService.createMessage({
                    type: MessageType.WORKFLOW,
                    category: MessageCategory.NOTIFICATION,
                    priority,
                    title: `项目状态变更：${project.projectName}`,
                    content: `项目"${project.projectName}"的进度状态已从"${this.getProjectStatusText(oldStatus)}"变更为"${this.getProjectStatusText(newStatus)}"`,
                    summary: `${updaterName}更新了项目状态`,
                    senderId: updatedBy,
                    senderName: updaterName,
                    recipientId: userId,
                    recipientType: 'user',
                    metadata: {
                        projectId: (project._id as any).toString(),
                        clientId: project.clientId,
                        oldStatus,
                        newStatus,
                        businessType: 'project_status_change'
                    }
                });
            }

            console.log(`✅ 项目状态变更通知已发送: ${project.projectName} (${oldStatus} -> ${newStatus})`);
        } catch (error) {
            console.error('发送项目状态变更通知失败:', error);
        }
    }

    /**
     * 项目团队变更通知
     */
    async notifyProjectTeamChange(
        project: IProject,
        changeType: 'added' | 'removed',
        userIds: string[],
        role: 'main' | 'assistant',
        updatedBy: string
    ): Promise<void> {
        try {
            const updaterUser = await this.getUserInfo(updatedBy);
            const updaterName = updaterUser?.username || '系统';
            const roleText = role === 'main' ? '主创设计师' : '助理设计师';
            const actionText = changeType === 'added' ? '加入' : '移出';

            // 通知被变更的用户
            for (const userId of userIds) {
                const user = await this.getUserInfo(userId);
                const userName = user?.username || '用户';

                await this.messageService.createMessage({
                    type: MessageType.WORKFLOW,
                    category: MessageCategory.NOTIFICATION,
                    priority: MessagePriority.MEDIUM,
                    title: `项目团队变更：${project.projectName}`,
                    content: `您已被${actionText}项目"${project.projectName}"的${roleText}团队。`,
                    summary: `${actionText}${roleText}团队`,
                    senderId: updatedBy,
                    senderName: updaterName,
                    recipientId: userId,
                    recipientType: 'user',
                    metadata: {
                        projectId: (project._id as any).toString(),
                        changeType,
                        role,
                        businessType: 'project_team_change'
                    }
                });
            }

            // 通知项目其他成员
            const otherMembers = await this.getProjectRelatedUsers(project);
            const changedUserNames = await Promise.all(
                userIds.map(async (id) => {
                    const user = await this.getUserInfo(id);
                    return user?.username || '用户';
                })
            );

            for (const memberId of otherMembers) {
                if (!userIds.includes(memberId)) {
                    await this.messageService.createMessage({
                        type: MessageType.WORKFLOW,
                        category: MessageCategory.INFO,
                        priority: MessagePriority.LOW,
                        title: `项目团队变更：${project.projectName}`,
                        content: `项目"${project.projectName}"的${roleText}团队发生变更：${changedUserNames.join('、')}已${actionText}团队。`,
                        summary: `团队成员变更`,
                        senderId: updatedBy,
                        senderName: updaterName,
                        recipientId: memberId,
                        recipientType: 'user',
                        metadata: {
                            projectId: (project._id as any).toString(),
                            changeType,
                            role,
                            businessType: 'project_team_change'
                        }
                    });
                }
            }

            console.log(`✅ 项目团队变更通知已发送: ${project.projectName} (${actionText}${roleText})`);
        } catch (error) {
            console.error('发送项目团队变更通知失败:', error);
        }
    }

    /**
     * 项目里程碑通知
     */
    async notifyProjectMilestone(
        project: IProject,
        milestone: 'started' | 'delivered' | 'settled',
        updatedBy: string
    ): Promise<void> {
        try {
            const updaterUser = await this.getUserInfo(updatedBy);
            const updaterName = updaterUser?.username || '系统';
            const notifyUsers = await this.getProjectRelatedUsers(project);

            const milestoneTexts = {
                started: '项目启动',
                delivered: '项目交付',
                settled: '项目结算完成'
            };

            const milestoneText = milestoneTexts[milestone];

            for (const userId of notifyUsers) {
                await this.messageService.createMessage({
                    type: MessageType.WORKFLOW,
                    category: MessageCategory.NOTIFICATION,
                    priority: MessagePriority.HIGH,
                    title: `项目里程碑：${project.projectName}`,
                    content: `项目"${project.projectName}"已达成重要里程碑：${milestoneText}。`,
                    summary: milestoneText,
                    senderId: updatedBy,
                    senderName: updaterName,
                    recipientId: userId,
                    recipientType: 'user',
                    metadata: {
                        projectId: (project._id as any).toString(),
                        milestone,
                        businessType: 'project_milestone'
                    }
                });
            }

            console.log(`🎯 项目里程碑通知已发送: ${project.projectName} (${milestoneText})`);
        } catch (error) {
            console.error('发送项目里程碑通知失败:', error);
        }
    }

    /**
     * 项目创建通知
     */
    async notifyProjectCreation(
        project: IProject,
        createdBy: string
    ): Promise<void> {
        try {
            console.log(`🔔 开始发送项目创建通知: ${project.projectName}`);
            console.log(`📋 项目信息: 创建者=${createdBy}, 主创设计师=${project.mainDesigners}, 助理设计师=${project.assistantDesigners}`);

            const creatorUser = await this.getUserInfo(createdBy);
            const creatorName = creatorUser?.username || '系统';
            console.log(`👤 创建者信息: ${creatorName} (${createdBy})`);

            const notifyUsers = await this.getProjectRelatedUsers(project);
            console.log(`👥 需要通知的用户: ${notifyUsers.length}个 - ${JSON.stringify(notifyUsers)}`);

            if (notifyUsers.length === 0) {
                console.log('⚠️ 没有找到需要通知的用户，跳过消息发送');
                return;
            }

            // 构建项目数据，包含所有可能的变量
            const projectData = {
                // 基本信息
                projectId: (project._id as any).toString(),
                projectName: project.projectName,
                projectDescription: project.clientRequirements || '暂无描述',
                clientId: project.clientId,
                clientName: project.clientName,

                // 联系人信息
                contactNames: project.contactNames?.join('、') || '暂无',
                contactPhones: project.contactPhones?.join('、') || '暂无',

                // 团队信息
                undertakingTeam: project.undertakingTeam || '暂无',
                mainDesigners: Array.isArray(project.mainDesigners) ? project.mainDesigners.join('、') : project.mainDesigners || '暂无',
                assistantDesigners: Array.isArray(project.assistantDesigners) ? project.assistantDesigners.join('、') : project.assistantDesigners || '暂无',

                // 状态信息
                progressStatus: project.progressStatus || 'planning',
                settlementStatus: project.settlementStatus || 'pending',

                // 时间信息
                createdAt: new Date().toLocaleString('zh-CN'),
                startedAt: project.startedAt ? new Date(project.startedAt).toLocaleString('zh-CN') : '未开始',
                deliveredAt: project.deliveredAt ? new Date(project.deliveredAt).toLocaleString('zh-CN') : '未交付',
                settledAt: project.settledAt ? new Date(project.settledAt).toLocaleString('zh-CN') : '未结算',

                // 业务信息
                clientRequirements: project.clientRequirements || '暂无',
                quotationId: project.quotationId || '暂无',
                remark: project.remark || '暂无',

                // 创建者信息
                creatorName,
                creatorId: createdBy,

                // 关联统计（暂时设为0，实际项目中可以查询）
                taskCount: 0,
                fileCount: 0,
                contractCount: 0,
                invoiceCount: 0,
                proposalCount: 0,

                // 关联ID和名称列表（新项目暂时为空）
                taskIds: '',
                taskNames: '',
                fileIds: '',
                fileNames: '',
                contractIds: '',
                contractNumbers: '',
                invoiceIds: '',
                invoiceNumbers: '',
                proposalIds: '',
                proposalTitles: ''
            };

            // 使用新的模板系统发送通知
            try {
                // 动态查找项目创建模板
                const templateCode = await this.findTemplateCode('project', 'create');
                if (templateCode) {
                    console.log(`🔄 开始调用 createMessageFromTemplate: ${templateCode}`);
                    console.log(`📊 项目数据:`, JSON.stringify(projectData, null, 2));
                    console.log(`👤 接收者ID: ${createdBy}`);

                    const messages = await this.messageService.createMessageFromTemplate(
                        templateCode,
                        projectData,
                        createdBy, // 这里传入创建者ID，模板会根据recipientRules决定实际接收者
                        'user'
                    );

                    console.log(`✅ createMessageFromTemplate 返回结果: ${messages.length} 条消息`);
                    messages.forEach((msg, index) => {
                        console.log(`  消息 ${index + 1}: ${msg.title} -> ${msg.recipientId} (状态: ${msg.status})`);
                    });

                    console.log(`✅ 项目创建通知已通过模板发送: ${project.projectName} (模板: ${templateCode})`);
                } else {
                    throw new Error('未找到项目创建模板');
                }
            } catch (templateError) {
                console.error('使用模板发送失败:', templateError);
                console.log('⚠️ 没有找到启用的项目创建模板，跳过消息发送');
                console.log('💡 提示：请在消息模板管理中创建并启用 businessModule=project, triggerCondition=create 的模板');
                // 不发送任何消息，完全依赖模板列表
            }

            console.log(`🆕 项目创建通知已发送: ${project.projectName} -> ${notifyUsers.length}个用户`);
        } catch (error) {
            console.error('发送项目创建通知失败:', error);
        }
    }

    /**
     * 项目删除通知
     */
    async notifyProjectDeletion(
        project: IProject,
        deletedBy: string
    ): Promise<void> {
        try {
            const deleterUser = await this.getUserInfo(deletedBy);
            const deleterName = deleterUser?.username || '系统';

            // 构建项目数据，包含所有可能的变量
            const projectData = {
                // 基本信息
                projectId: (project._id as any).toString(),
                projectName: project.projectName,
                projectDescription: project.clientRequirements || '暂无描述',
                clientId: project.clientId,
                clientName: project.clientName,

                // 联系人信息
                contactNames: project.contactNames?.join('、') || '暂无',
                contactPhones: project.contactPhones?.join('、') || '暂无',

                // 团队信息
                undertakingTeam: project.undertakingTeam || '暂无',
                mainDesigners: Array.isArray(project.mainDesigners) ? project.mainDesigners.join('、') : project.mainDesigners || '暂无',
                assistantDesigners: Array.isArray(project.assistantDesigners) ? project.assistantDesigners.join('、') : project.assistantDesigners || '暂无',

                // 状态信息
                progressStatus: project.progressStatus || 'planning',
                settlementStatus: project.settlementStatus || 'pending',

                // 时间信息
                deletedAt: new Date().toLocaleString('zh-CN'),
                startedAt: project.startedAt ? new Date(project.startedAt).toLocaleString('zh-CN') : '未开始',
                deliveredAt: project.deliveredAt ? new Date(project.deliveredAt).toLocaleString('zh-CN') : '未交付',
                settledAt: project.settledAt ? new Date(project.settledAt).toLocaleString('zh-CN') : '未结算',

                // 业务信息
                clientRequirements: project.clientRequirements || '暂无',
                quotationId: project.quotationId || '暂无',
                remark: project.remark || '暂无',

                // 删除者信息
                deleterName,
                deleterId: deletedBy
            };

            // 使用新的模板系统发送通知
            try {
                // 动态查找项目删除模板
                const templateCode = await this.findTemplateCode('project', 'delete');
                if (templateCode) {
                    await this.messageService.createMessageFromTemplate(
                        templateCode,
                        projectData,
                        deletedBy, // 这里传入删除者ID，模板会根据recipientRules决定实际接收者
                        'user'
                    );
                    console.log(`✅ 项目删除通知已通过模板发送: ${project.projectName} (模板: ${templateCode})`);
                } else {
                    throw new Error('未找到项目删除模板');
                }
            } catch (templateError) {
                console.error('使用模板发送失败:', templateError);
                console.log('⚠️ 没有找到启用的项目删除模板，跳过消息发送');
                console.log('💡 提示：请在消息模板管理中创建并启用 businessModule=project, triggerCondition=delete 的模板');
                // 不发送任何消息，完全依赖模板列表
            }

        } catch (error) {
            console.error('发送项目删除通知失败:', error);
        }
    }

    /**
     * 辅助方法
     */

    /**
     * 获取用户信息
     */
    private async getUserInfo(userId: string): Promise<IUser | null> {
        try {
            if (userId === 'system') return null;

            const user = await mongoose.connection.db?.collection('users').findOne({
                _id: new mongoose.Types.ObjectId(userId)
            });
            return user as IUser | null;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return null;
        }
    }

    /**
     * 获取项目名称
     */
    private async getProjectName(projectId: string): Promise<string> {
        try {
            const project = await mongoose.connection.db?.collection('projects').findOne({
                _id: new mongoose.Types.ObjectId(projectId)
            });
            return project?.projectName || '未知项目';
        } catch (error) {
            console.error('获取项目名称失败:', error);
            return '未知项目';
        }
    }

    /**
     * 获取任务相关用户
     */
    private async getTaskRelatedUsers(task: ITask): Promise<string[]> {
        const users = new Set<string>();

        // 添加主创设计师
        if (task.mainDesigners) {
            task.mainDesigners.forEach(id => users.add(id));
        }

        // 添加助理设计师
        if (task.assistantDesigners) {
            task.assistantDesigners.forEach(id => users.add(id));
        }

        // 获取项目相关人员
        try {
            const project = await mongoose.connection.db?.collection('projects').findOne({
                _id: new mongoose.Types.ObjectId(task.projectId)
            });

            if (project) {
                // 添加项目主创设计师
                if (project.mainDesigners) {
                    project.mainDesigners.forEach((id: string) => users.add(id));
                }

                // 添加项目助理设计师
                if (project.assistantDesigners) {
                    project.assistantDesigners.forEach((id: string) => users.add(id));
                }
            }
        } catch (error) {
            console.error('获取项目相关人员失败:', error);
        }

        return Array.from(users);
    }

    /**
     * 获取项目相关用户
     */
    private async getProjectRelatedUsers(project: IProject): Promise<string[]> {
        const users = new Set<string>();

        // 添加主创设计师
        if (project.mainDesigners) {
            project.mainDesigners.forEach(id => users.add(id));
        }

        // 添加助理设计师
        if (project.assistantDesigners) {
            project.assistantDesigners.forEach(id => users.add(id));
        }

        return Array.from(users);
    }

    /**
     * 获取优先级文本
     */
    private getPriorityText(priority: string): string {
        const priorityTexts: Record<string, string> = {
            low: '低',
            medium: '中',
            high: '高',
            urgent: '紧急',
            waiting: '等待中',
            'on-hold': '暂停',
            completed: '已完成'
        };
        return priorityTexts[priority] || priority;
    }

    /**
     * 获取状态文本
     */
    private getStatusText(status: string): string {
        const statusTexts: Record<string, string> = {
            pending: '待处理',
            'in-progress': '进行中',
            completed: '已完成',
            cancelled: '已取消',
            'on-hold': '暂停'
        };
        return statusTexts[status] || status;
    }

    /**
     * 获取项目状态文本
     */
    private getProjectStatusText(status: string): string {
        const statusTexts: Record<string, string> = {
            consulting: '咨询中',
            'in-progress': '进行中',
            'partial-delivery': '部分交付',
            completed: '已完成',
            'on-hold': '暂停',
            cancelled: '已取消'
        };
        return statusTexts[status] || status;
    }

    /**
 * 动态查找模板代码
 */
    private async findTemplateCode(businessModule: string, triggerCondition: string): Promise<string | null> {
        try {
            // 导入MessageTemplate模型
            const { MessageTemplate } = await import('../models/MessageTemplate');

            console.log(`🔍 正在查找模板: businessModule=${businessModule}, triggerCondition=${triggerCondition}`);

            // 首先查找所有匹配的模板（不考虑启用状态）
            const allTemplates = await MessageTemplate.find({
                businessModule,
                triggerCondition
            }).sort({ createdAt: -1 });

            console.log(`📋 找到 ${allTemplates.length} 个匹配的模板`);

            // 检查每个模板的状态
            for (const template of allTemplates) {
                console.log(`  - 模板: ${template.code} (${template.name}) - 启用状态: ${template.enabled}`);
            }

            // 查找启用的模板
            const enabledTemplate = await MessageTemplate.findOne({
                businessModule,
                triggerCondition,
                enabled: true
            }).sort({ createdAt: -1 }); // 获取最新的启用模板

            if (enabledTemplate) {
                console.log(`✅ 找到启用的模板: ${enabledTemplate.code} (${enabledTemplate.name})`);
                return enabledTemplate.code;
            } else {
                if (allTemplates.length > 0) {
                    console.log(`⚠️ 找到匹配的模板但都未启用: businessModule=${businessModule}, triggerCondition=${triggerCondition}`);
                } else {
                    console.log(`⚠️ 未找到任何匹配的模板: businessModule=${businessModule}, triggerCondition=${triggerCondition}`);
                }
                return null;
            }
        } catch (error) {
            console.error('查找模板失败:', error);
            return null;
        }
    }
}

export default new BusinessMessageService();
