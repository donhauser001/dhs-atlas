/**
 * 任务管理器
 * 
 * V2 架构核心组件：管理地图执行时的任务列表
 * 
 * 功能：
 * 1. 从地图生成 TaskList
 * 2. 更新任务状态
 * 3. 生成任务进度上下文（注入给 AI）
 */

import { v4 as uuidv4 } from 'uuid';
import type { TaskList, TaskItem, TaskStatus } from './types';
import type { IAiMapStep } from '../../models/AiMap';

/**
 * 从地图步骤创建任务列表
 */
export function createTaskListFromMap(
    mapId: string,
    mapName: string,
    steps: IAiMapStep[]
): TaskList {
    const now = new Date();
    
    const tasks: TaskItem[] = steps.map((step, index) => ({
        stepNumber: index + 1,
        name: step.name || `步骤 ${index + 1}`,
        description: step.action,
        toolId: step.toolId,
        status: 'pending' as TaskStatus,
    }));

    return {
        id: uuidv4(),
        mapId,
        mapName,
        tasks,
        currentStep: 0,
        totalSteps: steps.length,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * 开始执行任务列表
 */
export function startTaskList(taskList: TaskList): TaskList {
    return {
        ...taskList,
        currentStep: 1,
        status: 'running',
        updatedAt: new Date(),
        tasks: taskList.tasks.map((task, index) => 
            index === 0 
                ? { ...task, status: 'in_progress' as TaskStatus, startTime: new Date() }
                : task
        ),
    };
}

/**
 * 标记当前步骤完成，准备下一步
 */
export function completeCurrentStep(
    taskList: TaskList,
    resultSummary?: string
): TaskList {
    const currentIndex = taskList.currentStep - 1;
    if (currentIndex < 0 || currentIndex >= taskList.tasks.length) {
        return taskList;
    }

    const now = new Date();
    const updatedTasks = taskList.tasks.map((task, index) => {
        if (index === currentIndex) {
            // 标记当前步骤为完成
            return {
                ...task,
                status: 'completed' as TaskStatus,
                resultSummary,
                endTime: now,
            };
        }
        if (index === currentIndex + 1) {
            // 标记下一步为进行中
            return {
                ...task,
                status: 'in_progress' as TaskStatus,
                startTime: now,
            };
        }
        return task;
    });

    const nextStep = taskList.currentStep + 1;
    const isCompleted = nextStep > taskList.totalSteps;

    return {
        ...taskList,
        tasks: updatedTasks,
        currentStep: isCompleted ? taskList.totalSteps : nextStep,
        status: isCompleted ? 'completed' : 'running',
        updatedAt: now,
    };
}

/**
 * 标记当前步骤失败
 */
export function failCurrentStep(
    taskList: TaskList,
    error: string
): TaskList {
    const currentIndex = taskList.currentStep - 1;
    if (currentIndex < 0 || currentIndex >= taskList.tasks.length) {
        return taskList;
    }

    const now = new Date();
    const updatedTasks = taskList.tasks.map((task, index) => {
        if (index === currentIndex) {
            return {
                ...task,
                status: 'failed' as TaskStatus,
                error,
                endTime: now,
            };
        }
        return task;
    });

    return {
        ...taskList,
        tasks: updatedTasks,
        status: 'failed',
        updatedAt: now,
    };
}

/**
 * 生成任务进度提示（注入给 AI 的上下文）
 */
export function generateTaskProgressPrompt(taskList: TaskList): string {
    const statusIcon = {
        pending: '○',
        in_progress: '●',
        completed: '✅',
        failed: '❌',
    };

    const lines: string[] = [
        `📋 任务进度：${taskList.mapName}（${taskList.currentStep}/${taskList.totalSteps}）`,
        '',
    ];

    for (const task of taskList.tasks) {
        const icon = statusIcon[task.status];
        let line = `${icon} 步骤 ${task.stepNumber}: ${task.name}`;
        
        if (task.status === 'completed' && task.resultSummary) {
            line += `\n   → ${task.resultSummary}`;
        }
        if (task.status === 'failed' && task.error) {
            line += `\n   → 错误: ${task.error}`;
        }
        if (task.status === 'in_progress') {
            line += ' [执行中...]';
        }
        
        lines.push(line);
    }

    return lines.join('\n');
}

/**
 * 获取当前步骤信息
 */
export function getCurrentStep(taskList: TaskList): TaskItem | null {
    const currentIndex = taskList.currentStep - 1;
    if (currentIndex < 0 || currentIndex >= taskList.tasks.length) {
        return null;
    }
    return taskList.tasks[currentIndex];
}

/**
 * 检查任务是否全部完成
 */
export function isTaskListCompleted(taskList: TaskList): boolean {
    return taskList.status === 'completed';
}

/**
 * 检查任务是否失败
 */
export function isTaskListFailed(taskList: TaskList): boolean {
    return taskList.status === 'failed';
}

/**
 * 计算完成百分比
 */
export function getCompletionPercentage(taskList: TaskList): number {
    const completedCount = taskList.tasks.filter(t => t.status === 'completed').length;
    return Math.round((completedCount / taskList.totalSteps) * 100);
}

