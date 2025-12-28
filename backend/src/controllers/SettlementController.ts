import { Request, Response } from 'express';
import SettlementService from '../services/SettlementService';

export class SettlementController {
    /**
     * 创建结算单
     */
    static async createSettlement(req: Request, res: Response) {
        try {
            const { projectId, items } = req.body;
            const userId = (req as any).user?.userId || 'system';

            if (!projectId) {
                return res.status(400).json({
                    success: false,
                    message: '项目ID不能为空'
                });
            }

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '结算项不能为空'
                });
            }

            const settlement = await SettlementService.createSettlement({
                projectId,
                items,
                createdBy: userId
            });

            return res.json({
                success: true,
                message: '结算单创建成功',
                data: settlement
            });
        } catch (error) {
            console.error('创建结算单失败:', error);
            return res.status(500).json({
                success: false,
                message: '创建结算单失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 获取结算单列表
     */
    static async getSettlements(req: Request, res: Response) {
        try {
            const { page, limit, search, status, isSettled, projectId, clientId } = req.query;

            const result = await SettlementService.getSettlements({
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined,
                search: search as string,
                status: status as string,
                isSettled: isSettled === 'true' ? true : isSettled === 'false' ? false : undefined,
                projectId: projectId as string,
                clientId: clientId as string
            });

            return res.json({
                success: true,
                data: result.settlements,
                total: result.total,
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 20
            });
        } catch (error) {
            console.error('获取结算单列表失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取结算单列表失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 根据ID获取结算单详情
     */
    static async getSettlementById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const settlement = await SettlementService.getSettlementById(id);

            if (!settlement) {
                return res.status(404).json({
                    success: false,
                    message: '结算单不存在'
                });
            }

            return res.json({
                success: true,
                data: settlement
            });
        } catch (error) {
            console.error('获取结算单详情失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取结算单详情失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 更新结算单
     */
    static async updateSettlement(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { isSettled, settledAmount, settledDate, status, items, remark } = req.body;

            const updateData: any = {};
            if (isSettled !== undefined) updateData.isSettled = isSettled;
            if (settledAmount !== undefined) updateData.settledAmount = settledAmount;
            if (settledDate !== undefined) updateData.settledDate = settledDate ? new Date(settledDate) : null;
            if (status !== undefined) updateData.status = status;
            if (items !== undefined) updateData.items = items;
            if (remark !== undefined) updateData.remark = remark;

            const settlement = await SettlementService.updateSettlement(id, updateData);

            if (!settlement) {
                return res.status(404).json({
                    success: false,
                    message: '结算单不存在'
                });
            }

            return res.json({
                success: true,
                message: '结算单更新成功',
                data: settlement
            });
        } catch (error) {
            console.error('更新结算单失败:', error);
            return res.status(500).json({
                success: false,
                message: '更新结算单失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 删除结算单
     */
    static async deleteSettlement(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const deleted = await SettlementService.deleteSettlement(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: '结算单不存在'
                });
            }

            return res.json({
                success: true,
                message: '结算单删除成功'
            });
        } catch (error) {
            console.error('删除结算单失败:', error);
            return res.status(500).json({
                success: false,
                message: '删除结算单失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
}

