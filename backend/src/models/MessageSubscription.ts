import mongoose, { Document, Schema } from 'mongoose';
import { MessageType, MessageCategory, MessagePriority, PushSettings } from './Message';

// 订阅设置接口
export interface SubscriptionSetting {
    type: MessageType;            // 消息类型
    categories: MessageCategory[]; // 订阅的分类
    priority: MessagePriority[];  // 订阅的优先级
    pushSettings: PushSettings;   // 推送设置
}

// 免打扰设置接口
export interface DoNotDisturbSetting {
    enabled: boolean;             // 是否启用免打扰
    startTime: string;            // 开始时间 HH:mm
    endTime: string;              // 结束时间 HH:mm
    days: number[];               // 星期几 0-6 (0=周日)
    timezone?: string;            // 时区
}

// 消息订阅接口
export interface IMessageSubscription extends Document {
    userId: string;                   // 用户ID
    subscriptions: SubscriptionSetting[]; // 订阅设置列表
    
    // 免打扰设置
    doNotDisturb: DoNotDisturbSetting;
    
    // 全局设置
    globalSettings: {
        enableEmailDigest: boolean;   // 启用邮件摘要
        digestFrequency: 'daily' | 'weekly' | 'never'; // 摘要频率
        digestTime: string;           // 摘要发送时间 HH:mm
        maxDailyEmails: number;       // 每日最大邮件数
        enableSoundNotification: boolean; // 启用声音通知
        notificationSound: string;    // 通知声音
    };
    
    // 过滤设置
    filters: {
        keywords: string[];           // 关键词过滤
        senders: string[];            // 发送者过滤
        blockedTypes: MessageType[];  // 屏蔽的消息类型
    };
    
    // 时间信息
    createdAt: Date;
    updatedAt: Date;
    lastSyncAt?: Date;               // 最后同步时间
}

// 消息订阅Schema
const MessageSubscriptionSchema = new Schema<IMessageSubscription>({
    userId: {
        type: String,
        required: true,
        unique: true,
        ref: 'User',
        index: true
    },
    
    subscriptions: [{
        type: {
            type: String,
            enum: Object.values(MessageType),
            required: true
        },
        categories: [{
            type: String,
            enum: Object.values(MessageCategory),
            required: true
        }],
        priority: [{
            type: String,
            enum: Object.values(MessagePriority),
            required: true
        }],
        pushSettings: {
            email: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: false
            },
            push: {
                type: Boolean,
                default: true
            }
        }
    }],
    
    // 免打扰设置
    doNotDisturb: {
        enabled: {
            type: Boolean,
            default: false
        },
        startTime: {
            type: String,
            default: '22:00',
            match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        endTime: {
            type: String,
            default: '08:00',
            match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        days: [{
            type: Number,
            min: 0,
            max: 6
        }],
        timezone: {
            type: String,
            default: 'Asia/Shanghai'
        }
    },
    
    // 全局设置
    globalSettings: {
        enableEmailDigest: {
            type: Boolean,
            default: true
        },
        digestFrequency: {
            type: String,
            enum: ['daily', 'weekly', 'never'],
            default: 'daily'
        },
        digestTime: {
            type: String,
            default: '09:00',
            match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        maxDailyEmails: {
            type: Number,
            default: 10,
            min: 0,
            max: 100
        },
        enableSoundNotification: {
            type: Boolean,
            default: true
        },
        notificationSound: {
            type: String,
            default: 'default'
        }
    },
    
    // 过滤设置
    filters: {
        keywords: [{
            type: String,
            trim: true,
            maxlength: 50
        }],
        senders: [{
            type: String,
            ref: 'User'
        }],
        blockedTypes: [{
            type: String,
            enum: Object.values(MessageType)
        }]
    },
    
    lastSyncAt: {
        type: Date
    }
}, {
    timestamps: true,
    versionKey: false
});

// 索引
MessageSubscriptionSchema.index({ userId: 1 }, { unique: true });
MessageSubscriptionSchema.index({ 'subscriptions.type': 1 });
MessageSubscriptionSchema.index({ lastSyncAt: 1 });

// 虚拟字段
MessageSubscriptionSchema.virtual('isDoNotDisturbActive').get(function() {
    if (!this.doNotDisturb.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();
    
    // 检查是否在免打扰时间段内
    const startTime = this.doNotDisturb.startTime.split(':');
    const endTime = this.doNotDisturb.endTime.split(':');
    const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
    const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
    
    // 检查是否在免打扰日期内
    if (this.doNotDisturb.days.length > 0 && !this.doNotDisturb.days.includes(currentDay)) {
        return false;
    }
    
    // 处理跨天的情况
    if (startMinutes > endMinutes) {
        return currentTime >= startMinutes || currentTime <= endMinutes;
    } else {
        return currentTime >= startMinutes && currentTime <= endMinutes;
    }
});

// 实例方法
MessageSubscriptionSchema.methods.isSubscribedTo = function(
    type: MessageType, 
    category: MessageCategory, 
    priority: MessagePriority
): boolean {
    const subscription = this.subscriptions.find((sub: SubscriptionSetting) => sub.type === type);
    if (!subscription) return false;
    
    return subscription.categories.includes(category) && 
           subscription.priority.includes(priority);
};

MessageSubscriptionSchema.methods.getPushSettings = function(type: MessageType): PushSettings | null {
    const subscription = this.subscriptions.find((sub: SubscriptionSetting) => sub.type === type);
    return subscription ? subscription.pushSettings : null;
};

MessageSubscriptionSchema.methods.addSubscription = function(setting: SubscriptionSetting) {
    const existingIndex = this.subscriptions.findIndex((sub: SubscriptionSetting) => sub.type === setting.type);
    if (existingIndex >= 0) {
        this.subscriptions[existingIndex] = setting;
    } else {
        this.subscriptions.push(setting);
    }
    return this.save();
};

MessageSubscriptionSchema.methods.removeSubscription = function(type: MessageType) {
    this.subscriptions = this.subscriptions.filter((sub: SubscriptionSetting) => sub.type !== type);
    return this.save();
};

MessageSubscriptionSchema.methods.updateLastSync = function() {
    this.lastSyncAt = new Date();
    return this.save();
};

// 静态方法
MessageSubscriptionSchema.statics.findByUserId = function(userId: string) {
    return this.findOne({ userId });
};

MessageSubscriptionSchema.statics.createDefaultSubscription = function(userId: string) {
    const defaultSubscriptions: SubscriptionSetting[] = [
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
    ];
    
    return this.create({
        userId,
        subscriptions: defaultSubscriptions,
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
};

// 中间件
MessageSubscriptionSchema.pre('save', function(next) {
    // 确保至少有一个订阅设置
    if (this.subscriptions.length === 0) {
        this.subscriptions = [
            {
                type: MessageType.SYSTEM,
                categories: [MessageCategory.NOTIFICATION],
                priority: [MessagePriority.URGENT, MessagePriority.HIGH],
                pushSettings: { email: true, sms: false, push: true }
            }
        ];
    }
    next();
});

// 导出模型
export const MessageSubscription = mongoose.model<IMessageSubscription>('MessageSubscription', MessageSubscriptionSchema);
