/**
 * DB-GPT 客户端
 * 
 * 封装与 DB-GPT 服务的通信
 */

import type { DBGPTConfig, DBGPTMessage, DBGPTResponse, DBGPTStreamEvent } from './types';

const DEFAULT_CONFIG: DBGPTConfig = {
    baseUrl: process.env.DBGPT_BASE_URL || 'http://localhost:5670',
    model: process.env.DBGPT_MODEL || 'qwen3-coder-30b',
    temperature: 0.7,
    maxTokens: 4096,
    timeout: 60000,
};

export class DBGPTClient {
    private config: DBGPTConfig;

    constructor(config: Partial<DBGPTConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * 获取 API 端点
     */
    private getEndpoint(path: string): string {
        const baseUrl = this.config.baseUrl.replace(/\/+$/, '');
        return `${baseUrl}${path}`;
    }

    /**
     * 发送请求
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = this.getEndpoint(endpoint);
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                headers: { ...headers, ...(options.headers as Record<string, string>) },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`DB-GPT API 错误: ${response.status} - ${errorText}`);
            }

            return await response.json() as T;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`DB-GPT 请求超时 (${this.config.timeout}ms)`);
            }
            throw error;
        }
    }

    /**
     * 聊天补全 - 兼容 OpenAI 格式
     */
    async chatCompletion(messages: DBGPTMessage[]): Promise<DBGPTResponse> {
        interface OpenAIResponse {
            choices: Array<{
                message: { content: string; tool_calls?: Array<{ function: { name: string; arguments: string } }> };
                finish_reason: string;
            }>;
            usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        }

        const response = await this.request<OpenAIResponse>('/api/v1/chat/completions', {
            method: 'POST',
            body: JSON.stringify({
                model: this.config.model,
                messages,
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
            }),
        });

        const choice = response.choices?.[0];
        const toolCalls = choice?.message?.tool_calls?.map(tc => ({
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments || '{}'),
        }));

        return {
            content: choice?.message?.content || '',
            toolCalls,
            finishReason: choice?.finish_reason as DBGPTResponse['finishReason'],
            usage: response.usage ? {
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
            } : undefined,
        };
    }

    /**
     * 流式聊天补全
     */
    async *chatCompletionStream(
        messages: DBGPTMessage[]
    ): AsyncGenerator<DBGPTStreamEvent> {
        const url = this.getEndpoint('/api/v1/chat/completions');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: this.config.model,
                messages,
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DB-GPT API 错误: ${response.status} - ${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('无法获取响应流');

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            yield { type: 'done', data: null };
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices?.[0]?.delta;
                            if (delta?.content) {
                                yield { type: 'content', data: delta.content };
                            }
                            if (delta?.tool_calls) {
                                yield { type: 'tool_call', data: delta.tool_calls };
                            }
                        } catch {
                            // 忽略解析错误
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * 健康检查
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(this.getEndpoint('/'), {
                method: 'GET',
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * 获取可用模型列表
     */
    async listModels(): Promise<string[]> {
        interface ModelsResponse {
            data: Array<{ id: string }>;
        }
        try {
            const response = await this.request<ModelsResponse>('/api/v1/models');
            return response.data?.map(m => m.id) || [];
        } catch {
            return [];
        }
    }
}

/**
 * 创建 DB-GPT 客户端实例
 */
export function createDBGPTClient(config?: Partial<DBGPTConfig>): DBGPTClient {
    return new DBGPTClient(config);
}

// 默认客户端实例
let defaultClient: DBGPTClient | null = null;

export function getDefaultDBGPTClient(): DBGPTClient {
    if (!defaultClient) {
        defaultClient = new DBGPTClient();
    }
    return defaultClient;
}

