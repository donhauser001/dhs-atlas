/**
 * AI 工具系统入口
 * 
 * 导出类型和注册所有工具
 */

export * from './types';
export { toolRegistry, getToolDescriptions, generateToolsPrompt } from './registry';

// 导入工具模块
import { toolRegistry } from './registry';
import { createClientTool, searchClientTool, contactStatsTool } from './crm';
import { dbQueryTool } from './db';
import { aiCapabilitiesTool } from './ai';

/**
 * 注册所有工具
 */
export function registerAllTools(): void {
    // CRM 工具
    toolRegistry.register(createClientTool);
    toolRegistry.register(searchClientTool);
    toolRegistry.register(contactStatsTool);

    // 数据库工具
    toolRegistry.register(dbQueryTool);

    // AI 自身能力工具
    toolRegistry.register(aiCapabilitiesTool);

    console.log(`[Tool Registry] 共注册 ${toolRegistry.getAll().length} 个工具`);
}

