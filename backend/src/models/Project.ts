import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
    // 基本信息
    projectName: string;
    clientId: string;
    clientName: string;
    contactIds: string[];
    contactNames: string[];
    contactPhones: string[];

    // 团队信息
    undertakingTeam: string; // 承接团队（企业ID）
    mainDesigners: string[]; // 主创设计师用户ID数组
    assistantDesigners: string[]; // 助理设计师用户ID数组

    // 状态管理
    progressStatus: 'consulting' | 'in-progress' | 'partial-delivery' | 'completed' | 'on-hold' | 'cancelled';
    settlementStatus: 'unpaid' | 'prepaid' | 'partial-paid' | 'fully-paid';

    // 时间管理
    createdAt: Date;
    startedAt?: Date; // 调整为进行中的时间
    deliveredAt?: Date; // 调整为完全交付的时间
    settledAt?: Date; // 调整为完全结算的时间

    // 业务信息
    clientRequirements?: Array<{ content: string; createdAt: Date }>; // 客户嘱托（多条记录）
    quotationId?: string; // 关联报价单
    remark?: Array<{ content: string; createdAt: Date }>; // 备注（多条记录）

    // 关联信息（通过引用ID）
    taskIds: string[]; // 关联的任务ID数组
    fileIds: string[]; // 关联的项目文件ID数组
    clientFileIds: string[]; // 关联的客户文件ID数组
    contractIds: string[]; // 关联的合同ID数组
    invoiceIds: string[]; // 关联的发票ID数组
    proposalIds: string[]; // 关联的方案/提案ID数组
    settlementIds: string[]; // 关联的结算单ID数组

    // 项目日志
    logIds: string[]; // 关联的项目日志ID数组
}

const ProjectSchema = new Schema<IProject>({
    // 基本信息
    projectName: { type: String, required: true },
    clientId: { type: String, required: true },
    clientName: { type: String, required: true },
    contactIds: [{ type: String, required: true }],
    contactNames: [{ type: String, required: true }],
    contactPhones: [{ type: String, required: false }],

    // 团队信息
    undertakingTeam: { type: String, required: true }, // 承接团队（企业ID）
    mainDesigners: [{ type: String }], // 主创设计师用户ID数组
    assistantDesigners: [{ type: String }], // 助理设计师用户ID数组

    // 状态管理
    progressStatus: {
        type: String,
        enum: ['consulting', 'in-progress', 'partial-delivery', 'completed', 'on-hold', 'cancelled'],
        default: 'consulting'
    },
    settlementStatus: {
        type: String,
        enum: ['unpaid', 'prepaid', 'partial-paid', 'fully-paid'],
        default: 'unpaid'
    },

    // 时间管理
    createdAt: { type: Date, default: Date.now },
    startedAt: { type: Date }, // 调整为进行中的时间
    deliveredAt: { type: Date }, // 调整为完全交付的时间
    settledAt: { type: Date }, // 调整为完全结算的时间

    // 业务信息
    clientRequirements: [{
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }], // 客户嘱托（多条记录）
    quotationId: { type: String }, // 关联报价单
    remark: [{
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }], // 备注（多条记录）

    // 关联信息
    taskIds: [{ type: String }], // 关联的任务ID数组
    fileIds: [{ type: String }], // 关联的项目文件ID数组
    clientFileIds: [{ type: String }], // 关联的客户文件ID数组
    contractIds: [{ type: String }], // 关联的合同ID数组
    invoiceIds: [{ type: String }], // 关联的发票ID数组
    proposalIds: [{ type: String }], // 关联的方案/提案ID数组
    settlementIds: [{ type: String }], // 关联的结算单ID数组

    // 项目日志
    logIds: [{ type: String }] // 关联的项目日志ID数组
}, {
    timestamps: true,
    collection: 'projects'
});

// 索引
ProjectSchema.index({ projectName: 1 });
ProjectSchema.index({ clientId: 1 });
ProjectSchema.index({ undertakingTeam: 1 });
ProjectSchema.index({ progressStatus: 1 });
ProjectSchema.index({ settlementStatus: 1 });
ProjectSchema.index({ createdAt: -1 });

export default mongoose.model<IProject>('Project', ProjectSchema); 