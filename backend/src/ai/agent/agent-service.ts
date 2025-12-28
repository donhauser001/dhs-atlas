/**
 * Agent Service - AI 代理服务
 * 
 * 工作流：
 * 1. 入口：AI 地图 - 根据用户提问匹配地图，获取执行路径
 * 2. 中间：工具/数据库 - 按地图步骤调用工具
 * 3. 出口：样例模板 - 按模板格式化输出
 */

import { v4 as uuidv4 } from 'uuid';
import AiModel from '../../models/AiModel';
import AiMap from '../../models/AiMap';
import AiTool from '../../models/AiToolkit';
import AiDataModel from '../../models/AiDataModel';
import AiTemplate from '../../models/AiTemplate';
import { toolRegistry } from '../tools';
import type { ToolContext, ToolCallRequest, ToolResult } from '../tools/types';
import type {
    AgentRequest,
    AgentResponse,
    AgentMessage,
    PageContext,
    UISpec,
    PredictedAction,
} from './types';

/**
 * 根据页面模块获取角色定义
 */
function getRoleByModule(module?: string): { role: string; abilities: string[] } {
    const roles: Record<string, { role: string; abilities: string[] }> = {
        clients: {
            role: '客户服务专员',
            abilities: ['新建客户', '搜索/查询客户', '编辑客户信息', '查看客户关联的项目、合同、报价'],
        },
        projects: {
            role: '项目管理专员',
            abilities: ['新建项目', '搜索/查询项目', '编辑项目信息', '查看项目关联的客户、合同'],
        },
        contracts: {
            role: '合同管理专员',
            abilities: ['新建合同', '搜索/查询合同', '编辑合同信息'],
        },
    };

    return roles[module || ''] || {
        role: '业务助手',
        abilities: ['协助处理各类业务'],
    };
}

/**
 * 根据用户消息匹配 AI 地图
 */
async function matchAiMap(message: string, module?: string): Promise<{
    map: any | null;
    tools: any[];
    dataModels: any[];
    templates: any[];
}> {
    // 1. 查询所有启用的地图
    const maps = await AiMap.find({ enabled: true }).sort({ priority: -1 });

    // 2. 匹配地图（关键词匹配）
    // 模块映射：将页面模块映射到地图模块
    const moduleMapping: Record<string, string[]> = {
        clients: ['crm', 'clients', 'general'],
        projects: ['project', 'projects', 'general'],
        contracts: ['contract', 'contracts', 'general'],
    };
    const allowedModules = moduleMapping[module || ''] || ['general'];

    let matchedMap = null;
    for (const map of maps) {
        // 检查模块是否匹配
        if (!allowedModules.includes(map.module)) {
            continue;
        }
        // 检查触发词
        for (const trigger of map.triggers || []) {
            if (message.includes(trigger)) {
                matchedMap = map;
                console.log(`[Agent] 触发词匹配: "${trigger}" in "${message}"`);
                break;
            }
        }
        if (matchedMap) break;
    }

    // 3. 如果没有匹配到特定地图，返回空
    if (!matchedMap) {
        // 返回基础工具和数据模型
        const tools = await AiTool.find({ enabled: true });
        const dataModels = await AiDataModel.find({ enabled: true });
        const templates = await AiTemplate.find({ enabled: true });
        return { map: null, tools, dataModels, templates };
    }

    // 4. 根据地图步骤获取相关工具、数据模型、模板
    const toolIds = new Set<string>();
    const dataModelIds = new Set<string>();
    const templateIds = new Set<string>();

    for (const step of matchedMap.steps || []) {
        if (step.toolId) toolIds.add(step.toolId);
        if (step.dataModel) dataModelIds.add(step.dataModel);
        if (step.templateId) templateIds.add(step.templateId);
    }

    const tools = await AiTool.find({
        $or: [
            { toolId: { $in: Array.from(toolIds) } },
            { enabled: true }  // 也包含所有启用的工具
        ]
    });
    const dataModels = await AiDataModel.find({
        $or: [
            { collection: { $in: Array.from(dataModelIds) } },
            { enabled: true }
        ]
    });
    const templates = await AiTemplate.find({
        $or: [
            { templateId: { $in: Array.from(templateIds) } },
            { enabled: true }
        ]
    });

    return { map: matchedMap, tools, dataModels, templates };
}

