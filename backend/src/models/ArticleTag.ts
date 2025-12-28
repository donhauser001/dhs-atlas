import mongoose, { Document, Schema } from 'mongoose'

export interface IArticleTag extends Document {
    name: string
    description?: string
    slug: string
    color?: string
    articleCount: number
    isActive: boolean
    createTime: Date
    updateTime: Date
}

const ArticleTagSchema = new Schema<IArticleTag>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    color: {
        type: String,
        default: '#1890ff'
    },
    articleCount: {
        type: Number,
        default: 0
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
})

// 索引
ArticleTagSchema.index({ slug: 1 })
ArticleTagSchema.index({ isActive: 1 })

// 更新时间中间件
ArticleTagSchema.pre('save', function(next) {
    this.updateTime = new Date()
    next()
})

export default mongoose.model<IArticleTag>('ArticleTag', ArticleTagSchema) 