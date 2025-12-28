/**
 * AI 能力查询工具
 * 
 * 让 AI 查询自己有什么工具、数据模型、输出样例
 */

import { z } from 'zod';
import AiTool from '../../../models/AiToolkit';
import AiDataModel from '../../../models/AiDataModel';
import AiTemplate from '../../../models/AiTemplate';
import type { ToolDefinition, ToolContext, ToolResult } from '../types';

const paramsSchema = z.object({
    type: z.enum(['tools', 'models', 'templates', 'all']).default('all').describe('查询类型'),
    keyword: z.string().optional().describe('关键词过滤'),
});

type CapabilitiesParams = z.infer<typeof paramsSchema>;

export const aiCapabilitiesTool: ToolDefinition<CapabilitiesParams> = {
    id: 'ai.capabilities',
    name: 'AI能力查询',
    description: '查询 AI 可用的工具、数据模型、输出样例',
    category: 'ai',
    requiresConfirmation: false,
    paramsSchema,

    async execute(params: CapabilitiesParams, _context: ToolContext): Promise<ToolResult> {
        const { type, keyword } = params;
        const result: Record<string, unknown> = {};

        try {
            // 查询工具
            if (type === 'tools' || type === 'all') {
                const query: Record<string, unknown> = { enabled: true };
                if (keyword) {
                    query.$or = [
                        { name: { $regex: keyword, $options: 'i' } },
                        { description: { $regex: keyword, $options: 'i' } },
                    ];
                }
                const tools = await AiTool.find(query).sort({ order: 1 }).lean();
                result.tools = tools.map(t => ({
                    toolId: t.toolId,
                    name: t.name,
                    description: t.description,
                    usage: t.usage,
                    examples: t.examples,
                }));
            }

            // 查询数据模型
            if (type === 'models' || type === 'all') {
                const query: Record<string, unknown> = { enabled: true };
                if (keyword) {
                    query.$or = [
                        { name: { $regex: keyword, $options: 'i' } },
                        { collection: { $regex: keyword, $options: 'i' } },
                    ];
                }
                const models = await AiDataModel.find(query).sort({ order: 1 }).lean();
                result.dataModels = models.map(m => ({
                    collection: m.collection,
                    name: m.name,
                    description: m.description,
                    fields: m.fields,
                    relations: m.relations,
                    queryExamples: m.queryExamples,
                }));
            }

            // 查询样例模板
            if (type === 'templates' || type === 'all') {
                const query: Record<string, unknown> = { enabled: true };
                if (keyword) {
                    query.$or = [
                        { name: { $regex: keyword, $options: 'i' } },
                        { scenario: { $regex: keyword, $options: 'i' } },
                        { tags: { $regex: keyword, $options: 'i' } },
                    ];
                }
                const templates = await AiTemplate.find(query).sort({ order: 1 }).lean();
                result.templates = templates.map(t => ({
                    templateId: t.templateId,
                    name: t.name,
                    scenario: t.scenario,
                    template: t.template,
                    tags: t.tags,
                }));
            }

            return {
                success: true,
                data: result,
                message: '查询成功',
            };

        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'QUERY_FAILED',
                    message: `查询失败：${error instanceof Error ? error.message : '未知错误'}`,
                },
            };
        }
    },
};

