/**
 * Agent API 客户端
 * 
 * V2 架构：智能 AI + 系统守门
 * 
 * 与后端 Agent Service 交互
 */

import api from '@/lib/axios';

// ============ 类型定义 ============

export interface ToolCallRequest {
    toolId: string;
    params: Record<string, unknown>;
    requestId?: string;
}

/**
 * 结构化错误（Phase 2 增强）
 */
export interface StructuredError {
    code: string;
    message: string;
    reasonCode: string;
    userMessage: string;
    suggestion?: string;
    canRetry: boolean;
}

export interface ToolResult {
    success: boolean;
    data?: unknown;
    artifacts?: {
        id: string;
        type: string;
        [key: string]: unknown;
    };
    nextHints?: string[];
    uiSuggestion?: UISpec;
    /** 结构化错误信息（Phase 2） */
    error?: StructuredError;
}

export interface UISpec {
    componentId: string;
    props: Record<string, unknown>;
    target?: 'canvas' | 'modal' | 'toast';
}

export interface PredictedAction {
    id: string;
    type: 'execute' | 'template' | 'question';
    label: string;
    icon?: string;
    prompt?: string;
    toolId?: string;
    params?: Record<string, unknown>;
    confidence: number;
    requiresConfirmation: boolean;
}

export interface PageContext {
    module: string;
    pageType: 'list' | 'detail' | 'create' | 'edit' | 'unknown';
    pathname: string;
    entityId?: string;
    selectedIds?: string[];
}

// ============ 任务列表类型（V2 架构） ============

/**
 * 任务状态
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * 任务项（对应地图的一个步骤）
 */
export interface TaskItem {
    /** 步骤序号（从 1 开始） */
    stepNumber: number;
    /** 任务名称 */
    name: string;
    /** 任务描述 */
    description: string;
    /** 对应的工具 ID */
    toolId: string;
    /** 任务状态 */
    status: TaskStatus;
    /** 执行结果摘要（成功时显示） */
    resultSummary?: string;
    /** 错误信息（失败时显示） */
    error?: string;
    /** 开始时间 */
    startTime?: string;
    /** 结束时间 */
    endTime?: string;
}

/**
 * 任务列表（地图执行时的整体进度）
 */
export interface TaskList {
    /** 任务列表 ID */
    id: string;
    /** 关联的地图 ID */
    mapId: string;
    /** 地图名称 */
    mapName: string;
    /** 任务列表 */
    tasks: TaskItem[];
    /** 当前执行的步骤（从 1 开始，0 表示未开始） */
    currentStep: number;
    /** 总步骤数 */
    totalSteps: number;
    /** 整体状态 */
    status: 'pending' | 'running' | 'completed' | 'failed';
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
}

export interface AgentMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    toolCalls?: ToolCallRequest[];
    toolResult?: ToolResult;
    id?: string;
    timestamp?: Date;
}

export interface AgentChatRequest {
    message: string;
    history?: AgentMessage[];
    context?: PageContext;
    /** 会话 ID（用于保持工作流状态） */
    sessionId?: string;
}

export interface AgentChatResponse {
    content: string;
    toolResults?: Array<{
        toolId: string;
        result: ToolResult;
    }>;
    uiSpec?: UISpec;
    predictedActions?: PredictedAction[];
    pendingToolCalls?: ToolCallRequest[];
    /** 会话 ID（返回给前端用于后续请求） */
    sessionId?: string;
    /** 表单字段更新 */
    formUpdates?: Record<string, unknown>;
    /** 友好错误解释（Phase 2 增强） */
    explanation?: {
        userMessage: string;
        suggestion?: string;
        canRetry: boolean;
    };
    /** 
     * 任务列表（V2 架构）
     * 地图执行时返回，让用户看到执行进度
     */
    taskList?: TaskList;
}

export interface AgentStatusResponse {
    available: boolean;
    provider?: string;
    model?: string;
    url?: string;
    models?: string[];
    toolCount?: number;
    message?: string;
}

