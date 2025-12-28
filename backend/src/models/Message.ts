import mongoose, { Document, Schema } from 'mongoose';

// 消息类型枚举
export enum MessageType {
    SYSTEM = 'system',           // 系统通知
    TASK = 'task',              // 任务消息
    PROJECT = 'project',        // 项目消息
    CLIENT = 'client',          // 客户消息
    WORKFLOW = 'workflow',      // 工作流消息
    ANNOUNCEMENT = 'announcement' // 公告消息
}

// 消息分类枚举
export enum MessageCategory {
    NOTIFICATION = 'notification', // 通知
    REMINDER = 'reminder',        // 提醒
    ALERT = 'alert',             // 警告
    INFO = 'info',               // 信息
    ACTION_REQUIRED = 'action_required' // 需要操作
}

// 优先级枚举
export enum MessagePriority {
    URGENT = 'urgent',    // 紧急
    HIGH = 'high',        // 高
    MEDIUM = 'medium',    // 中
    LOW = 'low'           // 低
}

// 消息状态枚举
export enum MessageStatus {
    UNREAD = 'unread',    // 未读
    READ = 'read',        // 已读
    ARCHIVED = 'archived', // 已归档
    DELETED = 'deleted'    // 已删除
}

// 消息附件接口
export interface MessageAttachment {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
}

// 消息操作接口
export interface MessageAction {
    type: string;
    label: string;
    url?: string;
    data?: any;
}

// 推送设置接口
export interface PushSettings {
    email: boolean;               // 是否发送邮件
    sms: boolean;                 // 是否发送短信
    push: boolean;                // 是否推送通知
}

// 消息接口
export interface IMessage extends Document {
    // 基本信息
    title: string;                    // 消息标题
    content: string;                  // 消息内容
    summary?: string;                 // 消息摘要（用于列表显示）
    
    // 分类信息
    type: MessageType;                // 消息类型
    category: MessageCategory;        // 消息分类
    priority: MessagePriority;        // 优先级
    
    // 发送者信息
    senderId?: string;                // 发送者ID（系统消息为空）
    senderName: string;               // 发送者名称
    senderType: 'system' | 'user';    // 发送者类型
    
    // 接收者信息
    recipientId: string;              // 接收者ID
    recipientType: 'user' | 'role' | 'department'; // 接收者类型
    
    // 状态信息
    status: MessageStatus;            // 消息状态
    readAt?: Date;                    // 阅读时间
    archivedAt?: Date;                // 归档时间
    
    // 关联信息
    relatedEntityType?: string;       // 关联实体类型
    relatedEntityId?: string;         // 关联实体ID
    relatedEntityName?: string;       // 关联实体名称
    
    // 附加信息
    attachments?: MessageAttachment[]; // 附件列表
    actions?: MessageAction[];         // 可执行操作
    metadata?: Record<string, any>;    // 元数据
    
    // 时间信息
    createdAt: Date;                  // 创建时间
    updatedAt: Date;                  // 更新时间
    expiresAt?: Date;                 // 过期时间
    
    // 推送信息
    pushSettings?: PushSettings;
}

// 消息Schema
const MessageSchema = new Schema<IMessage>({
    // 基本信息
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000
    },
    summary: {
        type: String,
        trim: true,
        maxlength: 300
    },
    
    // 分类信息
    type: {
        type: String,
        enum: Object.values(MessageType),
        required: true,
        index: true
    },
    category: {
        type: String,
        enum: Object.values(MessageCategory),
        required: true,
        index: true
    },
    priority: {
        type: String,
        enum: Object.values(MessagePriority),
        required: true,
        default: MessagePriority.MEDIUM,
        index: true
    },
    
    // 发送者信息
    senderId: {
        type: String,
        ref: 'User',
        index: true
    },
    senderName: {
        type: String,
        required: true,
        trim: true
    },
    senderType: {
        type: String,
        enum: ['system', 'user'],
        required: true,
        default: 'system'
    },
    
    // 接收者信息
    recipientId: {
        type: String,
        required: true,
        index: true
    },
    recipientType: {
        type: String,
        enum: ['user', 'role', 'department'],
        required: true,
        default: 'user'
    },
    
    // 状态信息
    status: {
        type: String,
        enum: Object.values(MessageStatus),
        required: true,
        default: MessageStatus.UNREAD,
        index: true
    },
    readAt: {
        type: Date
    },
    archivedAt: {
        type: Date
    },
    
    // 关联信息
    relatedEntityType: {
        type: String,
        index: true
    },
    relatedEntityId: {
        type: String,
        index: true
    },
    relatedEntityName: {
        type: String,
        trim: true
    },
    
    // 附加信息
    attachments: [{
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        url: String
    }],
    actions: [{
        type: String,
        label: String,
        url: String,
        data: Schema.Types.Mixed
    }],
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    
    // 时间信息
    expiresAt: {
        type: Date,
        index: { expireAfterSeconds: 0 }
    },
    
    // 推送信息
    pushSettings: {
        email: {
            type: Boolean,
            default: false
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
}, {
    timestamps: true,
    versionKey: false
});

// 复合索引
MessageSchema.index({ recipientId: 1, status: 1, createdAt: -1 });
MessageSchema.index({ type: 1, category: 1 });
MessageSchema.index({ relatedEntityType: 1, relatedEntityId: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ priority: 1, status: 1 });

// 虚拟字段
MessageSchema.virtual('isUnread').get(function() {
    return this.status === MessageStatus.UNREAD;
});

MessageSchema.virtual('isExpired').get(function() {
    return this.expiresAt && this.expiresAt < new Date();
});

// 实例方法
MessageSchema.methods.markAsRead = function() {
    this.status = MessageStatus.READ;
    this.readAt = new Date();
    return this.save();
};

MessageSchema.methods.archive = function() {
    this.status = MessageStatus.ARCHIVED;
    this.archivedAt = new Date();
    return this.save();
};

MessageSchema.methods.softDelete = function() {
    this.status = MessageStatus.DELETED;
    return this.save();
};

// 静态方法
MessageSchema.statics.findByRecipient = function(recipientId: string, filters: any = {}) {
    return this.find({
        recipientId,
        status: { $ne: MessageStatus.DELETED },
        ...filters
    }).sort({ createdAt: -1 });
};

MessageSchema.statics.findUnreadByRecipient = function(recipientId: string) {
    return this.find({
        recipientId,
        status: MessageStatus.UNREAD
    }).sort({ createdAt: -1 });
};

MessageSchema.statics.countUnreadByRecipient = function(recipientId: string) {
    return this.countDocuments({
        recipientId,
        status: MessageStatus.UNREAD
    });
};

// 中间件
MessageSchema.pre('save', function(next) {
    // 自动生成摘要
    if (!this.summary && this.content) {
        this.summary = this.content.length > 100 
            ? this.content.substring(0, 100) + '...'
            : this.content;
    }
    next();
});

// 导出模型
export const Message = mongoose.model<IMessage>('Message', MessageSchema);
