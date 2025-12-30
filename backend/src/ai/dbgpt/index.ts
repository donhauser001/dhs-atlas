/**
 * DB-GPT 桥接层
 * 
 * 将 DB-GPT 作为 AI 服务后端，替换原有的 LLM 调用
 * 
 * 优势：
 * - 更成熟的 Agent 系统
 * - 更好的工具调用能力
 * - 支持 AWEL 工作流
 * - 内置 RAG 能力
 */

export { DBGPTClient, createDBGPTClient } from './client';
export { callDBGPT } from './llm-bridge';
export { DBGPTAgentService } from './agent-bridge';
export type { DBGPTConfig, DBGPTMessage, DBGPTResponse } from './types';

