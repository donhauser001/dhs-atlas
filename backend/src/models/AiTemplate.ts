/**
 * AI 输出样例模板
 * 
 * 存储输出参考模板，让 AI 知道应该如何格式化输出
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IAiTemplate extends Document {
    templateId: string;       // 模板ID
    name: string;             // 模板名称
    scenario: string;         // 使用场景描述
    template: string;         // Markdown 模板内容
    tags: string[];           // 标签，便于匹配
    enabled: boolean;         // 是否启用
    order: number;            // 排序
    createdAt: Date;
    updatedAt: Date;
}

const AiTemplateSchema = new Schema<IAiTemplate>({
    templateId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    scenario: {
        type: String,
        required: true,
    },
    template: {
        type: String,
        required: true,
    },
    tags: [{
        type: String,
        trim: true,
    }],
    enabled: {
        type: Boolean,
        default: true,
    },
    order: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// 索引
AiTemplateSchema.index({ tags: 1 });

export default mongoose.model<IAiTemplate>('AiTemplate', AiTemplateSchema);

