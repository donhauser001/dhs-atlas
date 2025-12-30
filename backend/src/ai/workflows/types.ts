/**
 * AI 工作流类型定义
 * 
 * 🔴 核心原则（来自开发伦理宪章）：
 * 1. AI 没做的事，不允许展示
 * 2. 工作流只提供事实（Facts）+ 可用工具
 * 3. LLM 自己决定说什么、调用什么
 */

import type { UISpec } from '../agent/types';

// ============ 工作流状态 ============

export type WorkflowStatus = 'idle' | 'active' | 'completed' | 'cancelled';

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  data?: Record<string, unknown>;
}

export interface WorkflowState {
  workflowId: string;
  sessionId: string;
  status: WorkflowStatus;
  currentStepIndex: number;
  steps: WorkflowStep[];
  collectedData: Record<string, unknown>;
  context: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ============ 工作流执行结果 ============

/**
 * 工作流步骤执行结果
 */
export interface WorkflowStepResult {
  /** 需要立即渲染的 UI（工作流主动触发） */
  uiSpec?: UISpec;
  /** 需要更新的表单字段 */
  formUpdates?: Record<string, unknown>;
  
  /**
   * 🔴 提供给 LLM 的上下文
   * 包含：事实 + 可用命令
   */
  context: WorkflowContext_ForLLM;
}

/**
 * 提供给 LLM 的工作流上下文
 */
export interface WorkflowContext_ForLLM {
  /** 
   * 事实：当前状态和数据
   */
  facts: {
    /** 工作流名称 */
    workflow: string;
    /** 当前步骤 */
    step: string;
    /** 已收集的数据 */
    collected: Record<string, unknown>;
    /** 最近一次操作的结果 */
    lastOperation?: {
      type: string;
      success: boolean;
      data?: unknown;
      error?: string;
    };
  };

  /**
   * 可用命令：AI 当前可以执行的操作
   * AI 根据这些命令决定下一步做什么
   */
  availableCommands: WorkflowCommand[];

  /**
   * 需要收集的字段（如果当前步骤需要用户输入）
   */
  fieldsToCollect?: Array<{
    name: string;
    label: string;
    required: boolean;
  }>;
}

/**
 * 工作流命令
 * 
 * 告诉 AI 它能执行什么操作
 */
export interface WorkflowCommand {
  /** 命令 ID */
  id: string;
  /** 命令名称（给 AI 看） */
  name: string;
  /** 命令描述（给 AI 理解用途） */
  description: string;
  /** 命令类型 */
  type: 'form' | 'api' | 'navigate' | 'confirm';
  /** 命令参数 schema */
  params?: Record<string, {
    type: string;
    description: string;
    required?: boolean;
  }>;
}

// ============ 工作流定义 ============

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  module: string;
  triggers: string[];
  formId?: string;
  steps: WorkflowStepDefinition[];
}

export interface WorkflowStepDefinition {
  id: string;
  name: string;
  fields?: string[];
  optional?: boolean;
}

// ============ 工作流处理器接口 ============

export interface WorkflowHandlerContext {
  sessionId: string;
  userId: string;
  userMessage: string;
  state: WorkflowState;
  pageContext?: {
    module: string;
    pathname: string;
    entityId?: string;
  };
}

export interface IWorkflowHandler {
  readonly definition: WorkflowDefinition;
  initialize(sessionId: string, context?: Record<string, unknown>): WorkflowState;
  handleInput(ctx: WorkflowHandlerContext): Promise<WorkflowStepResult>;
  canTrigger(message: string, context?: Record<string, unknown>): boolean;
}
