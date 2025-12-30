/**
 * Agent 流式响应控制器
 * 
 * 使用 SSE (Server-Sent Events) 实现实时反馈
 * 每个步骤完成后立即推送更新到前端
 */

import { Request, Response } from 'express';
import { processAgentRequest } from '../ai/agent/agent-service';
import type { AgentRequest, PageContext } from '../ai/agent/types';

/**
 * SSE 事件类型
 */
export enum SSEEventType {
    // 任务开始
    TASK_START = 'task_start',
    // 步骤开始
    STEP_START = 'step_start',
    // 步骤完成
    STEP_COMPLETE = 'step_complete',
    // 步骤失败
    STEP_FAILED = 'step_failed',
    // 工具调用
    TOOL_CALL = 'tool_call',
    // 工具结果
    TOOL_RESULT = 'tool_result',
    // AI 消息
    AI_MESSAGE = 'ai_message',
    // 任务完成
    TASK_COMPLETE = 'task_complete',
    // 错误
    ERROR = 'error',
}

/**
 * 发送 SSE 事件
 */
function sendSSE(res: Response, event: SSEEventType, data: unknown) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * 流式对话接口
 * 
 * 使用 SSE 实现实时反馈
 */
export async function streamChat(req: Request, res: Response) {
    const userId = (req as any).user?.userId;

    if (!userId) {
        return res.status(401).json({
            success: false,
            error: 'UNAUTHORIZED',
            message: '未授权访问',
        });
    }

    const { messages, context, sessionId } = req.body as AgentRequest;

    if (!messages || messages.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'INVALID_REQUEST',
            message: '消息不能为空',
        });
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲
    res.flushHeaders();

    try {
        // 发送开始事件
        sendSSE(res, SSEEventType.TASK_START, {
            sessionId,
            timestamp: new Date().toISOString(),
        });

        // 调用 agent 处理
        // TODO: 修改 processAgentRequest 支持回调，在每个步骤完成时调用
        const result = await processAgentRequest({
            messages,
            context: context as PageContext,
            sessionId,
        }, userId);

        // 发送最终结果
        sendSSE(res, SSEEventType.TASK_COMPLETE, {
            content: result.content,
            toolResults: result.toolResults,
            taskList: result.taskList,
            uiSpec: result.uiSpec,
            predictedActions: result.predictedActions,
            sessionId: result.sessionId,
        });

    } catch (error) {
        console.error('[Agent Stream] 处理失败:', error);
        sendSSE(res, SSEEventType.ERROR, {
            message: error instanceof Error ? error.message : '处理失败',
        });
    } finally {
        // 结束流
        res.end();
    }
}

export default {
    streamChat,
};

