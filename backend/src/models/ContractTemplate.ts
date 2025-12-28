import mongoose, { Document, Schema, Types } from 'mongoose';

// 绑定配置接口
export interface IBindingConfig {
    placeholderKey: string;
    settings: Record<string, any>;
}

export interface IContractTemplate extends Document {
    name: string;
    contractTitle?: string; // 合同标题（显示在合同文档中）
    description?: string;
    category: Types.ObjectId; // 引用ContractTemplateCategory的ObjectId
    content: string; // 富文本内容，包含占位符
    placeholders: string[]; // 使用的占位符列表
    associatedForm?: Types.ObjectId; // 关联的表单ID
    placeholderMode: 'preset' | 'form' | 'mixed'; // 占位符模式：预设/表单/混合
    usedPlaceholders: string[]; // 使用的预设占位符key列表
    bindingConfigs?: Record<string, IBindingConfig>; // 绑定配置（合作方设置、签章设置等）
    status: 'draft' | 'active' | 'archived';
    version: number;
    isDefault: boolean;
    tags: string[];
    createdBy: string;
    createTime: Date;
    updateTime: Date;
}

const ContractTemplateSchema = new Schema<IContractTemplate>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    contractTitle: {
        type: String,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'ContractTemplateCategory',
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    placeholders: [{
        type: String,
        trim: true
    }],
    associatedForm: {
        type: Schema.Types.ObjectId,
        ref: 'Form',
        required: false
    },
    placeholderMode: {
        type: String,
        enum: ['preset', 'form', 'mixed'],
        default: 'preset'
    },
    usedPlaceholders: [{
        type: String,
        trim: true
    }],
    bindingConfigs: {
        type: Schema.Types.Mixed, // 存储绑定配置的灵活结构
        default: {}
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'archived'],
        default: 'draft'
    },
    version: {
        type: Number,
        default: 1
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdBy: {
        type: String,
        required: true
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
ContractTemplateSchema.index({ name: 1 });
ContractTemplateSchema.index({ category: 1 });
ContractTemplateSchema.index({ status: 1 });
ContractTemplateSchema.index({ createdBy: 1 });
ContractTemplateSchema.index({ createTime: -1 });

// 确保同一类别只有一个默认模板
ContractTemplateSchema.index({ category: 1, isDefault: 1 }, {
    unique: true,
    partialFilterExpression: { isDefault: true }
});

export default mongoose.model<IContractTemplate>('ContractTemplate', ContractTemplateSchema);
