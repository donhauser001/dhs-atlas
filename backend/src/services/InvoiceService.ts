import Invoice, { IInvoice } from '../models/Invoice';
import Project from '../models/Project';

export interface CreateInvoiceData {
    invoiceNo: string;
    settlementId: string;
    settlementNo: string;
    projectId: string;
    projectName: string;
    clientId: string;
    clientName: string;
    contactIds: string[];
    contactNames: string[];
    invoiceDate: string; // YYYY-MM-DD格式
    invoiceAmount: number;
    invoiceType: '增值税普通发票' | '增值税专用发票';
    feeType: '预付金' | '尾款' | '全款';
    files: Array<{
        path: string;
        originalName: string;
        size: number;
    }>;
    remark?: string;
    createdBy: string;
}

export interface InvoiceQuery {
    page?: number;
    limit?: number;
    search?: string;
    settlementId?: string;
    projectId?: string;
    clientId?: string;
    invoiceType?: string;
    feeType?: string;
    startDate?: string;
    endDate?: string;
}

export class InvoiceService {
    /**
     * 创建发票
     */
    async createInvoice(data: CreateInvoiceData): Promise<IInvoice> {
        // 验证发票号码
        if (!data.invoiceNo || !data.invoiceNo.trim()) {
            throw new Error('发票号码不能为空');
        }

        // 检查发票号码是否已存在
        const existingInvoice = await Invoice.findOne({ invoiceNo: data.invoiceNo.trim() });
        if (existingInvoice) {
            throw new Error('发票号码已存在，请使用其他号码');
        }

        const invoice = new Invoice({
            ...data,
            invoiceNo: data.invoiceNo.trim(),
            invoiceDate: new Date(data.invoiceDate)
        });

        const savedInvoice = await invoice.save();

        // 更新项目的 invoiceIds
        const project = await Project.findById(data.projectId);
        if (project) {
            const currentInvoiceIds = project.invoiceIds || [];
            if (!currentInvoiceIds.includes((savedInvoice as any)._id.toString())) {
                await Project.findByIdAndUpdate(data.projectId, {
                    $push: { invoiceIds: (savedInvoice as any)._id.toString() }
                });
            }
        }

        return savedInvoice;
    }

    /**
     * 获取发票列表
     */
    async getInvoices(query: InvoiceQuery): Promise<{ invoices: IInvoice[], total: number }> {
        const { page = 1, limit = 10, search, settlementId, projectId, clientId, invoiceType, feeType, startDate, endDate } = query;
        const skip = (page - 1) * limit;

        const filter: any = {};

        if (search) {
            filter.$or = [
                { invoiceNo: { $regex: search, $options: 'i' } },
                { projectName: { $regex: search, $options: 'i' } },
                { clientName: { $regex: search, $options: 'i' } }
            ];
        }

        if (settlementId) filter.settlementId = settlementId;
        if (projectId) filter.projectId = projectId;
        if (clientId) filter.clientId = clientId;
        if (invoiceType) filter.invoiceType = invoiceType;
        if (feeType) filter.feeType = feeType;

        if (startDate || endDate) {
            filter.invoiceDate = {};
            if (startDate) {
                filter.invoiceDate.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.invoiceDate.$lte = new Date(endDate);
            }
        }

        const [invoices, total] = await Promise.all([
            Invoice.find(filter)
                .sort({ invoiceDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Invoice.countDocuments(filter)
        ]);

        return { invoices, total };
    }

    /**
     * 根据ID获取发票详情
     */
    async getInvoiceById(id: string): Promise<IInvoice | null> {
        return await Invoice.findById(id).lean();
    }

    /**
     * 更新发票
     */
    async updateInvoice(id: string, updateData: Partial<IInvoice>): Promise<IInvoice | null> {
        if (updateData.invoiceDate && typeof updateData.invoiceDate === 'string') {
            updateData.invoiceDate = new Date(updateData.invoiceDate) as any;
        }
        return await Invoice.findByIdAndUpdate(id, updateData, { new: true });
    }

    /**
     * 删除发票
     */
    async deleteInvoice(id: string): Promise<boolean> {
        const invoice = await Invoice.findById(id);
        if (!invoice) {
            return false;
        }

        // 从关联的项目中移除发票ID
        await Project.updateMany(
            { invoiceIds: id },
            { $pull: { invoiceIds: id } }
        );

        // 删除发票
        const result = await Invoice.findByIdAndDelete(id);
        return !!result;
    }

    /**
     * 获取发票统计信息
     */
    async getInvoiceStats(): Promise<{
        total: number;
        totalAmount: number;
        thisMonthCount: number;
        thisMonthAmount: number;
        lastMonthCount: number;
        lastMonthAmount: number;
    }> {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const [total, totalAmountResult, thisMonthInvoices, lastMonthInvoices] = await Promise.all([
            Invoice.countDocuments(),
            Invoice.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$invoiceAmount' }
                    }
                }
            ]),
            Invoice.find({
                invoiceDate: { $gte: thisMonthStart }
            }).lean(),
            Invoice.find({
                invoiceDate: { $gte: lastMonthStart, $lte: lastMonthEnd }
            }).lean()
        ]);

        const totalAmount = totalAmountResult[0]?.total || 0;
        const thisMonthCount = thisMonthInvoices.length;
        const thisMonthAmount = thisMonthInvoices.reduce((sum, inv) => sum + (inv.invoiceAmount || 0), 0);
        const lastMonthCount = lastMonthInvoices.length;
        const lastMonthAmount = lastMonthInvoices.reduce((sum, inv) => sum + (inv.invoiceAmount || 0), 0);

        return {
            total,
            totalAmount,
            thisMonthCount,
            thisMonthAmount,
            lastMonthCount,
            lastMonthAmount
        };
    }
}

export default new InvoiceService();

