import mongoose from 'mongoose';
import { Message, MessageType, MessageCategory, MessagePriority, MessageStatus } from '../models/Message';
import { MessageTemplate } from '../models/MessageTemplate';
import { MessageSubscription } from '../models/MessageSubscription';
import { User, IUser } from '../models/User';

/**
 * 消息中心数据迁移和初始化脚本
 */

// 默认消息模板数据
const defaultMessageTemplates = [
    {
        name: '项目创建通知',
        code: 'PROJECT_CREATED',
        description: '当新项目创建时发送的通知消息',
        businessModule: 'project',
        triggerCondition: 'create',
        titleTemplate: '新项目创建：{{projectName}}',
        contentTemplate: '项目 "{{projectName}}" 已创建成功。\n\n项目描述：{{projectDescription}}\n创建时间：{{createdAt}}\n负责人：{{managerName}}\n\n请及时关注项目进展。',
        summaryTemplate: '项目 "{{projectName}}" 已创建，负责人：{{managerName}}',
        sendTargets: ['message', 'push'],
        recipientRules: [
            {
                type: 'role_based',
                value: 'manager',
                description: '通知所有管理员'
            },
            {
                type: 'user_variable',
                value: '{{managerId}}',
                description: '通知项目负责人'
            }
        ],
        priority: 'HIGH',
        expiresIn: 168, // 7天
        enabled: true,
        version: 1,
        usageCount: 0,
        createdBy: 'system'
    },
    {
        name: '任务分配通知',
        code: 'TASK_ASSIGNED',
        description: '当任务分配给用户时发送的通知消息',
        businessModule: 'project',
        triggerCondition: 'task_assigned',
        titleTemplate: '新任务分配：{{taskName}}',
        contentTemplate: '您有一个新的任务需要处理：\n\n任务名称：{{taskName}}\n所属项目：{{projectName}}\n优先级：{{priority}}\n截止时间：{{dueDate}}\n分配人：{{assignerName}}\n\n请及时处理此任务。',
        summaryTemplate: '新任务：{{taskName}}，截止时间：{{dueDate}}',
        sendTargets: ['message', 'email', 'push'],
        recipientRules: [
            {
                type: 'user_variable',
                value: '{{assigneeId}}',
                description: '通知任务被分配人'
            }
        ],
        priority: 'HIGH',
        expiresIn: 72, // 3天
        enabled: true,
        version: 1,
        usageCount: 0,
        createdBy: 'system'
    },
    {
        name: '任务完成通知',
        code: 'TASK_COMPLETED',
        description: '当任务完成时发送给相关人员的通知消息',
        businessModule: 'project',
        triggerCondition: 'task_completed',
        titleTemplate: '任务已完成：{{taskTitle}}',
        contentTemplate: '任务 "{{taskTitle}}" 已完成。\n\n完成人：{{completedBy}}\n完成时间：{{completedAt}}\n任务描述：{{taskDescription}}\n\n感谢您的努力工作！',
        summaryTemplate: '任务 "{{taskTitle}}" 已由 {{completedBy}} 完成',
        sendTargets: ['message', 'push'],
        recipientRules: [
            {
                type: 'user_variable',
                value: '{{assignerId}}',
                description: '通知任务分配人'
            },
            {
                type: 'role_based',
                value: 'manager',
                description: '通知所有管理员'
            }
        ],
        priority: 'MEDIUM',
        expiresIn: 168, // 7天
        enabled: true,
        version: 1,
        usageCount: 0,
        createdBy: 'system'
    },
    {
        name: '系统维护通知',
        code: 'SYSTEM_MAINTENANCE',
        description: '系统维护时发送的通知消息',
        businessModule: 'system',
        triggerCondition: 'maintenance',
        titleTemplate: '系统维护通知',
        contentTemplate: '系统将于 {{maintenanceDate}} 进行维护。\n\n维护时间：{{maintenanceStartTime}} - {{maintenanceEndTime}}\n维护内容：{{maintenanceDescription}}\n\n维护期间系统将暂停服务，请提前做好相关准备。给您带来的不便，敬请谅解。',
        summaryTemplate: '系统维护：{{maintenanceDate}} {{maintenanceStartTime}}-{{maintenanceEndTime}}',
        sendTargets: ['message', 'email', 'push'],
        recipientRules: [
            {
                type: 'admin_only',
                value: 'all',
                description: '通知所有用户'
            }
        ],
        priority: 'URGENT',
        expiresIn: 24, // 1天
        enabled: true,
        version: 1,
        usageCount: 0,
        createdBy: 'system'
    },
    {
        name: '客户反馈通知',
        code: 'CLIENT_FEEDBACK',
        description: '收到客户反馈时发送的通知消息',
        businessModule: 'client',
        triggerCondition: 'feedback',
        titleTemplate: '客户反馈：{{clientName}}',
        contentTemplate: '收到来自客户 "{{clientName}}" 的反馈：\n\n反馈内容：{{feedbackContent}}\n反馈类型：{{feedbackType}}\n客户联系方式：{{clientContact}}\n反馈时间：{{feedbackTime}}\n\n请及时跟进处理。',
        summaryTemplate: '客户 {{clientName}} 提交了{{feedbackType}}反馈',
        sendTargets: ['message', 'email', 'push'],
        recipientRules: [
            {
                type: 'role_based',
                value: 'customer_service',
                description: '通知客服人员'
            },
            {
                type: 'role_based',
                value: 'manager',
                description: '通知管理员'
            }
        ],
        priority: 'HIGH',
        expiresIn: 48, // 2天
        enabled: true,
        version: 1,
        usageCount: 0,
        createdBy: 'system'
    },
    {
        name: '工作流审批通知',
        code: 'WORKFLOW_APPROVAL',
        description: '工作流需要审批时发送的通知消息',
        businessModule: 'system',
        triggerCondition: 'workflow_approval',
        titleTemplate: '待审批：{{workflowTitle}}',
        contentTemplate: '您有一个工作流需要审批：\n\n工作流标题：{{workflowTitle}}\n申请人：{{applicantName}}\n申请时间：{{applicationTime}}\n审批内容：{{approvalContent}}\n\n请登录系统进行审批操作。',
        summaryTemplate: '{{applicantName}} 提交的 {{workflowTitle}} 待您审批',
        sendTargets: ['message', 'email', 'push'],
        recipientRules: [
            {
                type: 'user_variable',
                value: '{{approverId}}',
                description: '通知审批人'
            }
        ],
        priority: 'HIGH',
        expiresIn: 72, // 3天
        enabled: true,
        version: 1,
        usageCount: 0,
        createdBy: 'system'
    },
    {
        name: '公告发布通知',
        code: 'ANNOUNCEMENT_PUBLISHED',
        description: '发布公告时发送的通知消息',
        businessModule: 'system',
        triggerCondition: 'announcement',
        titleTemplate: '新公告：{{announcementTitle}}',
        contentTemplate: '发布了新公告：\n\n标题：{{announcementTitle}}\n发布人：{{publisherName}}\n发布时间：{{publishTime}}\n\n内容摘要：{{announcementSummary}}\n\n请查看完整公告内容。',
        summaryTemplate: '新公告：{{announcementTitle}}',
        sendTargets: ['message', 'push'],
        recipientRules: [
            {
                type: 'admin_only',
                value: 'all',
                description: '通知所有用户'
            }
        ],
        priority: 'MEDIUM',
        expiresIn: 720, // 30天
        enabled: true,
        version: 1,
        usageCount: 0,
        createdBy: 'system'
    }
];

