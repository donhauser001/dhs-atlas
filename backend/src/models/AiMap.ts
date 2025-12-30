/**
 * AI 地图模型 - V2 架构
 * 
 * 定义场景与工具、数据、模板的映射关系
 * 帮助 AI 在复杂任务中找到正确的执行路径
 * 
 * V2 核心变化：
 * - 每步精确定义工具、参数模板、输出变量
 * - nextStepPrompt: 系统自动注入给 AI 的下一步提示
 * - 支持步骤间数据传递
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * 地图步骤定义
 */
export interface IAiMapStep {
    /** 步骤序号（从 1 开始） */
    order: number;
    /** 步骤名称（用于任务列表展示） */
    name: string;
    /** 动作描述（告诉 AI 这一步做什么） */
    action: string;
    /** 使用的工具 ID */
    toolId: string;
    /** 参数模板（支持变量引用，如 {{clientName}}） */
    paramsTemplate?: Record<string, any>;
    /** 输出变量名（供下一步使用，如 clientInfo） */
    outputKey?: string;
    /** 
     * 下一步提示词（核心！）
     * 步骤完成后系统自动注入给 AI
     * 支持模板变量：{{outputKey.field}}
     */
    nextStepPrompt?: string;
    /** 涉及的数据模型（可选，用于文档说明） */
    dataModel?: string;
    /** 使用的输出模板（可选） */
    templateId?: string;
    /** 条件判断（如：结果为空时） */
    condition?: string;
    /** 步骤说明/备注 */
    note?: string;
}

export interface IAiMap extends Document {
    mapId: string;            // 地图ID，如 query_client_quotation
    name: string;             // 地图名称，如 查询客户报价单
    description: string;      // 场景描述
    triggers: string[];       // 触发关键词，如 ['报价单', '价格单', '定价方案']
    steps: IAiMapStep[];      // 执行步骤（V2 升级版）
    examples: string;         // 完整示例（Markdown）
    enabled: boolean;
    priority: number;         // 优先级，数字越大越优先匹配
    module: string;           // 所属模块：crm, project, finance 等
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 步骤 Schema（V2 升级版）
 */
const AiMapStepSchema = new Schema({
    order: { type: Number, required: true },
    name: { type: String, required: true },
    action: { type: String, required: true },
    toolId: { type: String, required: true },
    paramsTemplate: { type: Schema.Types.Mixed },
    outputKey: { type: String },
    nextStepPrompt: { type: String },
    dataModel: { type: String },
    templateId: { type: String },
    condition: { type: String },
    note: { type: String },
}, { _id: false });

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
    steps: [AiMapStepSchema],
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

