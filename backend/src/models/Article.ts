import mongoose, { Schema, Document } from 'mongoose';

export interface IArticle extends Document {
    title: string;
    content: string;
    summary?: string;
    category: mongoose.Types.ObjectId;
    tags: string[];
    author: string;
    authorId: string;
    status: 'draft' | 'published' | 'archived';
    publishTime?: Date;
    coverImage?: string;
    viewCount: number;
    isTop: boolean;
    isRecommend: boolean;
    seoTitle?: string;
    seoKeywords?: string;
    seoDescription?: string;
    createTime: Date;
    updateTime: Date;
}

const ArticleSchema = new Schema<IArticle>({
    title: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        trim: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'ArticleCategory',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    author: {
        type: String,
        required: true
    },
    authorId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft',
        index: true
    },
    publishTime: {
        type: Date
    },
    coverImage: {
        type: String
    },
    viewCount: {
        type: Number,
        default: 0
    },
    isTop: {
        type: Boolean,
        default: false
    },
    isRecommend: {
        type: Boolean,
        default: false
    },
    seoTitle: {
        type: String,
        trim: true
    },
    seoKeywords: {
        type: String,
        trim: true
    },
    seoDescription: {
        type: String,
        trim: true
    }
}, {
    timestamps: {
        createdAt: 'createTime',
        updatedAt: 'updateTime'
    }
});

// 索引
ArticleSchema.index({ title: 'text', content: 'text' });
ArticleSchema.index({ category: 1 });
ArticleSchema.index({ status: 1 });
ArticleSchema.index({ authorId: 1 });
ArticleSchema.index({ publishTime: -1 });
ArticleSchema.index({ viewCount: -1 });
ArticleSchema.index({ isTop: 1 });
ArticleSchema.index({ isRecommend: 1 });

export default mongoose.model<IArticle>('Article', ArticleSchema); 