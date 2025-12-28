import mongoose, { Document, Schema } from 'mongoose';

export interface IContractTemplateCategory extends Document {
    name: string;
    description?: string;
    color?: string;
    isDefault: boolean;
    templateCount?: number;
    createdBy: string;
    createTime: Date;
    updateTime: Date;
}

const ContractTemplateCategorySchema = new Schema<IContractTemplateCategory>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
        unique: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 200
    },
    color: {
        type: String,
        enum: ['blue', 'green', 'orange', 'red', 'purple', 'cyan'],
        default: 'blue'
    },
    isDefault: {
        type: Boolean,
        default: false
    },
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
ContractTemplateCategorySchema.index({ name: 1 });
ContractTemplateCategorySchema.index({ createdBy: 1 });
ContractTemplateCategorySchema.index({ createTime: -1 });

// 确保只有一个默认分类
ContractTemplateCategorySchema.index(
    { isDefault: 1 },
    {
        unique: true,
        partialFilterExpression: { isDefault: true }
    }
);

export default mongoose.model<IContractTemplateCategory>('ContractTemplateCategory', ContractTemplateCategorySchema);