// 示例消息数据
const sampleMessages = [
    {
        title: '欢迎使用消息中心',
        content: '欢迎使用全新的消息中心功能！\n\n消息中心为您提供：\n• 实时消息通知\n• 消息分类管理\n• 个性化订阅设置\n• 批量操作功能\n\n如有任何问题，请联系系统管理员。',
        summary: '欢迎使用全新的消息中心功能',
        type: MessageType.SYSTEM,
        category: MessageCategory.INFO,
        priority: MessagePriority.MEDIUM,
        senderName: '系统管理员',
        senderType: 'system' as const,
        recipientType: 'role' as const,
        recipientId: 'admin',
        status: MessageStatus.UNREAD,
        pushSettings: {
            email: false,
            sms: false,
            push: true
        },
        metadata: {
            isWelcomeMessage: true
        }
    }
];

/**
 * 初始化消息模板
 */
export async function seedMessageTemplates(): Promise<void> {
    try {
        console.log('开始初始化消息模板...');
        
        // 调试：在函数开始时输出defaultMessageTemplates的内容
        console.log('defaultMessageTemplates数组长度:', defaultMessageTemplates.length);
        console.log('第一个模板的详细信息:');
        if (defaultMessageTemplates.length > 0) {
            const firstTemplate = defaultMessageTemplates[0];
            console.log('name:', firstTemplate.name);
            console.log('code:', firstTemplate.code);
            console.log('businessModule:', firstTemplate.businessModule);
            console.log('triggerCondition:', firstTemplate.triggerCondition);
            console.log('priority:', firstTemplate.priority);
            console.log('recipientRules:', JSON.stringify(firstTemplate.recipientRules, null, 2));
        }

        // 检查是否已存在模板
        const existingTemplates = await MessageTemplate.countDocuments();
        if (existingTemplates > 0) {
            console.log(`已存在 ${existingTemplates} 个消息模板，跳过初始化`);
            return;
        }

        // 创建默认模板
        const templates = await MessageTemplate.insertMany(defaultMessageTemplates);
        console.log(`成功创建 ${templates.length} 个默认消息模板`);

        // 输出创建的模板信息
        templates.forEach(template => {
            console.log(`- ${template.name} (${template.code})`);
        });

    } catch (error) {
        console.error('初始化消息模板失败:', error);
        throw error;
    }
}

