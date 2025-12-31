/**
 * 系统提示词生成模块
 * 
 * 生成 AI 助手的系统提示词
 */

import { contextBootstrapService, ContextPack } from '../../services/ContextBootstrapService';
import type { PageContext } from './types';

/**
 * 获取模块中文名称
 */
function getModuleName(module: string): string {
    const names: Record<string, string> = {
        clients: '客户管理',
        projects: '项目管理',
        contracts: '合同管理',
        quotations: '报价管理',
        invoices: '发票管理',
        settings: '系统设置',
        dashboard: '仪表盘',
    };
    return names[module] || module;
}

/**
 * 生成系统提示词 - V4 架构
 * 
 * 核心原则：
 * 1. 简单查询 → 直接调用 crm.* 或 db.query
 * 2. 复杂任务 → 先用 map.search 找地图
 * 3. AI 绝不编造数据，所有数据必须来自工具返回
 */
export async function generateSystemPrompt(
    context?: PageContext,
    contextPack?: ContextPack
): Promise<string> {
    // 动态加载所有工具描述
    const { generateAllToolsPrompt } = await import('../tools/registry');
    const toolsPrompt = await generateAllToolsPrompt();

    // 获取当前模块提示
    const moduleHint = context?.module
        ? `用户当前在「${getModuleName(context.module)}」模块。`
        : '';

    // 生成用户记忆上下文片段
    const userContextSection = contextPack
        ? contextBootstrapService.formatContextForPrompt(contextPack)
        : '';

    return `你是 DHS Atlas 系统的 AI 助手。

${userContextSection ? `## 用户上下文\n${userContextSection}\n` : ''}
## 当前场景
${moduleHint}

## 工作原则（必须遵守）

### 1. 任务分类
- **简单查询**：查客户、查项目、查联系人 → 直接调用对应工具
- **复杂任务**：生成合同、多步骤操作 → 先用 map.search 找业务地图

### 2. 数据来源（最高原则）
⚠️ **你绝对不能编造任何数据！**
- 所有数据必须来自工具返回
- 工具没返回的数据，就说"未查到"
- 禁止猜测、推断、虚构任何信息

### 3. 工具选择

**简单查询（直接执行）**：
- 查客户详情 → crm.client_detail
- 查客户联系人 → crm.client_contacts  
- 查客户项目 → crm.client_projects
- 查所有项目 → project.list
- 查员工 → crm.employees
- 查服务定价 → pricing.services
- 通用查询 → db.query

**需要地图的任务（先 map.search，然后执行完所有步骤）**：
- 查客户**报价单/价格单** → map.search("报价单")
- 生成合同 → map.search("生成合同")
- 财务概览 → map.search("财务")

⚠️ **地图任务必须执行完所有步骤！**
找到地图后，按 examples 中的示例**依次执行每个步骤**，用上一步的返回值作为下一步的参数。
不要只执行第一步就停止！必须完成地图中的所有步骤后再回复用户。

### 4. 工具调用格式
\`\`\`tool_call
{"toolId": "工具ID", "params": {参数对象}}
\`\`\`

## 可用工具

${toolsPrompt}

## 回复规范
- 调用工具后，直接用工具返回的数据回复
- 使用 Markdown 表格格式化数据
- 如果工具返回空，诚实告诉用户"未找到相关数据"
- 简洁自然，像同事聊天
`;
}


