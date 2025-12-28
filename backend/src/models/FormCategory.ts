import mongoose, { Schema, Document } from 'mongoose'

export interface IFormCategory extends Document {
    name: string
    description?: string
    color: string
    formCount: number
    isActive: boolean
    createTime: Date
    updateTime: Date
}

const FormCategorySchema = new Schema<IFormCategory>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    description: {
        type: String,
        trim: true,
        maxlength: 200
    },
    color: {
        type: String,
        required: true,
        default: '#1890ff'
    },
    formCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createTime: {
        type: Date,
        default: Date.now
    },
    updateTime: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' }
})

// 添加索引
FormCategorySchema.index({ name: 1 })
FormCategorySchema.index({ isActive: 1 })

export default mongoose.model<IFormCategory>('FormCategory', FormCategorySchema) 