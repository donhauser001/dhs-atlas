/**
 * Agent 流式响应控制器
 * 
 * 使用 SSE (Server-Sent Events) 实现实时反馈
 * 每个步骤完成后立即推送更新到前端
 * 
 * 符合宪章要求：禁止假进度条，实现真正的实时反馈
 */

import { Request, Response } from 'express';
import { processAgentRequest } from '../ai/agent/agent-service';
import type { AgentRequest, PageContext, ProgressCallback, TaskList, SSEEventType } from '../ai/agent/types';
import type { ToolResult } from '../ai/tools/types';

/**
 * 发送 SSE 事件并立即刷新
 * 
 * 重要：必须在每次 write 后调用 flush，确保数据立即发送
 * 否则数据可能被缓冲，导致"假聊天"问题
 */
function sendSSE(res: Response, event: SSEEventType, data: unknown): void {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    res.write(message);
    
    // 尝试多种方式强制刷新缓冲区
    // 方式 1: compression 中间件的 flush
    if (typeof (res as any).flush === 'function') {
        (res as any).flush();
    }
    
    // 方式 2: 使用 socket 的 uncork (强制发送缓冲数据)
    if (res.socket) {
        res.socket.uncork();
        res.socket.cork(); // 重新启用缓冲，但之前的数据已发送
        // 使用 setImmediate 在下一个事件循环再次 uncork
        setImmediate(() => {
            if (res.socket) {
                res.socket.uncork();
            }
        });
    }
}

/**
 * 流式对话接口
 * 
 * 使用 SSE 实现实时反馈，每个步骤完成后立即推送更新
 */
export async function streamChat(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.userId;

    if (!userId) {
        res.status(401).json({
            success: false,
            error: 'UNAUTHORIZED',
            message: '未授权访问',
        });
        return;
    }

    const { message, history, context, sessionId } = req.body as {
        message: string;
        history?: any[];
        context?: PageContext;
        sessionId?: string;
    };

    if (!message) {
        res.status(400).json({
            success: false,
            error: 'INVALID_REQUEST',
            message: '消息不能为空',
        });
        return;
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲
    res.setHeader('Content-Encoding', 'identity'); // 禁用压缩，确保实时传输
    res.flushHeaders();
    
    // 禁用 Nagle 算法，确保小数据包立即发送
    if (res.socket) {
        res.socket.setNoDelay(true);
    }

    // 创建进度回调
    const callbacks: ProgressCallback = {
        onTaskStart: (taskList: TaskList) => {
            console.log('[SSE] 任务开始:', taskList.mapName);
            sendSSE(res, 'task_start' as SSEEventType, {
                taskList,
                timestamp: new Date().toISOString(),
            });
        },

        onStepStart: (taskList: TaskList, stepNumber: number) => {
            const step = taskList.tasks.find(t => t.stepNumber === stepNumber);
            console.log('[SSE] 步骤开始:', stepNumber, step?.name);
            sendSSE(res, 'step_start' as SSEEventType, {
                taskList,
                stepNumber,
                stepName: step?.name,
                timestamp: new Date().toISOString(),
            });
        },

        onStepComplete: (taskList: TaskList, stepNumber: number, result: unknown) => {
            const step = taskList.tasks.find(t => t.stepNumber === stepNumber);
            console.log('[SSE] 步骤完成:', stepNumber, step?.name);
            sendSSE(res, 'step_complete' as SSEEventType, {
                taskList,
                stepNumber,
                stepName: step?.name,
                resultSummary: step?.resultSummary,
                timestamp: new Date().toISOString(),
            });
        },

        onStepFailed: (taskList: TaskList, stepNumber: number, error: string) => {
            console.log('[SSE] 步骤失败:', stepNumber, error);
            sendSSE(res, 'step_failed' as SSEEventType, {
                taskList,
                stepNumber,
                error,
                timestamp: new Date().toISOString(),
            });
        },

        onToolCall: (toolId: string, params: Record<string, unknown>) => {
            console.log('[SSE] 工具调用:', toolId);
            sendSSE(res, 'tool_call' as SSEEventType, {
                toolId,
                params,
                timestamp: new Date().toISOString(),
            });
        },

        onToolResult: (toolId: string, result: ToolResult) => {
            console.log('[SSE] 工具结果:', toolId, result.success ? '成功' : '失败');
            sendSSE(res, 'tool_result' as SSEEventType, {
                toolId,
                success: result.success,
                // 只发送摘要，不发送完整数据（避免数据量过大）
                hasData: !!result.data,
                timestamp: new Date().toISOString(),
            });
        },

        onMessage: (content: string) => {
            console.log('[SSE] AI 消息:', content.substring(0, 50) + '...');
            sendSSE(res, 'ai_message' as SSEEventType, {
                content,
                timestamp: new Date().toISOString(),
            });
        },

        onTaskComplete: (taskList: TaskList, finalContent: string) => {
            console.log('[SSE] 任务完成:', taskList.mapName);
            sendSSE(res, 'task_complete' as SSEEventType, {
                taskList,
                content: finalContent,
                timestamp: new Date().toISOString(),
            });
        },

        onError: (error: string) => {
            console.error('[SSE] 错误:', error);
            sendSSE(res, 'error' as SSEEventType, {
                error,
                timestamp: new Date().toISOString(),
            });
        },
    };

    try {
        // 构建 Agent 请求
        const agentRequest: AgentRequest = {
            message,
            history,
            context,
            userId,
            sessionId,
        };

        // 调用 Agent 处理，传入回调
        const result = await processAgentRequest(agentRequest, callbacks);

        // 发送最终完成事件
        sendSSE(res, 'task_complete' as SSEEventType, {
            content: result.content,
            toolResults: result.toolResults,
            taskList: result.taskList,
            uiSpec: result.uiSpec,
            predictedActions: result.predictedActions,
            sessionId: result.sessionId,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('[SSE] 处理失败:', error);
        sendSSE(res, 'error' as SSEEventType, {
            error: error instanceof Error ? error.message : '处理失败',
            timestamp: new Date().toISOString(),
        });
    } finally {
        // 结束流
        res.end();
    }
}

export default {
    streamChat,
};
