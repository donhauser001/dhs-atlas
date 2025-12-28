/**
 * 工作流管理器
 * 
 * 管理工作流生命周期和会话状态
 */

import type {
  WorkflowState,
  WorkflowStepResult,
  WorkflowHandlerContext,
  IWorkflowHandler,
} from './types';

// ============ 工作流注册表 ============

const handlers = new Map<string, IWorkflowHandler>();

export function registerWorkflow(handler: IWorkflowHandler): void {
  handlers.set(handler.definition.id, handler);
  console.log(`[Workflow] 注册: ${handler.definition.id}`);
}

export function getWorkflowHandler(id: string): IWorkflowHandler | undefined {
  return handlers.get(id);
}

export function getAllWorkflowDefinitions() {
  return Array.from(handlers.values()).map(h => h.definition);
}

// ============ 会话状态存储（内存，生产环境用 Redis）============

const sessions = new Map<string, WorkflowState>();

export function getSessionWorkflow(sessionId: string): WorkflowState | undefined {
  return sessions.get(sessionId);
}

export function saveSessionWorkflow(sessionId: string, state: WorkflowState): void {
  state.updatedAt = new Date();
  sessions.set(sessionId, state);
}

export function clearSessionWorkflow(sessionId: string): void {
  sessions.delete(sessionId);
}

// ============ 工作流管理器 ============

export class WorkflowManager {
  /**
   * 尝试匹配并启动工作流
   */
  static tryStart(
    sessionId: string,
    message: string,
    context?: Record<string, unknown>
  ): { started: boolean; workflowId?: string; state?: WorkflowState } {
    // 已有活跃工作流则不启动新的
    const existing = getSessionWorkflow(sessionId);
    if (existing && existing.status === 'active') {
      return { started: false };
    }

    for (const handler of handlers.values()) {
      if (handler.canTrigger(message, context)) {
        const state = handler.initialize(sessionId, context);
        saveSessionWorkflow(sessionId, state);
        console.log(`[Workflow] 启动: ${handler.definition.id}`);
        return { started: true, workflowId: handler.definition.id, state };
      }
    }

    return { started: false };
  }

  /**
   * 处理用户输入
   */
  static async handleInput(
    sessionId: string,
    userId: string,
    message: string,
    pageContext?: Record<string, unknown>
  ): Promise<WorkflowStepResult | null> {
    const state = getSessionWorkflow(sessionId);
    if (!state || state.status !== 'active') {
      return null;
    }

    const handler = getWorkflowHandler(state.workflowId);
    if (!handler) {
      clearSessionWorkflow(sessionId);
      return null;
    }

    const ctx: WorkflowHandlerContext = {
      sessionId,
      userId,
      userMessage: message,
      state,
      pageContext: pageContext as WorkflowHandlerContext['pageContext'],
    };

    const result = await handler.handleInput(ctx);
    saveSessionWorkflow(sessionId, state);
    
    return result;
  }

  /**
   * 检查是否有活跃工作流
   */
  static hasActive(sessionId: string): boolean {
    const state = getSessionWorkflow(sessionId);
    return !!state && state.status === 'active';
  }

  /**
   * 获取当前工作流状态
   */
  static getState(sessionId: string): WorkflowState | undefined {
    return getSessionWorkflow(sessionId);
  }

  /**
   * 取消工作流
   */
  static cancel(sessionId: string): boolean {
    const state = getSessionWorkflow(sessionId);
    if (state) {
      state.status = 'cancelled';
      saveSessionWorkflow(sessionId, state);
      return true;
    }
    return false;
  }
}
