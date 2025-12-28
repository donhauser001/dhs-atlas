/**
 * AI 原生架构 - 类型定义
 * 
 * 核心协议：
 * 1. Tool Protocol - AI 如何调用后端能力
 * 2. UI Protocol - AI 如何请求渲染交互组件
 * 
 * 参考文档：docs/ai-native-architecture/05-工程架构-协议与包结构.md
 */

import { LucideIcon } from 'lucide-react';

// ============ Tool Protocol ============

/**
 * 工具调用请求（AI 输出的结构化格式）
 */
export interface ToolCallRequest {
  /** 工具 ID，如 "crm.create_client" */
  toolId: string;
  /** 工具参数 */
  params: Record<string, unknown>;
  /** 请求 ID（用于追踪和幂等） */
  requestId?: string;
}

/**
 * 工具执行结果
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;

  /** 可继续编排的最小状态 */
  artifacts?: {
    id: string;
    type: string;
    [key: string]: unknown;
  };

  /** 下一步建议 */
  nextHints?: string[];

  /** 推荐展示的 UI 组件 */
  uiSuggestion?: UISpec;

  error?: {
    code: string;
    message: string;
  };
}

/**
 * 工具定义
 */
export interface ToolDefinition {
  /** 工具 ID */
  id: string;
  /** 工具名称 */
  name: string;
  /** 工具描述（给 AI 看） */
  description: string;
  /** 所属模块 */
  module: string;
  /** 参数 schema（JSON Schema 格式） */
  paramsSchema: Record<string, unknown>;
  /** 返回值 schema */
  resultSchema?: Record<string, unknown>;
  /** 权限要求 */
  permissions?: string[];
  /** 是否需要用户确认 */
  requiresConfirmation?: boolean;
}

// ============ UI Protocol ============

/**
 * UI Spec - AI 请求渲染的规格
 * AI 不输出 JSX，AI 输出 UI Spec
 */
export interface UISpec {
  /** 组件 ID（必须是已注册的组件） */
  componentId: string;
  /** 组件 props */
  props: Record<string, unknown>;
  /** 渲染目标 */
  target?: 'canvas' | 'modal' | 'toast';
}

/**
 * UI 事件（用户操作后回传给 AI）
 */
export interface UIEvent {
  /** 事件类型 */
  type: 'submit' | 'cancel' | 'select' | 'approve' | 'reject' | 'update';
  /** 组件 ID */
  componentId: string;
  /** 事件数据 */
  payload: Record<string, unknown>;
}

/**
 * Interaction Orchestrator 的裁决结果
 */
export interface UIDecision {
  action: 'render' | 'reject' | 'defer';
  target?: 'canvas' | 'modal' | 'toast';
  timing?: 'immediate' | 'afterCurrent' | 'queued';
  reason?: string;
  errors?: string[];
}

// ============ Agent 对话 ============

/**
 * Agent 对话消息
 */
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  /** 工具调用（如果有） */
  toolCalls?: ToolCallRequest[];
  /** UI 请求（如果有） */
  uiSpec?: UISpec;
  /** 工具执行结果（role=tool 时） */
  toolResult?: ToolResult;
  /** 时间戳 */
  timestamp?: Date;
}

/**
 * Agent 响应
 */
export interface AgentResponse {
  /** AI 的文本回复 */
  content: string;
  /** 需要执行的工具调用 */
  toolCalls?: ToolCallRequest[];
  /** 需要渲染的 UI */
  uiSpec?: UISpec;
  /** 预判的下一步操作 */
  predictedActions?: PredictedAction[];
}

// ============ 预判指令 ============

/**
 * 预判指令类型
 */
export type PredictedActionType = 'execute' | 'template' | 'question';

/**
 * 预判指令
 * 🔴 核心约束：execute 类型必须 requiresConfirmation = true
 */
export interface PredictedAction {
  id: string;
  type: PredictedActionType;
  label: string;
  icon?: string;
  /** 提示词模板（template 类型） */
  prompt?: string;
  /** 工具 ID（execute 类型） */
  toolId?: string;
  /** 工具参数（execute 类型） */
  params?: Record<string, unknown>;
  /** 置信度 0-1 */
  confidence: number;
  /** 🔴 强制约束：execute 类型必须为 true */
  requiresConfirmation: boolean;
}

// ============ 页面上下文 ============

/**
 * 页面上下文（AI 感知的信息）
 */
export interface PageContext {
  /** 当前模块 */
  module: string;
  /** 页面类型 */
  pageType: 'list' | 'detail' | 'create' | 'edit';
  /** 当前路由 */
  pathname: string;
  /** 当前实体 ID（如果在详情页） */
  entityId?: string;
  /** 选中的项目 ID 列表 */
  selectedIds?: string[];
  /** 可用的工具列表 */
  availableTools: string[];
}

// ============ 模块能力定义 ============

/**
 * 快捷操作定义
 */
export interface QuickAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** 对应的工具 ID */
  toolId?: string;
  /** 或者是一个提示词模板 */
  prompt?: string;
  /** 是否需要确认 */
  requiresConfirmation?: boolean;
  /** 排序权重 */
  order?: number;
}

/**
 * 模块 AI 能力定义
 */
export interface ModuleCapability {
  /** 模块 ID */
  moduleId: string;
  /** 模块名称 */
  moduleName: string;
  /** 模块描述 */
  description: string;
  /** 模块图标 */
  icon?: LucideIcon;
  /** 该模块可用的工具 ID 列表 */
  availableTools: string[];
  /** 快捷操作 */
  quickActions: QuickAction[];
  /** 关联的路由 */
  routePatterns?: string[];
  /** 是否启用 */
  enabled?: boolean;
}

// ============ 为了向后兼容保留的类型别名 ============

export type AiQuickAction = QuickAction;
export type AiModuleCapability = ModuleCapability;
