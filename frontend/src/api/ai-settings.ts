/**
 * AI 设置 API
 * 
 * 管理 AI 模型配置，支持多种在线模型和本地模型
 */

import api from '@/lib/axios';

// ============ 类型定义 ============

// AI 提供商类型
export type AiProvider =
    | 'openai'      // OpenAI (GPT-4, GPT-3.5)
    | 'anthropic'   // Anthropic (Claude)
    | 'google'      // Google (Gemini)
    | 'deepseek'    // DeepSeek
    | 'zhipu'       // 智谱 (GLM)
    | 'moonshot'    // Moonshot (Kimi)
    | 'qwen'        // 通义千问
    | 'ollama'      // Ollama (本地模型)
    | 'lmstudio'    // LMStudio (本地模型)
    | 'custom';     // 自定义 OpenAI 兼容接口

// AI 模型配置
export interface AiModelConfig {
    _id: string;
    // 基本信息
    name: string;           // 配置名称
    provider: AiProvider;   // 提供商
    model: string;          // 模型名称

    // 连接配置
    apiKey?: string;        // API Key (敏感信息，不返回)
    apiKeySet?: boolean;    // 是否已设置 API Key
    baseUrl?: string;       // API 基础 URL (自定义或本地)

    // 模型参数
    temperature?: number;   // 温度 (0-2)
    maxTokens?: number;     // 最大 token 数
    topP?: number;          // Top P (0-1)

    // 状态
    isDefault: boolean;     // 是否默认模型
    isEnabled: boolean;     // 是否启用

    // 元数据
    createdAt: string;
    updatedAt: string;
}

// 创建/更新请求
export interface CreateAiModelRequest {
    name: string;
    provider: AiProvider;
    model: string;
    apiKey?: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    isDefault?: boolean;
    isEnabled?: boolean;
}

export interface UpdateAiModelRequest extends Partial<CreateAiModelRequest> { }

// 测试连接请求
export interface TestConnectionRequest {
    provider: AiProvider;
    model: string;
    apiKey?: string;
    baseUrl?: string;
}

// 测试连接响应
export interface TestConnectionResponse {
    success: boolean;
    message: string;
    responseTime?: number;  // 响应时间(ms)
    modelInfo?: {
        name: string;
        version?: string;
    };
}

// Ollama 模型列表
export interface OllamaModel {
    name: string;
    size: number;
    digest: string;
    modified_at: string;
}

// LMStudio 模型列表
export interface LMStudioModel {
    id: string;
    object: string;
    owned_by: string;
}

// ============ 预置模型列表 ============