/**
 * 生成系统提示词 - 基于 AI 地图
 */
function generateSystemPrompt(
    context: PageContext | undefined,
    mapInfo: {
        map: any | null;
        tools: any[];
        dataModels: any[];
        templates: any[];
    }
): string {
    const { role, abilities } = getRoleByModule(context?.module);
    const { map, tools, dataModels, templates } = mapInfo;

    // 构建工具说明
    const toolsSection = tools.map(t =>
        `### ${t.name} (${t.toolId})\n${t.description}\n\n**调用方式:**\n${t.usage}`
    ).join('\n\n');

    // 构建数据模型说明
    const dataModelsSection = dataModels.map(m =>
        `### ${m.name} (${m.collection})\n${m.description || ''}\n\n**字段:**\n${m.fields}\n\n**关联:**\n${m.relations || '无'}`
    ).join('\n\n');

    // 构建输出模板说明
    const templatesSection = templates.map(t =>
        `### ${t.name} (${t.templateId})\n**场景:** ${t.scenario}\n\n**模板:**\n${t.template}`
    ).join('\n\n');

    // 如果匹配到地图，构建执行路径
    let mapSection = '';
    if (map) {
        const stepsDesc = map.steps.map((s: any) => {
            let desc = `${s.order}. ${s.action}`;
            if (s.toolId) desc += ` (工具: ${s.toolId})`;
            if (s.dataModel) desc += ` (数据: ${s.dataModel})`;
            if (s.templateId) desc += ` (模板: ${s.templateId})`;
            if (s.condition) desc += ` [条件: ${s.condition}]`;
            return desc;
        }).join('\n');

        mapSection = `
## 🗺️ 当前任务地图: ${map.name}

**场景:** ${map.description}

**执行步骤:**
${stepsDesc}

${map.examples ? `**参考示例:**\n${map.examples}` : ''}

---
请严格按照上述步骤执行，使用指定的工具和模板。
`;
    }

    return `你是「${role}」。

## 你的能力
${abilities.map(a => `- ${a}`).join('\n')}
${mapSection}
## 可用工具

${toolsSection}

## 数据库结构

${dataModelsSection}

## 输出模板

请参考以下模板格式化输出：

${templatesSection}

## 输出规范
- 使用 **Markdown** 格式
- 表格数据用 Markdown 表格
- 回复简短自然，像同事聊天
- 每次回复必须包含文字说明
- 查询结果请按模板格式输出

## ⚠️ 重要约束
- **禁止编造数据**：只能使用工具返回的真实数据，不能虚构任何信息
- **禁止猜测**：如果数据不完整，明确告知用户"该字段无数据"
- **引用原始数据**：输出时必须基于工具返回的 JSON 数据
- **无数据时诚实回答**：如果查询结果为空，直接说"未找到相关数据"
`;
}

/**
 * 调用 LLM
 */
async function callLLM(
    systemPrompt: string,
    messages: AgentMessage[]
): Promise<string> {
    const defaultModel = await AiModel.findOne({ isDefault: true, isEnabled: true })
        .select('+apiKey');

    if (!defaultModel) {
        throw new Error('未配置默认 AI 模型，请先在「系统设置 > AI 设置」中添加并设为默认');
    }

    console.log('[Agent] 使用模型:', defaultModel.provider, defaultModel.model);

    const openaiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
            role: m.role === 'tool' ? 'assistant' : m.role,
            content: m.role === 'tool'
                ? `工具执行结果: ${JSON.stringify(m.toolResult)}`
                : m.content,
        })),
    ];

    let apiUrl = defaultModel.baseUrl || '';
    apiUrl = apiUrl.replace(/\/+$/, '');
    if (!apiUrl.endsWith('/v1')) {
        apiUrl = `${apiUrl}/v1`;
    }
    apiUrl = `${apiUrl}/chat/completions`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(defaultModel.apiKey && { 'Authorization': `Bearer ${defaultModel.apiKey}` }),
        },
        body: JSON.stringify({
            model: defaultModel.model,
            messages: openaiMessages,
            temperature: defaultModel.temperature ?? 0.7,
            max_tokens: defaultModel.maxTokens ?? 2048,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API 错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || '';
}

/**
 * 解析 LLM 响应中的工具调用
 */
function parseToolCalls(content: string): ToolCallRequest[] {
    const toolCalls: ToolCallRequest[] = [];
    const regex = /```tool_call\s*([\s\S]*?)```/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
        try {
            const parsed = JSON.parse(match[1].trim());
            if (parsed.toolId) {
                toolCalls.push({
                    toolId: parsed.toolId,
                    params: parsed.params || {},
                    requestId: uuidv4(),
                });
            }
        } catch (e) {
            console.warn('[Agent] 无法解析工具调用:', match[1]);
        }
    }

    return toolCalls;
}

