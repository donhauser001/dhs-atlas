/**
 * LLM 调用模块
 * 
 * 负责与大语言模型的通信
 * 
 * 支持两种后端：
 * 1. 原有模式：使用 AiModel 配置的模型（默认）
 * 2. DB-GPT 模式：通过 USE_DBGPT=true 启用
 */

import AiModel from '../../models/AiModel';
import { getAIServiceConfig } from '../dbgpt/config';
import { callDBGPT } from '../dbgpt/llm-bridge';
import type { AgentMessage } from './types';

/**
 * 调用 LLM
 * 
 * 根据配置自动选择使用原有模型还是 DB-GPT
 */
export async function callLLM(
    systemPrompt: string,
    messages: AgentMessage[]
): Promise<string> {
    const config = getAIServiceConfig();

    // 如果启用了 DB-GPT，使用 DB-GPT 后端
    if (config.useDBGPT) {
        console.log('[Agent] 使用 DB-GPT 后端:', config.dbgptModel);
        return callDBGPT(systemPrompt, messages);
    }

    // 原有逻辑：使用数据库配置的模型
    return callLLMOriginal(systemPrompt, messages);
}

/**
 * 原有的 LLM 调用实现
 */
async function callLLMOriginal(
    systemPrompt: string,
    messages: AgentMessage[]
): Promise<string> {
    const defaultModel = await AiModel.findOne({ isDefault: true, isEnabled: true })
        .select('+apiKey');

    if (!defaultModel) {
        throw new Error('未配置默认 AI 模型，请先在「系统设置 > AI 设置」中添加并设为默认');
    }

    console.log('[Agent] 使用模型:', defaultModel.provider, defaultModel.model);

    const openaiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
            role: m.role === 'tool' ? 'assistant' : m.role,
            content: m.role === 'tool'
                ? `工具执行结果: ${JSON.stringify(m.toolResult)}`
                : m.content,
        })),
    ];

    let apiUrl = defaultModel.baseUrl || '';
    apiUrl = apiUrl.replace(/\/+$/, '');
    if (!apiUrl.endsWith('/v1')) {
        apiUrl = `${apiUrl}/v1`;
    }
    apiUrl = `${apiUrl}/chat/completions`;

    console.log('[Agent] LLM 请求 URL:', apiUrl);

    let response: Response;
    try {
        response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(defaultModel.apiKey && { 'Authorization': `Bearer ${defaultModel.apiKey}` }),
            },
            body: JSON.stringify({
                model: defaultModel.model,
                messages: openaiMessages,
                temperature: defaultModel.temperature ?? 0.7,
                max_tokens: defaultModel.maxTokens ?? 2048,
            }),
        });
    } catch (fetchError) {
        console.error('[Agent] LLM fetch 错误:', fetchError);
        throw fetchError;
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Agent] LLM API 响应错误:', response.status, errorText);
        throw new Error(`LLM API 错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content || '';
    console.log('[Agent] LLM 响应长度:', content.length);
    return content;
}

