/**
 * 关键记忆模型
 * 
 * 经用户确认的长期记忆，用于 AI 个性化服务
 * 
 * 特点：
 * - 长期存储，无 TTL
 * - 记录使用频率和最后使用时间
 * - 支持用户手动管理（编辑、删除）
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { MemoryType } from './StagingMemory';

/**
 * 记忆来源类型
 */
export type MemorySource = 'user_input' | 'ai_proposal' | 'system';

/**
 * 关键记忆接口
 */
export interface IKeyMemory extends Document {
    // 关联信息
    userId: string;
    
    // 记忆内容
    content: string;
    memoryType: MemoryType;
    
    // 来源信息
    source: MemorySource;
    sourceEventId?: Types.ObjectId;
    
    // 状态
    isActive: boolean;
    
    // 使用追踪
    lastUsedAt?: Date;
    useCount: number;
    
    // 时间戳
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 创建关键记忆的输入类型
 */
export interface CreateKeyMemoryInput {
    userId: string;
    content: string;
    memoryType: MemoryType;
    source: MemorySource;
    sourceEventId?: Types.ObjectId | string;
}

/**
 * 更新关键记忆的输入类型
 */
export interface UpdateKeyMemoryInput {
    content?: string;
    memoryType?: MemoryType;
    isActive?: boolean;
}

/**
 * 关键记忆查询参数
 */
export interface KeyMemoryQuery {
    userId?: string;
    memoryType?: MemoryType;
    source?: MemorySource;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

// ============================================================================
// Schema 定义
// ============================================================================

const KeyMemorySchema = new Schema<IKeyMemory>(
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
        source: {
            type: String,
            required: true,
            enum: ['user_input', 'ai_proposal', 'system'],
        },
        sourceEventId: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
            index: true,
        },
        lastUsedAt: {
            type: Date,
        },
        useCount: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// 复合索引：按用户和激活状态查询
KeyMemorySchema.index({ userId: 1, isActive: 1 });

// 复合索引：按用户和类型查询
KeyMemorySchema.index({ userId: 1, memoryType: 1 });

// 复合索引：按用户、激活状态和类型查询
KeyMemorySchema.index({ userId: 1, isActive: 1, memoryType: 1 });

// 索引：按使用次数排序（用于获取最常用的记忆）
KeyMemorySchema.index({ userId: 1, useCount: -1 });

export default mongoose.model<IKeyMemory>('KeyMemory', KeyMemorySchema);

// ============================================================================
// 类型导出
// ============================================================================

export const MEMORY_SOURCES: MemorySource[] = ['user_input', 'ai_proposal', 'system'];

export const MEMORY_SOURCE_LABELS: Record<MemorySource, string> = {
    user_input: '用户输入',
    ai_proposal: 'AI 提议',
    system: '系统生成',
};

