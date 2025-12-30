/**
 * AI 工具系统入口
 * 
 * 所有工具现在都通过数据库配置化管理，无需硬编码
 * 
 * 工具执行流程：
 * 1. AI 调用工具时，toolRegistry.execute() 被触发
 * 2. 从数据库加载工具的 execution 配置
 * 3. ToolExecutor 解析配置并执行
 */

export * from './types';
export { 
    toolRegistry, 
    getToolDescriptions, 
    generateToolsPrompt,
    getAllToolDescriptions,
    generateAllToolsPrompt,
    loadToolsFromDatabase,
} from './registry';
export { ToolExecutor } from './executor';

/**
 * 初始化工具系统
 * 
 * 配置化方案不需要硬编码注册，工具定义全部存储在数据库中
 * 此函数保留用于未来可能的系统初始化需求
 */
export function registerAllTools(): void {
    console.log('[Tool Registry] 使用配置化工具系统，工具从数据库动态加载');
}

