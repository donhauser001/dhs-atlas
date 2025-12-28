/**
 * AI 数据模型定义
 * 
 * 存储数据库表结构，让 AI 了解数据模型
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IAiDataModel extends Document {
    collection: string;       // 集合名称，如 clients
    name: string;             // 中文名称，如 客户表
    description: string;      // 表描述
    fields: string;           // 字段说明（Markdown）
    relations: string;        // 关联关系（Markdown）
    queryExamples: string;    // 查询示例（Markdown）
    enabled: boolean;         // 是否启用
    order: number;            // 排序
    createdAt: Date;
    updatedAt: Date;
}

const AiDataModelSchema = new Schema<IAiDataModel>({
    collection: {
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
        default: '',
    },
    fields: {
        type: String,
        required: true,
    },
    relations: {
        type: String,
        default: '',
    },
    queryExamples: {
        type: String,
        default: '',
    },
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

export default mongoose.model<IAiDataModel>('AiDataModel', AiDataModelSchema);

