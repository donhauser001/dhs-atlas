/**
 * DB-GPT 桥接层类型定义
 */

export interface DBGPTConfig {
    /** DB-GPT 服务地址 */
    baseUrl: string;
    /** API 密钥（如果需要） */
    apiKey?: string;
    /** 默认模型名称 */
    model?: string;
    /** 温度参数 */
    temperature?: number;
    /** 最大 token 数 */
    maxTokens?: number;
    /** 请求超时（毫秒） */
    timeout?: number;
}

export interface DBGPTMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface DBGPTToolCall {
    name: string;
    arguments: Record<string, unknown>;
}

export interface DBGPTResponse {
    content: string;
    toolCalls?: DBGPTToolCall[];
    finishReason?: 'stop' | 'tool_calls' | 'length';
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface DBGPTStreamEvent {
    type: 'content' | 'tool_call' | 'done' | 'error';
    data: unknown;
}

export interface DBGPTAgentConfig extends DBGPTConfig {
    /** 使用的 Agent ID（可选，不指定则使用默认 Agent） */
    agentId?: string;
    /** 自定义工具列表 */
    tools?: DBGPTToolDefinition[];
}

export interface DBGPTToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}

