/**
 * Agent Service 类型定义
 */

import type { ToolCallRequest, ToolResult } from '../tools/types';

/**
 * 对话消息
 */
export interface AgentMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    /** 工具调用请求（assistant 消息） */
    toolCalls?: ToolCallRequest[];
    /** 工具执行结果（tool 消息） */
    toolResult?: ToolResult;
    /** 消息 ID */
    id?: string;
    /** 时间戳 */
    timestamp?: Date;
}

/**
 * 页面上下文
 */
export interface PageContext {
    /** 当前模块 */
    module: string;
    /** 页面类型 */
    pageType: 'list' | 'detail' | 'create' | 'edit' | 'unknown';
    /** 当前路由 */
    pathname: string;
    /** 当前实体 ID */
    entityId?: string;
    /** 选中的项目 */
    selectedIds?: string[];
}

/**
 * Agent 请求
 */
export interface AgentRequest {
    /** 用户消息 */
    message: string;
    /** 对话历史 */
    history?: AgentMessage[];
    /** 页面上下文 */
    context?: PageContext;
    /** 用户 ID */
    userId: string;
    /** 会话 ID */
    sessionId?: string;
}

/**
 * UI 规格（AI 请求渲染的组件）
 */
export interface UISpec {
    componentId: string;
    props: Record<string, unknown>;
    target?: 'canvas' | 'modal' | 'toast';
}

/**
 * 预判指令
 */
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

/**
 * Agent 响应
 */
export interface AgentResponse {
    /** AI 的文本回复 */
    content: string;
    /** 执行的工具调用结果 */
    toolResults?: Array<{
        toolId: string;
        result: ToolResult;
    }>;
    /** 需要渲染的 UI */
    uiSpec?: UISpec;
    /** 预判的下一步操作 */
    predictedActions?: PredictedAction[];
    /** 是否需要用户确认（有待执行的工具） */
    pendingToolCalls?: ToolCallRequest[];
    /** 表单字段更新（工作流触发） */
    formUpdates?: Record<string, unknown>;
}