export const AI_PROVIDERS: Record<AiProvider, {
    name: string;
    description: string;
    defaultBaseUrl?: string;
    models: { id: string; name: string; description?: string }[];
}> = {
    openai: {
        name: 'OpenAI',
        description: 'GPT-4, GPT-3.5 等模型',
        defaultBaseUrl: 'https://api.openai.com/v1',
        models: [
            { id: 'gpt-4o', name: 'GPT-4o', description: '最新多模态模型' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '轻量级多模态' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: '高性能版本' },
            { id: 'gpt-4', name: 'GPT-4', description: '标准版本' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '经济实惠' },
        ],
    },
    anthropic: {
        name: 'Anthropic',
        description: 'Claude 系列模型',
        defaultBaseUrl: 'https://api.anthropic.com',
        models: [
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: '最新版本' },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: '最强能力' },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: '均衡选择' },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: '快速响应' },
        ],
    },
    google: {
        name: 'Google',
        description: 'Gemini 系列模型',
        defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        models: [
            { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: '最新实验版' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '高级版本' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: '快速版本' },
        ],
    },
    deepseek: {
        name: 'DeepSeek',
        description: '深度求索系列模型',
        defaultBaseUrl: 'https://api.deepseek.com',
        models: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat', description: '对话模型' },
            { id: 'deepseek-coder', name: 'DeepSeek Coder', description: '代码模型' },
        ],
    },
    zhipu: {
        name: '智谱 AI',
        description: 'GLM 系列模型',
        defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        models: [
            { id: 'glm-4-plus', name: 'GLM-4 Plus', description: '旗舰版' },
            { id: 'glm-4', name: 'GLM-4', description: '标准版' },
            { id: 'glm-4-flash', name: 'GLM-4 Flash', description: '快速版' },
        ],
    },
    moonshot: {
        name: 'Moonshot',
        description: 'Kimi 系列模型',
        defaultBaseUrl: 'https://api.moonshot.cn/v1',
        models: [
            { id: 'moonshot-v1-128k', name: 'Moonshot 128K', description: '超长上下文' },
            { id: 'moonshot-v1-32k', name: 'Moonshot 32K', description: '长上下文' },
            { id: 'moonshot-v1-8k', name: 'Moonshot 8K', description: '标准版' },
        ],
    },
    qwen: {
        name: '通义千问',
        description: '阿里云通义系列',
        defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        models: [
            { id: 'qwen-max', name: 'Qwen Max', description: '旗舰版' },
            { id: 'qwen-plus', name: 'Qwen Plus', description: '增强版' },
            { id: 'qwen-turbo', name: 'Qwen Turbo', description: '快速版' },
        ],
    },
    ollama: {
        name: 'Ollama',
        description: '本地部署模型',
        defaultBaseUrl: 'http://localhost:11434',
        models: [
            { id: 'llama3.2', name: 'Llama 3.2', description: 'Meta 最新模型' },
            { id: 'qwen2.5', name: 'Qwen 2.5', description: '通义千问本地版' },
            { id: 'deepseek-r1', name: 'DeepSeek R1', description: '推理模型' },
            { id: 'mistral', name: 'Mistral', description: '高效模型' },
            { id: 'codellama', name: 'Code Llama', description: '代码专用' },
        ],
    },
    lmstudio: {
        name: 'LMStudio',
        description: '本地模型管理器',
        defaultBaseUrl: 'http://192.168.31.178:1234',
        models: [
            { id: 'qwen/qwen3-coder-30b', name: 'Qwen3 Coder 30B', description: '代码专用' },
            { id: 'custom', name: '自定义模型', description: '手动输入模型名称' },
        ],
    },
    custom: {
        name: '自定义',
        description: 'OpenAI 兼容接口',
        models: [],
    },
};

// ============ API 函数 ============

/**
 * 获取所有 AI 模型配置
 */
export async function getAllAiModels(): Promise<AiModelConfig[]> {
    const response = await api.get('/ai-settings');
    return response.data.data;
}

/**
 * 获取单个 AI 模型配置
 */
export async function getAiModel(id: string): Promise<AiModelConfig> {
    const response = await api.get(`/ai-settings/${id}`);
    return response.data.data;
}

/**
 * 创建 AI 模型配置
 */
export async function createAiModel(data: CreateAiModelRequest): Promise<AiModelConfig> {
    const response = await api.post('/ai-settings', data);
    return response.data.data;
}

/**
 * 更新 AI 模型配置
 */
export async function updateAiModel(id: string, data: UpdateAiModelRequest): Promise<AiModelConfig> {
    const response = await api.put(`/ai-settings/${id}`, data);
    return response.data.data;
}

/**
 * 删除 AI 模型配置
 */
export async function deleteAiModel(id: string): Promise<void> {
    await api.delete(`/ai-settings/${id}`);
}

/**
 * 设置默认模型
 */
export async function setDefaultModel(id: string): Promise<AiModelConfig> {
    const response = await api.post(`/ai-settings/${id}/set-default`);
    return response.data.data;
}

/**
 * 测试模型连接
 */
export async function testConnection(data: TestConnectionRequest): Promise<TestConnectionResponse> {
    const response = await api.post('/ai-settings/test', data);
    return response.data.data;
}

/**
 * 获取 Ollama 本地模型列表
 */
export async function getOllamaModels(baseUrl?: string): Promise<OllamaModel[]> {
    const url = baseUrl || 'http://localhost:11434';
    const response = await api.get('/ai-settings/ollama/models', {
        params: { baseUrl: url },
    });
    return response.data.data;
}

/**
 * 获取 LMStudio 本地模型列表
 */
export async function getLMStudioModels(baseUrl?: string): Promise<LMStudioModel[]> {
    const url = baseUrl || 'http://192.168.31.178:1234';
    const response = await api.get('/ai-settings/lmstudio/models', {
        params: { baseUrl: url },
    });
    return response.data.data;
}

