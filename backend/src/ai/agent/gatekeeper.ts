/**
 * 系统守门层
 * 
 * 负责审计日志和权限检查
 */

import { v4 as uuidv4 } from 'uuid';
import AiTool from '../../models/AiToolkit';
import { toolRegistry } from '../tools';
import { auditLogService } from '../../services/AuditLogService';
import { aiPermissionService } from '../../services/AiPermissionService';
import { createPermissionDeniedError } from './explanation-templates';
import type { AuditLogEntry } from './types';

// ============================================================================
// 审计日志
// ============================================================================

export interface ExtendedAuditEntry extends AuditLogEntry {
    duration?: number;
    requestId?: string;
    collection?: string;
    operation?: string;
    module?: string;
    pathname?: string;
}

/**
 * 审计日志记录
 * 持久化到 AuditLog 集合，异步执行不阻塞主流程
 */
export async function logAudit(entry: ExtendedAuditEntry): Promise<void> {
    // 使用 AuditLogService 异步写入
    auditLogService.log({
        userId: entry.userId,
        toolId: entry.toolId,
        params: entry.params,
        success: entry.success,
        error: entry.errorMessage,
        reasonCode: entry.reasonCode,
        duration: entry.duration || 0,
        timestamp: entry.timestamp,
        sessionId: entry.sessionId,
        requestId: entry.requestId || uuidv4(),
        targetCollection: entry.collection,
        operation: entry.operation,
        module: entry.module,
        pathname: entry.pathname,
    });

    // 同时保留控制台输出（便于调试）
    console.log('[Audit]', JSON.stringify({
        userId: entry.userId,
        toolId: entry.toolId,
        success: entry.success,
        timestamp: entry.timestamp.toISOString(),
        paramsKeys: Object.keys(entry.params),
    }));
}

// ============================================================================
// 权限检查
// ============================================================================

export interface PermissionCheckResult {
    allowed: boolean;
    reason?: string;
    reasonCode?: string;
}

/**
 * 权限检查（RBAC 版本）
 * 
 * 检查顺序：
 * 1. 工具是否存在且启用
 * 2. 用户是否有权限执行该工具
 */
export async function checkPermission(
    userId: string,
    toolId: string
): Promise<PermissionCheckResult> {
    // 1. 检查数据库中是否有这个工具
    const dbTool = await AiTool.findOne({ toolId, enabled: true });
    if (!dbTool) {
        // 检查硬编码工具
        const tool = toolRegistry.get(toolId);
        if (!tool) {
            return {
                allowed: false,
                reason: `工具 ${toolId} 不存在或未启用`,
                reasonCode: 'BLOCKED_TOOL_NOT_FOUND',
            };
        }
    }

    // 2. RBAC 权限检查
    const permResult = await aiPermissionService.checkToolPermission(userId, toolId);
    if (!permResult.allowed) {
        return {
            allowed: false,
            reason: permResult.reason,
            reasonCode: permResult.reasonCode,
        };
    }

    return { allowed: true };
}

