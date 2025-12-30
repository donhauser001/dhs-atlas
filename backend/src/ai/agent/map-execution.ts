/**
 * 地图执行模块
 * 
 * 管理地图执行上下文和步骤提示生成
 */

import type { ToolResult } from '../tools/types';
import type { TaskList } from './types';
import type { IAiMapStep } from '../../models/AiMap';
import {
    createTaskListFromMap,
    startTaskList,
    completeCurrentStep,
    failCurrentStep,
    generateTaskProgressPrompt,
    isTaskListCompleted,
} from './task-manager';

// ============================================================================
// 地图执行上下文
// ============================================================================

interface MapExecutionContext {
    /** 当前任务列表 */
    taskList: TaskList | null;
    /** 当前地图的步骤定义 */
    steps: IAiMapStep[];
    /** 步骤执行结果（按 outputKey 存储） */
    stepOutputs: Record<string, any>;
}

// 会话级的地图执行上下文缓存
const mapExecutionContexts = new Map<string, MapExecutionContext>();

/**
 * 获取或创建地图执行上下文
 */
export function getMapExecutionContext(sessionId: string): MapExecutionContext {
    if (!mapExecutionContexts.has(sessionId)) {
        mapExecutionContexts.set(sessionId, {
            taskList: null,
            steps: [],
            stepOutputs: {},
        });
    }
    return mapExecutionContexts.get(sessionId)!;
}

/**
 * 清除地图执行上下文
 */
export function clearMapExecutionContext(sessionId: string): void {
    mapExecutionContexts.delete(sessionId);
}

// ============================================================================
// 模板变量替换
// ============================================================================

/**
 * 替换模板变量
 * 支持 {{xxx.yyy}} 格式的变量引用
 * 
 * 特殊处理：
 * - 如果变量是数组且访问其属性（如 xxx.name），自动取第一个元素
 * - 如果变量是数组且访问 .length，返回长度
 */
export function replaceTemplateVariables(
    template: string,
    data: Record<string, any>
): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path: string) => {
        const parts = path.split('.');
        let value: any = data;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (value == null) {
                return `{{${path}}}`; // 保持原样
            }

            // 如果当前值是数组
            if (Array.isArray(value)) {
                // 如果访问 .length，返回长度
                if (part === 'length') {
                    value = value.length;
                    continue;
                }
                // 如果访问其他属性，自动取第一个元素
                if (value.length > 0 && typeof value[0] === 'object') {
                    value = value[0][part];
                } else {
                    return `{{${path}}}`; // 保持原样
                }
            } else if (typeof value === 'object') {
                value = value[part];
            } else {
                return `{{${path}}}`; // 保持原样
            }
        }

        // 如果最终值是数组，转为 JSON
        if (Array.isArray(value)) {
            return JSON.stringify(value);
        }

        return value?.toString() || `{{${path}}}`;
    });
}

// ============================================================================
// 结果摘要生成
// ============================================================================

/**
 * 生成结果摘要（用于任务列表展示）
 */
export function generateResultSummary(data: any): string {
    if (!data) return '无数据';

    // 数组类型
    if (Array.isArray(data)) {
        return `返回 ${data.length} 条数据`;
    }

    // 对象类型 - 尝试提取关键信息
    if (typeof data === 'object') {
        if (data.clientName) return `客户: ${data.clientName}`;
        if (data.quotationId || data._id) return `ID: ${data.quotationId || data._id}`;
        if (data.contactCount !== undefined) return `${data.contactCount} 个联系人`;
        if (data.projectCount !== undefined) return `${data.projectCount} 个项目`;
        if (data.services && Array.isArray(data.services)) return `${data.services.length} 个服务`;
        if (data.maps && Array.isArray(data.maps)) {
            return data.maps.length > 0 ? `找到 ${data.maps.length} 个地图` : '未找到地图';
        }
        if (data.message) return data.message.substring(0, 50);
        return '执行成功';
    }

    return String(data).substring(0, 50);
}

