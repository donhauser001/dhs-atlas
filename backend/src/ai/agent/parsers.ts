/**
 * 解析函数模块
 * 
 * 解析 LLM 响应中的各种结构化内容
 */

import { v4 as uuidv4 } from 'uuid';
import type { ToolCallRequest } from '../tools/types';
import type { UISpec, PredictedAction } from './types';

/**
 * 解析 LLM 响应中的工具调用
 */
export function parseToolCalls(content: string): ToolCallRequest[] {
    const toolCalls: ToolCallRequest[] = [];
    const regex = /```tool_call\s*([\s\S]*?)```/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
        try {
            const parsed = JSON.parse(match[1].trim());
            if (parsed.toolId) {
                toolCalls.push({
                    toolId: parsed.toolId,
                    params: parsed.params || {},
                    requestId: uuidv4(),
                });
            }
        } catch (e) {
            console.warn('[Agent] 无法解析工具调用:', match[1]);
        }
    }

    return toolCalls;
}

/**
 * 解析 LLM 响应中的 UI 表单指令
 */
export function parseUIForm(content: string): UISpec | null {
    const regex = /```ui_form\s*([\s\S]*?)```/g;
    const match = regex.exec(content);

    if (!match) return null;

    try {
        const formSpec = JSON.parse(match[1].trim());
        return {
            componentId: 'AiForm',
            props: {
                formId: formSpec.formId,
                mode: formSpec.mode || 'create',
                title: formSpec.title,
                initialValues: formSpec.initialValues,
            },
            target: 'canvas',
        };
    } catch (e) {
        return null;
    }
}

/**
 * 解析预判指令
 */
export function parsePredictedActions(content: string): PredictedAction[] {
    const regex = /```predicted_actions\s*([\s\S]*?)```/g;
    const match = regex.exec(content);

    if (!match) return [];

    try {
        const actions = JSON.parse(match[1].trim());
        return actions.map((a: Partial<PredictedAction>, index: number) => ({
            id: `pred-${index}`,
            type: a.type || 'question',
            label: a.label || '',
            prompt: a.prompt,
            toolId: a.toolId,
            params: a.params,
            confidence: a.confidence || 0.8,
            requiresConfirmation: a.type === 'execute' ? true : (a.requiresConfirmation ?? false),
        }));
    } catch (e) {
        return [];
    }
}

/**
 * 提取纯文本内容（移除所有特殊代码块）
 */
export function extractTextContent(content: string): string {
    return content
        .replace(/```tool_call\s*[\s\S]*?```/g, '')
        .replace(/```predicted_actions\s*[\s\S]*?```/g, '')
        .replace(/```ui_form\s*[\s\S]*?```/g, '')
        .trim();
}