/**
 * 解析 LLM 响应中的 UI 表单指令
 */
function parseUIForm(content: string): UISpec | null {
    const regex = /```ui_form\s*([\s\S]*?)```/g;
    const match = regex.exec(content);

    if (!match) return null;

    try {
        const formSpec = JSON.parse(match[1].trim());
        return {
            componentId: 'AiForm',
            props: {
                formId: formSpec.formId,
                mode: formSpec.mode || 'create',
                title: formSpec.title,
                initialValues: formSpec.initialValues,
            },
            target: 'canvas',
        };
    } catch (e) {
        return null;
    }
}

/**
 * 解析预判指令
 */
function parsePredictedActions(content: string): PredictedAction[] {
    const regex = /```predicted_actions\s*([\s\S]*?)```/g;
    const match = regex.exec(content);

    if (!match) return [];

    try {
        const actions = JSON.parse(match[1].trim());
        return actions.map((a: Partial<PredictedAction>, index: number) => ({
            id: `pred-${index}`,
            type: a.type || 'question',
            label: a.label || '',
            prompt: a.prompt,
            toolId: a.toolId,
            params: a.params,
            confidence: a.confidence || 0.8,
            requiresConfirmation: a.type === 'execute' ? true : (a.requiresConfirmation ?? false),
        }));
    } catch (e) {
        return [];
    }
}

/**
 * 提取纯文本内容
 */
function extractTextContent(content: string): string {
    return content
        .replace(/```tool_call\s*[\s\S]*?```/g, '')
        .replace(/```predicted_actions\s*[\s\S]*?```/g, '')
        .replace(/```ui_form\s*[\s\S]*?```/g, '')
        .trim();
}

/**
 * 执行工具调用
 */
async function executeToolCalls(
    toolCalls: ToolCallRequest[],
    context: ToolContext
): Promise<Array<{ toolId: string; result: ToolResult }>> {
    const results: Array<{ toolId: string; result: ToolResult }> = [];

    for (const call of toolCalls) {
        const tool = toolRegistry.get(call.toolId);
        if (tool?.requiresConfirmation) continue;

        const result = await toolRegistry.execute(
            call.toolId,
            call.params,
            { ...context, requestId: call.requestId || uuidv4() }
        );
        results.push({ toolId: call.toolId, result });
    }

    return results;
}

/**
 * 合并工具结果中的 UI 建议
 */
function mergeUISpecs(
    toolResults: Array<{ toolId: string; result: ToolResult }>
): UISpec | undefined {
    for (let i = toolResults.length - 1; i >= 0; i--) {
        const { result } = toolResults[i];
        if (result.success && result.uiSuggestion) {
            return {
                componentId: result.uiSuggestion.componentId,
                props: result.uiSuggestion.props,
                target: 'canvas',
            };
        }
    }
    return undefined;
}

/**
 * Agent Service 主函数
 * 
 * 工作流：
 * 1. 匹配 AI 地图（入口）
 * 2. 生成带地图指引的系统提示词
 * 3. 调用 LLM
 * 4. 执行工具
 * 5. 返回结果（按模板格式化 - 出口）
 */
