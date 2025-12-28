import mongoose, { Document, Schema } from 'mongoose'

export interface IQuotation extends Document {
    name: string
    status: 'active' | 'inactive'
    validUntil?: Date
    description: string
    isDefault: boolean
    selectedServices: string[]
    createTime: Date
    updateTime: Date
}

const QuotationSchema = new Schema<IQuotation>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    validUntil: {
        type: Date
    },
    description: {
        type: String,
        default: ''
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    selectedServices: [{
        type: String,
        required: true
    }]
}, {
    timestamps: {
        createdAt: 'createTime',
        updatedAt: 'updateTime'
    }
})

export default mongoose.model<IQuotation>('Quotation', QuotationSchema) 