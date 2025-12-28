/**
 * CRM 工具：创建客户
 * 
 * 这是一个真正的工具，由 AI 决定何时调用。
 */

import { z } from 'zod';
import Client from '../../../models/Client';
import type { ToolDefinition, ToolResult, ToolContext } from '../types';

// 参数 Schema
const paramsSchema = z.object({
    /** 客户名称（必填） */
    name: z.string().min(1, '客户名称不能为空'),
    /** 客户简称 */
    shortName: z.string().optional(),
    /** 客户类型 */
    type: z.enum(['企业', '个人', '政府', '其他']).default('企业'),
    /** 联系人姓名 */
    contactName: z.string().optional(),
    /** 联系电话 */
    contactPhone: z.string().optional(),
    /** 联系邮箱 */
    contactEmail: z.string().email().optional().or(z.literal('')),
    /** 地址 */
    address: z.string().optional(),
    /** 备注 */
    notes: z.string().optional(),
});

type CreateClientParams = z.infer<typeof paramsSchema>;

interface CreateClientResult {
    clientId: string;
    name: string;
    type: string;
}

/**
 * 创建客户工具定义
 */
export const createClientTool: ToolDefinition<CreateClientParams, CreateClientResult> = {
    id: 'crm.create_client',
    name: '创建客户',
    description: `创建一个新的客户记录。
使用场景：
- 用户说"帮我创建一个客户"
- 用户说"新建客户 XX 公司"
- 需要在系统中录入新客户时

必须提供客户名称，其他字段可选。`,
    module: 'crm',
    paramsSchema,
    requiresConfirmation: true, // 创建操作需要用户确认
    permissions: ['client:create'],

    async execute(params: CreateClientParams, context: ToolContext): Promise<ToolResult<CreateClientResult>> {
        try {
            // 检查客户是否已存在
            const existing = await Client.findOne({ name: params.name });
            if (existing) {
                return {
                    success: false,
                    error: {
                        code: 'CLIENT_EXISTS',
                        message: `客户 "${params.name}" 已存在`,
                    },
                    // 建议查看现有客户
                    uiSuggestion: {
                        componentId: 'AiDetails',
                        props: {
                            title: '客户已存在',
                            data: {
                                id: existing._id.toString(),
                                name: existing.name,
                                type: existing.type,
                            },
                            actions: ['view', 'edit'],
                        },
                    },
                };
            }

            // 创建客户
            const client = new Client({
                name: params.name,
                shortName: params.shortName || params.name.substring(0, 10),
                type: params.type,
                contacts: params.contactName ? [{
                    name: params.contactName,
                    phone: params.contactPhone,
                    email: params.contactEmail,
                    isPrimary: true,
                }] : [],
                address: params.address,
                notes: params.notes,
                createdBy: context.userId,
            });

            await client.save();

            return {
                success: true,
                data: {
                    clientId: client._id.toString(),
                    name: client.name,
                    type: client.type,
                },
                artifacts: {
                    id: client._id.toString(),
                    type: 'client',
                    name: client.name,
                },
                nextHints: [
                    '为这个客户创建报价单',
                    '添加更多联系人',
                    '创建合同',
                ],
                uiSuggestion: {
                    componentId: 'AiDetails',
                    props: {
                        title: '客户创建成功',
                        data: {
                            id: client._id.toString(),
                            name: client.name,
                            type: client.type,
                            contactName: params.contactName,
                        },
                        actions: ['view', 'createQuote', 'createContract'],
                    },
                },
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'CREATE_FAILED',
                    message: error instanceof Error ? error.message : '创建客户失败',
                },
            };
        }
    },
};

