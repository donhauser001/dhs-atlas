import Settlement, { ISettlement, ISettlementItem } from '../models/Settlement';
import Income from '../models/Income';
import Invoice from '../models/Invoice';
import Project from '../models/Project';
import TaskService from './TaskService';
import { convertToRMB } from '../utils/rmbConverter';

export interface CreateSettlementData {
    projectId: string;
    items: Array<{
        taskId: string;
        settlementUnitPrice: number;
        settlementQuantity: number;
        subtotal?: number; // 小计（前端计算好的）
        remarks?: string; // 备注（可选，常规任务和额外费用都可能有）
        taskName?: string; // 任务名称（仅额外费用需要）
        unit?: string; // 单位（仅额外费用需要）
        billingDescription?: string; // 费用说明（仅额外费用需要）
        isDamaged?: boolean; // 是否启用损稿计费
        damagedPercentage?: number; // 损稿计费比例（0-100）
    }>;
    createdBy: string;
}

export interface SettlementQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    isSettled?: boolean;
    projectId?: string;
    clientId?: string;
}

export class SettlementService {
    private taskService = TaskService;

    /**
     * 生成结算单号
     * 格式：SET-YYYYMM-XXXX（如：SET-202401-0001）
     */
    async generateSettlementNo(): Promise<string> {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `SET-${year}${month}-`;

        // 查询当月最大的结算单号
        const lastSettlement = await Settlement.findOne({
            settlementNo: { $regex: `^${prefix}` }
        })
            .sort({ settlementNo: -1 })
            .lean();

        let sequence = 1;
        if (lastSettlement) {
            // 提取序号部分
            const lastNo = lastSettlement.settlementNo;
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
     * 创建结算单
     */
    async createSettlement(data: CreateSettlementData): Promise<ISettlement> {
        // 获取项目信息
        const project = await Project.findById(data.projectId);
        if (!project) {
            throw new Error('项目不存在');
        }

        // 检查项目是否已经有关联的结算单（一个项目只能有一个结算单）
        if (project.settlementIds && project.settlementIds.length > 0) {
            // 验证这些结算单是否真实存在
            const existingSettlements = await Settlement.find({
                _id: { $in: project.settlementIds }
            }).lean();

            if (existingSettlements.length > 0) {
                throw new Error('该项目已存在结算单，请先删除现有结算单后再创建新的结算单');
            } else {
                // 如果结算单不存在，清理项目中的无效ID
                await Project.findByIdAndUpdate(data.projectId, {
                    $set: { settlementIds: [] }
                });
            }
        }

        // 获取项目下的所有任务
        const tasks = await this.taskService.getTasksByProject(data.projectId);

        // 构建子结算单数组
        const items: ISettlementItem[] = [];
        let totalAmount = 0;

        // 分离普通任务和额外费用
        const regularItems = data.items.filter(item => !item.taskId.startsWith('extra-'));
        const extraFeeItems = data.items.filter(item => item.taskId.startsWith('extra-'));

        // 处理普通任务
        for (const task of tasks) {
            // 查找对应的结算数据
            const settlementData = regularItems.find(item => item.taskId === task._id?.toString() || item.taskId === task.id);

            if (settlementData) {
                const unitPrice = task.unitPrice || (task.subtotal && task.quantity ? task.subtotal / task.quantity : 0);
                // 优先使用前端传递的 subtotal，如果没有则计算
                const subtotal = (settlementData as any).subtotal !== undefined
                    ? (settlementData as any).subtotal
                    : (settlementData.settlementUnitPrice * settlementData.settlementQuantity);

                // 备注处理：直接使用前端传递的备注（从模态窗表格中获取）
                const remarks = (settlementData as any).remarks !== undefined
                    ? String((settlementData as any).remarks || '').trim()
                    : '';

                const item: ISettlementItem = {
                    taskId: task._id?.toString() || task.id,
                    taskName: task.taskName,
                    unitPrice: unitPrice,
                    quantity: task.quantity || 0,
                    unit: task.unit || '',
                    settlementUnitPrice: settlementData.settlementUnitPrice,
                    settlementQuantity: settlementData.settlementQuantity,
                    subtotal: subtotal,
                    remarks: remarks && remarks.trim() !== '' ? remarks.trim() : undefined,
                    mainDesigners: task.mainDesigners || [],
                    mainDesignerNames: task.mainDesignerNames || [],
                    assistantDesigners: task.assistantDesigners || [],
                    assistantDesignerNames: task.assistantDesignerNames || [],
                    isDamaged: (settlementData as any).isDamaged || false,
                    damagedPercentage: (settlementData as any).damagedPercentage || 0
                };

                items.push(item);

                totalAmount += subtotal;
            }
        }

        // 处理额外费用（需要从请求中获取任务名称和备注）
        for (const extraItem of extraFeeItems) {
            // 优先使用前端传递的 subtotal，如果没有则计算
            const subtotal = (extraItem as any).subtotal !== undefined
                ? (extraItem as any).subtotal
                : (extraItem.settlementUnitPrice * extraItem.settlementQuantity);

            const extraFeeItem: ISettlementItem = {
                taskId: extraItem.taskId,
                taskName: (extraItem as any).taskName || '额外费用',
                unitPrice: extraItem.settlementUnitPrice, // 额外费用没有订单定价，使用结算定价
                quantity: extraItem.settlementQuantity, // 额外费用没有订单数量，使用结算数量
                unit: (extraItem as any).unit || '',
                settlementUnitPrice: extraItem.settlementUnitPrice,
                settlementQuantity: extraItem.settlementQuantity,
                subtotal: subtotal,
                remarks: (extraItem as any).remarks ? String((extraItem as any).remarks).trim() : undefined,
                mainDesigners: [],
                mainDesignerNames: [],
                assistantDesigners: [],
                assistantDesignerNames: [],
                isDamaged: (extraItem as any).isDamaged || false,
                damagedPercentage: (extraItem as any).damagedPercentage || 0
            };

            items.push(extraFeeItem);

            totalAmount += subtotal;
        }

        if (items.length === 0) {
            throw new Error('没有可结算的任务');
        }

        // 生成结算单号
        const settlementNo = await this.generateSettlementNo();

        // 调试日志：总金额
        console.log('结算单总金额计算:', {
            itemsCount: items.length,
            totalAmount: totalAmount,
            itemsSubtotals: items.map(item => ({ taskName: item.taskName, subtotal: item.subtotal }))
        });

        // 计算金额大写
        const totalAmountInWords = convertToRMB(totalAmount, true);

        // 创建结算单
        const settlement = new Settlement({
            settlementNo,
            projectId: (project as any)._id.toString(),
            projectName: project.projectName,
            clientId: project.clientId,
            clientName: project.clientName,
            contactIds: project.contactIds || [],
            contactNames: project.contactNames || [],
            items,
            totalAmount,
            totalAmountInWords,
            isSettled: false,
            status: 'pending',
            createdBy: data.createdBy
        });

        const savedSettlement = await settlement.save();

        // 更新项目的 settlementIds（一个项目只能有一个结算单，所以使用$set而不是$push）
        await Project.findByIdAndUpdate((project as any)._id, {
            $set: { settlementIds: [(savedSettlement as any)._id.toString()] }
        });

        return savedSettlement;
    }

    /**
     * 获取结算单列表
     */
    async getSettlements(query: SettlementQuery): Promise<{ settlements: ISettlement[], total: number }> {
        const { page = 1, limit = 20, search, status, isSettled, projectId, clientId } = query;
        const skip = (page - 1) * limit;

        const filter: any = {};

        if (search) {
            filter.$or = [
                { settlementNo: { $regex: search, $options: 'i' } },
                { projectName: { $regex: search, $options: 'i' } },
                { clientName: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) {
            filter.status = status;
        }

        if (isSettled !== undefined) {
            filter.isSettled = isSettled;
        }

        if (projectId) {
            filter.projectId = projectId;
        }

        if (clientId) {
            filter.clientId = clientId;
        }

        const [settlements, total] = await Promise.all([
            Settlement.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Settlement.countDocuments(filter)
        ]);

        // 查询每个结算单关联的回款记录并计算总和，同时自动更新结算状态
        const settlementsWithIncome = await Promise.all(
            settlements.map(async (settlement) => {
                const settlementId = (settlement as any)._id?.toString() || settlement._id;
                const incomes = await Income.find({ settlementId: settlementId })
                    .sort({ paymentDate: -1 })
                    .lean();
                const totalIncomeAmount = incomes.reduce((sum, income) => sum + (income.amount || 0), 0);
                const totalAmount = settlement.totalAmount || 0;

                // 获取最后一次回款记录的支付日期
                const lastIncomeDate = incomes.length > 0 && incomes[0].paymentDate
                    ? new Date(incomes[0].paymentDate)
                    : null;

                // 根据结算金额和订单总额的关系自动更新状态
                let newStatus: 'pending' | 'partial' | 'completed' = 'pending';
                let isSettled = false;
                let needsUpdate = false;

                if (totalIncomeAmount >= totalAmount && totalAmount > 0) {
                    // 结算金额 >= 订单总额，状态为已结清
                    newStatus = 'completed';
                    isSettled = true;
                    if (settlement.status !== 'completed' || settlement.isSettled !== true) {
                        needsUpdate = true;
                    }
                } else if (totalIncomeAmount > 0 && totalIncomeAmount < totalAmount) {
                    // 结算金额 > 0 且 < 订单总额，状态为部分结清
                    newStatus = 'partial';
                    isSettled = false;
                    if (settlement.status !== 'partial' || settlement.isSettled !== false) {
                        needsUpdate = true;
                    }
                } else {
                    // 结算金额 = 0，状态为待结清
                    newStatus = 'pending';
                    isSettled = false;
                    if (settlement.status !== 'pending' || settlement.isSettled !== false) {
                        needsUpdate = true;
                    }
                }

                // 检查是否需要更新结算日期（使用最后一次回款的支付日期）
                const shouldUpdateSettledDate = lastIncomeDate && (
                    !settlement.settledDate ||
                    new Date(settlement.settledDate).getTime() !== lastIncomeDate.getTime()
                );

                // 如果状态需要更新，保存到数据库
                if (needsUpdate) {
                    settlement.status = newStatus;
                    settlement.isSettled = isSettled;
                    settlement.settledAmount = totalIncomeAmount;
                    // 如果有回款记录，使用最后一次回款的支付日期；否则清空
                    if (lastIncomeDate) {
                        settlement.settledDate = lastIncomeDate;
                    } else {
                        settlement.settledDate = undefined;
                    }
                    await settlement.save();
                } else if (settlement.settledAmount !== totalIncomeAmount || shouldUpdateSettledDate) {
                    // 即使状态不变，也要更新 settledAmount 和 settledDate
                    settlement.settledAmount = totalIncomeAmount;
                    if (lastIncomeDate) {
                        settlement.settledDate = lastIncomeDate;
                    } else {
                        settlement.settledDate = undefined;
                    }
                    await settlement.save();
                }

                // 返回数据（转换为普通对象）
                const settlementObj = settlement.toObject();
                return {
                    ...settlementObj,
                    totalIncomeAmount
                };
            })
        );

        return {
            settlements: settlementsWithIncome as any[],
            total
        };
    }

    /**
     * 根据ID获取结算单
     */
    async getSettlementById(id: string): Promise<ISettlement | null> {
        return await Settlement.findById(id).lean() as ISettlement | null;
    }

    /**
     * 更新结算单
     */
    async updateSettlement(id: string, updateData: {
        isSettled?: boolean;
        settledAmount?: number;
        settledDate?: Date;
        status?: 'pending' | 'partial' | 'completed';
        items?: ISettlementItem[];
        remark?: string;
    }): Promise<ISettlement | null> {
        const settlement = await Settlement.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        return settlement;
    }

    /**
     * 删除结算单
     */
    async deleteSettlement(id: string): Promise<boolean> {
        try {
            const settlement = await Settlement.findById(id);

            if (!settlement) {
                return false;
            }

            // 删除关联的所有收入记录
            await Income.deleteMany({ settlementId: id });

            // 获取关联的发票记录，以便从项目中移除
            const invoices = await Invoice.find({ settlementId: id }).lean();
            const invoiceIds = invoices.map((inv: any) => inv._id.toString());

            // 删除关联的所有发票记录
            await Invoice.deleteMany({ settlementId: id });

            // 从关联的项目中移除发票ID
            if (invoiceIds.length > 0) {
                for (const invoiceId of invoiceIds) {
                    await Project.updateMany(
                        { invoiceIds: invoiceId },
                        { $pull: { invoiceIds: invoiceId } }
                    );
                }
            }

            // 删除结算单
            const result = await Settlement.findByIdAndDelete(id);

            // 从关联的项目中移除结算单ID
            if (result) {
                await Project.updateMany(
                    { settlementIds: id },
                    { $pull: { settlementIds: id } }
                );
            }

            return !!result;
        } catch (error) {
            console.error('删除结算单失败:', error);
            throw new Error('删除结算单失败');
        }
    }
}

export default new SettlementService();

