/**
 * Agent Service - AI 代理服务
 * 
 * V2 架构：智能 AI + 系统守门
 * 
 * 核心理念：
 * - AI 智能不受限：AI 自由理解意图、查询地图、决定行动
 * - AI 权限有边界：系统负责权限检查、参数验证、审计记录
 */

import { v4 as uuidv4 } from 'uuid';
import { toolRegistry } from '../tools';
import { conversationService } from '../../services/ConversationService';
import { contextBootstrapService, ContextPack } from '../../services/ContextBootstrapService';
import { generateExplanationText, fromError, createPermissionDeniedError } from './explanation-templates';

// 导入拆分的模块
import { clearMapsCache } from './cache';
import { checkPermission, logAudit } from './gatekeeper';
import { callLLM } from './llm';
import { parseToolCalls, parseUIForm, parsePredictedActions, extractTextContent } from './parsers';
import { generateSystemPrompt } from './prompt-generator';
import { executeToolCalls, mergeUISpecs, formatToolResults, ToolExecutionContext } from './tool-executor';
import { generateMapStepPrompt, getMapExecutionContext } from './map-execution';

import type { ToolContext, ToolCallRequest, ToolResult } from '../tools/types';
import type {
    AgentRequest,
    AgentResponse,
    AgentMessage,
    PageContext,
    ProgressCallback,
    TaskList,
} from './types';

// 重新导出缓存清理函数
export { clearMapsCache };

/**
 * Agent Service 主函数 - V2 架构
 * 
 * @param request - Agent 请求
 * @param callbacks - 可选的进度回调，用于 SSE 实时反馈
 */
