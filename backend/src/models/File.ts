import mongoose, { Schema, Document } from 'mongoose';

// 文件接口定义
export interface IFile extends Document {
    _id: mongoose.Types.ObjectId;
    originalName: string;        // 原始文件名
    fileName: string;           // 存储的文件名
    filePath: string;           // 文件存储路径
    thumbnailPath?: string;     // 缩略图路径
    fileSize: number;           // 文件大小（字节）
    mimeType: string;           // 文件MIME类型
    category: string;           // 文件分类（对应上传目录）
    subDirectory?: string;      // 子目录（如客户ID等）
    uploadedBy: mongoose.Types.ObjectId;  // 上传者用户ID
    uploaderName: string;       // 上传者姓名
    uploadTime: Date;           // 上传时间
    lastModified: Date;         // 最后修改时间
    isPublic: boolean;          // 是否公开（管理员可见所有文件）
    description?: string;       // 文件描述
    tags?: string[];           // 文件标签
    downloadCount: number;      // 下载次数
    status: 'active' | 'deleted';  // 文件状态
}

// 文件创建请求接口
export interface CreateFileRequest {
    originalName: string;
    fileName: string;
    filePath: string;
    thumbnailPath?: string;
    fileSize: number;
    mimeType: string;
    category: string;
    subDirectory?: string;
    uploadedBy: string;
    uploaderName: string;
    isPublic?: boolean;
    description?: string;
    tags?: string[];
}

// 文件更新请求接口
export interface UpdateFileRequest {
    originalName?: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
}

// 文件查询接口
export interface FileQuery {
    page?: number;
    limit?: number;
    category?: string;
    uploadedBy?: string;
    search?: string;
    tags?: string[];
    isPublic?: boolean;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// 文件Schema定义
const FileSchema: Schema = new Schema({
    originalName: {
        type: String,
        required: true,
        trim: true
    },
    fileName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    filePath: {
        type: String,
        required: true,
        trim: true
    },
    thumbnailPath: {
        type: String,
        trim: true
    },
    fileSize: {
        type: Number,
        required: true,
        min: 0
    },
    mimeType: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'article-image',
            'articles',
            'avatars',
            'clients',
            'contracts',
            'departments',
            'enterprises',
            'projects',
            'users',
            'forms',
            'general',
            'single'
        ],
        trim: true
    },
    subDirectory: {
        type: String,
        trim: true
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploaderName: {
        type: String,
        required: true,
        trim: true
    },
    uploadTime: {
        type: Date,
        default: Date.now
    },
    lastModified: {
        type: Date,
        default: Date.now
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    downloadCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'deleted'],
        default: 'active'
    }
}, {
    timestamps: true,
    collection: 'files'
});

// 创建索引
FileSchema.index({ uploadedBy: 1, category: 1 });
FileSchema.index({ fileName: 1 });
FileSchema.index({ originalName: 'text', description: 'text' });
FileSchema.index({ uploadTime: -1 });
FileSchema.index({ category: 1, status: 1 });

// 更新lastModified字段的中间件
FileSchema.pre('save', function (next) {
    if (this.isModified() && !this.isNew) {
        this.lastModified = new Date();
    }
    next();
});

// 导出模型
export const File = mongoose.model<IFile>('File', FileSchema);
export default File;