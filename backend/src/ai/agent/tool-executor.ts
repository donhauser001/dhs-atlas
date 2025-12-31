/**
 * 工具执行模块
 * 
 * 负责执行工具调用和合并结果
 */

import { v4 as uuidv4 } from 'uuid';
import { toolRegistry } from '../tools';
import { checkPermission, logAudit } from './gatekeeper';
import { createPermissionDeniedError } from './explanation-templates';
import type { ToolContext, ToolCallRequest, ToolResult } from '../tools/types';
import type { UISpec } from './types';

export interface ToolExecutionContext extends ToolContext {
    module?: string;
    pathname?: string;
}

/**
 * 执行工具调用（带守门层）
 */
export async function executeToolCalls(
    toolCalls: ToolCallRequest[],
    context: ToolExecutionContext
): Promise<Array<{ toolId: string; result: ToolResult }>> {
    const results: Array<{ toolId: string; result: ToolResult }> = [];

    for (const call of toolCalls) {
        const requestId = call.requestId || uuidv4();
        const startTime = Date.now();

        // 1. 权限检查
        const permCheck = await checkPermission(context.userId, call.toolId);
        if (!permCheck.allowed) {
            console.log('[Agent] 权限拒绝:', call.toolId, permCheck.reason);
            const permError = createPermissionDeniedError(permCheck.reason || '权限不足');
            results.push({
                toolId: call.toolId,
                result: {
                    success: false,
                    error: permError,
                },
            });

            // 记录审计日志
            await logAudit({
                userId: context.userId,
                toolId: call.toolId,
                params: call.params,
                result: null,
                success: false,
                timestamp: new Date(),
                sessionId: context.sessionId,
                errorMessage: permCheck.reason,
                reasonCode: permCheck.reasonCode,
                duration: Date.now() - startTime,
                requestId,
                module: context.module,
                pathname: context.pathname,
            });

            continue;
        }

        // 2. 检查是否需要确认
        const tool = toolRegistry.get(call.toolId);
        if (tool?.requiresConfirmation) {
            console.log('[Agent] 工具需要确认:', call.toolId);
            continue; // 跳过需要确认的工具
        }

        // 3. 执行工具
        const result = await toolRegistry.execute(
            call.toolId,
            call.params,
            { ...context, requestId }
        );

        const duration = Date.now() - startTime;
        console.log('[Agent] 工具执行完成:', call.toolId, `${duration}ms`);

        // 提取集合和操作信息（用于审计）
        const collection = call.params?.collection as string | undefined;
        const operation = call.params?.operation as string | undefined;

        // 4. 记录审计日志
        await logAudit({
            userId: context.userId,
            toolId: call.toolId,
            params: call.params,
            result: result.success ? result.data : null,
            success: result.success,
            timestamp: new Date(),
            sessionId: context.sessionId,
            errorMessage: result.error?.message,
            reasonCode: result.error?.code,
            duration,
            requestId,
            collection,
            operation,
            module: context.module,
            pathname: context.pathname,
        });

        results.push({ toolId: call.toolId, result });
    }

    return results;
}

/**
 * 合并工具结果中的 UI 建议
 */
export function mergeUISpecs(
    toolResults: Array<{ toolId: string; result: ToolResult }>
): UISpec | undefined {
    for (let i = toolResults.length - 1; i >= 0; i--) {
        const { result } = toolResults[i];
        if (result.success && result.uiSuggestion) {
            return {
                componentId: result.uiSuggestion.componentId,
                props: result.uiSuggestion.props,
                target: 'canvas',
            };
        }
    }
    return undefined;
}

/**
 * 格式化工具结果为文本
 */
export function formatToolResults(
    toolResults: Array<{ toolId: string; result: ToolResult }>
): string {
    return toolResults.map(r => {
        if (!r.result.success) {
            return `[${r.toolId} 错误]: ${r.result.error?.message}`;
        }
        // 截断数组数据，最多保留 5 条
        let data: any = r.result.data;
        if (data && typeof data === 'object') {
            const d = data as any;
            // 处理 contacts 数组
            if (d.contacts && Array.isArray(d.contacts) && d.contacts.length > 5) {
                data = { ...d, contacts: d.contacts.slice(0, 5), _note: `共 ${d.contactCount} 人，仅显示前 5 人` };
            }
            // 处理 projects 数组
            if (d.projects && Array.isArray(d.projects) && d.projects.length > 5) {
                data = { ...d, projects: d.projects.slice(0, 5), _note: `共 ${d.projectCount} 个，仅显示前 5 个` };
            }
        }
        const jsonStr = JSON.stringify(data, null, 2);
        // 单个结果最多 1500 字符
        const truncated = jsonStr.length > 1500 ? jsonStr.substring(0, 1500) + '...(已截断)' : jsonStr;
        return `[${r.toolId} 执行结果]:\n${truncated}`;
    }).join('\n\n');
}


