import mongoose, { Document, Schema } from 'mongoose'

export interface IPricingCategory extends Document {
    name: string
    description: string
    status: 'active' | 'inactive'
    serviceCount: number
    createTime: Date
    updateTime: Date
}

export interface PricingCategory {
    _id: string
    name: string
    description: string
    status: 'active' | 'inactive'
    serviceCount: number
    createTime: string
    updateTime: string
}

export interface CreatePricingCategoryRequest {
    name: string
    description?: string
    status?: 'active' | 'inactive'
}

export interface UpdatePricingCategoryRequest {
    name?: string
    description?: string
    status?: 'active' | 'inactive'
}

const PricingCategorySchema = new Schema<IPricingCategory>({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    serviceCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: {
        createdAt: 'createTime',
        updatedAt: 'updateTime'
    }
})

// 添加索引
PricingCategorySchema.index({ name: 1 })
PricingCategorySchema.index({ status: 1 })

export const PricingCategory = mongoose.model<IPricingCategory>('PricingCategory', PricingCategorySchema) 