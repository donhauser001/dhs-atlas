/**
 * AI 聊天 API
 */

import api from '@/lib/axios';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AiStatusResponse {
  available: boolean;
  provider: string;
  url: string;
  models?: string[];
  error?: string;
}

/**
 * 发送聊天消息
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await api.post<{ success: boolean; data: ChatResponse }>('/ai/chat', request);
  return response.data.data;
}

/**
 * 检查 AI 服务状态
 */
export async function getAiStatus(): Promise<AiStatusResponse> {
  const response = await api.get<{ success: boolean; data: AiStatusResponse }>('/ai/status');
  return response.data.data;
}

