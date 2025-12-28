import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGeneratedContract extends Document {
    name: string;
    description?: string;
    templateId: Types.ObjectId; // 关联的模板ID
    formDataId?: Types.ObjectId; // 关联的表单数据ID
    content: string; // 生成后的合同内容（已替换占位符）
    originalPlaceholders: string[]; // 原始占位符列表
    replacedData: Record<string, any>; // 替换的数据
    status: 'pending' | 'signed' | 'cancelled';
    contractNumber?: string; // 合同编号
    clientInfo?: {
        name: string;
        contact?: string;
        phone?: string;
        email?: string;
        address?: string;
    };
    projectInfo?: {
        name: string;
        description?: string;
        amount?: number;
        startDate?: Date;
        endDate?: Date;
    };
    generatedBy: string;
    generateTime: Date;
    signedTime?: Date;
    expirationDate?: Date;
    signedFile?: string; // 签署文件路径
    // 关联ID信息，用于权限控制和关系查询
    relatedIds?: {
        projectId?: string;    // 项目ID
        clientIds?: string[];  // 客户ID列表（除我方外的其他各方）
        contactIds?: string[]; // 联系人ID列表（除我方外的其他各方联系人）
    };
    createTime: Date;
    updateTime: Date;
}

const GeneratedContractSchema = new Schema<IGeneratedContract>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    templateId: {
        type: Schema.Types.ObjectId,
        ref: 'ContractTemplate',
        required: true
    },
    formDataId: {
        type: Schema.Types.ObjectId,
        ref: 'FormData',
        required: false
    },
    content: {
        type: String,
        required: true
    },
    originalPlaceholders: [{
        type: String,
        trim: true
    }],
    replacedData: {
        type: Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['pending', 'signed', 'cancelled'],
        default: 'pending'
    },
    contractNumber: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    clientInfo: {
        name: { type: String, trim: true },
        contact: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true },
        address: { type: String, trim: true }
    },
    projectInfo: {
        name: { type: String, trim: true },
        description: { type: String, trim: true },
        amount: { type: Number, min: 0 },
        startDate: { type: Date },
        endDate: { type: Date }
    },
    generatedBy: {
        type: String,
        required: true
    },
    generateTime: {
        type: Date,
        default: Date.now
    },
    signedTime: {
        type: Date
    },
    expirationDate: {
        type: Date
    },
    signedFile: {
        type: String,
        trim: true
    },
    relatedIds: {
        projectId: { type: String, trim: true },
        clientIds: [{ type: String, trim: true }],
        contactIds: [{ type: String, trim: true }]
    },
    createTime: {
        type: Date,
        default: Date.now
    },
    updateTime: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' }
});

// 创建索引
GeneratedContractSchema.index({ templateId: 1 });
GeneratedContractSchema.index({ status: 1 });
GeneratedContractSchema.index({ generatedBy: 1 });
GeneratedContractSchema.index({ generateTime: -1 });
GeneratedContractSchema.index({ contractNumber: 1 });
GeneratedContractSchema.index({ 'clientInfo.name': 1 });
GeneratedContractSchema.index({ 'projectInfo.name': 1 });
GeneratedContractSchema.index({ 'relatedIds.projectId': 1 });
GeneratedContractSchema.index({ 'relatedIds.clientIds': 1 });
GeneratedContractSchema.index({ 'relatedIds.contactIds': 1 });

// 自动生成合同编号
GeneratedContractSchema.pre('save', async function (next) {
    if (this.isNew && !this.contractNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // 查找当天已生成的合同数量
        const count = await mongoose.model('GeneratedContract').countDocuments({
            generateTime: {
                $gte: new Date(year, date.getMonth(), date.getDate()),
                $lt: new Date(year, date.getMonth(), date.getDate() + 1)
            }
        });

        // 生成合同编号：HT + 年月日 + 三位序号
        this.contractNumber = `HT${year}${month}${day}${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

export default mongoose.model<IGeneratedContract>('GeneratedContract', GeneratedContractSchema);
