/**
 * LLM 桥接层
 * 
 * 替换原有的 llm.ts，使用 DB-GPT 作为 LLM 后端
 * 
 * 使用方式：
 * 1. 在 agent-service.ts 中将 callLLM 替换为 callDBGPT
 * 2. 或者通过环境变量 USE_DBGPT=true 启用
 */

import { getDefaultDBGPTClient } from './client';
import type { DBGPTMessage } from './types';
import type { AgentMessage } from '../agent/types';

/**
 * 将原有的 AgentMessage 转换为 DBGPTMessage
 */
function convertMessages(messages: AgentMessage[]): DBGPTMessage[] {
    return messages.map(m => {
        if (m.role === 'tool') {
            // 工具结果转换为 assistant 消息
            return {
                role: 'assistant' as const,
                content: `工具执行结果: ${JSON.stringify(m.toolResult)}`,
            };
        }
        return {
            role: m.role as 'user' | 'assistant',
            content: m.content,
        };
    });
}

/**
 * 通过 DB-GPT 调用 LLM
 * 
 * 这是原有 callLLM 函数的替代实现
 * 
 * @param systemPrompt - 系统提示词
 * @param messages - 对话历史
 * @returns LLM 响应内容
 */
export async function callDBGPT(
    systemPrompt: string,
    messages: AgentMessage[]
): Promise<string> {
    const client = getDefaultDBGPTClient();

    console.log('[DB-GPT Bridge] 调用 DB-GPT LLM');

    // 构建完整的消息列表
    const dbgptMessages: DBGPTMessage[] = [
        { role: 'system', content: systemPrompt },
        ...convertMessages(messages),
    ];

    try {
        const response = await client.chatCompletion(dbgptMessages);

        console.log('[DB-GPT Bridge] 响应长度:', response.content.length);
        if (response.usage) {
            console.log('[DB-GPT Bridge] Token 使用:', response.usage);
        }

        return response.content;
    } catch (error) {
        console.error('[DB-GPT Bridge] 调用失败:', error);
        throw error;
    }
}

/**
 * 流式调用 DB-GPT
 * 
 * 支持 SSE 实时反馈
 */
export async function* callDBGPTStream(
    systemPrompt: string,
    messages: AgentMessage[]
): AsyncGenerator<string> {
    const client = getDefaultDBGPTClient();

    console.log('[DB-GPT Bridge] 流式调用 DB-GPT LLM');

    const dbgptMessages: DBGPTMessage[] = [
        { role: 'system', content: systemPrompt },
        ...convertMessages(messages),
    ];

    try {
        for await (const event of client.chatCompletionStream(dbgptMessages)) {
            if (event.type === 'content' && typeof event.data === 'string') {
                yield event.data;
            } else if (event.type === 'done') {
                break;
            }
        }
    } catch (error) {
        console.error('[DB-GPT Bridge] 流式调用失败:', error);
        throw error;
    }
}


