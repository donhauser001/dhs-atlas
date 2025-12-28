'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, UserPlus, Flame, Zap, Clock, Coffee, Mail, Pause, Check, X, ChevronDown, PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Task, TaskPriority } from '@/api/tasks';
import { specificationApi, Specification, formatSpecification } from '@/api/specifications';
import { SpecificationModal } from './specification-modal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// 优先级配置 - 带图标
const priorityConfig: Record<string, {
  label: string;
  bgColor: string;
  textColor: string;
  icon: React.ReactNode;
}> = {
  urgent: {
    label: '十万火急',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: <Flame className="h-3 w-3" />
  },
  high: {
    label: '尽快完成',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    icon: <Zap className="h-3 w-3" />
  },
  medium: {
    label: '正常进行',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: <Clock className="h-3 w-3" />
  },
  low: {
    label: '不太着急',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-700',
    icon: <Coffee className="h-3 w-3" />
  },
  waiting: {
    label: '等待反馈',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: <Mail className="h-3 w-3" />
  },
  'on-hold': {
    label: '暂时搁置',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    icon: <Pause className="h-3 w-3" />
  },
  completed: {
    label: '完工大吉',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: <Check className="h-3 w-3" />
  },
  removed: {
    label: '损稿',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-400',
    icon: <X className="h-3 w-3" />
  },
};

// 获取进度颜色 - 使用 Tailwind 调色板颜色
function getProgressColor(progress: number): string {
  if (progress >= 100) return 'oklch(0.723 0.219 149.579)'; // green-500
  if (progress >= 75) return 'oklch(0.623 0.214 259.815)';  // blue-500
  if (progress >= 50) return 'oklch(0.795 0.184 86.047)';   // yellow-500
  return 'oklch(0.705 0.191 41.116)';                        // orange-500
}

