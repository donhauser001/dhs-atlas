import mongoose, { Schema, Document } from 'mongoose';

/**
 * 审计日志接口
 * 
 * 记录所有 AI 工具调用的详细信息，用于：
 * - 安全审计
 * - 问题排查
 * - 使用统计
 */
export interface IAuditLog extends Document {
    // 基础信息
    userId: string;
    toolId: string;
    params: Record<string, any>;
    
    // 执行结果
    success: boolean;
    error?: string;
    reasonCode?: string;
    duration: number;
    
    // 时间和标识
    timestamp: Date;
    sessionId?: string;
    requestId: string;
    
    // 扩展字段（用于数据库操作）
    targetCollection?: string;  // 目标集合名称（改名避免与 Document.collection 冲突）
    operation?: string;
    affectedCount?: number;
    
    // 上下文信息
    module?: string;
    pathname?: string;
    userAgent?: string;
    ip?: string;
}

/**
 * 审计日志 Schema
 */
const AuditLogSchema = new Schema<IAuditLog>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        toolId: {
            type: String,
            required: true,
            index: true,
        },
        params: {
            type: Schema.Types.Mixed,
            default: {},
        },
        success: {
            type: Boolean,
            required: true,
            index: true,
        },
        error: {
            type: String,
        },
        reasonCode: {
            type: String,
            index: true,
        },
        duration: {
            type: Number,
            required: true,
        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now,
            index: true,
        },
        sessionId: {
            type: String,
            index: true,
        },
        requestId: {
            type: String,
            required: true,
            unique: true,
        },
        targetCollection: {
            type: String,
            index: true,
        },
        operation: {
            type: String,
        },
        affectedCount: {
            type: Number,
        },
        module: {
            type: String,
        },
        pathname: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        ip: {
            type: String,
        },
    },
    {
        timestamps: false, // 使用自定义的 timestamp 字段
    }
);

// 复合索引：按用户和时间查询
AuditLogSchema.index({ userId: 1, timestamp: -1 });

// 复合索引：按工具和时间查询
AuditLogSchema.index({ toolId: 1, timestamp: -1 });

// 复合索引：按成功状态和时间查询（用于统计失败率）
AuditLogSchema.index({ success: 1, timestamp: -1 });

// TTL 索引：90 天后自动删除
AuditLogSchema.index(
    { timestamp: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60 } // 90 天
);

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// ============================================================================
// 类型导出
// ============================================================================

/**
 * 创建审计日志的输入类型
 */
export interface CreateAuditLogInput {
    userId: string;
    toolId: string;
    params: Record<string, any>;
    success: boolean;
    error?: string;
    reasonCode?: string;
    duration: number;
    timestamp?: Date;
    sessionId?: string;
    requestId: string;
    targetCollection?: string;
    operation?: string;
    affectedCount?: number;
    module?: string;
    pathname?: string;
    userAgent?: string;
    ip?: string;
}

/**
 * 审计日志查询参数
 */
export interface AuditLogQuery {
    userId?: string;
    toolId?: string;
    success?: boolean;
    reasonCode?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}

/**
 * 审计统计结果
 */
export interface AuditStats {
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
    successRate: number;
    avgDuration: number;
    byTool: Array<{
        toolId: string;
        count: number;
        successCount: number;
        failedCount: number;
        avgDuration: number;
    }>;
    byReasonCode: Array<{
        reasonCode: string;
        count: number;
    }>;
}

