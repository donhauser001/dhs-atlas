/**
 * AI 工具系统 - 类型定义
 * 
 * 参考文档：docs/ai-native-architecture/05-工程架构-协议与包结构.md
 */

import { z } from 'zod';
import type { ReasonCode } from '../agent/reason-codes';

// ============================================================================
// StructuredError 定义（Phase 2: 失败语义支持）
// ============================================================================

/**
 * 结构化错误
 * 
 * 相比传统的 { code, message }，增加了：
 * - reasonCode: 标准化原因码（可分类、可统计）
 * - userMessage: 用户友好提示（可直接展示）
 * - suggestion: 建议操作（帮助用户解决问题）
 * - canRetry: 是否可重试（决定 UI 行为）
 */
export interface StructuredError {
    /** 系统错误码（如 TOOL_NOT_FOUND） */
    code: string;
    /** 技术错误信息（给开发者看） */
    message: string;
    /** 标准化原因码（用于统计和分类） */
    reasonCode: ReasonCode;
    /** 用户友好提示（可直接展示给用户） */
    userMessage: string;
    /** 建议操作（帮助用户解决问题） */
    suggestion?: string;
    /** 是否可重试 */
    canRetry: boolean;
}

/**
 * 创建 StructuredError 的参数
 */
export interface CreateStructuredErrorParams {
    code: string;
    message: string;
    reasonCode: ReasonCode;
    userMessage?: string;
    suggestion?: string;
    canRetry?: boolean;
}

/**
 * 工具执行上下文
 */
export interface ToolContext {
    /** 用户 ID */
    userId: string;
    /** 租户 ID */
    tenantId?: string;
    /** 请求 ID（用于审计和幂等） */
    requestId: string;
    /** 会话 ID */
    sessionId?: string;
}

/**
 * 工具执行结果
 */
export interface ToolResult<T = unknown> {
    success: boolean;
    data?: T;

    /** 产出物（可用于后续编排） */
    artifacts?: {
        id: string;
        type: string;
        [key: string]: unknown;
    };

    /** 下一步建议（给 AI 参考） */
    nextHints?: string[];

    /** 推荐的 UI 组件 */
    uiSuggestion?: {
        componentId: string;
        props: Record<string, unknown>;
    };

    /** 错误信息（结构化） */
    error?: StructuredError;
}

/**
 * 工具定义
 */
export interface ToolDefinition<TParams = unknown, TResult = unknown> {
    /** 工具 ID，格式：module.action，如 crm.create_client */
    id: string;
    /** 工具名称（中文） */
    name: string;
    /** 工具描述（给 AI 看，要清晰说明用途和限制） */
    description: string;
    /** 所属模块 */
    module: string;
    /** 参数 schema（Zod） */
    paramsSchema: z.ZodType<TParams>;
    /** 是否需要用户确认 */
    requiresConfirmation?: boolean;
    /** 权限要求 */
    permissions?: string[];
    /** 执行函数 */
    execute: (params: TParams, context: ToolContext) => Promise<ToolResult<TResult>>;
}

/**
 * 工具注册表
 */
export interface ToolRegistry {
    register<TParams, TResult>(tool: ToolDefinition<TParams, TResult>): void;
    get(toolId: string): ToolDefinition | undefined;
    getAll(): ToolDefinition[];
    getByModule(module: string): ToolDefinition[];
    execute<TParams, TResult>(
        toolId: string,
        params: TParams,
        context: ToolContext
    ): Promise<ToolResult<TResult>>;
}

/**
 * 工具调用请求（从 AI 响应解析出来的）
 */
export interface ToolCallRequest {
    toolId: string;
    params: Record<string, unknown>;
    requestId?: string;
}

/**
 * 工具描述（给 AI 的 system prompt 用）
 */
export interface ToolDescription {
    id: string;
    name: string;
    description: string;
    parameters: Record<string, unknown>; // JSON Schema 格式
    requiresConfirmation?: boolean;
    usage?: string;      // 使用方法
    examples?: string;   // 调用示例
    category?: string;   // 工具分类
}

