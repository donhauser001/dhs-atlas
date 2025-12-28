import mongoose, { Schema, Document } from 'mongoose'

export interface IClient extends Document {
    name: string;
    address: string;
    invoiceType: string;
    invoiceInfo: string;
    category: string;
    quotationId?: string;
    rating: number;
    files: Array<{
        path: string;        // 文件路径
        originalName: string; // 原始文件名
        size: number;        // 文件大小（字节）
    }>;
    summary: string;
    status: 'active' | 'inactive';
    createTime: string;
    updateTime: string;
}

const ClientSchema = new Schema<IClient>({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    invoiceType: {
        type: String,
        required: true,
        enum: ['增值税专用发票', '增值税普通发票', '不开票']
    },
    invoiceInfo: {
        type: String,
        default: '',
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    quotationId: {
        type: String,
        default: null
    },
    rating: {
        type: Number,
        default: 3,
        min: 1,
        max: 5
    },
    files: [{
        path: {
            type: String,
            required: true
        },
        originalName: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        }
    }],
    summary: {
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
    createTime: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    },
    updateTime: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    }
}, {
    timestamps: true
})



export interface CreateClientRequest {
    name: string;
    address: string;
    invoiceType: string;
    invoiceInfo?: string;
    category: string;
    quotationId?: string;
    rating?: number;
    files?: Array<{
        path: string;
        originalName: string;
        size: number;
    }>;
    summary?: string;
    status?: 'active' | 'inactive';
}

export interface UpdateClientRequest {
    name?: string;
    address?: string;
    invoiceType?: string;
    invoiceInfo?: string;
    category?: string;
    quotationId?: string;
    rating?: number;
    files?: Array<{
        path: string;
        originalName: string;
        size: number;
    }>;
    summary?: string;
    status?: 'active' | 'inactive';
}

export interface ClientQuery {
    search?: string;
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
}

export default mongoose.model<IClient>('Client', ClientSchema) 