export interface ToolInfo {
    id: string;
    name: string;
    description: string;
    module: string;
    requiresConfirmation?: boolean;
}

// ============ SSE 事件类型 ============

/**
 * SSE 事件类型
 */
export type SSEEventType =
    | 'task_start'
    | 'step_start'
    | 'step_complete'
    | 'step_failed'
    | 'tool_call'
    | 'tool_result'
    | 'ai_message'
    | 'task_complete'
    | 'error'
    // Python Agent 发送的事件类型
    | 'start'
    | 'content'
    | 'done';

/**
 * SSE 事件数据
 */
export interface SSEEventData {
    type: SSEEventType;
    taskList?: TaskList;
    stepNumber?: number;
    stepName?: string;
    toolId?: string;
    content?: string;
    error?: string;
    timestamp?: string;
    // task_complete 事件特有字段
    toolResults?: Array<{ toolId: string; result: ToolResult }>;
    uiSpec?: UISpec;
    predictedActions?: PredictedAction[];
    sessionId?: string;
    // Python Agent 发送的事件特有字段
    session_id?: string;
}

/**
 * SSE 进度回调
 */
export interface SSEProgressCallbacks {
    onTaskStart?: (taskList: TaskList) => void;
    onStepStart?: (taskList: TaskList, stepNumber: number, stepName?: string) => void;
    onStepComplete?: (taskList: TaskList, stepNumber: number, stepName?: string) => void;
    onStepFailed?: (taskList: TaskList, stepNumber: number, error: string) => void;
    onToolCall?: (toolId: string) => void;
    onToolResult?: (toolId: string, success: boolean) => void;
    onMessage?: (content: string) => void;
    onComplete?: (response: AgentChatResponse) => void;
    onError?: (error: string) => void;
}

// ============ API 函数 ============

/**
 * 发送消息给 Agent
 */
export async function sendAgentMessage(
    request: AgentChatRequest
): Promise<AgentChatResponse> {
    const response = await api.post<{ success: boolean; data: AgentChatResponse }>(
        '/agent/chat',
        request
    );

    if (!response.data.success) {
        throw new Error('Agent 请求失败');
    }

    return response.data.data;
}

/**
 * 流式发送消息给 Agent（SSE 实时反馈）
 * 
 * @param request - 请求参数
 * @param callbacks - 进度回调
 * @returns 取消函数
 */
export function streamAgentMessage(
    request: AgentChatRequest,
    callbacks: SSEProgressCallbacks
): () => void {
    const controller = new AbortController();

    // 获取认证 token
    const token = localStorage.getItem('token');

    // 使用 fetch 而不是 EventSource（因为需要 POST 请求）
    // 深度整合：直接调用 Python Agent API
    // 如果 Python Agent 未运行，会回退到原来的 TypeScript 后端
    const streamUrl = 'http://localhost:8000/api/agent/stream';

    const fetchStream = async () => {
        try {
            const response = await fetch(streamUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            console.log('[SSE] 开始接收流式数据...');

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    console.log('[SSE] 流式数据接收完成');
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                console.log('[SSE] 收到数据块:', chunk.length, '字节');

                buffer += chunk;

                // 解析 SSE 事件 - 以双换行分割事件
                const events = buffer.split('\n\n');
                buffer = events.pop() || ''; // 保留不完整的事件

                for (const eventBlock of events) {
                    if (!eventBlock.trim()) continue;

                    const lines = eventBlock.split('\n');
                    let currentEvent: SSEEventType | null = null;
                    let currentData: string | null = null;

                    for (const line of lines) {
                        if (line.startsWith('event: ')) {
                            currentEvent = line.slice(7).trim() as SSEEventType;
                        } else if (line.startsWith('data: ')) {
                            currentData = line.slice(6);
                        }
                    }

                    if (currentEvent && currentData) {
                        console.log('[SSE] 解析事件:', currentEvent);
                        try {
                            const data = JSON.parse(currentData) as SSEEventData;
                            handleSSEEvent(currentEvent, data, callbacks);
                        } catch (e) {
                            console.warn('[SSE] 解析事件数据失败:', e, currentData);
                        }
                    }
                }
            }
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                console.log('[SSE] 请求已取消');
                return;
            }
            console.error('[SSE] 流式请求失败:', error);
            callbacks.onError?.(error instanceof Error ? error.message : '未知错误');
        }
    };

    fetchStream();

    // 返回取消函数
    return () => {
        controller.abort();
    };
}