export async function processAgentRequest(
    request: AgentRequest,
    callbacks?: ProgressCallback
): Promise<AgentResponse> {
    const { message, history = [], context, userId, sessionId } = request;
    const currentSessionId = sessionId || uuidv4();

    console.log('[Agent] 收到请求:', {
        message: message.substring(0, 50),
        module: context?.module,
        userId,
        historyLength: history.length,
    });

    // 记录用户消息
    try {
        await conversationService.logEvent({
            userId,
            sessionId: currentSessionId,
            role: 'user',
            content: message,
            module: context?.module,
            pathname: context?.pathname,
        });
    } catch (error) {
        console.warn('[Agent] 记录对话日志失败:', error);
    }

    // 加载用户上下文
    let contextPack: ContextPack | undefined;
    try {
        contextPack = await contextBootstrapService.bootstrap(
            userId,
            currentSessionId,
            { loadProjects: true, loadRecentTopics: true }
        );
        console.log('[Agent] 用户上下文加载完成:', {
            memoryCount: contextPack.meta.memoryCount,
            projectCount: contextPack.meta.projectCount,
        });
    } catch (error) {
        console.warn('[Agent] 加载用户上下文失败:', error);
    }

    // Step 1: 生成系统提示词
    const systemPrompt = await generateSystemPrompt(context, contextPack);

    // Step 2: 构建消息历史
    const messages: AgentMessage[] = [
        ...history,
        { role: 'user', content: message, timestamp: new Date() },
    ];

    // Step 3: 调用 LLM
    let llmResponse: string;
    try {
        llmResponse = await callLLM(systemPrompt, messages);
    } catch (error) {
        const structuredError = fromError(
            error instanceof Error ? error : new Error('未知错误'),
            'ERROR_LLM_UNAVAILABLE'
        );
        return {
            content: generateExplanationText(structuredError),
            sessionId: currentSessionId,
        };
    }

    console.log('[Agent] LLM 响应:', llmResponse.substring(0, 200) + '...');

    // Step 4: 解析工具调用
    const toolCalls = parseToolCalls(llmResponse);
    const pendingToolCalls: ToolCallRequest[] = [];
    const executableToolCalls: ToolCallRequest[] = [];

    for (const call of toolCalls) {
        const tool = toolRegistry.get(call.toolId);
        if (tool?.requiresConfirmation) {
            pendingToolCalls.push(call);
        } else {
            executableToolCalls.push(call);
        }
    }

    // Step 5: 执行工具
    const toolContext: ToolExecutionContext = {
        userId,
        sessionId,
        requestId: uuidv4(),
        module: context?.module,
        pathname: context?.pathname,
    };
    
    // 执行工具并触发回调
    const toolResults = await executeToolCalls(executableToolCalls, toolContext);
    
    // 触发工具结果回调
    for (const result of toolResults) {
        callbacks?.onToolResult?.(result.toolId, result.result);
    }

    // Step 6: 检测地图执行流程
    const { prompt: mapStepPrompt, taskList: currentTaskList } = await generateMapStepPrompt(
        toolResults,
        currentSessionId
    );
    
    // 如果识别到地图，触发任务开始回调
    if (currentTaskList) {
        callbacks?.onTaskStart?.(currentTaskList);
    }

    // Step 7: 格式化输出
    let finalResponse = llmResponse;
    // 追踪最新的 taskList（在循环外声明，确保返回时可用）
    let latestTaskList = currentTaskList;

    if (toolResults.length > 0) {
        console.log('[Agent] 工具执行完成，请求 LLM 格式化输出...');

        const toolResultsText = formatToolResults(toolResults);
        const userQuestion = messages[messages.length - 1]?.content || '';

        let formatPrompt: string;
        if (mapStepPrompt) {
            console.log('[Agent] 🗺️ 注入地图步骤提示');
            formatPrompt = `用户问题：${userQuestion}

工具查询结果：
${toolResultsText}

---
⚠️ **任务尚未完成！请继续执行下一步骤！**

${mapStepPrompt}

---
**重要**：你必须立即调用工具继续执行！不要输出任何文字解释，直接输出工具调用：
\`\`\`tool_call
{"toolId": "...", "params": {...}}
\`\`\``;
        } else {
            formatPrompt = `用户问题：${userQuestion}

工具查询结果：
${toolResultsText}

请根据以上数据用中文回答用户问题，用 Markdown 表格展示。禁止调用工具。`;
        }

        try {
            finalResponse = await callLLM(systemPrompt, [
                { role: 'user', content: formatPrompt, timestamp: new Date() },
            ]);
            console.log('[Agent] 格式化响应:', finalResponse.substring(0, 300) + '...');

            // 循环执行地图步骤
            // 注意：只保留最新的工具结果，避免上下文溢出
            let latestToolResultsText = toolResultsText;
            const maxRounds = 5;

            for (let round = 2; round <= maxRounds; round++) {
                const newToolCalls = parseToolCalls(finalResponse);
                if (newToolCalls.length === 0) {
                    console.log('[Agent] 第', round, '轮：无新工具调用，结束循环');
                    break;
                }

                console.log('[Agent] 第', round, '轮：发现', newToolCalls.length, '个工具调用');

                // 触发工具调用回调
                for (const call of newToolCalls) {
                    callbacks?.onToolCall?.(call.toolId, call.params);
                }

                const newResults = await executeToolCalls(newToolCalls, toolContext);
                toolResults.push(...newResults);
                
                // 触发工具结果回调
                for (const result of newResults) {
                    callbacks?.onToolResult?.(result.toolId, result.result);
                }

                const newToolResultsText = formatToolResults(newResults);
                console.log('[Agent] 第', round, '轮结果（前 500 字符）:', newToolResultsText.substring(0, 500));
                // 只保留最新结果，不累积（避免上下文溢出）
                latestToolResultsText = newToolResultsText;

                const { prompt: nextMapPrompt, taskList: nextTaskList, isCompleted } = await generateMapStepPrompt(
                    newResults,
                    currentSessionId
                );
                if (nextTaskList) {
                    latestTaskList = nextTaskList;
                    // 触发步骤完成回调（taskList 更新意味着有步骤完成）
                    const completedStep = nextTaskList.tasks.find(t => t.status === 'completed' && t.stepNumber === nextTaskList.currentStep - 1);
                    if (completedStep) {
                        callbacks?.onStepComplete?.(nextTaskList, completedStep.stepNumber, completedStep.resultSummary);
                    }
                    // 如果有下一步，触发步骤开始回调
                    const currentStep = nextTaskList.tasks.find(t => t.status === 'in_progress');
                    if (currentStep) {
                        callbacks?.onStepStart?.(nextTaskList, currentStep.stepNumber);
                    }
                }

                let nextFormatPrompt: string;
                if (nextMapPrompt && !isCompleted) {
                    // 地图未完成，继续执行下一步
                    console.log('[Agent] 🗺️ 第', round, '轮注入地图步骤提示');
                    // 只包含最新的工具结果，不累积历史结果
                    nextFormatPrompt = `当前步骤结果：
${latestToolResultsText.substring(0, 1500)}

---
${nextMapPrompt}

直接输出工具调用：
\`\`\`tool_call
{"toolId": "...", "params": {...}}
\`\`\``;
                } else if (isCompleted) {
                    // 地图已完成所有步骤
                    console.log('[Agent] 🗺️ 第', round, '轮：地图执行完成，生成最终汇总');
                    
                    // 触发任务完成回调（先发送，让前端知道任务完成）
                    if (latestTaskList) {
                        callbacks?.onTaskComplete?.(latestTaskList, '');
                    }
                    
                    // 只使用最新一轮的结果（包含最终数据），避免上下文溢出
                    nextFormatPrompt = `用户问题：${userQuestion}

${nextMapPrompt}

最终查询结果（截取前1500字符）：
${latestToolResultsText.substring(0, 1500)}

请根据以上数据用中文回答用户问题，用简洁的 Markdown 表格展示关键信息。⛔ 禁止调用工具！`;
                } else {
                    // 任务完成，汇总所有结果
                    const allResultsSummary = formatToolResults(toolResults);
                    nextFormatPrompt = `用户问题：${userQuestion}

所有查询结果：
${allResultsSummary.substring(0, 3000)}

请根据以上数据用中文回答用户问题，用 Markdown 表格展示。禁止调用工具。`;
                }

                finalResponse = await callLLM(systemPrompt, [
                    { role: 'user', content: nextFormatPrompt, timestamp: new Date() },
                ]);
                console.log('[Agent] 第', round, '轮响应:', finalResponse.substring(0, 200) + '...');

                // 地图完成或不在地图流程中，跳出循环
                if (!nextMapPrompt || isCompleted) {
                    console.log('[Agent] 地图执行完成或不在地图流程中，结束多轮循环');
                    break;
                }
            }
        } catch (error) {
            console.warn('[Agent] 格式化调用失败，使用原始响应');
        }
    }

    // Step 8: 解析最终响应
    const predictedActions = parsePredictedActions(finalResponse);
    const formUISpec = parseUIForm(finalResponse);
    const textContent = extractTextContent(finalResponse);
    const uiSpec = formUISpec || mergeUISpecs(toolResults);

    // 记录 AI 响应
    try {
        const toolCallsForLog = toolResults.map(r => ({
            toolId: r.toolId,
            params: {},
            success: r.result.success,
            reasonCode: r.result.error?.reasonCode,
        }));

        await conversationService.logEvent({
            userId,
            sessionId: currentSessionId,
            role: 'assistant',
            content: textContent,
            toolCalls: toolCallsForLog.length > 0 ? toolCallsForLog : undefined,
            module: context?.module,
            pathname: context?.pathname,
        });
    } catch (error) {
        console.warn('[Agent] 记录 AI 响应日志失败:', error);
    }

    // 使用 latestTaskList（在循环中实时更新的），而不是从已清除的上下文获取
    console.log('[Agent] 最终 taskList:', latestTaskList ? `${latestTaskList.mapName} - ${latestTaskList.status}` : 'null');

    // 触发 AI 消息回调
    callbacks?.onMessage?.(textContent);

    // 如果任务已完成，确保触发任务完成回调
    if (latestTaskList?.status === 'completed') {
        callbacks?.onTaskComplete?.(latestTaskList, textContent);
    }

    return {
        content: textContent,
        toolResults: toolResults.length > 0 ? toolResults : undefined,
        uiSpec,
        predictedActions: predictedActions.length > 0 ? predictedActions : undefined,
        pendingToolCalls: pendingToolCalls.length > 0 ? pendingToolCalls : undefined,
        sessionId: currentSessionId,
        taskList: latestTaskList || undefined,
    };
}

