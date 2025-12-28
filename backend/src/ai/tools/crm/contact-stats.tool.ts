/**
 * 联系人统计工具
 * 
 * 直接返回聚合好的统计数据，避免 AI 幻觉
 */

import { z } from 'zod';
import mongoose from 'mongoose';
import type { ToolDefinition, ToolContext, ToolResult } from '../types';

const paramsSchema = z.object({
    clientName: z.string().describe('客户名称（支持模糊匹配）'),
    includeAmount: z.boolean().default(false).describe('是否包含金额统计'),
});

type ContactStatsParams = z.infer<typeof paramsSchema>;

interface ContactStat {
    name: string;
    projectCount: number;
    projects: string[];
    totalAmount?: number;
}

export const contactStatsTool: ToolDefinition<ContactStatsParams> = {
    id: 'crm.contact_stats',
    name: '联系人项目统计',
    description: '统计某客户下各联系人的项目数量和金额，返回聚合好的数据',
    category: 'crm',
    requiresConfirmation: false,
    paramsSchema,

    async execute(params: ContactStatsParams, _context: ToolContext): Promise<ToolResult> {
        const { clientName, includeAmount } = params;

        try {
            const db = mongoose.connection.db;
            if (!db) throw new Error('数据库未连接');

            // 1. 查询该客户的所有项目
            const projects = await db.collection('projects').find({
                clientName: { $regex: clientName, $options: 'i' }
            }).toArray();

            if (projects.length === 0) {
                return {
                    success: true,
                    data: {
                        clientName,
                        message: '未找到该客户的项目',
                        contacts: [],
                        summary: { totalContacts: 0, totalProjects: 0 }
                    }
                };
            }

            // 2. 统计联系人
            const contactMap = new Map<string, ContactStat>();

            for (const project of projects) {
                const contactNames = project.contactNames || [];
                for (const name of contactNames) {
                    if (!contactMap.has(name)) {
                        contactMap.set(name, {
                            name,
                            projectCount: 0,
                            projects: [],
                            totalAmount: 0,
                        });
                    }
                    const stat = contactMap.get(name)!;
                    stat.projectCount++;
                    stat.projects.push(project.projectName);
                }
            }

            // 3. 如果需要金额统计，查询结算表
            if (includeAmount) {
                const projectIds = projects.map(p => p._id);
                const settlements = await db.collection('settlements').find({
                    projectId: { $in: projectIds }
                }).toArray();

                // 建立 projectId -> amount 映射
                const amountMap = new Map<string, number>();
                for (const s of settlements) {
                    const pid = s.projectId?.toString();
                    if (pid) {
                        amountMap.set(pid, (amountMap.get(pid) || 0) + (s.totalAmount || 0));
                    }
                }

                // 关联到联系人
                for (const project of projects) {
                    const amount = amountMap.get(project._id.toString()) || 0;
                    const contactNames = project.contactNames || [];
                    for (const name of contactNames) {
                        const stat = contactMap.get(name);
                        if (stat) {
                            stat.totalAmount = (stat.totalAmount || 0) + amount;
                        }
                    }
                }
            }

            // 4. 转换为数组并排序
            const contacts = Array.from(contactMap.values())
                .sort((a, b) => b.projectCount - a.projectCount);

            // 5. 计算总结
            const topByCount = contacts[0];
            const topByAmount = includeAmount 
                ? contacts.reduce((a, b) => (a.totalAmount || 0) > (b.totalAmount || 0) ? a : b)
                : null;

            return {
                success: true,
                data: {
                    clientName: projects[0]?.clientName || clientName,
                    contacts: contacts.map(c => ({
                        name: c.name,
                        projectCount: c.projectCount,
                        projects: c.projects.join(', '),
                        ...(includeAmount && { totalAmount: c.totalAmount }),
                    })),
                    summary: {
                        totalContacts: contacts.length,
                        totalProjects: projects.length,
                        topByProjectCount: topByCount ? `${topByCount.name}（${topByCount.projectCount}个项目）` : null,
                        ...(includeAmount && topByAmount && {
                            totalAmount: contacts.reduce((sum, c) => sum + (c.totalAmount || 0), 0),
                            topByAmount: `${topByAmount.name}（¥${topByAmount.totalAmount}）`,
                        }),
                    }
                }
            };

        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'STATS_ERROR',
                    message: error instanceof Error ? error.message : '统计失败',
                }
            };
        }
    },
};

