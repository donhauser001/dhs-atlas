import mongoose, { Schema, Document } from 'mongoose'

export interface ITierSetting {
    id: string
    startQuantity?: number
    endQuantity?: number
    minQuantity?: number // 向后兼容
    maxQuantity?: number // 向后兼容
    minAmount?: number // 向后兼容
    maxAmount?: number // 向后兼容
    discountRatio: number
}

export interface IPricingPolicy extends Document {
    name: string
    alias: string
    type: 'tiered_discount' | 'uniform_discount'
    summary: string
    validUntil: Date | null
    discountRatio?: number
    tierSettings?: ITierSetting[]
    status: 'active' | 'inactive'
    createTime: Date
    updateTime: Date
}

const TierSettingSchema = new Schema<ITierSetting>({
    id: {
        type: String,
        required: true
    },
    startQuantity: {
        type: Number,
        min: 1
    },
    endQuantity: {
        type: Number,
        min: 1
    },
    minQuantity: {
        type: Number,
        min: 1
    },
    maxQuantity: {
        type: Number,
        min: 1
    },
    minAmount: {
        type: Number,
        min: 0
    },
    maxAmount: {
        type: Number,
        min: 0
    },
    discountRatio: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    }
})

const PricingPolicySchema = new Schema<IPricingPolicy>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    alias: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['tiered_discount', 'uniform_discount'],
        required: true
    },
    summary: {
        type: String,
        default: ''
    },
    validUntil: {
        type: Date,
        default: null
    },
    discountRatio: {
        type: Number,
        min: 0,
        max: 100
    },
    tierSettings: [TierSettingSchema],
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
PricingPolicySchema.index({ name: 1 })
PricingPolicySchema.index({ alias: 1 })
PricingPolicySchema.index({ type: 1 })
PricingPolicySchema.index({ status: 1 })

export default mongoose.model<IPricingPolicy>('PricingPolicy', PricingPolicySchema) 