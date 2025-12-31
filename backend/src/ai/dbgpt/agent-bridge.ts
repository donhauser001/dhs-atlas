/**
 * Agent 桥接层
 * 
 * 使用 DB-GPT 的 Agent 系统替代原有的 agent-service
 * 
 * 这是一个更高级的集成方式，可以利用 DB-GPT 的：
 * - Agent 框架
 * - 工具调用能力
 * - 上下文管理
 */

import { getDefaultDBGPTClient, DBGPTClient } from './client';
import type { DBGPTMessage, DBGPTAgentConfig } from './types';
import type { AgentRequest, AgentResponse, ProgressCallback } from '../agent/types';
import { toolRegistry } from '../tools';
import type { ToolResult, ToolContext } from '../tools/types';
import { createExecutionError } from '../agent/explanation-templates';

/**
 * DB-GPT Agent 服务
 * 
 * 将原有的工具系统与 DB-GPT Agent 结合
 */
export class DBGPTAgentService {
    private client: DBGPTClient;
    private config: DBGPTAgentConfig;

    constructor(config?: Partial<DBGPTAgentConfig>) {
        this.config = {
            baseUrl: process.env.DBGPT_BASE_URL || 'http://localhost:5670',
            model: process.env.DBGPT_MODEL || 'qwen3-coder-30b',
            temperature: 0.7,
            maxTokens: 4096,
            timeout: 60000,
            ...config,
        };
        this.client = new DBGPTClient(this.config);
    }

    /**
     * 处理 Agent 请求
     * 
     * 使用 DB-GPT 作为 LLM 后端，但保留原有的工具执行逻辑
     */
    async processRequest(
        request: AgentRequest,
        callbacks?: ProgressCallback
    ): Promise<AgentResponse> {
        const { message, history = [], context, userId, sessionId } = request;

        console.log('[DB-GPT Agent] 处理请求:', {
            message: message.substring(0, 50),
            module: context?.module,
            userId,
        });

        // 构建系统提示词（包含可用工具信息）
        const systemPrompt = await this.buildSystemPrompt(context);

        // 构建消息历史
        const messages: DBGPTMessage[] = [
            { role: 'system', content: systemPrompt },
            ...history.map(h => ({
                role: h.role as 'user' | 'assistant',
                content: h.content,
            })),
            { role: 'user', content: message },
        ];

        // 调用 DB-GPT
        try {
            callbacks?.onMessage?.('正在思考...');

            const response = await this.client.chatCompletion(messages);

            // 解析工具调用
            if (response.toolCalls && response.toolCalls.length > 0) {
                callbacks?.onMessage?.('正在执行工具...');

                const toolResults = await this.executeTools(
                    response.toolCalls,
                    { userId, sessionId: sessionId || '', module: context?.module },
                    callbacks
                );

                // 将工具结果加入对话，继续对话
                const toolResultMessage = toolResults.map(r =>
                    `工具 ${r.toolId}: ${r.result.success ? JSON.stringify(r.result.data) : r.result.error}`
                ).join('\n');

                messages.push(
                    { role: 'assistant', content: response.content },
                    { role: 'user', content: `工具执行结果:\n${toolResultMessage}\n请根据结果继续回答。` }
                );

                const finalResponse = await this.client.chatCompletion(messages);

                return {
                    content: finalResponse.content,
                    toolResults,
                    sessionId: sessionId || '',
                };
            }

            callbacks?.onMessage?.(response.content);

            return {
                content: response.content,
                sessionId: sessionId || '',
            };
        } catch (error) {
            console.error('[DB-GPT Agent] 处理失败:', error);
            callbacks?.onError?.(error instanceof Error ? error.message : '处理失败');

            return {
                content: `处理请求时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
                sessionId: sessionId || '',
            };
        }
    }

    /**
     * 构建系统提示词
     */
    private async buildSystemPrompt(context?: { module?: string; pathname?: string }): Promise<string> {
        // 获取所有可用工具
        const tools = toolRegistry.getAll();

        const toolsDescription = tools.map(t =>
            `- ${t.id}: ${t.name} - ${t.description}`
        ).join('\n');

        return `你是 DHS-Atlas 系统的 AI 助手，帮助用户处理 CRM、项目管理、报价单等业务。

当前模块: ${context?.module || '未知'}
当前页面: ${context?.pathname || '未知'}

## 可用工具

${toolsDescription}

## 工具调用格式

当需要调用工具时，请使用以下 JSON 格式：
\`\`\`tool_call
{
  "tool": "工具ID",
  "params": { "参数名": "参数值" }
}
\`\`\`

## 注意事项

1. 优先使用 CRM 工具（crm.client_detail, crm.client_list）查询客户信息
2. 查询报价单时，先查客户再查报价单
3. 回答要简洁明了，使用表格展示结构化数据
4. 如果不确定，先使用 schema.search 了解数据结构`;
    }

    /**
     * 执行工具调用
     */
    private async executeTools(
        toolCalls: Array<{ name: string; arguments: Record<string, unknown> }>,
        context: { userId: string; sessionId: string; module?: string },
        callbacks?: ProgressCallback
    ): Promise<Array<{ toolId: string; result: ToolResult }>> {
        const results: Array<{ toolId: string; result: ToolResult }> = [];

        for (const call of toolCalls) {
            console.log('[DB-GPT Agent] 执行工具:', call.name);
            callbacks?.onToolCall?.(call.name, call.arguments);

            const toolContext: ToolContext = {
                userId: context.userId,
                requestId: context.sessionId,
                sessionId: context.sessionId,
            };

            try {
                const result = await toolRegistry.execute(
                    call.name,
                    call.arguments,
                    toolContext
                );
                results.push({ toolId: call.name, result });
                callbacks?.onToolResult?.(call.name, result);
            } catch (error) {
                const errorResult: ToolResult = {
                    success: false,
                    error: createExecutionError(
                        error instanceof Error ? error.message : '工具执行失败'
                    ),
                };
                results.push({ toolId: call.name, result: errorResult });
                callbacks?.onToolResult?.(call.name, errorResult);
            }
        }

        return results;
    }

    /**
     * 健康检查
     */
    async healthCheck(): Promise<boolean> {
        return this.client.healthCheck();
    }
}

// 默认实例
let defaultAgentService: DBGPTAgentService | null = null;

export function getDBGPTAgentService(): DBGPTAgentService {
    if (!defaultAgentService) {
        defaultAgentService = new DBGPTAgentService();
    }
    return defaultAgentService;
}

