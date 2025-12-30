/**
 * 对话日志模型
 * 
 * 记录所有 AI 对话事件，用于：
 * - 对话历史回放
 * - 记忆系统追溯来源
 * - 对话质量分析
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * 工具调用记录
 */
export interface IToolCall {
    toolId: string;
    params: Record<string, any>;
    success: boolean;
    reasonCode?: string;
    duration?: number;
}

/**
 * 对话事件接口
 */
export interface IConversation extends Document {
    // 关联信息
    userId: string;
    sessionId: string;
    
    // 时间信息
    timestamp: Date;
    
    // 消息内容
    role: 'user' | 'assistant' | 'system';
    content: string;
    
    // 工具调用（仅 assistant 角色）
    toolCalls?: IToolCall[];
    
    // 上下文信息
    module?: string;
    pathname?: string;
    
    // 元数据
    metadata?: Record<string, any>;
    
    // 时间戳
    createdAt: Date;
}

/**
 * 创建对话事件的输入类型
 */
export interface CreateConversationInput {
    userId: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    toolCalls?: IToolCall[];
    module?: string;
    pathname?: string;
    metadata?: Record<string, any>;
    timestamp?: Date;
}

/**
 * 对话查询参数
 */
export interface ConversationQuery {
    userId?: string;
    sessionId?: string;
    role?: 'user' | 'assistant' | 'system';
    startDate?: Date;
    endDate?: Date;
    module?: string;
    page?: number;
    limit?: number;
}

// ============================================================================
// Schema 定义
// ============================================================================

const ToolCallSchema = new Schema<IToolCall>(
    {
        toolId: { type: String, required: true },
        params: { type: Schema.Types.Mixed, default: {} },
        success: { type: Boolean, required: true },
        reasonCode: { type: String },
        duration: { type: Number },
    },
    { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        sessionId: {
            type: String,
            required: true,
            index: true,
        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now,
            index: true,
        },
        role: {
            type: String,
            required: true,
            enum: ['user', 'assistant', 'system'],
        },
        content: {
            type: String,
            required: true,
        },
        toolCalls: {
            type: [ToolCallSchema],
            default: undefined,
        },
        module: {
            type: String,
            index: true,
        },
        pathname: {
            type: String,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// 复合索引：按用户和时间查询
ConversationSchema.index({ userId: 1, timestamp: -1 });

// 复合索引：按会话和时间查询（用于获取会话历史）
ConversationSchema.index({ sessionId: 1, timestamp: 1 });

// 复合索引：按用户和会话查询
ConversationSchema.index({ userId: 1, sessionId: 1 });

// TTL 索引：180 天后自动删除
ConversationSchema.index(
    { timestamp: 1 },
    { expireAfterSeconds: 180 * 24 * 60 * 60 } // 180 天
);

export default mongoose.model<IConversation>('Conversation', ConversationSchema);

