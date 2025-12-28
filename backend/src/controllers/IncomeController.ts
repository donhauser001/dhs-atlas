import { Request, Response } from 'express';
import IncomeService from '../services/IncomeService';

export class IncomeController {
    /**
     * 创建回款
     */
    static async createIncome(req: Request, res: Response) {
        try {
            const {
                settlementId,
                settlementNo,
                projectId,
                projectName,
                clientId,
                clientName,
                contactIds,
                contactNames,
                amount,
                paymentType,
                paymentChannel,
                payerName,
                transactionNo,
                checkNo,
                payee,
                paymentDate,
                remark
            } = req.body;
            const userId = (req as any).user?.userId || 'system';

            if (!settlementId || !settlementNo || !projectId || !clientId || !amount || !paymentType || !paymentChannel || !paymentDate) {
                return res.status(400).json({
                    success: false,
                    message: '必填字段不能为空'
                });
            }

            const income = await IncomeService.createIncome({
                settlementId,
                settlementNo,
                projectId,
                projectName: projectName || '',
                clientId,
                clientName: clientName || '',
                contactIds: contactIds || [],
                contactNames: contactNames || [],
                amount,
                paymentType,
                paymentChannel,
                payerName,
                transactionNo,
                checkNo,
                payee,
                paymentDate: new Date(paymentDate),
                remark,
                createdBy: userId
            });

            return res.json({
                success: true,
                message: '回款创建成功',
                data: income
            });
        } catch (error) {
            console.error('创建回款失败:', error);
            return res.status(500).json({
                success: false,
                message: '创建回款失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 获取回款列表
     */
    static async getIncomes(req: Request, res: Response) {
        try {
            const {
                page,
                limit,
                search,
                projectId,
                clientId,
                settlementId,
                startDate,
                endDate,
                paymentChannel
            } = req.query;

            const query: any = {};
            if (page) query.page = parseInt(page as string);
            if (limit) query.limit = parseInt(limit as string);
            if (search) query.search = search as string;
            if (projectId) query.projectId = projectId as string;
            if (clientId) query.clientId = clientId as string;
            if (settlementId) query.settlementId = settlementId as string;
            if (startDate) query.startDate = new Date(startDate as string);
            if (endDate) query.endDate = new Date(endDate as string);
            if (paymentChannel) query.paymentChannel = paymentChannel as string;

            const result = await IncomeService.getIncomes(query);

            return res.json({
                success: true,
                data: result.data,
                total: result.total
            });
        } catch (error) {
            console.error('获取回款列表失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取回款列表失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 根据ID获取回款详情
     */
    static async getIncomeById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const income = await IncomeService.getIncomeById(id);

            if (!income) {
                return res.status(404).json({
                    success: false,
                    message: '回款不存在'
                });
            }

            return res.json({
                success: true,
                data: income
            });
        } catch (error) {
            console.error('获取回款详情失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取回款详情失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 更新回款
     */
    static async updateIncome(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                amount,
                paymentType,
                paymentChannel,
                payerName,
                transactionNo,
                checkNo,
                payee,
                paymentDate,
                remark
            } = req.body;

            const updateData: any = {};
            if (amount !== undefined) updateData.amount = amount;
            if (paymentType) updateData.paymentType = paymentType;
            if (paymentChannel) updateData.paymentChannel = paymentChannel;
            if (payerName !== undefined) updateData.payerName = payerName;
            if (transactionNo !== undefined) updateData.transactionNo = transactionNo;
            if (checkNo !== undefined) updateData.checkNo = checkNo;
            if (payee !== undefined) updateData.payee = payee;
            if (paymentDate) updateData.paymentDate = new Date(paymentDate);
            if (remark !== undefined) updateData.remark = remark;

            const income = await IncomeService.updateIncome(id, updateData);

            if (!income) {
                return res.status(404).json({
                    success: false,
                    message: '回款不存在'
                });
            }

            return res.json({
                success: true,
                message: '回款更新成功',
                data: income
            });
        } catch (error) {
            console.error('更新回款失败:', error);
            return res.status(500).json({
                success: false,
                message: '更新回款失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 更新回款备注
     */
    static async updateIncomeRemark(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { remark } = req.body;

            const income = await IncomeService.updateIncomeRemark(id, remark || '');

            if (!income) {
                return res.status(404).json({
                    success: false,
                    message: '回款不存在'
                });
            }

            return res.json({
                success: true,
                message: '备注更新成功',
                data: income
            });
        } catch (error) {
            console.error('更新回款备注失败:', error);
            return res.status(500).json({
                success: false,
                message: '更新回款备注失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 删除回款
     */
    static async deleteIncome(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await IncomeService.deleteIncome(id);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: '回款不存在'
                });
            }

            return res.json({
                success: true,
                message: '回款删除成功'
            });
        } catch (error) {
            console.error('删除回款失败:', error);
            return res.status(500).json({
                success: false,
                message: '删除回款失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 获取回款统计
     */
    static async getIncomeStats(req: Request, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            const stats = await IncomeService.getIncomeStats(
                startDate ? new Date(startDate as string) : undefined,
                endDate ? new Date(endDate as string) : undefined
            );

            return res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('获取回款统计失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取回款统计失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
}