export async function processAgentRequest(
    request: AgentRequest
): Promise<AgentResponse> {
    const { message, history = [], context, userId, sessionId } = request;

    // 1. 匹配 AI 地图（入口）
    console.log('[Agent] 匹配 AI 地图...');
    const mapInfo = await matchAiMap(message, context?.module);

    if (mapInfo.map) {
        console.log('[Agent] 匹配到地图:', mapInfo.map.name);
    } else {
        console.log('[Agent] 未匹配到特定地图，使用通用模式');
    }

    // 2. 生成系统提示词（包含地图指引）
    const systemPrompt = generateSystemPrompt(context, mapInfo);

    // 3. 构建消息历史
    const messages: AgentMessage[] = [
        ...history,
        { role: 'user', content: message, timestamp: new Date() },
    ];

    // 4. 调用 LLM
    let llmResponse: string;
    try {
        llmResponse = await callLLM(systemPrompt, messages);
    } catch (error) {
        return {
            content: `抱歉，AI 服务暂时不可用。错误: ${error instanceof Error ? error.message : '未知错误'}`,
        };
    }

    console.log('[Agent] LLM 响应:', llmResponse.substring(0, 200) + '...');

    // 5. 解析工具调用
    const toolCalls = parseToolCalls(llmResponse);

    // 6. 分离需要确认和可直接执行的工具
    const pendingToolCalls: ToolCallRequest[] = [];
    const executableToolCalls: ToolCallRequest[] = [];

    for (const call of toolCalls) {
        const tool = toolRegistry.get(call.toolId);
        if (tool?.requiresConfirmation) {
            pendingToolCalls.push(call);
        } else {
            executableToolCalls.push(call);
        }
    }

    // 7. 执行工具
    const toolContext: ToolContext = {
        userId,
        sessionId,
        requestId: uuidv4(),
    };
    const toolResults = await executeToolCalls(executableToolCalls, toolContext);

    // 8. 如果有工具执行结果，再次调用 LLM 让它按模板格式化输出
    let finalResponse = llmResponse;
    if (toolResults.length > 0) {
        console.log('[Agent] 工具执行完成，请求 LLM 格式化输出...');

        // 构建包含工具结果的用户消息
        const toolResultsText = toolResults.map(r => {
            const data = r.result.success ? JSON.stringify(r.result.data, null, 2) : `错误: ${r.result.error?.message}`;
            return `[${r.toolId} 执行结果]:\n${data}`;
        }).join('\n\n');

        // 强调只能使用真实数据
        const formatMessages: AgentMessage[] = [
            ...messages,
            {
                role: 'user',
                content: `工具已执行完成，以下是【真实数据】：

${toolResultsText}

请严格基于上述【真实数据】进行格式化输出：
1. 只使用上面 JSON 中存在的字段和值
2. 不要编造任何数据（如联系人姓名、金额等）
3. 如果某字段为空或不存在，写"无数据"
4. 使用 Markdown 表格格式化输出`,
                timestamp: new Date(),
            },
        ];

        try {
            finalResponse = await callLLM(systemPrompt, formatMessages);
            console.log('[Agent] 格式化响应:', finalResponse.substring(0, 300) + '...');
        } catch (error) {
            console.warn('[Agent] 格式化调用失败，使用原始响应');
        }
    }

    // 9. 解析最终响应
    const predictedActions = parsePredictedActions(finalResponse);
    const formUISpec = parseUIForm(finalResponse);
    const textContent = extractTextContent(finalResponse);
    const uiSpec = formUISpec || mergeUISpecs(toolResults);

    return {
        content: textContent,
        toolResults: toolResults.length > 0 ? toolResults : undefined,
        uiSpec,
        predictedActions: predictedActions.length > 0 ? predictedActions : undefined,
        pendingToolCalls: pendingToolCalls.length > 0 ? pendingToolCalls : undefined,
    };
}

/**
 * 确认并执行待处理的工具调用
 */
export async function confirmAndExecuteTools(
    toolCalls: ToolCallRequest[],
    userId: string,
    sessionId?: string
): Promise<Array<{ toolId: string; result: ToolResult }>> {
    const context: ToolContext = {
        userId,
        sessionId,
        requestId: uuidv4(),
    };

    const results: Array<{ toolId: string; result: ToolResult }> = [];

    for (const call of toolCalls) {
        const result = await toolRegistry.execute(
            call.toolId,
            call.params,
            { ...context, requestId: call.requestId || uuidv4() }
        );
        results.push({ toolId: call.toolId, result });
    }

    return results;
}
