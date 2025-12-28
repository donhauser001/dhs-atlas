'use client';

/**
 * AI Panel - AI 原生架构的对话面板
 * 
 * 使用新的 Agent API，所有 AI 决策由后端完成。
 */

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { useAi, type AiMessage } from './ai-context';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Send,
  Loader2,
  ChevronLeft,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { ToolCallRequest, PredictedAction } from '@/api/agent';

// ============ Constants ============

export const AI_PANEL_COLLAPSED_WIDTH = 48;
export const AI_PANEL_EXPANDED_WIDTH = 680;
export const TRANSITION_DURATION = 300;

// ============ Message Bubble ============

interface MessageBubbleProps {
  message: AiMessage;
  onConfirmTools?: (toolCalls: ToolCallRequest[]) => void;
  onPredictedAction?: (action: PredictedAction) => void;
}

function MessageBubble({ message, onConfirmTools, onPredictedAction }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const hasPendingTools = message.pendingToolCalls && message.pendingToolCalls.length > 0;
  const hasPredictedActions = message.predictedActions && message.predictedActions.length > 0;

  return (
    <div
      className={cn(
        'flex flex-col w-full gap-2',
        isUser ? 'items-end' : 'items-start'
      )}
    >
      {/* 主消息气泡 */}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md',
          isStreaming && 'animate-pulse'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_table]:w-full [&_table]:text-xs [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_tr]:border-b">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse rounded-sm" />
        )}
      </div>

      {/* 待确认的工具调用 */}
      {hasPendingTools && onConfirmTools && (
        <div className="max-w-[85%] p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
            需要确认执行以下操作：
          </p>
          <div className="space-y-1">
            {message.pendingToolCalls?.map((call, idx) => (
              <div key={idx} className="text-xs text-amber-600 dark:text-amber-400">
                • {call.toolId}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs"
              onClick={() => onConfirmTools(message.pendingToolCalls!)}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              确认执行
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
            >
              <XCircle className="h-3 w-3 mr-1" />
              取消
            </Button>
          </div>
        </div>
      )}

      {/* 预判指令 */}
      {hasPredictedActions && onPredictedAction && (
        <div className="max-w-[85%] space-y-1">
          <p className="text-[10px] text-muted-foreground">下一步你可能想：</p>
          <div className="flex flex-wrap gap-1">
            {message.predictedActions?.slice(0, 4).map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant="outline"
                className="h-6 text-xs px-2"
                onClick={() => onPredictedAction(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Status Badge ============

function AiStatusBadge({ isThinking }: { isThinking: boolean }) {
  if (isThinking) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-amber-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        思考中
      </span>
    );
  }

  return (
    <span className="text-[10px] text-green-600">
      就绪
    </span>
  );
}

// ============ Quick Actions Bar ============

function QuickActionsBar() {
  const { quickActions, triggerQuickAction } = useAi();

  if (quickActions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 px-4 py-2 border-b bg-muted/30">
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => triggerQuickAction(action)}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

// ============ Collapsed Panel ============

function CollapsedPanel() {
  const { togglePanel } = useAi();

  return (
    <div
      className="h-full flex flex-col items-center py-4 bg-background border-l"
      style={{ width: AI_PANEL_COLLAPSED_WIDTH }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePanel}
        className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 border border-violet-500/20"
        title="打开 AI 助手 (⌘K)"
      >
        <Sparkles className="h-5 w-5 text-violet-500" />
      </Button>

      <div className="mt-4 flex flex-col items-center">
        <span
          className="text-[10px] text-muted-foreground tracking-wider"
          style={{ writingMode: 'vertical-rl' }}
        >
          AI 助手
        </span>
      </div>

      <div className="mt-auto mb-2">
        <kbd className="text-[9px] text-muted-foreground bg-muted px-1 py-0.5 rounded">
          ⌘K
        </kbd>
      </div>
    </div>
  );
}

// ============ Expanded Panel ============

function ExpandedPanel() {
  const {
    togglePanel,
    messages,
    clearMessages,
    inputValue,
    setInputValue,
    isThinking,
    activeCapability,
    sendMessage,
    confirmTools,
  } = useAi();

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 自动聚焦输入框
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;
    await sendMessage(inputValue.trim());
  };

  // 处理预判指令
  const handlePredictedAction = (action: PredictedAction) => {
    if (action.type === 'template' && action.prompt) {
      setInputValue(action.prompt);
    } else if (action.type === 'question') {
      sendMessage(action.label);
    } else if (action.type === 'execute' && action.requiresConfirmation) {
      // 需要确认的执行类指令
      if (action.toolId) {
        confirmTools([{ toolId: action.toolId, params: action.params || {} }]);
      }
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const ModuleIcon = activeCapability?.icon;
  const headerTitle = activeCapability?.moduleName || 'AI 助手';

  return (
    <div
      className="h-full flex flex-col bg-background border-l"
      style={{ width: AI_PANEL_EXPANDED_WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b bg-gradient-to-r from-violet-500/5 to-purple-500/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            {ModuleIcon ? (
              <ModuleIcon className="h-4 w-4 text-white" />
            ) : (
              <Sparkles className="h-4 w-4 text-white" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight">{headerTitle}</span>
            <AiStatusBadge isThinking={isThinking} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clearMessages}
            title="清空对话"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={togglePanel}
            title="收起面板 (⌘K)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActionsBar />

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4"
        ref={scrollRef as React.RefObject<HTMLDivElement>}
      >
        <div className="py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              <Sparkles className="h-8 w-8 mx-auto mb-3 text-violet-400" />
              <p>你好！我是 AI 助手</p>
              <p className="text-xs mt-1">有什么可以帮助你的吗？</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onConfirmTools={confirmTools}
                onPredictedAction={handlePredictedAction}
              />
            ))
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，或点击上方快捷操作..."
            className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 text-sm rounded-xl border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            rows={1}
            disabled={isThinking}
          />
          <Button
            size="icon"
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            onClick={handleSend}
            disabled={!inputValue.trim() || isThinking}
          >
            {isThinking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          按 Enter 发送，Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}

// ============ Main Panel ============

export function AiPanel() {
  const { panelState } = useAi();

  return (
    <div
      className="h-full transition-all duration-300 ease-in-out flex-shrink-0"
      style={{
        width: panelState === 'expanded' ? AI_PANEL_EXPANDED_WIDTH : AI_PANEL_COLLAPSED_WIDTH
      }}
    >
      {panelState === 'collapsed' ? <CollapsedPanel /> : <ExpandedPanel />}
    </div>
  );
}

export default AiPanel;