// 获取截止日期显示文本
function getDueDateText(dueDate: string): string {
  const date = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '已逾期';
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

interface TaskListProps {
  tasks: Task[];
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
  onAssignDesigners: (task: Task) => void;
  onPriorityChange: (task: Task, priority: TaskPriority) => void;
  onProcessStepChange: (task: Task, stepId: string) => void;
  onSpecificationChange?: (task: Task, specId: string | null) => void;
}

export function TaskList({
  tasks,
  onAddTask,
  onTaskClick,
  onAssignDesigners,
  onPriorityChange,
  onProcessStepChange,
  onSpecificationChange,
}: TaskListProps) {
  const _totalAmount = tasks.reduce((sum, task) => sum + (task.subtotal || 0), 0);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<Specification | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSpec, setDeletingSpec] = useState<Specification | null>(null);

  // 获取规格列表
  const fetchSpecifications = async () => {
    try {
      const response = await specificationApi.getAll({ limit: 100 });
      if (response.success) {
        setSpecifications(response.data);
      }
    } catch {
      console.error('获取规格列表失败:', error);
    }
  };

  useEffect(() => {
    fetchSpecifications();
  }, []);

  // 创建/编辑规格成功后刷新列表
  const handleSpecificationSuccess = () => {
    fetchSpecifications();
    setEditingSpec(null);
  };

  // 打开编辑规格模态窗
  const handleEditSpec = (e: React.MouseEvent, spec: Specification) => {
    e.stopPropagation();
    setEditingSpec(spec);
    setSpecModalOpen(true);
  };

  // 打开删除确认对话框
  const handleDeleteSpec = (e: React.MouseEvent, spec: Specification) => {
    e.stopPropagation();
    setDeletingSpec(spec);
    setDeleteDialogOpen(true);
  };

  // 确认删除规格
  const confirmDeleteSpec = async () => {
    if (!deletingSpec) return;
    try {
      await specificationApi.delete(deletingSpec._id);
      toast.success('规格删除成功');
      fetchSpecifications();
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingSpec(null);
    }
  };

  // 打开创建规格模态窗
  const handleCreateSpec = () => {
    setEditingSpec(null);
    setSpecModalOpen(true);
  };

  return (
    <>
      <Card>
        <Tabs defaultValue="tasks" className="w-full">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <TabsList>
              <TabsTrigger value="tasks">任务列表</TabsTrigger>
              <TabsTrigger value="proposals">提案列表</TabsTrigger>
              <TabsTrigger value="deliverables">交付文件</TabsTrigger>
            </TabsList>
            <Button onClick={onAddTask} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              添加任务
            </Button>
          </div>
          <CardContent className="pt-2">
            <TabsContent value="tasks" className="mt-0">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无任务，点击上方按钮添加
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30%]">任务名称</TableHead>
                        <TableHead className="w-[12%]">规格</TableHead>
                        <TableHead className="w-[12%]">紧急度</TableHead>
                        <TableHead className="w-[8%]">数量</TableHead>
                        <TableHead className="w-[25%]">设计师</TableHead>
                        <TableHead className="w-[10%]">金额</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => {
                        const progress = task.currentProcessStep?.progressRatio || 0;
                        const progressColor = getProgressColor(progress);
                        const priority = priorityConfig[task.priority] || priorityConfig.medium;
                        const hasMainDesigners = task.mainDesignerNames && task.mainDesignerNames.length > 0;
                        const hasAssistantDesigners = task.assistantDesignerNames && task.assistantDesignerNames.length > 0;
                        const hasAnyDesigners = hasMainDesigners || hasAssistantDesigners;

                        // 查找当前规格
                        const currentSpec = task.specificationId
                          ? specifications.find(s => s._id === task.specificationId)
                          : null;

                        return (
                          <TableRow
                            key={task._id}
                            className="group [&>td]:py-4"
                            style={{
                              backgroundImage: progress > 0 ? `linear-gradient(to right, ${progressColor} ${progress}%, transparent ${progress}%)` : undefined,
                              backgroundSize: '100% 3px',
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'bottom left',
                            }}
                          >
                            {/* 任务名称 + 流程 */}
                            <TableCell>
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  className="text-primary hover:underline font-medium shrink-0"
                                  onClick={() => onTaskClick(task)}
                                >
                                  {task.taskName}
                                </button>

                                {task.processSteps && task.processSteps.length > 0 ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="inline-flex items-center rounded overflow-hidden border border-orange-200 text-xs cursor-pointer shrink-0">
                                        <span className="px-2 py-0.5 font-medium bg-orange-50 text-orange-700 border-r border-orange-200">
                                          {task.currentProcessStep?.name || '选择流程'}
                                        </span>
                                        {task.dueDate && (
                                          <span className="px-2 py-0.5 font-semibold text-white bg-orange-500">
                                            {getDueDateText(task.dueDate)}
                                          </span>
                                        )}
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      {task.processSteps.map((step) => (
                                        <DropdownMenuItem
                                          key={step.id}
                                          onClick={() => onProcessStepChange(task, step.id)}
                                        >
                                          <span>{step.name}</span>
                                          <span className="ml-2 text-muted-foreground">({step.progressRatio}%)</span>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : (
                                  <span className="inline-flex px-2 py-0.5 text-xs rounded border border-gray-200 bg-gray-50 text-gray-500 shrink-0">
                                    无流程
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* 规格 */}
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer whitespace-nowrap">
                                    {currentSpec ? (
                                      <span>{task.specificationName || formatSpecification(currentSpec)}</span>
                                    ) : task.specificationName ? (
                                      <span>{task.specificationName}</span>
                                    ) : (
                                      <span className="text-muted-foreground">选择规格</span>
                                    )}
                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-80">
                                  {/* 添加新规格 */}
                                  <DropdownMenuItem onClick={handleCreateSpec}>
                                    <PlusCircle className="h-4 w-4 mr-2 text-primary" />
                                    <span className="text-primary">添加新规格</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />

                                  {/* 清除规格 */}
                                  <DropdownMenuItem onClick={() => onSpecificationChange?.(task, null)}>
                                    <span className="text-muted-foreground">清除规格</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />

                                  {/* 规格列表 */}
                                  {specifications.length === 0 ? (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                      暂无规格，请先添加
                                    </div>
                                  ) : (
                                    specifications.map((spec) => (
                                      <DropdownMenuItem
                                        key={spec._id}
                                        className="flex items-center justify-between group/item"
                                        onClick={() => onSpecificationChange?.(task, spec._id)}
                                      >
                                        <div className="flex-1 min-w-0">
                                          <span className="font-medium">{spec.name}</span>
                                          <span className="ml-2 text-muted-foreground text-xs">
                                            {formatSpecification(spec)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <button
                                                  className="p-1 rounded hover:bg-primary/10 text-primary"
                                                  onClick={(e) => handleEditSpec(e, spec)}
                                                >
                                                  <Pencil className="h-3 w-3" />
                                                </button>
                                              </TooltipTrigger>
                                              <TooltipContent>编辑</TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <button
                                                  className="p-1 rounded hover:bg-destructive/10 text-destructive"
                                                  onClick={(e) => handleDeleteSpec(e, spec)}
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </button>
                                              </TooltipTrigger>
                                              <TooltipContent>删除</TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      </DropdownMenuItem>
                                    ))
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>

                            {/* 紧急度 - 带图标 */}
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className={cn(
                                    "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded cursor-pointer whitespace-nowrap",
                                    priority.bgColor,
                                    priority.textColor
                                  )}>
                                    {priority.icon}
                                    <span>{priority.label}</span>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {Object.entries(priorityConfig).map(([key, config]) => (
                                    <DropdownMenuItem
                                      key={key}
                                      onClick={() => onPriorityChange(task, key as TaskPriority)}
                                    >
                                      <span className={cn(
                                        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded",
                                        config.bgColor,
                                        config.textColor
                                      )}>
                                        {config.icon}
                                        <span>{config.label}</span>
                                      </span>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>

                            {/* 数量 */}
                            <TableCell>
                              <span className="text-sm">{task.quantity}{task.unit}</span>
                            </TableCell>

                            {/* 设计师 */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {hasMainDesigners && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1">
                                          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                                          <span className="text-sm">{task.mainDesignerNames!.join('、')}</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>主创设计师</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {hasAssistantDesigners && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1">
                                          <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                                          <span className="text-sm text-muted-foreground">{task.assistantDesignerNames!.join('、')}</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>助理设计师</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}

                                {hasAnyDesigners ? (
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary/80 ml-1"
                                    onClick={() => onAssignDesigners(task)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => onAssignDesigners(task)}
                                        >
                                          <UserPlus className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>分配设计师</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>

                            {/* 金额 */}
                            <TableCell>
                              <span className="text-sm">¥{task.subtotal?.toLocaleString() || 0}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="proposals" className="mt-0">
              <div className="text-center py-12 text-muted-foreground">
                提案列表功能开发中...
              </div>
            </TabsContent>

            <TabsContent value="deliverables" className="mt-0">
              <div className="text-center py-12 text-muted-foreground">
                交付文件功能开发中...
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* 创建/编辑规格模态窗 */}
      <SpecificationModal
        open={specModalOpen}
        onOpenChange={setSpecModalOpen}
        editingSpec={editingSpec}
        onSuccess={handleSpecificationSuccess}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除规格「{deletingSpec?.name}」吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSpec} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
