import mongoose, { Schema, Document } from 'mongoose'

export interface IDepartment extends Document {
    name: string;
    parentId?: string;
    enterpriseId: string;
    enterpriseName: string;
    level: number;
    employeeCount: number;
    status: 'active' | 'inactive';
    createTime: string;
}

const DepartmentSchema = new Schema<IDepartment>({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    parentId: {
        type: String,
        ref: 'Department',
        index: true
    },
    enterpriseId: {
        type: String,
        required: true,
        index: true
    },
    enterpriseName: {
        type: String,
        required: true,
        trim: true
    },
    level: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    },
    employeeCount: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
        index: true
    },
    createTime: {
        type: String,
        default: () => new Date().toLocaleString()
    }
}, {
    timestamps: true
})

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema)

export interface Department {
    id: string;
    name: string;
    parentId?: string;
    enterpriseId: string;
    enterpriseName: string;
    level: number;
    employeeCount: number;
    status: 'active' | 'inactive';
    createTime: string;
}

export interface CreateDepartmentRequest {
    name: string;
    parentId?: string;
    enterpriseId: string;
    status: 'active' | 'inactive';
}

export interface UpdateDepartmentRequest {
    name?: string;
    parentId?: string;
    enterpriseId?: string;
    enterpriseName?: string;
    status?: 'active' | 'inactive';
}

export interface DepartmentQuery {
    enterpriseId?: string;
    parentId?: string;
    status?: string;
    page?: number;
    limit?: number;
} 