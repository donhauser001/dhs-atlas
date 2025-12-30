/**
 * 记忆控制器
 * 
 * 处理暂存记忆和关键记忆的 API 请求
 */

import { Request, Response } from 'express';
import { stagingMemoryService } from '../services/StagingMemoryService';
import { keyMemoryService } from '../services/KeyMemoryService';
import { contextBootstrapService } from '../services/ContextBootstrapService';
import { MemoryType } from '../models/StagingMemory';

/**
 * 获取请求中的用户 ID
 */
function getUserId(req: Request): string {
    return (req as any).userId || 'anonymous';
}

/**
 * 记忆控制器
 */
class MemoryController {
    // =========================================================================
    // 暂存记忆 API
    // =========================================================================

    /**
     * 获取用户的暂存记忆
     * GET /api/memory/staging
     */
    async getStagingMemories(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            const { status, type } = req.query;

            const memories = await stagingMemoryService.getUserStagingMemories(userId, {
                status: status as any,
                type: type as MemoryType,
            });

            return res.json({
                success: true,
                data: memories,
            });
        } catch (error) {
            console.error('[MemoryController] 获取暂存记忆失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取暂存记忆失败',
            });
        }
    }

    /**
     * 获取单条暂存记忆
     * GET /api/memory/staging/:id
     */
    async getStagingMemoryById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const memory = await stagingMemoryService.getById(id);

            if (!memory) {
                return res.status(404).json({
                    success: false,
                    error: '暂存记忆不存在',
                });
            }

            return res.json({
                success: true,
                data: memory,
            });
        } catch (error) {
            console.error('[MemoryController] 获取暂存记忆详情失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取暂存记忆详情失败',
            });
        }
    }

    /**
     * 提升为关键记忆
     * POST /api/memory/staging/:id/promote
     */
    async promoteMemory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await stagingMemoryService.promoteToKeyMemory(id);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    error: '暂存记忆不存在',
                });
            }

            return res.json({
                success: true,
                data: result,
                message: '记忆已提升为关键记忆',
            });
        } catch (error) {
            console.error('[MemoryController] 提升记忆失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '提升记忆失败',
            });
        }
    }

    /**
     * 批量提升为关键记忆
     * POST /api/memory/staging/promote-batch
     */
    async promoteBatch(req: Request, res: Response) {
        try {
            const { ids } = req.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '请提供要提升的记忆 ID 列表',
                });
            }

            const result = await stagingMemoryService.promoteMultiple(ids);

            return res.json({
                success: true,
                data: result,
                message: `成功提升 ${result.success.length} 条记忆`,
            });
        } catch (error) {
            console.error('[MemoryController] 批量提升记忆失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '批量提升记忆失败',
            });
        }
    }

    /**
     * 拒绝暂存记忆
     * POST /api/memory/staging/:id/reject
     */
    async rejectMemory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const memory = await stagingMemoryService.rejectMemory(id);

            if (!memory) {
                return res.status(404).json({
                    success: false,
                    error: '暂存记忆不存在',
                });
            }

            return res.json({
                success: true,
                data: memory,
                message: '已拒绝该记忆',
            });
        } catch (error) {
            console.error('[MemoryController] 拒绝记忆失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '拒绝记忆失败',
            });
        }
    }

    /**
     * 删除暂存记忆
     * DELETE /api/memory/staging/:id
     */
    async deleteStagingMemory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await stagingMemoryService.deleteMemory(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: '暂存记忆不存在',
                });
            }

            return res.json({
                success: true,
                message: '已删除暂存记忆',
            });
        } catch (error) {
            console.error('[MemoryController] 删除暂存记忆失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '删除暂存记忆失败',
            });
        }
    }

    /**
     * 获取暂存记忆统计
     * GET /api/memory/staging/stats
     */
    async getStagingStats(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            const stats = await stagingMemoryService.getStats(userId);

            return res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            console.error('[MemoryController] 获取暂存记忆统计失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取统计失败',
            });
        }
    }

    // =========================================================================
    // 关键记忆 API
    // =========================================================================

    /**
     * 获取用户的关键记忆
     * GET /api/memory/key
     */
    async getKeyMemories(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            const { type, activeOnly } = req.query;

            const memories = await keyMemoryService.getUserKeyMemories(userId, {
                type: type as MemoryType,
                activeOnly: activeOnly !== 'false',
            });

            return res.json({
                success: true,
                data: memories,
            });
        } catch (error) {
            console.error('[MemoryController] 获取关键记忆失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取关键记忆失败',
            });
        }
    }

    /**
     * 获取用户记忆（按类型分组）
     * GET /api/memory/key/grouped
     */
    async getKeyMemoriesGrouped(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            const { activeOnly } = req.query;

            const grouped = await keyMemoryService.getUserMemoriesGrouped(
                userId,
                activeOnly !== 'false'
            );

            return res.json({
                success: true,
                data: grouped,
            });
        } catch (error) {
            console.error('[MemoryController] 获取分组记忆失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取分组记忆失败',
            });
        }
    }

    /**
     * 获取单条关键记忆
     * GET /api/memory/key/:id
     */
    async getKeyMemoryById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const memory = await keyMemoryService.getById(id);

            if (!memory) {
                return res.status(404).json({
                    success: false,
                    error: '关键记忆不存在',
                });
            }

            return res.json({
                success: true,
                data: memory,
            });
        } catch (error) {
            console.error('[MemoryController] 获取关键记忆详情失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取关键记忆详情失败',
            });
        }
    }

    /**
     * 添加关键记忆
     * POST /api/memory/key
     */
    async addKeyMemory(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            const { content, memoryType } = req.body;

            if (!content || !memoryType) {
                return res.status(400).json({
                    success: false,
                    error: '请提供 content 和 memoryType',
                });
            }

            const memory = await keyMemoryService.addKeyMemory({
                userId,
                content,
                memoryType,
                source: 'user_input',
            });

            return res.status(201).json({
                success: true,
                data: memory,
                message: '关键记忆添加成功',
            });
        } catch (error) {
            console.error('[MemoryController] 添加关键记忆失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '添加关键记忆失败',
            });
        }
    }

    /**
     * 更新关键记忆
     * PUT /api/memory/key/:id
     */
    async updateKeyMemory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { content, memoryType, isActive } = req.body;

            const memory = await keyMemoryService.updateKeyMemory(id, {
                content,
                memoryType,
                isActive,
            });

            if (!memory) {
                return res.status(404).json({
                    success: false,
                    error: '关键记忆不存在',
                });
            }

            return res.json({
                success: true,
                data: memory,
                message: '关键记忆更新成功',
            });
        } catch (error) {
            console.error('[MemoryController] 更新关键记忆失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '更新关键记忆失败',
            });
        }
    }

    /**
     * 删除关键记忆
     * DELETE /api/memory/key/:id
     */
    async deleteKeyMemory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await keyMemoryService.deleteKeyMemory(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: '关键记忆不存在',
                });
            }

            return res.json({
                success: true,
                message: '已删除关键记忆',
            });
        } catch (error) {
            console.error('[MemoryController] 删除关键记忆失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '删除关键记忆失败',
            });
        }
    }

    /**
     * 获取关键记忆统计
     * GET /api/memory/key/stats
     */
    async getKeyStats(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            const stats = await keyMemoryService.getStats(userId);

            return res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            console.error('[MemoryController] 获取关键记忆统计失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取统计失败',
            });
        }
    }

    /**
     * 搜索记忆
     * GET /api/memory/key/search
     */
    async searchKeyMemories(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            const { keyword, page, limit } = req.query;

            if (!keyword) {
                return res.status(400).json({
                    success: false,
                    error: '请提供搜索关键词',
                });
            }

            const result = await keyMemoryService.search(userId, keyword as string, {
                page: parseInt(page as string) || 1,
                limit: parseInt(limit as string) || 20,
            });

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            console.error('[MemoryController] 搜索记忆失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '搜索失败',
            });
        }
    }

    // =========================================================================
    // 上下文 API
    // =========================================================================

    /**
     * 执行上下文初始化
     * POST /api/context/bootstrap
     */
    async bootstrap(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            const { sessionId, options } = req.body;

            const contextPack = await contextBootstrapService.bootstrap(
                userId,
                sessionId,
                options
            );

            return res.json({
                success: true,
                data: contextPack,
            });
        } catch (error) {
            console.error('[MemoryController] 上下文初始化失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '上下文初始化失败',
            });
        }
    }

    /**
     * 获取当前上下文包
     * GET /api/context/current
     */
    async getCurrentContext(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            const contextPack = await contextBootstrapService.getCurrentContextPack(userId);

            return res.json({
                success: true,
                data: contextPack,
            });
        } catch (error) {
            console.error('[MemoryController] 获取当前上下文失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取当前上下文失败',
            });
        }
    }

    /**
     * 获取格式化的上下文提示词片段
     * GET /api/context/prompt
     */
    async getContextPrompt(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            const contextPack = await contextBootstrapService.bootstrap(userId);
            const prompt = contextBootstrapService.formatContextForPrompt(contextPack);

            return res.json({
                success: true,
                data: {
                    prompt,
                    meta: contextPack.meta,
                },
            });
        } catch (error) {
            console.error('[MemoryController] 获取上下文提示词失败:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取上下文提示词失败',
            });
        }
    }
}

export default new MemoryController();

