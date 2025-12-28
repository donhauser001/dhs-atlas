import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
    // 基本信息
    taskName: string;
    projectId: string; // 直接关联项目
    serviceId: string; // 关联服务

    // 人员分配
    mainDesigners: string[]; // 主创设计师ID数组
    assistantDesigners: string[]; // 助理设计师ID数组

    // 规格信息
    specificationId?: string; // 关联规格ID

    // 数量和金额
    quantity: number;
    unit: string;
    subtotal: number;

    // 价格政策
    pricingPolicies: Array<{
        policyId: string;
        policyName: string;
        policyType: 'uniform_discount' | 'tiered_discount';
        discountRatio: number;
        calculationDetails: string;
    }>;

    // 计费说明
    billingDescription: string;

    // 状态和优先级
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold';
    priority: 'low' | 'medium' | 'high' | 'urgent' | 'waiting' | 'on-hold' | 'completed';

    // 流程节点状态
    processStepId?: string; // 当前流程节点ID
    processStepName?: string; // 当前流程节点名称

    // 进度
    progress: number; // 进度百分比 0-100

    // 时间管理
    startDate?: Date;
    dueDate?: Date;
    completedDate?: Date;

    // 结算状态
    settlementStatus: 'unpaid' | 'prepaid' | 'draft-paid' | 'fully-paid' | 'cancelled';
    settlementTime?: Date;

    // 其他信息
    remarks?: string;
    attachmentIds: string[]; // 附件文件ID数组
    proposalId?: string; // 关联方案

    // 创建和更新时间
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
    // 基本信息
    taskName: { type: String, required: true },
    projectId: { type: String, required: true },
    serviceId: { type: String, required: true },

    // 人员分配
    mainDesigners: [{ type: String }],
    assistantDesigners: [{ type: String }],

    // 规格信息
    specificationId: { type: String },

    // 数量和金额
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    subtotal: { type: Number, required: true },

    // 价格政策
    pricingPolicies: [{
        policyId: { type: String, required: true },
        policyName: { type: String, required: true },
        policyType: {
            type: String,
            enum: ['uniform_discount', 'tiered_discount'],
            required: true
        },
        discountRatio: { type: Number, required: true },
        calculationDetails: { type: String, required: true }
    }],

    // 计费说明
    billingDescription: { type: String, required: true },

    // 状态和优先级
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent', 'waiting', 'on-hold', 'completed'],
        default: 'medium'
    },

    // 流程节点状态
    processStepId: { type: String },
    processStepName: { type: String },

    // 进度
    progress: { type: Number, default: 0, min: 0, max: 100 },

    // 时间管理
    startDate: { type: Date },
    dueDate: { type: Date },
    completedDate: { type: Date },

    // 结算状态
    settlementStatus: {
        type: String,
        enum: ['unpaid', 'prepaid', 'draft-paid', 'fully-paid', 'cancelled'],
        default: 'unpaid'
    },
    settlementTime: { type: Date },

    // 其他信息
    remarks: { type: String },
    attachmentIds: [{ type: String }],
    proposalId: { type: String }
}, {
    timestamps: true,
    collection: 'tasks'
});

// 索引
TaskSchema.index({ projectId: 1 });
TaskSchema.index({ assignedDesigners: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ settlementStatus: 1 });
TaskSchema.index({ dueDate: 1 });

export default mongoose.model<ITask>('Task', TaskSchema); 