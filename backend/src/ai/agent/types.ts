/**
 * Agent Service 类型定义
 * 
 * V2 架构：AI 智能不受限，系统只守门
 */

import type { ToolCallRequest, ToolResult } from '../tools/types';

// ============================================================================
// 任务机制类型（地图执行时的进度跟踪）
// ============================================================================

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
    startTime?: Date;
    /** 结束时间 */
    endTime?: Date;
}

/**
 * 任务列表（地图执行时的整体进度）
 * 
 * 作用：
 * 1. 反馈给前端，让用户看到执行进度
 * 2. 作为 AI 的上下文，让 AI 知道当前进度
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
    createdAt: Date;
    /** 更新时间 */
    updatedAt: Date;
}

// ============================================================================
// 消息和上下文类型
// ============================================================================

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
    /** 会话 ID（用于对话日志追踪） */
    sessionId?: string;
    /** 
     * 任务列表（地图执行时）
     * V2 架构核心：让用户看到执行进度，让 AI 知道当前状态
     */
    taskList?: TaskList;
}

// ============================================================================
// 系统守门层类型
// ============================================================================

/**
 * 权限检查结果
 */
export interface PermissionCheckResult {
    allowed: boolean;
    reason?: string;
}

/**
 * 参数验证结果
 */
export interface ValidationResult {
    valid: boolean;
    errors?: string[];
}

/**
 * 审计日志条目
 */
export interface AuditLogEntry {
    /** 用户 ID */
    userId: string;
    /** 工具 ID */
    toolId: string;
    /** 调用参数 */
    params: Record<string, unknown>;
    /** 执行结果 */
    result: unknown;
    /** 是否成功 */
    success: boolean;
    /** 时间戳 */
    timestamp: Date;
    /** 会话 ID */
    sessionId?: string;
    /** 错误信息 */
    errorMessage?: string;
    /** 原因码 */
    reasonCode?: string;
    /** 执行耗时（毫秒） */
    duration?: number;
    /** 请求 ID */
    requestId?: string;
    /** 目标集合名称 */
    collection?: string;
    /** 操作类型 */
    operation?: string;
    /** 模块名称 */
    module?: string;
    /** 路由路径 */
    pathname?: string;
}

// ============================================================================
// AI 地图类型（知识库版本）
// ============================================================================

/**
 * 地图工具定义
 */
export interface MapTool {
    toolId: string;
    description: string;
    parameters: Record<string, unknown>;
    requiresConfirmation: boolean;
}

/**
 * 地图示例
 */
export interface MapExample {
    userInput: string;
    aiResponse: string;
    toolCalls?: Array<{
        toolId: string;
        params: Record<string, unknown>;
    }>;
}

/**
 * AI 地图（知识库版本）
 */
export interface AiMapKnowledge {
    mapId: string;
    name: string;
    description: string;
    scenarios: string[];
    tools: MapTool[];
    bestPractices?: string[];
    examples?: MapExample[];
}
