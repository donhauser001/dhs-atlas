import mongoose, { Schema, Document } from 'mongoose'

export interface IServicePricing extends Document {
    serviceName: string
    alias: string
    categoryId: string
    categoryName?: string
    unitPrice: number
    unit: string
    priceDescription: string
    link: string
    additionalConfigId?: string
    additionalConfigName?: string
    serviceProcessId?: string
    serviceProcessName?: string
    pricingPolicyIds?: string[]
    pricingPolicyNames?: string[]
    status: 'active' | 'inactive'
    createTime: Date
    updateTime: Date
}

const ServicePricingSchema = new Schema<IServicePricing>({
    serviceName: {
        type: String,
        required: true,
        trim: true
    },
    alias: {
        type: String,
        required: true,
        trim: true
    },
    categoryId: {
        type: String,
        required: true
    },
    categoryName: {
        type: String,
        trim: true
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true,
        trim: true
    },
    priceDescription: {
        type: String,
        default: ''
    },
    link: {
        type: String,
        default: ''
    },
    additionalConfigId: {
        type: String
    },
    additionalConfigName: {
        type: String,
        trim: true
    },
    serviceProcessId: {
        type: String
    },
    serviceProcessName: {
        type: String,
        trim: true
    },
    pricingPolicyIds: [{
        type: String
    }],
    pricingPolicyNames: [{
        type: String,
        trim: true
    }],
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
ServicePricingSchema.index({ serviceName: 1 })
ServicePricingSchema.index({ alias: 1 })
ServicePricingSchema.index({ categoryId: 1 })
ServicePricingSchema.index({ status: 1 })

export default mongoose.model<IServicePricing>('ServicePricing', ServicePricingSchema) 