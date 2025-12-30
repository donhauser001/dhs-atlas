'use client';

/**
 * AI Context - V2 架构
 * 
 * AI 智能不受限，系统只守门
 * AI 自由理解意图、查询地图、决定行动
 */

import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  useAiFormCapabilities,
  type FormDefinition,
  type FormOperationMode,
} from '@/lib/form-registry';
import {
  matchModuleByRoute,
  type ModuleCapability,
  type QuickAction,
} from '@/lib/ai-capabilities';
import {
  sendAgentMessage,
  confirmToolCalls,
  type AgentMessage,
  type AgentChatResponse,
  type UISpec,
  type PredictedAction,
  type ToolCallRequest,
  type PageContext,
  type TaskList,
} from '@/api/agent';

// ============ Types ============

export type AiPanelState = 'collapsed' | 'expanded';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'streaming' | 'complete' | 'error';
  /** 待确认的工具调用 */
  pendingToolCalls?: ToolCallRequest[];
  /** 预判指令 */
  predictedActions?: PredictedAction[];
  /** UI 规格（需要渲染的组件） */
  uiSpec?: UISpec;
  /** 友好错误解释（Phase 2 增强） */
  explanation?: {
    userMessage: string;
    suggestion?: string;
    canRetry: boolean;
  };
  /** 任务列表（V2 架构：地图执行时的进度） */
  taskList?: TaskList;
}

export interface CanvasForm {
  formId: string;
  initialData?: Record<string, unknown>;
  operationMode: FormOperationMode;
}

export interface AiContextValue {
  // Panel 状态
  panelState: AiPanelState;
  setPanelState: (state: AiPanelState) => void;
  togglePanel: () => void;
  canvasShifted: boolean;

  // 消息管理
  messages: AiMessage[];
  addMessage: (message: Omit<AiMessage, 'id' | 'timestamp'>) => void;
  updateLastMessage: (update: Partial<Omit<AiMessage, 'id' | 'timestamp'>>) => void;
  clearMessages: () => void;

  // 输入状态
  inputValue: string;
  setInputValue: (value: string) => void;

  // AI 状态
  isThinking: boolean;
  setIsThinking: (thinking: boolean) => void;

  // 任务列表（V2 架构：地图执行时的进度）
  currentTaskList: TaskList | null;

  // 场景化能力
  activeCapability: ModuleCapability | null;
  quickActions: QuickAction[];
  triggerQuickAction: (action: QuickAction) => void;

  // Agent 交互
  sendMessage: (message: string) => Promise<void>;
  confirmTools: (toolCalls: ToolCallRequest[]) => Promise<void>;

  // 当前页面上下文
  pageContext: PageContext;

  // 表单能力
  availableForms: FormDefinition[];
  matchFormByIntent: (intent: string) => FormDefinition | null;
  projectFormToCanvas: (formId: string, options?: {
    initialData?: Record<string, unknown>;
    operationMode?: FormOperationMode;
  }) => void;
  closeCanvasForm: () => void;
  canvasForm: CanvasForm | null;

  // 处理 UI Spec（从 Agent 响应渲染 UI）
  handleUISpec: (spec: UISpec) => void;
}

// 向后兼容的类型别名
export type AiQuickAction = QuickAction;
export type AiModuleCapability = ModuleCapability;

// ============ Context ============

const AiContext = React.createContext<AiContextValue | null>(null);

// ============ Hook ============

export function useAi() {
  const context = React.useContext(AiContext);
  if (!context) {
    throw new Error('useAi must be used within an AiProvider');
  }
  return context;
}

export function useAiOptional() {
  return React.useContext(AiContext);
}

// ============ Provider ============

interface AiProviderProps {
  children: React.ReactNode;
  defaultPanelState?: AiPanelState;
}

