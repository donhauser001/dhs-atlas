'use client';

/**
 * Task Panel - 任务进度面板
 * 
 * V2 架构核心组件：展示地图执行时的任务进度
 * 
 * 功能：
 * - 显示任务名称和总步骤数
 * - 进度条展示 (0%/33%/66%/100%)
 * - 每步状态: pending(○) / in_progress(●) / completed(✓) / failed(✗)
 * - 步骤完成时显示 resultSummary
 * - 支持展开/折叠
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CheckCircle2,
  Circle,
  CircleDot,
  XCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import type { TaskList, TaskItem, TaskStatus } from '@/api/agent';

// ============ Status Icon ============

interface StatusIconProps {
  status: TaskStatus;
  className?: string;
}

function StatusIcon({ status, className }: StatusIconProps) {
  switch (status) {
    case 'pending':
      return <Circle className={cn('h-4 w-4 text-muted-foreground', className)} />;
    case 'in_progress':
      return <Loader2 className={cn('h-4 w-4 text-primary animate-spin', className)} />;
    case 'completed':
      return <CheckCircle2 className={cn('h-4 w-4 text-green-500', className)} />;
    case 'failed':
      return <XCircle className={cn('h-4 w-4 text-destructive', className)} />;
    default:
      return <Circle className={cn('h-4 w-4', className)} />;
  }
}

// ============ Task Item Row ============

interface TaskItemRowProps {
  task: TaskItem;
  isLast: boolean;
}

function TaskItemRow({ task, isLast }: TaskItemRowProps) {
  const statusLabels: Record<TaskStatus, string> = {
    pending: '等待中',
    in_progress: '执行中...',
    completed: '已完成',
    failed: '失败',
  };

  return (
    <div className={cn('relative pl-6', !isLast && 'pb-4')}>
      {/* 连接线 */}
      {!isLast && (
        <div className="absolute left-[7px] top-5 w-0.5 h-full bg-border" />
      )}
      
      {/* 状态图标 */}
      <div className="absolute left-0 top-0.5">
        <StatusIcon status={task.status} />
      </div>

      {/* 内容 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={cn(
            'text-sm font-medium',
            task.status === 'completed' && 'text-green-600 dark:text-green-400',
            task.status === 'failed' && 'text-destructive',
            task.status === 'pending' && 'text-muted-foreground',
          )}>
            {task.stepNumber}. {task.name}
          </span>
          <span className={cn(
            'text-xs',
            task.status === 'in_progress' && 'text-primary',
            task.status === 'completed' && 'text-green-600 dark:text-green-400',
            task.status === 'failed' && 'text-destructive',
            task.status === 'pending' && 'text-muted-foreground',
          )}>
            {statusLabels[task.status]}
          </span>
        </div>

        {/* 结果摘要或错误信息 */}
        {task.status === 'completed' && task.resultSummary && (
          <p className="text-xs text-muted-foreground pl-2 border-l-2 border-green-500/30">
            {task.resultSummary}
          </p>
        )}
        {task.status === 'failed' && task.error && (
          <p className="text-xs text-destructive pl-2 border-l-2 border-destructive/30">
            {task.error}
          </p>
        )}
      </div>
    </div>
  );
}

// ============ Overall Status Badge ============

interface OverallStatusBadgeProps {
  status: TaskList['status'];
}

function OverallStatusBadge({ status }: OverallStatusBadgeProps) {
  const configs = {
    pending: {
      label: '准备中',
      className: 'bg-muted text-muted-foreground',
    },
    running: {
      label: '执行中',
      className: 'bg-primary/10 text-primary',
    },
    completed: {
      label: '已完成',
      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    failed: {
      label: '执行出错',
      className: 'bg-destructive/10 text-destructive',
    },
  };

  const config = configs[status];

  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-medium',
      config.className
    )}>
      {config.label}
    </span>
  );
}

// ============ Main TaskPanel ============

interface TaskPanelProps {
  taskList: TaskList;
  className?: string;
  defaultExpanded?: boolean;
}

export function TaskPanel({ taskList, className, defaultExpanded = true }: TaskPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  // 计算进度百分比
  const completedCount = taskList.tasks.filter(t => t.status === 'completed').length;
  const progressPercentage = Math.round((completedCount / taskList.totalSteps) * 100);

  // 状态图标
  const StatusHeaderIcon = taskList.status === 'completed' 
    ? CheckCircle2 
    : taskList.status === 'failed'
      ? XCircle
      : taskList.status === 'running'
        ? CircleDot
        : ClipboardList;

  return (
    <div className={cn(
      'rounded-lg border bg-card text-card-foreground',
      taskList.status === 'completed' && 'border-green-500/30',
      taskList.status === 'failed' && 'border-destructive/30',
      taskList.status === 'running' && 'border-primary/30',
      className
    )}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2">
              <StatusHeaderIcon className={cn(
                'h-4 w-4',
                taskList.status === 'completed' && 'text-green-500',
                taskList.status === 'failed' && 'text-destructive',
                taskList.status === 'running' && 'text-primary',
              )} />
              <span className="font-medium text-sm">{taskList.mapName}</span>
              <OverallStatusBadge status={taskList.status} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {completedCount}/{taskList.totalSteps} 步
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <Progress value={progressPercentage} className="h-1.5" />
        </div>

        {/* Task List */}
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2">
            {taskList.tasks.map((task, index) => (
              <TaskItemRow
                key={task.stepNumber}
                task={task}
                isLast={index === taskList.tasks.length - 1}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default TaskPanel;

