/**
 * AI 原生架构 - 能力系统
 * 
 * 这不是"假工作流"系统，而是：
 * 1. 模块能力注册 - 定义每个模块有哪些工具和快捷操作
 * 2. 类型定义 - Tool Protocol 和 UI Protocol 的类型
 * 
 * 真正的 AI 决策由后端 Agent Service 完成，使用真实的 LLM。
 * 
 * 参考文档：docs/ai-native-architecture/
 */

// 类型导出
export * from './types';

// 模块注册表
export {
  moduleRegistry,
  registerModule,
  getModule,
  getAllModules,
  matchModuleByRoute,
  // 向后兼容
  aiCapabilityRegistry,
  registerAiCapability,
  getAiCapability,
  getAllAiCapabilities,
  matchAiCapabilityByRoute,
  getWorkflow,
} from './registry';
