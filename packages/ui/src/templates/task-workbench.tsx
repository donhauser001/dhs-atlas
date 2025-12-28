'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { EmptyState } from '../states/empty-state';
import { LoadingState } from '../states/loading-state';
import { ErrorState } from '../states/error-state';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Play,
  RotateCcw,
  FileText,
  MessageSquare,
  Wrench,
  Terminal,
  Loader2,
} from 'lucide-react';

// ============ Types ============

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

// Task detail - Evidence (what data supports this task)
export interface TaskEvidence {
  id: string;
  type: string;
  title: string;
  content: string;
  source?: string;
}

// Task detail - Explanation (why this needs attention)
export interface TaskExplanation {
  summary: string;
  details?: string;
  confidence?: number;
}

// Task detail - Suggested fixes
export interface TaskFix {
  id: string;
  title: string;
  description: string;
  action: () => void;
  isRecommended?: boolean;
}

// Extended Task with detail fields
export interface TaskWithDetail extends Task {
  evidence?: TaskEvidence[];
  explanation?: TaskExplanation;
  suggestedFixes?: TaskFix[];
}

export interface TaskLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export interface TaskWorkbenchAction {
  key: string;
  label: string;
  onClick: (task: Task) => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline';
  disabled?: (task: Task) => boolean;
  hidden?: (task: Task) => boolean;
}

// Action Schema for AI
export interface TaskWorkbenchActionSchema {
  list: {
    input: { status?: TaskStatus };
    output: { tasks: Task[] };
  };
  get: {
    input: { id: string };
    output: TaskWithDetail;
  };
  run: {
    input: { id: string };
    output: { success: boolean; message: string };
  };
  retry: {
    input: { id: string };
    output: { success: boolean; message: string };
  };
  approve: {
    input: { id: string };
    output: { success: boolean };
  };
  reject: {
    input: { id: string; reason: string };
    output: { success: boolean };
  };
  applyFix: {
    input: { taskId: string; fixId: string };
    output: { success: boolean };
  };
}

// Run log configuration with SSE support
export interface RunLogConfig {
  subscribe?: (taskId: string, onMessage: (entry: TaskLogEntry) => void) => () => void;
  initialEntries?: TaskLogEntry[];
}

export interface TaskWorkbenchConfig {
  title: string;
  description?: string;
  actions?: TaskWorkbenchAction[];
  showLog?: boolean;
  runLog?: RunLogConfig;
}

export interface TaskWorkbenchProps {
  config: TaskWorkbenchConfig;
  tasks: Task[];
  selectedTask?: TaskWithDetail | null;
  log?: TaskLogEntry[];
  isLoading?: boolean;
  isRunning?: boolean;
  error?: Error | null;
  onSelectTask?: (task: Task) => void;
  onRetry?: () => void;
}

// ============ Helper Components ============

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const statusConfig = {
    pending: {
      icon: Clock,
      label: '待处理',
      className: 'bg-muted text-muted-foreground',
    },
    in_progress: {
      icon: Play,
      label: '进行中',
      className: 'bg-blue-500/10 text-blue-500',
    },
    completed: {
      icon: CheckCircle2,
      label: '已完成',
      className: 'bg-green-500/10 text-green-500',
    },
    failed: {
      icon: AlertCircle,
      label: '失败',
      className: 'bg-destructive/10 text-destructive',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        config.className
      )}
      data-status={status}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' }) {
  const config = {
    low: { label: '低', variant: 'secondary' as const },
    medium: { label: '中', variant: 'default' as const },
    high: { label: '高', variant: 'destructive' as const },
  };

  return <Badge variant={config[priority].variant}>{config[priority].label}</Badge>;
}

