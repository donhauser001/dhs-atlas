import { Request, Response } from 'express';
import InvoiceService, { CreateInvoiceData, InvoiceQuery } from '../services/InvoiceService';
import { authenticateToken } from '../middleware/auth';

export class InvoiceController {
    /**
     * 创建发票
     */
    static async createInvoice(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (!user) {
                return res.status(401).json({ success: false, message: '未授权' });
            }

            // 验证必填字段
            if (!req.body.invoiceNo || !req.body.invoiceNo.trim()) {
                return res.status(400).json({ success: false, message: '发票号码不能为空' });
            }
            if (!req.body.settlementId) {
                return res.status(400).json({ success: false, message: '结算单ID不能为空' });
            }
            if (!req.body.settlementNo) {
                return res.status(400).json({ success: false, message: '结算单号不能为空' });
            }
            if (!req.body.projectId) {
                return res.status(400).json({ success: false, message: '项目ID不能为空' });
            }
            if (!req.body.projectName) {
                return res.status(400).json({ success: false, message: '项目名称不能为空' });
            }
            if (!req.body.clientId) {
                return res.status(400).json({ success: false, message: '客户ID不能为空' });
            }
            if (!req.body.clientName) {
                return res.status(400).json({ success: false, message: '客户名称不能为空' });
            }
            if (!req.body.invoiceDate) {
                return res.status(400).json({ success: false, message: '开票日期不能为空' });
            }
            if (req.body.invoiceAmount === undefined || req.body.invoiceAmount === null) {
                return res.status(400).json({ success: false, message: '开票金额不能为空' });
            }
            if (!req.body.invoiceType) {
                return res.status(400).json({ success: false, message: '发票类型不能为空' });
            }
            if (!req.body.feeType) {
                return res.status(400).json({ success: false, message: '费用类型不能为空' });
            }

            const data: CreateInvoiceData = {
                invoiceNo: req.body.invoiceNo.trim(),
                settlementId: req.body.settlementId,
                settlementNo: req.body.settlementNo,
                projectId: req.body.projectId,
                projectName: req.body.projectName,
                clientId: req.body.clientId,
                clientName: req.body.clientName,
                contactIds: req.body.contactIds || [],
                contactNames: req.body.contactNames || [],
                invoiceDate: req.body.invoiceDate,
                invoiceAmount: req.body.invoiceAmount,
                invoiceType: req.body.invoiceType,
                feeType: req.body.feeType,
                files: req.body.files || [],
                remark: req.body.remark,
                createdBy: user.userId
            };

            console.log('接收到的发票数据:', JSON.stringify(data, null, 2));

            const invoice = await InvoiceService.createInvoice(data);
            res.json({
                success: true,
                data: invoice
            });
        } catch (error: any) {
            console.error('创建发票失败:', error);

            // 处理MongoDB唯一索引错误
            if (error.code === 11000 || error.name === 'MongoServerError') {
                return res.status(400).json({
                    success: false,
                    message: '发票号码已存在，请使用其他号码'
                });
            }

            // 处理验证错误
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: error.message || '数据验证失败'
                });
            }

            res.status(500).json({
                success: false,
                message: error.message || '创建发票失败'
            });
        }
    }

    /**
     * 获取发票列表
     */
    static async getInvoices(req: Request, res: Response) {
        try {
            const query: InvoiceQuery = {
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                search: req.query.search as string,
                settlementId: req.query.settlementId as string,
                projectId: req.query.projectId as string,
                clientId: req.query.clientId as string,
                invoiceType: req.query.invoiceType as string,
                feeType: req.query.feeType as string,
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string
            };

            const result = await InvoiceService.getInvoices(query);
            res.json({
                success: true,
                data: result.invoices,
                total: result.total
            });
        } catch (error: any) {
            console.error('获取发票列表失败:', error);
            res.status(500).json({
                success: false,
                message: error.message || '获取发票列表失败'
            });
        }
    }

    /**
     * 根据ID获取发票详情
     */
    static async getInvoiceById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const invoice = await InvoiceService.getInvoiceById(id);

            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message: '发票不存在'
                });
            }

            res.json({
                success: true,
                data: invoice
            });
        } catch (error: any) {
            console.error('获取发票详情失败:', error);
            res.status(500).json({
                success: false,
                message: error.message || '获取发票详情失败'
            });
        }
    }

    /**
     * 更新发票
     */
    static async updateInvoice(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData: any = {};

            if (req.body.invoiceNo !== undefined) updateData.invoiceNo = req.body.invoiceNo;
            if (req.body.invoiceDate !== undefined) updateData.invoiceDate = req.body.invoiceDate;
            if (req.body.invoiceAmount !== undefined) updateData.invoiceAmount = req.body.invoiceAmount;
            if (req.body.invoiceType !== undefined) updateData.invoiceType = req.body.invoiceType;
            if (req.body.feeType !== undefined) updateData.feeType = req.body.feeType;
            if (req.body.files !== undefined) updateData.files = req.body.files;
            if (req.body.remark !== undefined) updateData.remark = req.body.remark;

            const invoice = await InvoiceService.updateInvoice(id, updateData);

            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message: '发票不存在'
                });
            }

            res.json({
                success: true,
                data: invoice
            });
        } catch (error: any) {
            console.error('更新发票失败:', error);
            res.status(500).json({
                success: false,
                message: error.message || '更新发票失败'
            });
        }
    }

    /**
     * 删除发票
     */
    static async deleteInvoice(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await InvoiceService.deleteInvoice(id);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: '发票不存在'
                });
            }

            res.json({
                success: true,
                message: '发票删除成功'
            });
        } catch (error: any) {
            console.error('删除发票失败:', error);
            res.status(500).json({
                success: false,
                message: error.message || '删除发票失败'
            });
        }
    }

    /**
     * 获取发票统计信息
     */
    static async getInvoiceStats(req: Request, res: Response) {
        try {
            const stats = await InvoiceService.getInvoiceStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error: any) {
            console.error('获取发票统计失败:', error);
            res.status(500).json({
                success: false,
                message: error.message || '获取发票统计失败'
            });
        }
    }
}

