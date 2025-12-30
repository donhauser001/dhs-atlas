/**
 * AI 工具注册表实现
 * 
 * 支持两种工具来源：
 * 1. 硬编码工具：在代码中定义，适合核心系统工具
 * 2. 配置化工具：在数据库中配置，支持声明式执行逻辑
 * 
 * 执行优先级：数据库配置 > 硬编码定义
 */

import { v4 as uuidv4 } from 'uuid';
import { zodToJsonSchema } from 'zod-to-json-schema';
import AiTool from '../../models/AiToolkit';
import { ToolExecutor } from './executor';
import {
    createToolNotFoundError,
    createValidationError,
    createExecutionError,
} from '../agent/explanation-templates';
import type {
    ToolDefinition,
    ToolRegistry,
    ToolContext,
    ToolResult,
    ToolDescription,
} from './types';

// 硬编码工具存储
const hardcodedTools = new Map<string, ToolDefinition>();

/**
 * 工具注册表单例
 */
export const toolRegistry: ToolRegistry = {
    /**
     * 注册硬编码工具
     */
    register<TParams, TResult>(tool: ToolDefinition<TParams, TResult>): void {
        if (hardcodedTools.has(tool.id)) {
            console.warn(`[Tool Registry] 工具 "${tool.id}" 已存在，将被覆盖`);
        }

        hardcodedTools.set(tool.id, tool as ToolDefinition);
        console.log(`[Tool Registry] 注册硬编码工具: ${tool.id} (${tool.name})`);
    },

    /**
     * 获取工具（优先从数据库，然后从硬编码）
     */
    get(toolId: string): ToolDefinition | undefined {
        // 硬编码工具直接返回
        return hardcodedTools.get(toolId);
    },

    /**
     * 获取所有硬编码工具
     */
    getAll(): ToolDefinition[] {
        return Array.from(hardcodedTools.values());
    },

    /**
     * 按模块获取硬编码工具
     */
    getByModule(module: string): ToolDefinition[] {
        return Array.from(hardcodedTools.values()).filter(t => t.module === module);
    },

    /**
     * 执行工具
     * 优先级：数据库配置化工具 > 硬编码工具
     */
    async execute<TParams, TResult>(
        toolId: string,
        params: TParams,
        context: ToolContext
    ): Promise<ToolResult<TResult>> {
        // 确保有 requestId
        const execContext: ToolContext = {
            ...context,
            requestId: context.requestId || uuidv4(),
        };

        // 记录审计日志
        console.log(`[Tool Audit] 执行工具: ${toolId}`, {
            requestId: execContext.requestId,
            userId: execContext.userId,
            params,
            timestamp: new Date().toISOString(),
        });

        try {
            // 优先检查数据库中是否有配置化工具
            const canUseDbTool = await ToolExecutor.canExecute(toolId);

            if (canUseDbTool) {
                // 使用配置化工具执行器
                console.log(`[Tool Registry] 使用配置化工具: ${toolId}`);
                const result = await ToolExecutor.execute(toolId, params as Record<string, any>, execContext);

                console.log(`[Tool Audit] 工具完成: ${toolId}`, {
                    requestId: execContext.requestId,
                    success: result.success,
                    source: 'database',
                    timestamp: new Date().toISOString(),
                });

                return result as ToolResult<TResult>;
            }

            // 回退到硬编码工具
            const tool = hardcodedTools.get(toolId);
            if (!tool) {
                return {
                    success: false,
                    error: createToolNotFoundError(toolId),
                };
            }

            // 验证参数
            const validation = tool.paramsSchema.safeParse(params);
            if (!validation.success) {
                return {
                    success: false,
                    error: createValidationError([validation.error.message]),
                };
            }

            // 执行硬编码工具
            console.log(`[Tool Registry] 使用硬编码工具: ${toolId}`);
            const result = await tool.execute(validation.data, execContext);

            console.log(`[Tool Audit] 工具完成: ${toolId}`, {
                requestId: execContext.requestId,
                success: result.success,
                source: 'hardcoded',
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
                error: createExecutionError(
                    error instanceof Error ? error.message : '工具执行失败'
                ),
            };
        }
    },
};

/**
 * 从数据库加载所有启用的工具信息
 */
export async function loadToolsFromDatabase(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    hasExecution: boolean;
}>> {
    const tools = await AiTool.find({ enabled: true }).sort({ order: 1 });
    return tools.map(t => ({
        id: t.toolId,
        name: t.name,
        description: t.description,
        category: t.category,
        hasExecution: !!t.execution,
    }));
}

/**
 * 获取硬编码工具描述列表（同步版本）
 */
export function getToolDescriptions(toolIds?: string[]): ToolDescription[] {
    const allTools = toolIds
        ? toolIds.map(id => hardcodedTools.get(id)).filter(Boolean) as ToolDefinition[]
        : Array.from(hardcodedTools.values());

    return allTools.map(tool => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        parameters: zodToJsonSchema(tool.paramsSchema as any),
        requiresConfirmation: tool.requiresConfirmation,
    }));
}