function TaskLogViewer({
  log,
  isRunning,
}: {
  log: TaskLogEntry[];
  isRunning?: boolean;
}) {
  const levelConfig = {
    info: { className: 'text-muted-foreground' },
    warning: { className: 'text-yellow-500' },
    error: { className: 'text-destructive' },
    success: { className: 'text-green-500' },
  };

  const containerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new log entries arrive
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [log.length]);

  return (
    <div
      ref={containerRef}
      className="font-mono text-xs space-y-1 max-h-64 overflow-y-auto bg-muted/50 rounded-md p-3"
    >
      {log.length === 0 && !isRunning ? (
        <p className="text-muted-foreground">暂无日志</p>
      ) : (
        <>
          {log.map((entry) => (
            <div
              key={entry.id}
              className={cn('flex gap-2', levelConfig[entry.level].className)}
              data-log-id={entry.id}
            >
              <span className="text-muted-foreground shrink-0">
                {new Date(entry.timestamp).toLocaleTimeString('zh-CN')}
              </span>
              <span className="shrink-0">[{entry.level.toUpperCase()}]</span>
              <span className="break-all">{entry.message}</span>
            </div>
          ))}
          {isRunning && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>执行中...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EvidenceSection({ evidence }: { evidence: TaskEvidence[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium flex items-center gap-2 text-sm">
        <FileText className="h-4 w-4" />
        证据依据
      </h3>
      {evidence.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无证据</p>
      ) : (
        <div className="space-y-2">
          {evidence.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-muted/50 rounded-md text-sm"
              data-evidence-id={item.id}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{item.type}</Badge>
                <span className="font-medium">{item.title}</span>
              </div>
              <p className="text-muted-foreground">{item.content}</p>
              {item.source && (
                <p className="text-xs text-muted-foreground mt-1">
                  来源: {item.source}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExplanationSection({ explanation }: { explanation: TaskExplanation }) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium flex items-center gap-2 text-sm">
        <MessageSquare className="h-4 w-4" />
        问题说明
      </h3>
      <div className="p-3 bg-muted/50 rounded-md text-sm">
        <p className="font-medium">{explanation.summary}</p>
        {explanation.details && (
          <p className="text-muted-foreground mt-2">{explanation.details}</p>
        )}
        {explanation.confidence !== undefined && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">置信度:</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-32">
              <div
                className="h-full bg-primary"
                style={{ width: `${explanation.confidence}%` }}
              />
            </div>
            <span className="text-xs font-medium">{explanation.confidence}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FixesSection({ fixes }: { fixes: TaskFix[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium flex items-center gap-2 text-sm">
        <Wrench className="h-4 w-4" />
        建议修复
      </h3>
      {fixes.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无建议</p>
      ) : (
        <div className="space-y-2">
          {fixes.map((fix) => (
            <div
              key={fix.id}
              className={cn(
                'p-3 rounded-md border flex items-start justify-between gap-3',
                fix.isRecommended && 'border-primary bg-primary/5'
              )}
              data-fix-id={fix.id}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{fix.title}</span>
                  {fix.isRecommended && (
                    <Badge variant="default">推荐</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {fix.description}
                </p>
              </div>
              <Button
                variant={fix.isRecommended ? 'default' : 'outline'}
                size="sm"
                onClick={fix.action}
                data-action={`apply-fix-${fix.id}`}
              >
                应用
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Main Component ============

export function TaskWorkbench({
  config,
  tasks,
  selectedTask,
  log = [],
  isLoading,
  isRunning,
  error,
  onSelectTask,
  onRetry,
}: TaskWorkbenchProps) {
  // SSE subscription for real-time logs
  const [liveLog, setLiveLog] = React.useState<TaskLogEntry[]>(log);

  React.useEffect(() => {
    setLiveLog(log);
  }, [log]);

  React.useEffect(() => {
    if (!selectedTask || !config.runLog?.subscribe) return;

    const unsubscribe = config.runLog.subscribe(selectedTask.id, (entry) => {
      setLiveLog((prev) => [...prev, entry]);
    });

    return unsubscribe;
  }, [selectedTask?.id, config.runLog]);

  // Error state
  if (error) {
    return (
      <ErrorState title="加载失败" message={error.message} retry={onRetry} />
    );
  }

  // Loading state
  if (isLoading) {
    return <LoadingState message="加载任务..." />;
  }

  const visibleActions = config.actions?.filter(
    (action) => !selectedTask || !action.hidden?.(selectedTask)
  );

  return (
    <div className="space-y-4" data-testid="task-workbench">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{config.title}</h1>
          {config.description && (
            <p className="text-muted-foreground">{config.description}</p>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task list (left panel) */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="font-medium">任务列表</h2>
              <p className="text-sm text-muted-foreground">
                共 {tasks.length} 个任务
              </p>
            </div>
            {tasks.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="暂无任务"
                  description="没有待处理的任务"
                  icon="inbox"
                />
              </div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onSelectTask?.(task)}
                    className={cn(
                      'w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between',
                      selectedTask?.id === task.id && 'bg-muted'
                    )}
                    data-task-id={task.id}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {task.title}
                        </p>
                        {task.priority && (
                          <PriorityBadge priority={task.priority} />
                        )}
                      </div>
                      <TaskStatusBadge status={task.status} />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Task detail (right panel) */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedTask ? (
            <div className="rounded-lg border p-8">
              <EmptyState
                title="选择一个任务"
                description="从左侧列表选择一个任务查看详情"
                icon="folder"
              />
            </div>
          ) : (
            <>
              {/* Task info and actions */}
              <div className="rounded-lg border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-semibold">
                        {selectedTask.title}
                      </h2>
                      {selectedTask.priority && (
                        <PriorityBadge priority={selectedTask.priority} />
                      )}
                    </div>
                    {selectedTask.description && (
                      <p className="text-muted-foreground">
                        {selectedTask.description}
                      </p>
                    )}
                  </div>
                  <TaskStatusBadge status={selectedTask.status} />
                </div>

                {/* Actions */}
                {visibleActions && visibleActions.length > 0 && (
                  <div className="flex gap-2">
                    {visibleActions.map((action) => (
                      <Button
                        key={action.key}
                        variant={action.variant ?? 'default'}
                        onClick={() => action.onClick(selectedTask)}
                        disabled={
                          action.disabled?.(selectedTask) || isRunning
                        }
                        data-action={action.key}
                      >
                        {action.icon && (
                          <action.icon className="h-4 w-4 mr-2" />
                        )}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Evidence */}
              {selectedTask.evidence && selectedTask.evidence.length > 0 && (
                <div className="rounded-lg border p-4">
                  <EvidenceSection evidence={selectedTask.evidence} />
                </div>
              )}

              {/* Explanation */}
              {selectedTask.explanation && (
                <div className="rounded-lg border p-4">
                  <ExplanationSection explanation={selectedTask.explanation} />
                </div>
              )}

              {/* Suggested fixes */}
              {selectedTask.suggestedFixes &&
                selectedTask.suggestedFixes.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <FixesSection fixes={selectedTask.suggestedFixes} />
                  </div>
                )}

              {/* Log viewer */}
              {config.showLog && (
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2 text-sm">
                    <Terminal className="h-4 w-4" />
                    执行日志
                  </h3>
                  <TaskLogViewer log={liveLog} isRunning={isRunning} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
