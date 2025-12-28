import mongoose, { Schema, Document } from 'mongoose';

// 子结算单接口
export interface ISettlementItem {
    taskId: string;
    taskName: string;
    unitPrice: number; // 定价
    quantity: number; // 数量
    unit?: string; // 单位
    settlementUnitPrice: number; // 结算定价
    settlementQuantity: number; // 结算数量
    subtotal: number; // 小计（结算定价 × 结算数量）
    remarks?: string; // 备注
    mainDesigners?: string[]; // 主创设计师ID数组
    mainDesignerNames?: string[]; // 主创设计师名称数组
    assistantDesigners?: string[]; // 助理设计师ID数组
    assistantDesignerNames?: string[]; // 助理设计师名称数组
    isDamaged?: boolean; // 是否启用损稿计费
    damagedPercentage?: number; // 损稿计费比例（0-100）
}

// 结算单接口
export interface ISettlement extends Document {
    settlementNo: string; // 结算单号
    projectId: string; // 关联项目ID
    projectName: string; // 项目名称
    clientId: string; // 客户ID
    clientName: string; // 客户名称
    contactIds: string[]; // 联系人ID数组
    contactNames: string[]; // 联系人名称数组
    items: ISettlementItem[]; // 子结算单数组
    totalAmount: number; // 总金额
    totalAmountInWords: string; // 总金额大写
    isSettled: boolean; // 是否结算
    settledAmount?: number; // 结算金额
    settledDate?: Date; // 结算日期
    status: 'pending' | 'partial' | 'completed'; // 结算状态
    remark?: string; // 备注
    createdBy: string; // 创建人
    createdAt: Date;
    updatedAt: Date;
}

// 子结算单Schema
const SettlementItemSchema = new Schema<ISettlementItem>({
    taskId: { type: String, required: true },
    taskName: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String },
    settlementUnitPrice: { type: Number, required: true, min: 0 },
    settlementQuantity: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    remarks: { type: String },
    mainDesigners: [{ type: String }],
    mainDesignerNames: [{ type: String }],
    assistantDesigners: [{ type: String }],
    assistantDesignerNames: [{ type: String }],
    isDamaged: { type: Boolean, default: false },
    damagedPercentage: { type: Number, min: 0, max: 100 }
}, { _id: false });

// 结算单Schema
const SettlementSchema = new Schema<ISettlement>({
    settlementNo: {
        type: String,
        required: true,
        unique: true,
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
    items: [SettlementItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    totalAmountInWords: {
        type: String,
        required: true
    },
    isSettled: {
        type: Boolean,
        default: false,
        index: true
    },
    settledAmount: {
        type: Number,
        min: 0
    },
    settledDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'partial', 'completed'],
        default: 'pending',
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
    collection: 'settlements'
});

// 索引
SettlementSchema.index({ settlementNo: 1 });
SettlementSchema.index({ projectId: 1 });
SettlementSchema.index({ clientId: 1 });
SettlementSchema.index({ status: 1 });
SettlementSchema.index({ isSettled: 1 });
SettlementSchema.index({ createdAt: -1 });

export default mongoose.model<ISettlement>('Settlement', SettlementSchema);