/**
 * 初始化示例消息
 */
export async function seedSampleMessages(): Promise<void> {
    try {
        console.log('开始创建示例消息...');

        // 获取所有用户
        const users = await mongoose.connection.db?.collection('users').find({}).project({ _id: 1 }).toArray() || [];
        if (users.length === 0) {
            console.log('没有找到用户，跳过创建示例消息');
            return;
        }

        // 为每个用户创建欢迎消息
        const messages = users.map((user: any) => ({
            ...sampleMessages[0],
            recipientId: user._id.toString(),
            recipientType: 'user' as const
        }));

        const createdMessages = await Message.insertMany(messages);
        console.log(`成功为 ${users.length} 个用户创建了欢迎消息`);

    } catch (error) {
        console.error('创建示例消息失败:', error);
        throw error;
    }
}

/**
 * 初始化用户订阅设置
 */
export async function seedMessageSubscriptions(): Promise<void> {
    try {
        console.log('开始初始化用户订阅设置...');

        // 获取所有用户
        const users = await mongoose.connection.db?.collection('users').find({}).project({ _id: 1 }).toArray() || [];
        if (users.length === 0) {
            console.log('没有找到用户，跳过初始化订阅设置');
            return;
        }

        let createdCount = 0;

        for (const user of users) {
            // 检查用户是否已有订阅设置
            const existingSubscription = await MessageSubscription.findOne({ userId: user._id });
            if (!existingSubscription) {
                // 创建默认订阅设置
                const defaultSubscription = new MessageSubscription({
                    userId: user._id.toString(),
                    subscriptions: [
                        {
                            type: MessageType.SYSTEM,
                            categories: [MessageCategory.NOTIFICATION, MessageCategory.ALERT],
                            priority: [MessagePriority.URGENT, MessagePriority.HIGH, MessagePriority.MEDIUM],
                            pushSettings: { email: true, sms: false, push: true }
                        },
                        {
                            type: MessageType.TASK,
                            categories: [MessageCategory.NOTIFICATION, MessageCategory.REMINDER],
                            priority: [MessagePriority.URGENT, MessagePriority.HIGH, MessagePriority.MEDIUM],
                            pushSettings: { email: true, sms: false, push: true }
                        },
                        {
                            type: MessageType.PROJECT,
                            categories: [MessageCategory.NOTIFICATION, MessageCategory.INFO],
                            priority: [MessagePriority.URGENT, MessagePriority.HIGH, MessagePriority.MEDIUM],
                            pushSettings: { email: true, sms: false, push: true }
                        }
                    ],
                    doNotDisturb: {
                        enabled: false,
                        startTime: '22:00',
                        endTime: '08:00',
                        days: [],
                        timezone: 'Asia/Shanghai'
                    },
                    globalSettings: {
                        enableEmailDigest: true,
                        digestFrequency: 'daily',
                        digestTime: '09:00',
                        maxDailyEmails: 10,
                        enableSoundNotification: true,
                        notificationSound: 'default'
                    },
                    filters: {
                        keywords: [],
                        senders: [],
                        blockedTypes: []
                    }
                });
                await defaultSubscription.save();
                createdCount++;
            }
        }

        console.log(`成功为 ${createdCount} 个用户创建了默认订阅设置`);

    } catch (error) {
        console.error('初始化用户订阅设置失败:', error);
        throw error;
    }
}

