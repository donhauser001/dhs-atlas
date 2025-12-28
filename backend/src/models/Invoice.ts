import mongoose, { Schema, Document } from 'mongoose';

// 发票接口
export interface IInvoice extends Document {
    invoiceNo: string; // 发票号码
    settlementId: string; // 关联结算单ID
    settlementNo: string; // 结算单号
    projectId: string; // 关联项目ID
    projectName: string; // 项目名称
    clientId: string; // 客户ID
    clientName: string; // 客户名称
    contactIds: string[]; // 联系人ID数组
    contactNames: string[]; // 联系人名称数组
    invoiceDate: Date; // 开票日期
    invoiceAmount: number; // 开票金额
    invoiceType: '增值税普通发票' | '增值税专用发票'; // 发票类型
    feeType: '预付金' | '尾款' | '全款'; // 费用类型
    files: Array<{
        path: string; // 文件路径
        originalName: string; // 原始文件名
        size: number; // 文件大小（字节）
    }>; // 发票文件
    remark?: string; // 备注
    createdBy: string; // 创建人
    createdAt: Date;
    updatedAt: Date;
}

// 发票Schema
const InvoiceSchema = new Schema<IInvoice>({
    invoiceNo: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
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
    invoiceDate: {
        type: Date,
        required: true,
        index: true
    },
    invoiceAmount: {
        type: Number,
        required: true,
        min: 0
    },
    invoiceType: {
        type: String,
        enum: ['增值税普通发票', '增值税专用发票'],
        required: true
    },
    feeType: {
        type: String,
        enum: ['预付金', '尾款', '全款'],
        required: true
    },
    files: [{
        path: {
            type: String,
            required: true
        },
        originalName: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        }
    }],
    remark: {
        type: String
    },
    createdBy: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    collection: 'invoices'
});

// 索引
InvoiceSchema.index({ invoiceNo: 1 });
InvoiceSchema.index({ settlementId: 1 });
InvoiceSchema.index({ projectId: 1 });
InvoiceSchema.index({ clientId: 1 });
InvoiceSchema.index({ invoiceDate: -1 });

const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);

export default Invoice;

