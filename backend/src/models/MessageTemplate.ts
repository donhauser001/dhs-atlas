import mongoose, { Document, Schema } from 'mongoose';

// 发送目标类型
export type SendTarget = 'message' | 'email' | 'push';

// 优先级类型
export type Priority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

// 接收者规则类型
export type RecipientRuleType = 'specific_user' | 'user_variable' | 'role_based' | 'admin_only';

// 接收者规则接口
export interface RecipientRule {
    type: RecipientRuleType;
    value: string | string[];
    description?: string;
}

// 消息模板接口 - 基于智能向导重新设计
export interface IMessageTemplate extends Document {
    // 基本信息
    name: string;                     // 模板名称
    code: string;                     // 模板代码（唯一标识）
    description?: string;             // 模板描述

    // 业务配置
    businessModule: string;           // 业务模块 (client, project, finance等)
    triggerCondition: string;         // 触发条件 (create, update, delete等)

    // 模板内容
    titleTemplate: string;            // 标题模板
    contentTemplate: string;          // 内容模板
    summaryTemplate?: string;         // 摘要模板

    // 发送设置
    sendTargets: SendTarget[];        // 发送目标 (message, email, push)
    priority: Priority;               // 优先级
    expiresIn?: number;              // 过期时间（小时）
    recipientRules: RecipientRule[];  // 接收者规则

    // 状态
    enabled: boolean;                 // 是否启用
    version: number;                  // 版本号

    // 统计信息
    usageCount: number;               // 使用次数
    lastUsedAt?: Date;               // 最后使用时间

    // 时间信息
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;               // 创建者ID
    updatedBy?: string;              // 更新者ID
}

// 消息模板Schema - 基于智能向导重新设计
const MessageTemplateSchema = new Schema<IMessageTemplate>({
    // 基本信息
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        match: /^[A-Z0-9_]+$/,
        maxlength: 50
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },

    // 业务配置
    businessModule: {
        type: String,
        required: true,
        enum: ['client', 'project', 'finance', 'pricing', 'contract', 'form', 'content', 'file', 'user', 'organization', 'system'],
        index: true
    },
    triggerCondition: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    // 模板内容
    titleTemplate: {
        type: String,
        required: true,
        maxlength: 200
    },
    contentTemplate: {
        type: String,
        required: true,
        maxlength: 5000
    },
    summaryTemplate: {
        type: String,
        maxlength: 300
    },

    // 发送设置
    sendTargets: [{
        type: String,
        enum: ['message', 'email', 'push'],
        required: true
    }],
    priority: {
        type: String,
        enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'],
        required: true,
        default: 'MEDIUM'
    },
    expiresIn: {
        type: Number,
        min: 1,
        max: 8760 // 最大1年
    },
    recipientRules: [{
        type: {
            type: String,
            enum: ['specific_user', 'user_variable', 'role_based', 'admin_only'],
            required: true
        },
        value: {
            type: Schema.Types.Mixed,
            required: true
        },
        description: String
    }],

    // 状态
    enabled: {
        type: Boolean,
        default: true,
        index: true
    },
    version: {
        type: Number,
        default: 1,
        min: 1
    },

    // 统计信息
    usageCount: {
        type: Number,
        default: 0,
        min: 0
    },
    lastUsedAt: {
        type: Date
    },

    // 创建者信息
    createdBy: {
        type: String,
        required: true,
        index: true
    },
    updatedBy: {
        type: String,
        index: true
    }
}, {
    timestamps: true,
    collection: 'message_templates'
});

// 索引
MessageTemplateSchema.index({ businessModule: 1, triggerCondition: 1 });
MessageTemplateSchema.index({ enabled: 1, createdAt: -1 });
MessageTemplateSchema.index({ createdBy: 1 });

// 静态方法
MessageTemplateSchema.statics.findByCode = function (code: string) {
    return this.findOne({ code: code.toUpperCase() });
};

MessageTemplateSchema.statics.findByBusinessModule = function (businessModule: string, enabled?: boolean) {
    const query: any = { businessModule };
    if (enabled !== undefined) query.enabled = enabled;
    return this.find(query).sort({ createdAt: -1 });
};

// 实例方法
MessageTemplateSchema.methods.incrementUsage = function () {
    this.usageCount += 1;
    this.lastUsedAt = new Date();
    return this.save();
};

// 导出模型 - 明确指定集合名称为 message_templates
export const MessageTemplate = mongoose.model<IMessageTemplate>('MessageTemplate', MessageTemplateSchema, 'message_templates');
export default MessageTemplate;