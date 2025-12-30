/**
 * LLM 调用模块
 * 
 * 负责与大语言模型的通信
 */

import AiModel from '../../models/AiModel';
import type { AgentMessage } from './types';

/**
 * 调用 LLM
 */
export async function callLLM(
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

