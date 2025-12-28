/**
 * AI 模型配置 Model
 */

import mongoose, { Document, Schema } from 'mongoose';

// AI 提供商类型
export type AiProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'deepseek'
  | 'zhipu'
  | 'moonshot'
  | 'qwen'
  | 'ollama'
  | 'lmstudio'
  | 'custom';

// AI 模型配置接口
export interface IAiModel extends Document {
  name: string;
  provider: AiProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  isDefault: boolean;
  isEnabled: boolean;
  enterpriseId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AiModelSchema = new Schema<IAiModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      enum: [
        'openai',
        'anthropic',
        'google',
        'deepseek',
        'zhipu',
        'moonshot',
        'qwen',
        'ollama',
        'lmstudio',
        'custom',
      ],
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    apiKey: {
      type: String,
      select: false, // 默认不返回 API Key
    },
    baseUrl: {
      type: String,
      trim: true,
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2,
    },
    maxTokens: {
      type: Number,
      default: 4096,
    },
    topP: {
      type: Number,
      default: 1,
      min: 0,
      max: 1,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    // 注意：enterpriseId 已弃用，AI 设置现在是全局配置
    // 保留字段是为了向后兼容，但不再是必需的
    enterpriseId: {
      type: Schema.Types.ObjectId,
      ref: 'Enterprise',
      required: false, // 改为非必需，支持全局配置
    },
  },
  {
    timestamps: true,
  }
);

// 索引 - AI 设置是全局配置，不需要按企业索引
AiModelSchema.index({ isDefault: 1 });
AiModelSchema.index({ provider: 1 });

// 虚拟字段：判断是否已设置 API Key
AiModelSchema.virtual('apiKeySet').get(function () {
  return !!this.apiKey;
});

// 确保 JSON 输出包含虚拟字段
AiModelSchema.set('toJSON', { virtuals: true });
AiModelSchema.set('toObject', { virtuals: true });

export default mongoose.model<IAiModel>('AiModel', AiModelSchema);

