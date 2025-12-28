/**
 * AI 工作流系统
 * 
 * 工作流 = 状态机 + 可用命令
 * 所有对话由 LLM 生成
 */

export * from './types';
export * from './workflow-manager';

// 注册所有工作流
import { registerWorkflow } from './workflow-manager';
import { createClientWorkflow } from './crm';

// CRM 模块
registerWorkflow(createClientWorkflow);

// TODO: 更多模块工作流
// - 报价管理
// - 合同管理
// - 项目管理