/**
 * 确认并执行待处理的工具调用
 */
export async function confirmAndExecuteTools(
    toolCalls: ToolCallRequest[],
    userId: string,
    sessionId?: string,
    moduleContext?: { module?: string; pathname?: string }
): Promise<Array<{ toolId: string; result: ToolResult }>> {
    const context: ToolContext = {
        userId,
        sessionId,
        requestId: uuidv4(),
    };

    const results: Array<{ toolId: string; result: ToolResult }> = [];

    for (const call of toolCalls) {
        const requestId = call.requestId || uuidv4();
        const startTime = Date.now();

        const permCheck = await checkPermission(userId, call.toolId);
        if (!permCheck.allowed) {
            const permError = createPermissionDeniedError(permCheck.reason || '权限不足');
            results.push({
                toolId: call.toolId,
                result: { success: false, error: permError },
            });

            await logAudit({
                userId,
                toolId: call.toolId,
                params: call.params,
                result: null,
                success: false,
                timestamp: new Date(),
                sessionId,
                errorMessage: permCheck.reason,
                reasonCode: permCheck.reasonCode,
                duration: Date.now() - startTime,
                requestId,
                module: moduleContext?.module,
                pathname: moduleContext?.pathname,
            });
            continue;
        }

        const result = await toolRegistry.execute(call.toolId, call.params, { ...context, requestId });
        const duration = Date.now() - startTime;

        await logAudit({
            userId,
            toolId: call.toolId,
            params: call.params,
            result: result.success ? result.data : null,
            success: result.success,
            timestamp: new Date(),
            sessionId,
            errorMessage: result.error?.message,
            reasonCode: result.error?.code,
            duration,
            requestId,
            collection: call.params?.collection as string | undefined,
            operation: call.params?.operation as string | undefined,
            module: moduleContext?.module,
            pathname: moduleContext?.pathname,
        });

        results.push({ toolId: call.toolId, result });
    }

    return results;
}
