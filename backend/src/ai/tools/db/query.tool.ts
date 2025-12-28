/**
 * 通用数据库查询工具
 * 
 * 让 AI 直接执行 MongoDB 查询
 */

import { z } from 'zod';
import mongoose from 'mongoose';
import type { ToolDefinition, ToolContext, ToolResult } from '../types';

// 允许查询的集合（白名单，安全考虑）
const ALLOWED_COLLECTIONS = [
    'clients',
    'projects', 
    'quotations',
    'clientcategories',
    'invoices',
    'settlements',
];

// 禁止的操作（安全考虑）
const FORBIDDEN_OPERATIONS = ['$where', '$function'];

// Zod schema - 简化版本
const paramsSchema = z.object({
    collection: z.string(),
    operation: z.enum(['find', 'findOne', 'count', 'aggregate']),
    query: z.object({}).passthrough().optional(),
    projection: z.object({}).passthrough().optional(),
    sort: z.object({}).passthrough().optional(),
    limit: z.number().default(10),
    pipeline: z.array(z.object({}).passthrough()).optional(),
});

type DbQueryParams = z.infer<typeof paramsSchema>;

export const dbQueryTool: ToolDefinition<DbQueryParams> = {
    id: 'db.query',
    name: '数据库查询',
    description: '执行 MongoDB 查询，获取数据',
    category: 'database',
    requiresConfirmation: false,
    paramsSchema,

    async execute(params: DbQueryParams, _context: ToolContext): Promise<ToolResult> {
        const { 
            collection, 
            operation, 
            query = {}, 
            projection,
            sort,
            limit = 10,
            pipeline,
        } = params;

        // 安全检查：集合白名单
        if (!ALLOWED_COLLECTIONS.includes(collection)) {
            return {
                success: false,
                error: {
                    code: 'FORBIDDEN_COLLECTION',
                    message: `不允许查询集合 "${collection}"，允许的集合：${ALLOWED_COLLECTIONS.join(', ')}`,
                },
            };
        }

        // 安全检查：禁止危险操作
        const queryStr = JSON.stringify(query);
        for (const forbidden of FORBIDDEN_OPERATIONS) {
            if (queryStr.includes(forbidden)) {
                return {
                    success: false,
                    error: {
                        code: 'FORBIDDEN_OPERATION',
                        message: `查询包含禁止的操作：${forbidden}`,
                    },
                };
            }
        }

        try {
            const db = mongoose.connection.db;
            if (!db) {
                return { 
                    success: false, 
                    error: { code: 'DB_NOT_CONNECTED', message: '数据库未连接' },
                };
            }

            const coll = db.collection(collection);
            let result: unknown;

            switch (operation) {
                case 'find':
                    result = await coll
                        .find(query as object, { projection: projection as object })
                        .sort(sort as object || {})
                        .limit(Math.min(limit, 50))
                        .toArray();
                    break;

                case 'findOne':
                    result = await coll.findOne(query as object, { projection: projection as object });
                    break;

                case 'count':
                    result = await coll.countDocuments(query as object);
                    break;

                case 'aggregate':
                    if (!pipeline) {
                        return { 
                            success: false, 
                            error: { code: 'MISSING_PIPELINE', message: 'aggregate 需要 pipeline 参数' },
                        };
                    }
                    result = await coll.aggregate(pipeline as object[]).toArray();
                    break;

                default:
                    return { 
                        success: false, 
                        error: { code: 'UNSUPPORTED_OP', message: `不支持的操作：${operation}` },
                    };
            }

            return {
                success: true,
                data: result,
                message: operation === 'count' 
                    ? `共 ${result} 条记录`
                    : Array.isArray(result) 
                        ? `查询到 ${result.length} 条记录`
                        : result ? '查询成功' : '未找到数据',
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

