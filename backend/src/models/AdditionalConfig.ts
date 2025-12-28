import mongoose, { Schema, Document } from 'mongoose'

export interface IAdditionalConfig extends Document {
    name: string
    description: string
    initialDraftCount: number // 初稿方案数量
    maxDraftCount: number // 最多方案数量
    mainCreatorRatio: number // 主创绩效比例
    assistantRatio: number // 助理绩效比例
    status: 'active' | 'inactive'
    createTime: Date
    updateTime: Date
}

const AdditionalConfigSchema = new Schema<IAdditionalConfig>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    initialDraftCount: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    maxDraftCount: {
        type: Number,
        required: true,
        min: 1,
        max: 20
    },
    mainCreatorRatio: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    assistantRatio: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: {
        createdAt: 'createTime',
        updatedAt: 'updateTime'
    }
})

// 添加索引
AdditionalConfigSchema.index({ name: 1 })
AdditionalConfigSchema.index({ status: 1 })

export default mongoose.model<IAdditionalConfig>('AdditionalConfig', AdditionalConfigSchema) 