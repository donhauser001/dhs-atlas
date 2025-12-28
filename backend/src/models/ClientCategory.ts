import mongoose, { Schema, Document } from 'mongoose'

export interface IClientCategory extends Document {
    name: string
    description: string
    status: 'active' | 'inactive'
    clientCount: number
    createTime: string
}

const ClientCategorySchema = new Schema<IClientCategory>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
        index: true
    },
    clientCount: {
        type: Number,
        default: 0
    },
    createTime: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    }
}, {
    timestamps: true
})



export interface CreateClientCategoryRequest {
    name: string
    description?: string
    status?: 'active' | 'inactive'
}

export interface UpdateClientCategoryRequest {
    name?: string
    description?: string
    status?: 'active' | 'inactive'
}

export default mongoose.model<IClientCategory>('ClientCategory', ClientCategorySchema)