/**
 * 获取所有工具描述（包括数据库中的配置化工具）
 */
export async function getAllToolDescriptions(toolIds?: string[]): Promise<ToolDescription[]> {
    // 从数据库加载配置化工具
    const query: any = { enabled: true };
    if (toolIds?.length) {
        query.toolId = { $in: toolIds };
    }

    const dbTools = await AiTool.find(query).sort({ order: 1 });

    const dbDescriptions: ToolDescription[] = dbTools.map(tool => ({
        id: tool.toolId,
        name: tool.name,
        description: tool.description,
        parameters: tool.paramsSchema || {},
        requiresConfirmation: tool.execution?.requiresConfirmation || false,
        usage: tool.usage || '',
        examples: tool.examples || '',
        category: tool.category || 'general',
    }));

    // 获取硬编码工具（排除数据库中已有的）
    const dbToolIds = new Set(dbTools.map(t => t.toolId));
    const hardcoded = getToolDescriptions(toolIds).filter(t => !dbToolIds.has(t.id));

    return [...dbDescriptions, ...hardcoded];
}

/**
 * 生成工具的 system prompt 片段（同步版本，仅硬编码工具）
 */
export function generateToolsPrompt(toolIds?: string[]): string {
    const descriptions = getToolDescriptions(toolIds);
    return formatToolsPrompt(descriptions);
}

/**
 * 生成工具的 system prompt 片段（异步版本，包括配置化工具）
 */
export async function generateAllToolsPrompt(toolIds?: string[]): Promise<string> {
    const descriptions = await getAllToolDescriptions(toolIds);
    return formatToolsPrompt(descriptions);
}

/**
 * 获取类别中文名称
 */
function getCategoryName(category: string): string {
    const names: Record<string, string> = {
        crm: '🎯 CRM 工具（客户/联系人/项目查询，优先使用）',
        contract: '📄 合同工具',
        schema: '🔍 数据结构工具',
        database: '💾 数据库工具',
        ui: '🖥️ UI 工具',
        system: '⚙️ 系统工具',
        general: '📦 通用工具',
    };
    return names[category] || category;
}

/**
 * 格式化工具描述为 prompt 文本
 * 按类别分组，优先显示 crm 工具
 */
function formatToolsPrompt(descriptions: ToolDescription[]): string {
    if (descriptions.length === 0) {
        return '当前没有可用的工具。';
    }

    // 按类别分组
    const grouped = new Map<string, ToolDescription[]>();
    for (const tool of descriptions) {
        const category = (tool as any).category || 'general';
        if (!grouped.has(category)) {
            grouped.set(category, []);
        }
        grouped.get(category)!.push(tool);
    }

    // 定义类别显示顺序（crm 优先）
    const categoryOrder = ['crm', 'contract', 'schema', 'database', 'ui', 'system', 'general'];

    let result = '';

    for (const category of categoryOrder) {
        const tools = grouped.get(category);
        if (!tools || tools.length === 0) continue;

        result += `### ${getCategoryName(category)}\n\n`;

        for (const tool of tools) {
            const confirmText = tool.requiresConfirmation ? ' ⚠️需确认' : '';
            result += `**${tool.id}** - ${tool.name}${confirmText}\n`;
            result += `${tool.description}\n`;
            if (tool.examples) {
                result += `${tool.examples}\n`;
            }
            result += '\n';
        }
    }

    return result.trim();
}

