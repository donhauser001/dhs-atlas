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
    confirm: confirmToolCalls,
    status: getAgentStatus,
    tools: getAgentTools,
};

export default agentApi;