/**
 * 处理 SSE 事件
 */
function handleSSEEvent(
    eventType: SSEEventType,
    data: SSEEventData,
    callbacks: SSEProgressCallbacks
): void {
    console.log('[SSE] 收到事件:', eventType, data);

    switch (eventType) {
        case 'task_start':
            if (data.taskList) {
                callbacks.onTaskStart?.(data.taskList);
            }
            break;

        case 'step_start':
            if (data.taskList && data.stepNumber !== undefined) {
                callbacks.onStepStart?.(data.taskList, data.stepNumber, data.stepName);
            }
            break;

        case 'step_complete':
            if (data.taskList && data.stepNumber !== undefined) {
                callbacks.onStepComplete?.(data.taskList, data.stepNumber, data.stepName);
            }
            break;

        case 'step_failed':
            if (data.taskList && data.stepNumber !== undefined && data.error) {
                callbacks.onStepFailed?.(data.taskList, data.stepNumber, data.error);
            }
            break;

        case 'tool_call':
            if (data.toolId) {
                callbacks.onToolCall?.(data.toolId);
            }
            break;

        case 'tool_result':
            if (data.toolId) {
                callbacks.onToolResult?.(data.toolId, true);
            }
            break;

        case 'ai_message':
        case 'content':  // Python Agent 发送的事件类型
            if (data.content) {
                callbacks.onMessage?.(data.content);
            }
            break;

        case 'task_complete':
        case 'done':  // Python Agent 发送的事件类型
            callbacks.onComplete?.({
                content: data.content || '',
                taskList: data.taskList,
                toolResults: data.toolResults,
                uiSpec: data.uiSpec,
                predictedActions: data.predictedActions,
                sessionId: data.sessionId || data.session_id,
            });
            break;

        case 'error':
            callbacks.onError?.(data.error || '未知错误');
            break;

        case 'start':  // Python Agent 发送的事件类型
            // 开始事件，可以用于显示加载状态
            console.log('[SSE] 会话开始:', data.session_id);
            break;
    }
}

/**
 * 确认并执行待处理的工具调用
 */
export async function confirmToolCalls(
    toolCalls: ToolCallRequest[]
): Promise<Array<{ toolId: string; result: ToolResult }>> {
    const response = await api.post<{
        success: boolean;
        data: { results: Array<{ toolId: string; result: ToolResult }> };
    }>('/agent/confirm', { toolCalls });

    if (!response.data.success) {
        throw new Error('工具执行失败');
    }

    return response.data.data.results;
}

/**
 * 获取 Agent 服务状态
 */
export async function getAgentStatus(): Promise<AgentStatusResponse> {
    const response = await api.get<{ success: boolean; data: AgentStatusResponse }>(
        '/agent/status'
    );
    return response.data.data;
}

/**
 * 获取可用工具列表
 */
export async function getAgentTools(): Promise<ToolInfo[]> {
    const response = await api.get<{
        success: boolean;
        data: { tools: ToolInfo[] };
    }>('/agent/tools');
    return response.data.data.tools;
}

// ============ 默认导出 ============

const agentApi = {
    chat: sendAgentMessage,
    chatStream: streamAgentMessage,
    confirm: confirmToolCalls,
    status: getAgentStatus,
    tools: getAgentTools,
};

export default agentApi;
