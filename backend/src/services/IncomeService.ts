import Income, { IIncome } from '../models/Income';

export interface CreateIncomeData {
    settlementId: string;
    settlementNo: string;
    projectId: string;
    projectName: string;
    clientId: string;
    clientName: string;
    contactIds: string[];
    contactNames: string[];
    amount: number;
    paymentType: 'full' | 'half' | 'tail' | 'custom' | 'customPercent';
    paymentChannel: 'company' | 'check' | 'wechat' | 'alipay' | 'cash';
    payerName?: string;
    transactionNo?: string;
    checkNo?: string;
    payee?: string;
    paymentDate: Date;
    remark?: string;
    createdBy: string;
}

export interface IncomeQuery {
    page?: number;
    limit?: number;
    search?: string;
    projectId?: string;
    clientId?: string;
    settlementId?: string;
    startDate?: Date;
    endDate?: Date;
    paymentChannel?: string;
}

export class IncomeService {
    /**
     * 生成回款单号
     * 格式：INC-YYYYMM-XXXX（如：INC-202401-0001）
     */
    async generateIncomeNo(): Promise<string> {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `INC-${year}${month}-`;

        // 查询当月最大的回款单号
        const lastIncome = await Income.findOne({
            incomeNo: { $regex: `^${prefix}` }
        })
            .sort({ incomeNo: -1 })
            .lean();

        let sequence = 1;
        if (lastIncome) {
            // 提取序号部分
            const lastNo = lastIncome.incomeNo;
            const lastSequence = parseInt(lastNo.substring(prefix.length));
            if (!isNaN(lastSequence)) {
                sequence = lastSequence + 1;
            }
        }

        // 格式化为4位数字
        const sequenceStr = String(sequence).padStart(4, '0');
        return `${prefix}${sequenceStr}`;
    }

    /**
     * 创建回款
     */
    async createIncome(data: CreateIncomeData): Promise<IIncome> {
        const incomeNo = await this.generateIncomeNo();

        const income = new Income({
            incomeNo,
            ...data
        });

        return await income.save();
    }

    /**
     * 获取回款列表
     */
    async getIncomes(query: IncomeQuery = {}): Promise<{ data: IIncome[]; total: number }> {
        const {
            page = 1,
            limit = 10,
            search,
            projectId,
            clientId,
            settlementId,
            startDate,
            endDate,
            paymentChannel
        } = query;

        const filter: any = {};

        if (search) {
            filter.$or = [
                { incomeNo: { $regex: search, $options: 'i' } },
                { settlementNo: { $regex: search, $options: 'i' } },
                { projectName: { $regex: search, $options: 'i' } },
                { clientName: { $regex: search, $options: 'i' } }
            ];
        }

        if (projectId) {
            filter.projectId = projectId;
        }

        if (clientId) {
            filter.clientId = clientId;
        }

        if (settlementId) {
            filter.settlementId = settlementId;
        }

        if (startDate || endDate) {
            filter.paymentDate = {};
            if (startDate) {
                filter.paymentDate.$gte = startDate;
            }
            if (endDate) {
                filter.paymentDate.$lte = endDate;
            }
        }

        if (paymentChannel) {
            filter.paymentChannel = paymentChannel;
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Income.find(filter)
                .sort({ paymentDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Income.countDocuments(filter)
        ]);

        return { data, total };
    }

    /**
     * 根据ID获取回款详情
     */
    async getIncomeById(id: string): Promise<IIncome | null> {
        return await Income.findById(id).lean();
    }

    /**
     * 更新回款
     */
    async updateIncome(id: string, data: Partial<CreateIncomeData>): Promise<IIncome | null> {
        const updateData: any = { ...data };
        // 转换日期格式
        if (data.paymentDate) {
            updateData.paymentDate = new Date(data.paymentDate);
        }
        const income = await Income.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );
        return income;
    }

    /**
     * 更新回款备注
     */
    async updateIncomeRemark(id: string, remark: string): Promise<IIncome | null> {
        const income = await Income.findByIdAndUpdate(
            id,
            { remark },
            { new: true }
        );
        return income;
    }

    /**
     * 删除回款
     */
    async deleteIncome(id: string): Promise<boolean> {
        const result = await Income.findByIdAndDelete(id);
        return !!result;
    }

    /**
     * 获取回款统计
     */
    async getIncomeStats(startDate?: Date, endDate?: Date): Promise<{
        total: number;
        thisMonth: number;
        lastMonth: number;
        thisYear: number;
    }> {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const thisYearStart = new Date(now.getFullYear(), 0, 1);

        const dateFilter: any = {};
        if (startDate) dateFilter.$gte = startDate;
        if (endDate) dateFilter.$lte = endDate;

        const baseFilter = Object.keys(dateFilter).length > 0 ? { paymentDate: dateFilter } : {};

        const [total, thisMonth, lastMonth, thisYear] = await Promise.all([
            Income.aggregate([
                { $match: baseFilter },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Income.aggregate([
                { $match: { ...baseFilter, paymentDate: { $gte: thisMonthStart } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Income.aggregate([
                { $match: { ...baseFilter, paymentDate: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Income.aggregate([
                { $match: { ...baseFilter, paymentDate: { $gte: thisYearStart } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        return {
            total: total[0]?.total || 0,
            thisMonth: thisMonth[0]?.total || 0,
            lastMonth: lastMonth[0]?.total || 0,
            thisYear: thisYear[0]?.total || 0
        };
    }
}

export default new IncomeService();

