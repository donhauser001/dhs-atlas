/**
 * AI 地图模型
 * 
 * 定义场景与工具、数据、模板的映射关系
 * 帮助 AI 在复杂任务中找到正确的执行路径
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IAiMap extends Document {
    mapId: string;            // 地图ID，如 query_client
    name: string;             // 地图名称，如 查询客户
    description: string;      // 场景描述
    triggers: string[];       // 触发关键词，如 ['查询客户', '找客户', '搜索客户']
    steps: {                  // 执行步骤
        order: number;        // 步骤顺序
        action: string;       // 动作描述
        toolId?: string;      // 使用的工具
        dataModel?: string;   // 涉及的数据模型
        templateId?: string;  // 使用的输出模板
        condition?: string;   // 条件判断（如：结果为空时）
        note?: string;        // 步骤说明
    }[];
    examples: string;         // 完整示例（Markdown）
    enabled: boolean;
    priority: number;         // 优先级，数字越大越优先匹配
    module: string;           // 所属模块：crm, project, finance 等
    createdAt: Date;
    updatedAt: Date;
}

const AiMapSchema = new Schema<IAiMap>({
    mapId: {
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
    triggers: [{
        type: String,
        trim: true,
    }],
    steps: [{
        order: { type: Number, required: true },
        action: { type: String, required: true },
        toolId: String,
        dataModel: String,
        templateId: String,
        condition: String,
        note: String,
    }],
    examples: {
        type: String,
        default: '',
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    priority: {
        type: Number,
        default: 0,
    },
    module: {
        type: String,
        default: 'general',
    },
}, {
    timestamps: true,
});

// 索引
AiMapSchema.index({ triggers: 1 });
AiMapSchema.index({ module: 1 });
AiMapSchema.index({ priority: -1 });

export default mongoose.model<IAiMap>('AiMap', AiMapSchema);

