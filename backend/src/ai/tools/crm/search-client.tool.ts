/**
 * CRM 工具：搜索客户
 */

import { z } from 'zod';
import Client from '../../../models/Client';
import type { ToolDefinition, ToolResult, ToolContext } from '../types';

const paramsSchema = z.object({
    /** 搜索关键词 */
    query: z.string().min(1, '搜索关键词不能为空'),
    /** 最大返回数量 */
    limit: z.number().min(1).max(50).default(10),
});

type SearchClientParams = z.infer<typeof paramsSchema>;

interface ClientSummary {
    id: string;
    name: string;
    shortName?: string;
    type: string;
    contactName?: string;
    contactPhone?: string;
}

interface SearchClientResult {
    total: number;
    clients: ClientSummary[];
}

export const searchClientTool: ToolDefinition<SearchClientParams, SearchClientResult> = {
    id: 'crm.search_client',
    name: '搜索客户',
    description: `在数据库中搜索客户。
使用场景：
- 用户问"有没有叫 XX 的客户"
- 用户说"查一下 XX 公司"
- 在创建客户前先检查是否已存在
- 需要找到特定客户时`,
    module: 'crm',
    paramsSchema,
    requiresConfirmation: false, // 查询操作不需要确认
    permissions: ['client:read'],

    async execute(params: SearchClientParams, _context: ToolContext): Promise<ToolResult<SearchClientResult>> {
        try {
            const regex = new RegExp(params.query, 'i');

            const clients = await Client.find({
                $or: [
                    { name: regex },
                    { shortName: regex },
                    { 'contacts.name': regex },
                    { 'contacts.phone': regex },
                ],
            })
                .limit(params.limit)
                .select('name shortName type contacts')
                .lean();

            const results: ClientSummary[] = clients.map(c => {
                const primaryContact = c.contacts?.find((contact: { isPrimary?: boolean }) => contact.isPrimary) || c.contacts?.[0];
                return {
                    id: c._id.toString(),
                    name: c.name,
                    shortName: c.shortName,
                    type: c.type,
                    contactName: primaryContact?.name,
                    contactPhone: primaryContact?.phone,
                };
            });

            return {
                success: true,
                data: {
                    total: results.length,
                    clients: results,
                },
                uiSuggestion: results.length > 0 ? {
                    componentId: 'AiList',
                    props: {
                        title: `找到 ${results.length} 个客户`,
                        items: results,
                        selectable: true,
                    },
                } : undefined,
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'SEARCH_FAILED',
                    message: error instanceof Error ? error.message : '搜索失败',
                },
            };
        }
    },
};

