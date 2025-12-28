/**
 * AI 工具集模型
 * 
 * 存储 AI 可用的工具定义
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IAiTool extends Document {
    toolId: string;           // 工具ID，如 db.query
    name: string;             // 工具名称
    description: string;      // 工具描述
    usage: string;            // 使用方法（Markdown）
    examples: string;         // 调用示例（Markdown）
    enabled: boolean;         // 是否启用
    category: string;         // 分类：database, form, api 等
    order: number;            // 排序
    createdAt: Date;
    updatedAt: Date;
}

const AiToolSchema = new Schema<IAiTool>({
    toolId: {
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
    description: {
        type: String,
        required: true,
    },
    usage: {
        type: String,
        default: '',
    },
    examples: {
        type: String,
        default: '',
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    category: {
        type: String,
        default: 'general',
    },
    order: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

export default mongoose.model<IAiTool>('AiTool', AiToolSchema);

