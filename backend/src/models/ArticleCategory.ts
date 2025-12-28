import mongoose, { Document, Schema } from 'mongoose'

export interface IArticleCategory extends Document {
    name: string
    description?: string
    slug: string
    color?: string
    articleCount: number
    isActive: boolean
    parentId?: string
    level: number
    path: string[]
    children?: IArticleCategory[]
    createTime: Date
    updateTime: Date
}

const ArticleCategorySchema = new Schema<IArticleCategory>({
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
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'ArticleCategory'
    },
    level: {
        type: Number,
        default: 1
    },
    path: [{
        type: Schema.Types.ObjectId,
        ref: 'ArticleCategory'
    }],
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
ArticleCategorySchema.index({ slug: 1 })
ArticleCategorySchema.index({ parentId: 1 })
ArticleCategorySchema.index({ isActive: 1 })
ArticleCategorySchema.index({ level: 1 })

// 更新时间中间件
ArticleCategorySchema.pre('save', function(next) {
    this.updateTime = new Date()
    next()
})

export default mongoose.model<IArticleCategory>('ArticleCategory', ArticleCategorySchema) 