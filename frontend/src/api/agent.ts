/**
 * Agent API 客户端
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
    error?: {
        code: string;
        message: string;
    };
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