// ============================================================================
// 地图步骤提示生成
// ============================================================================

export interface MapStepPromptResult {
    prompt: string | null;
    taskList: TaskList | null;
    /** 地图是否已完成所有步骤 */
    isCompleted?: boolean;
}

/**
 * 生成地图步骤提示（V2 版本）
 * 
 * 功能：
 * 1. map.search 返回地图时，创建 TaskList 并返回第一步提示
 * 2. 步骤执行完成时，更新 TaskList 状态并注入 nextStepPrompt
 * 3. 全部完成时，返回汇总提示
 */
export async function generateMapStepPrompt(
    toolResults: Array<{ toolId: string; result: ToolResult }>,
    sessionId: string
): Promise<MapStepPromptResult> {
    const ctx = getMapExecutionContext(sessionId);

    // 引入 AiMap 模型
    const { default: mongoose } = await import('mongoose');
    const AiMap = mongoose.models.AiMap || (await import('../../models/AiMap')).default;

    // 用于保存最终的 prompt 和 taskList
    let finalPrompt: string | null = null;
    let finalTaskList: TaskList | null = null;

    console.log('[Agent] 🔍 generateMapStepPrompt 处理工具结果:', toolResults.map(r => r.toolId));

    for (const { toolId, result } of toolResults) {
        console.log('[Agent] 🔍 处理工具:', toolId, 'taskList status:', ctx.taskList?.status, 'currentStep:', ctx.taskList?.currentStep);
        
        if (!result.success) {
            if (ctx.taskList && ctx.taskList.status === 'running') {
                const errorMsg = result.error?.message || '执行失败';
                ctx.taskList = failCurrentStep(ctx.taskList, errorMsg);
                console.log('[Agent] 🗺️ 步骤执行失败:', errorMsg);
                return {
                    prompt: `❌ 步骤执行失败: ${errorMsg}\n\n请检查参数后重试，或向用户说明情况。`,
                    taskList: ctx.taskList,
                };
            }
            continue;
        }

        // 情况1: map.search 返回了地图 → 创建 TaskList
        if (toolId === 'map.search' && result.data) {
            const data = result.data as any;
            const maps = data.maps || [];

            if (maps.length > 0) {
                const map = maps[0];
                const steps = (map.steps || []) as IAiMapStep[];

                if (steps.length > 0) {
                    ctx.taskList = createTaskListFromMap(map.mapId, map.name, steps);
                    ctx.taskList = startTaskList(ctx.taskList);
                    ctx.steps = steps;
                    ctx.stepOutputs = {};

                    const firstStep = steps[0];
                    console.log('[Agent] 🗺️ 创建任务列表:', map.name, '，共', steps.length, '步');

                    const taskProgressPrompt = generateTaskProgressPrompt(ctx.taskList);
                    finalPrompt = `🗺️ 找到地图「${map.name}」，开始执行任务。

${taskProgressPrompt}

📍 **当前步骤: ${firstStep.name}**
${firstStep.action}

请调用工具 \`${firstStep.toolId}\` 执行此步骤。`;
                    finalTaskList = ctx.taskList;
                    continue;
                }
            }
        }

        // 情况2: 正在执行地图步骤
        if (ctx.taskList && ctx.taskList.status === 'running') {
            const currentStepIndex = ctx.taskList.currentStep - 1;
            const currentStep = ctx.steps[currentStepIndex];

            if (currentStep && currentStep.toolId === toolId) {
                if (currentStep.outputKey) {
                    ctx.stepOutputs[currentStep.outputKey] = result.data;
                }

                const resultSummary = generateResultSummary(result.data);
                ctx.taskList = completeCurrentStep(ctx.taskList, resultSummary);

                console.log('[Agent] 🗺️ 步骤完成:', currentStep.name, '→', resultSummary);

                if (isTaskListCompleted(ctx.taskList)) {
                    console.log('[Agent] 🗺️ 地图全部步骤完成!');
                    const taskProgressPrompt = generateTaskProgressPrompt(ctx.taskList);
                    const completedTaskList = ctx.taskList;
                    clearMapExecutionContext(sessionId);

                    return {
                        prompt: `✅ 任务「${completedTaskList.mapName}」全部完成！

${taskProgressPrompt}

📋 请将所有查询结果汇总，用 Markdown 表格展示给用户。
⛔ **禁止再调用任何工具！**`,
                        taskList: completedTaskList,
                        isCompleted: true,
                    };
                }

                const nextStep = ctx.steps[currentStepIndex + 1];
                if (nextStep) {
                    let nextPrompt: string;
                    if (currentStep.nextStepPrompt) {
                        console.log('[Agent] 🔍 stepOutputs keys:', Object.keys(ctx.stepOutputs));
                        nextPrompt = replaceTemplateVariables(
                            currentStep.nextStepPrompt,
                            { ...ctx.stepOutputs, _lastResult: result.data }
                        );
                        console.log('[Agent] 🔍 替换后 nextStepPrompt:', nextPrompt.substring(0, 300));
                    } else {
                        nextPrompt = `✅ 步骤 ${currentStepIndex + 1} 完成: ${resultSummary}

📍 **下一步 (${currentStepIndex + 2}/${ctx.steps.length}): ${nextStep.name}**
${nextStep.action}

请调用工具 \`${nextStep.toolId}\` 继续执行。`;
                    }

                    const taskProgressPrompt = generateTaskProgressPrompt(ctx.taskList);
                    return {
                        prompt: `${taskProgressPrompt}

---
${nextPrompt}`,
                        taskList: ctx.taskList,
                    };
                }
            }
        }

        // 情况3: 向后兼容模式
        if (!ctx.taskList && toolId !== 'map.search' && toolId !== 'schema.search') {
            try {
                const mapsWithStep = await AiMap.find({
                    enabled: true,
                    'steps.toolId': toolId
                }).lean();

                for (const map of mapsWithStep) {
                    const steps = ((map as any).steps || []) as IAiMapStep[];
                    const currentStepIndex = steps.findIndex((s) => s.toolId === toolId);

                    if (currentStepIndex >= 0) {
                        const currentStep = steps[currentStepIndex];
                        const nextStep = steps[currentStepIndex + 1];

                        if (currentStep.nextStepPrompt) {
                            console.log('[Agent] 🗺️ 地图步骤完成(兼容模式):', currentStep.name);
                            const prompt = replaceTemplateVariables(
                                currentStep.nextStepPrompt,
                                { _lastResult: result.data }
                            );
                            return { prompt, taskList: null };
                        }

                        if (nextStep) {
                            console.log('[Agent] 🗺️ 地图步骤完成(兼容模式):', currentStep.name, '→ 下一步:', nextStep.name);
                            return {
                                prompt: `✅ 步骤 ${currentStepIndex + 1} 完成。

📍 **下一步 (${currentStepIndex + 2}/${steps.length}): ${nextStep.name}**
${nextStep.action}

请调用工具 \`${nextStep.toolId}\` 继续执行。`,
                                taskList: null,
                            };
                        }

                        if (currentStepIndex === steps.length - 1) {
                            console.log('[Agent] 🗺️ 地图全部步骤完成(兼容模式)');
                            return {
                                prompt: `✅ 地图「${(map as any).name}」全部 ${steps.length} 个步骤已完成！

📋 请将所有查询结果汇总，用 Markdown 表格展示给用户。`,
                                taskList: null,
                            };
                        }
                    }
                }
            } catch (error) {
                console.warn('[Agent] 查找地图步骤失败:', error);
            }
        }
    }

    if (finalPrompt) {
        return { prompt: finalPrompt, taskList: finalTaskList || ctx.taskList };
    }

    return { prompt: null, taskList: ctx.taskList };
}

