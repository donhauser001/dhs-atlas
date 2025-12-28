/**
 * AI 工具注册表实现
 */

import { v4 as uuidv4 } from 'uuid';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type {
    ToolDefinition,
    ToolRegistry,
    ToolContext,
    ToolResult,
    ToolDescription,
} from './types';

// 工具存储
const tools = new Map<string, ToolDefinition>();

/**
 * 工具注册表单例
 */
export const toolRegistry: ToolRegistry = {
    register<TParams, TResult>(tool: ToolDefinition<TParams, TResult>): void {
        if (tools.has(tool.id)) {
            console.warn(`[Tool Registry] 工具 "${tool.id}" 已存在，将被覆盖`);
        }

        tools.set(tool.id, tool as ToolDefinition);
        console.log(`[Tool Registry] 注册工具: ${tool.id} (${tool.name})`);
    },

    get(toolId: string): ToolDefinition | undefined {
        return tools.get(toolId);
    },

    getAll(): ToolDefinition[] {
        return Array.from(tools.values());
    },

    getByModule(module: string): ToolDefinition[] {
        return Array.from(tools.values()).filter(t => t.module === module);
    },

    async execute<TParams, TResult>(
        toolId: string,
        params: TParams,
        context: ToolContext
    ): Promise<ToolResult<TResult>> {
        const tool = tools.get(toolId);

        if (!tool) {
            return {
                success: false,
                error: {
                    code: 'TOOL_NOT_FOUND',
                    message: `工具 "${toolId}" 不存在`,
                },
            };
        }

        // 验证参数
        const validation = tool.paramsSchema.safeParse(params);
        if (!validation.success) {
            return {
                success: false,
                error: {
                    code: 'INVALID_PARAMS',
                    message: `参数验证失败: ${validation.error.message}`,
                },
            };
        }

        // 确保有 requestId
        const execContext: ToolContext = {
            ...context,
            requestId: context.requestId || uuidv4(),
        };

        // 记录审计日志
        console.log(`[Tool Audit] 执行工具: ${toolId}`, {
            requestId: execContext.requestId,
            userId: execContext.userId,
            params: validation.data,
            timestamp: new Date().toISOString(),
        });

        try {
            // 执行工具
            const result = await tool.execute(validation.data, execContext);

            // 记录结果
            console.log(`[Tool Audit] 工具完成: ${toolId}`, {
                requestId: execContext.requestId,
                success: result.success,
                timestamp: new Date().toISOString(),
            });

            return result as ToolResult<TResult>;
        } catch (error) {
            console.error(`[Tool Audit] 工具失败: ${toolId}`, {
                requestId: execContext.requestId,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString(),
            });

            return {
                success: false,
                error: {
                    code: 'EXECUTION_ERROR',
                    message: error instanceof Error ? error.message : '工具执行失败',
                },
            };
        }
    },
};

/**
 * 获取工具描述列表（用于生成 AI system prompt）
 */
export function getToolDescriptions(toolIds?: string[]): ToolDescription[] {
    const allTools = toolIds
        ? toolIds.map(id => tools.get(id)).filter(Boolean) as ToolDefinition[]
        : Array.from(tools.values());

    return allTools.map(tool => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        parameters: zodToJsonSchema(tool.paramsSchema),
        requiresConfirmation: tool.requiresConfirmation,
    }));
}

/**
 * 生成工具的 system prompt 片段
 */
export function generateToolsPrompt(toolIds?: string[]): string {
    const descriptions = getToolDescriptions(toolIds);

    if (descriptions.length === 0) {
        return '当前没有可用的工具。';
    }

    const toolsText = descriptions.map(tool => {
        const paramsText = JSON.stringify(tool.parameters, null, 2);
        const confirmText = tool.requiresConfirmation ? '（需要用户确认）' : '';
        return `### ${tool.id}: ${tool.name}${confirmText}
${tool.description}

参数 Schema:
\`\`\`json
${paramsText}
\`\`\``;
    }).join('\n\n');

    return `## 可用工具

${toolsText}

## 工具调用格式

当你需要调用工具时，请在回复中包含以下格式的 JSON 块：

\`\`\`tool_call
{
  "toolId": "工具ID",
  "params": { /* 参数 */ }
}
\`\`\`

你可以在一次回复中调用多个工具。每个工具调用使用单独的 \`\`\`tool_call 块。`;
}