/**
 * 创建消息相关索引
 */
export async function createMessageIndexes(): Promise<void> {
    try {
        console.log('开始创建消息相关索引...');

        // 消息表索引
        await Message.collection.createIndex({ recipientId: 1, status: 1, createdAt: -1 });
        await Message.collection.createIndex({ type: 1, category: 1 });
        await Message.collection.createIndex({ relatedEntityType: 1, relatedEntityId: 1 });
        await Message.collection.createIndex({ senderId: 1, createdAt: -1 });
        await Message.collection.createIndex({ priority: 1, status: 1 });
        await Message.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

        // 消息模板表索引
        await MessageTemplate.collection.createIndex({ code: 1 }, { unique: true });
        await MessageTemplate.collection.createIndex({ type: 1, enabled: 1 });
        await MessageTemplate.collection.createIndex({ triggers: 1, enabled: 1 });
        await MessageTemplate.collection.createIndex({ createdBy: 1 });

        // 消息订阅表索引
        await MessageSubscription.collection.createIndex({ userId: 1 }, { unique: true });
        await MessageSubscription.collection.createIndex({ 'subscriptions.type': 1 });
        await MessageSubscription.collection.createIndex({ lastSyncAt: 1 });

        console.log('消息相关索引创建完成');

    } catch (error) {
        console.error('创建消息索引失败:', error);
        throw error;
    }
}

/**
 * 完整的消息中心数据初始化
 */
export async function initializeMessageCenter(): Promise<void> {
    try {
        console.log('=== 开始初始化消息中心 ===');

        // 1. 创建索引
        await createMessageIndexes();

        // 2. 初始化消息模板
        await seedMessageTemplates();

        // 3. 初始化用户订阅设置
        await seedMessageSubscriptions();

        // 4. 创建示例消息
        await seedSampleMessages();

        console.log('=== 消息中心初始化完成 ===');

    } catch (error) {
        console.error('消息中心初始化失败:', error);
        throw error;
    }
}

/**
 * 清理消息中心数据（谨慎使用）
 */
export async function cleanupMessageCenter(): Promise<void> {
    try {
        console.log('=== 开始清理消息中心数据 ===');
        console.warn('警告：此操作将删除所有消息中心相关数据！');

        // 删除所有消息
        const messageResult = await Message.deleteMany({});
        console.log(`删除了 ${messageResult.deletedCount} 条消息`);

        // 删除所有消息模板
        const templateResult = await MessageTemplate.deleteMany({});
        console.log(`删除了 ${templateResult.deletedCount} 个消息模板`);

        // 删除所有订阅设置
        const subscriptionResult = await MessageSubscription.deleteMany({});
        console.log(`删除了 ${subscriptionResult.deletedCount} 个订阅设置`);

        console.log('=== 消息中心数据清理完成 ===');

    } catch (error) {
        console.error('清理消息中心数据失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const command = process.argv[2];

    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser')
        .then(async () => {
            console.log('数据库连接成功');

            switch (command) {
                case 'init':
                    await initializeMessageCenter();
                    break;
                case 'cleanup':
                    await cleanupMessageCenter();
                    break;
                case 'templates':
                    await seedMessageTemplates();
                    break;
                case 'subscriptions':
                    await seedMessageSubscriptions();
                    break;
                case 'messages':
                    await seedSampleMessages();
                    break;
                case 'indexes':
                    await createMessageIndexes();
                    break;
                default:
                    console.log('使用方法:');
                    console.log('  npm run seed:messages init        - 完整初始化消息中心');
                    console.log('  npm run seed:messages templates   - 初始化消息模板');
                    console.log('  npm run seed:messages subscriptions - 初始化订阅设置');
                    console.log('  npm run seed:messages messages    - 创建示例消息');
                    console.log('  npm run seed:messages indexes     - 创建索引');
                    console.log('  npm run seed:messages cleanup     - 清理所有数据');
            }

            await mongoose.disconnect();
            console.log('数据库连接已关闭');
            process.exit(0);

        })
        .catch(error => {
            console.error('数据库连接失败:', error);
            process.exit(1);
        });
}