export function AiProvider({
  children,
  defaultPanelState = 'collapsed'
}: AiProviderProps) {
  const pathname = usePathname();
  const [panelState, setPanelState] = React.useState<AiPanelState>(defaultPanelState);
  const [messages, setMessages] = React.useState<AiMessage[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isThinking, setIsThinking] = React.useState(false);
  const [canvasForm, setCanvasForm] = React.useState<CanvasForm | null>(null);
  const [currentTaskList, setCurrentTaskList] = React.useState<TaskList | null>(null);

  // 对话历史（用于发送给 Agent）
  const historyRef = React.useRef<AgentMessage[]>([]);

  // 会话 ID（用于保持工作流状态）
  const sessionIdRef = React.useRef<string | null>(null);

  // 组件挂载时重置状态（确保刷新后清空）
  React.useEffect(() => {
    console.log('[AI] Provider 挂载，重置状态');
    historyRef.current = [];
    sessionIdRef.current = null;
  }, []);

  // 获取表单能力
  const { availableForms, matchFormByIntent } = useAiFormCapabilities();

  // 根据当前路由匹配模块能力
  const activeCapability = React.useMemo(() => {
    return matchModuleByRoute(pathname);
  }, [pathname]);

  // 当前模块的快捷操作
  const quickActions = activeCapability?.quickActions || [];

  // 页面上下文
  const pageContext = React.useMemo<PageContext>(() => {
    // 解析页面类型
    let pageType: PageContext['pageType'] = 'unknown';
    if (pathname.includes('/create') || pathname.includes('/new')) {
      pageType = 'create';
    } else if (pathname.includes('/edit')) {
      pageType = 'edit';
    } else if (/\/[a-f0-9]{24}$/.test(pathname)) {
      pageType = 'detail';
    } else {
      pageType = 'list';
    }

    return {
      module: activeCapability?.moduleId || 'unknown',
      pageType,
      pathname,
    };
  }, [pathname, activeCapability]);

  // Canvas 深度偏移状态
  const canvasShifted = panelState === 'expanded';

  // 切换面板
  const togglePanel = React.useCallback(() => {
    setPanelState(prev => prev === 'collapsed' ? 'expanded' : 'collapsed');
  }, []);

  // 添加消息
  const addMessage = React.useCallback((message: Omit<AiMessage, 'id' | 'timestamp'>) => {
    const newMessage: AiMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);

    // 同时更新历史记录
    if (message.role !== 'system') {
      historyRef.current.push({
        role: message.role,
        content: message.content,
      });
    }
  }, []);

  // 更新最后一条消息
  const updateLastMessage = React.useCallback((update: Partial<Omit<AiMessage, 'id' | 'timestamp'>>) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      newMessages[lastIndex] = {
        ...newMessages[lastIndex],
        ...update,
      };
      return newMessages;
    });
  }, []);

  // 清空消息（同时重置会话）
  const clearMessages = React.useCallback(() => {
    setMessages([]);
    historyRef.current = [];
    sessionIdRef.current = null; // 重置 sessionId，开始新会话
    setCurrentTaskList(null); // 清除任务列表
  }, []);

  // 处理 UI Spec（从 Agent 响应渲染 UI）
  const handleUISpec = React.useCallback((spec: UISpec) => {
    console.log('[AI] 处理 UI Spec:', spec);

    // 根据 componentId 决定如何渲染
    switch (spec.componentId) {
      case 'AiForm':
        // 渲染表单到画布
        setCanvasForm({
          formId: spec.props.formId as string || spec.props.schemaId as string,
          initialData: spec.props.initialValues as Record<string, unknown>,
          operationMode: (spec.props.mode as FormOperationMode) || 'create',
        });
        break;
      case 'AiDetails':
      case 'AiList':
        // TODO: 实现其他组件的渲染
        console.log('[AI] 待实现的组件:', spec.componentId);
        break;
      default:
        console.warn('[AI] 未知的组件:', spec.componentId);
    }
  }, []);

  // 发送消息给 Agent
  const sendMessage = React.useCallback(async (message: string) => {
    if (!message.trim()) return;

    // 添加用户消息
    addMessage({
      role: 'user',
      content: message,
      status: 'complete',
    });

    // 清空输入
    setInputValue('');
    setIsThinking(true);

    // 添加 AI 思考中的消息
    addMessage({
      role: 'assistant',
      content: '正在思考...',
      status: 'streaming',
    });

    try {
      // 调试：打印发送的历史记录
      console.log('[AI] 发送消息，历史长度:', historyRef.current.length);
      if (historyRef.current.length > 0) {
        console.log('[AI] 历史内容:', historyRef.current.map(h => ({ role: h.role, content: h.content.substring(0, 50) })));
      }

      // 调用 Agent API（传递 sessionId 以保持工作流状态）
      const response: AgentChatResponse = await sendAgentMessage({
        message,
        history: historyRef.current,
        context: pageContext,
        sessionId: sessionIdRef.current || undefined,
      });

      // 保存返回的 sessionId（用于后续请求）
      if (response.sessionId) {
        sessionIdRef.current = response.sessionId;
      }

      // 更新 AI 回复
      updateLastMessage({
        content: response.content,
        status: 'complete',
        pendingToolCalls: response.pendingToolCalls,
        predictedActions: response.predictedActions,
        uiSpec: response.uiSpec,
        taskList: response.taskList,
      });

      // 更新当前任务列表（V2 架构）
      if (response.taskList) {
        setCurrentTaskList(response.taskList);
        console.log('[AI] 更新任务列表:', response.taskList.mapName, response.taskList.status);
      }

      // 更新对话历史
      historyRef.current.push({
        role: 'assistant',
        content: response.content,
      });

      // 处理 UI 渲染请求
      if (response.uiSpec) {
        handleUISpec(response.uiSpec);
      }

      // 处理表单字段更新
      if (response.formUpdates && canvasForm) {
        setCanvasForm(prev => prev ? {
          ...prev,
          initialData: { ...prev.initialData, ...response.formUpdates },
        } : null);
      }

    } catch (error) {
      console.error('[AI] 发送消息失败:', error);

      // 构建友好的错误消息
      let errorMessage = '抱歉，AI 服务暂时不可用。';
      let suggestionText = '';

      if (error instanceof Error) {
        // 尝试解析 API 返回的错误
        try {
          const apiError = JSON.parse(error.message);
          if (apiError.explanation) {
            errorMessage = apiError.explanation.userMessage || errorMessage;
            suggestionText = apiError.explanation.suggestion || '';
          }
        } catch {
          errorMessage = error.message || errorMessage;
        }
      }

      updateLastMessage({
        content: suggestionText
          ? `${errorMessage}\n\n💡 建议: ${suggestionText}`
          : errorMessage,
        status: 'error',
      });
    } finally {
      setIsThinking(false);
    }
  }, [addMessage, updateLastMessage, pageContext, handleUISpec, canvasForm]);

  // 确认并执行待处理的工具调用
  const confirmTools = React.useCallback(async (toolCalls: ToolCallRequest[]) => {
    setIsThinking(true);

    try {
      const results = await confirmToolCalls(toolCalls);

      // 显示执行结果（使用友好的错误消息）
      const resultMessages = results.map(r => {
        if (r.result.success) {
          return `✅ ${r.toolId}: 执行成功`;
        } else {
          // 优先使用 userMessage（友好消息），其次是 message（技术消息）
          const errorMsg = r.result.error?.userMessage || r.result.error?.message || '执行失败';
          const suggestion = r.result.error?.suggestion;
          return suggestion
            ? `❌ ${r.toolId}: ${errorMsg}\n   💡 ${suggestion}`
            : `❌ ${r.toolId}: ${errorMsg}`;
        }
      }).join('\n');

      addMessage({
        role: 'assistant',
        content: `工具执行完成：\n${resultMessages}`,
        status: 'complete',
      });

      // 处理最后一个成功工具的 UI 建议
      for (let i = results.length - 1; i >= 0; i--) {
        const { result } = results[i];
        if (result.success && result.uiSuggestion) {
          handleUISpec({
            componentId: result.uiSuggestion.componentId,
            props: result.uiSuggestion.props,
            target: 'canvas',
          });
          break;
        }
      }

    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        status: 'error',
      });
    } finally {
      setIsThinking(false);
    }
  }, [addMessage, handleUISpec]);

  // 触发快捷操作
  const triggerQuickAction = React.useCallback((action: QuickAction) => {
    if (panelState === 'collapsed') {
      setPanelState('expanded');
    }

    // 如果有 prompt，直接发送
    if (action.prompt) {
      sendMessage(action.prompt);
    } else {
      // 否则填入输入框
      setInputValue(action.label);
    }
  }, [panelState, sendMessage]);

  // 在 Canvas 上投射表单
  const projectFormToCanvas = React.useCallback((
    formId: string,
    options?: {
      initialData?: Record<string, unknown>;
      operationMode?: FormOperationMode;
    }
  ) => {
    setCanvasForm({
      formId,
      initialData: options?.initialData,
      operationMode: options?.operationMode || 'create',
    });

    if (panelState === 'collapsed') {
      setPanelState('expanded');
    }
  }, [panelState]);

  // 关闭 Canvas 上的表单
  const closeCanvasForm = React.useCallback(() => {
    setCanvasForm(null);
  }, []);

  // 注册全局快捷键 ⌘K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        togglePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePanel]);

  const value = React.useMemo<AiContextValue>(() => ({
    panelState,
    setPanelState,
    togglePanel,
    canvasShifted,
    messages,
    addMessage,
    updateLastMessage,
    clearMessages,
    inputValue,
    setInputValue,
    isThinking,
    setIsThinking,
    currentTaskList,
    activeCapability,
    quickActions,
    triggerQuickAction,
    sendMessage,
    confirmTools,
    pageContext,
    availableForms,
    matchFormByIntent,
    projectFormToCanvas,
    closeCanvasForm,
    canvasForm,
    handleUISpec,
  }), [
    panelState,
    togglePanel,
    canvasShifted,
    messages,
    addMessage,
    updateLastMessage,
    clearMessages,
    inputValue,
    isThinking,
    currentTaskList,
    activeCapability,
    quickActions,
    triggerQuickAction,
    sendMessage,
    confirmTools,
    pageContext,
    availableForms,
    matchFormByIntent,
    projectFormToCanvas,
    closeCanvasForm,
    canvasForm,
    handleUISpec,
  ]);

  return (
    <AiContext.Provider value={value}>
      {children}
    </AiContext.Provider>
  );
}
