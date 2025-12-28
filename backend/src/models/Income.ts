import mongoose, { Schema, Document } from 'mongoose';

// 回款接口
export interface IIncome extends Document {
    incomeNo: string; // 回款单号
    settlementId: string; // 关联结算单ID
    settlementNo: string; // 结算单号
    projectId: string; // 关联项目ID
    projectName: string; // 项目名称
    clientId: string; // 客户ID
    clientName: string; // 客户名称
    contactIds: string[]; // 联系人ID数组
    contactNames: string[]; // 联系人名称数组
    amount: number; // 回款金额
    paymentType: 'full' | 'half' | 'tail' | 'custom' | 'customPercent'; // 回款类型
    paymentChannel: 'company' | 'check' | 'wechat' | 'alipay' | 'cash'; // 回款渠道
    payerName?: string; // 付方名称
    transactionNo?: string; // 交易流水号
    checkNo?: string; // 支票号
    payee?: string; // 收款人
    paymentDate: Date; // 回款时间
    remark?: string; // 备注
    createdBy: string; // 创建人
    createdAt: Date;
    updatedAt: Date;
}

// 回款Schema
const IncomeSchema = new Schema<IIncome>({
    incomeNo: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    settlementId: {
        type: String,
        required: true,
        index: true
    },
    settlementNo: {
        type: String,
        required: true,
        index: true
    },
    projectId: {
        type: String,
        required: true,
        index: true
    },
    projectName: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true,
        index: true
    },
    clientName: {
        type: String,
        required: true
    },
    contactIds: [{
        type: String
    }],
    contactNames: [{
        type: String
    }],
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentType: {
        type: String,
        enum: ['full', 'half', 'tail', 'custom', 'customPercent'],
        required: true
    },
    paymentChannel: {
        type: String,
        enum: ['company', 'check', 'wechat', 'alipay', 'cash'],
        required: true
    },
    payerName: {
        type: String
    },
    transactionNo: {
        type: String
    },
    checkNo: {
        type: String
    },
    payee: {
        type: String
    },
    paymentDate: {
        type: Date,
        required: true,
        index: true
    },
    remark: {
        type: String
    },
    createdBy: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    collection: 'incomes'
});

// 索引
IncomeSchema.index({ incomeNo: 1 });
IncomeSchema.index({ settlementId: 1 });
IncomeSchema.index({ settlementNo: 1 });
IncomeSchema.index({ projectId: 1 });
IncomeSchema.index({ clientId: 1 });
IncomeSchema.index({ paymentDate: -1 });
IncomeSchema.index({ createdAt: -1 });

export default mongoose.model<IIncome>('Income', IncomeSchema);

