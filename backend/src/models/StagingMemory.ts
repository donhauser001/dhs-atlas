/**
 * 暂存记忆模型
 * 
 * AI 提议的记忆，等待用户确认后才能成为关键记忆
 * 
 * 特点：
 * - 有 TTL（默认 7 天后自动过期）
 * - 需要用户确认才能提升为 KeyMemory
 * - 保留来源追溯（关联到原始对话事件）
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * 记忆类型
 */
export type MemoryType = 'preference' | 'project' | 'role' | 'boundary';

/**
 * 暂存记忆状态
 */
export type StagingMemoryStatus = 'pending' | 'confirmed' | 'rejected';

/**
 * 暂存记忆接口
 */
export interface IStagingMemory extends Document {
    // 关联信息
    userId: string;
    
    // 记忆内容
    content: string;
    memoryType: MemoryType;
    
    // 来源追溯
    sourceEventId: Types.ObjectId;
    sourceQuote?: string;
    
    // 状态
    status: StagingMemoryStatus;
    
    // TTL
    expiresAt: Date;
    
    // 时间戳
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 创建暂存记忆的输入类型
 */
export interface CreateStagingMemoryInput {
    userId: string;
    content: string;
    memoryType: MemoryType;
    sourceEventId: Types.ObjectId | string;
    sourceQuote?: string;
    expiresAt?: Date;
}

/**
 * 暂存记忆提议（AI 提议的记忆）
 */
export interface StagingMemoryProposal {
    userId: string;
    content: string;
    memoryType: MemoryType;
    sourceEventId: Types.ObjectId | string;
    sourceQuote?: string;
}

// ============================================================================
// Schema 定义
// ============================================================================

const StagingMemorySchema = new Schema<IStagingMemory>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        content: {
            type: String,
            required: true,
        },
        memoryType: {
            type: String,
            required: true,
            enum: ['preference', 'project', 'role', 'boundary'],
            index: true,
        },
        sourceEventId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Conversation',
        },
        sourceQuote: {
            type: String,
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'confirmed', 'rejected'],
            default: 'pending',
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 默认 7 天后过期
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// 复合索引：按用户和状态查询
StagingMemorySchema.index({ userId: 1, status: 1 });

// 复合索引：按用户和类型查询
StagingMemorySchema.index({ userId: 1, memoryType: 1 });

// TTL 索引：过期后自动删除
StagingMemorySchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

export default mongoose.model<IStagingMemory>('StagingMemory', StagingMemorySchema);

// ============================================================================
// 类型导出
// ============================================================================

export const MEMORY_TYPES: MemoryType[] = ['preference', 'project', 'role', 'boundary'];

export const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
    preference: '偏好',
    project: '项目/工作',
    role: '角色/身份',
    boundary: '边界与禁忌',
};

