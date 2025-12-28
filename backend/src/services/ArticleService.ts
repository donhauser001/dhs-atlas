import Article, { IArticle } from '../models/Article';

export interface CreateArticleRequest {
    title: string;
    content: string;
    summary?: string;
    category: string;
    tags?: string[];
    author: string;
    authorId: string;
    coverImage?: string;
    seoTitle?: string;
    seoKeywords?: string;
    seoDescription?: string;
}

export interface UpdateArticleRequest {
    title?: string;
    content?: string;
    summary?: string;
    category?: string;
    tags?: string[];
    status?: 'draft' | 'published' | 'archived';
    publishTime?: Date;
    coverImage?: string;
    isTop?: boolean;
    isRecommend?: boolean;
    seoTitle?: string;
    seoKeywords?: string;
    seoDescription?: string;
}

export interface ArticleQuery {
    search?: string;
    category?: string;
    status?: string;
    authorId?: string;
    page?: number;
    limit?: number;
}

class ArticleService {
    // 创建文章
    async createArticle(data: CreateArticleRequest): Promise<IArticle> {
        const article = new Article({
            ...data,
            status: 'draft',
            viewCount: 0,
            isTop: false,
            isRecommend: false
        });
        return await article.save();
    }

    // 获取文章列表
    async getArticles(query: ArticleQuery = {}): Promise<{ articles: IArticle[], total: number }> {
        const { search, category, status, authorId, page = 1, limit = 10 } = query;

        let filter: any = {};

        if (search) {
            filter.$text = { $search: search };
        }

        if (category && category !== 'all') {
            filter.category = category;
        }

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (authorId) {
            filter.authorId = authorId;
        }

        const skip = (page - 1) * limit;

        const [articles, total] = await Promise.all([
            Article.find(filter)
                .sort({ createTime: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Article.countDocuments(filter)
        ]);

        return { articles, total };
    }

    // 根据ID获取文章
    async getArticleById(id: string): Promise<IArticle | null> {
        return await Article.findById(id);
    }

    // 更新文章
    async updateArticle(id: string, data: UpdateArticleRequest): Promise<IArticle | null> {
        const updateData = { ...data };

        // 如果状态改为已发布，设置发布时间
        if (data.status === 'published') {
            updateData.publishTime = new Date();
        }

        return await Article.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );
    }

    // 删除文章
    async deleteArticle(id: string): Promise<boolean> {
        const result = await Article.findByIdAndDelete(id);
        return !!result;
    }

    // 切换文章状态
    async toggleArticleStatus(id: string): Promise<IArticle | null> {
        const article = await Article.findById(id);
        if (!article) return null;

        let newStatus: 'draft' | 'published' | 'archived';
        switch (article.status) {
            case 'draft':
                newStatus = 'published';
                break;
            case 'published':
                newStatus = 'archived';
                break;
            case 'archived':
                newStatus = 'draft';
                break;
            default:
                newStatus = 'draft';
        }

        return await this.updateArticle(id, { status: newStatus });
    }

    // 设置置顶状态
    async toggleTopStatus(id: string): Promise<IArticle | null> {
        const article = await Article.findById(id);
        if (!article) return null;

        return await Article.findByIdAndUpdate(
            id,
            { isTop: !article.isTop },
            { new: true }
        );
    }

    // 设置推荐状态
    async toggleRecommendStatus(id: string): Promise<IArticle | null> {
        const article = await Article.findById(id);
        if (!article) return null;

        return await Article.findByIdAndUpdate(
            id,
            { isRecommend: !article.isRecommend },
            { new: true }
        );
    }

    // 增加浏览量
    async incrementViewCount(id: string): Promise<void> {
        await Article.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    }

    // 获取文章分类统计
    async getCategoryStats(): Promise<{ category: string, count: number }[]> {
        return await Article.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $project: { category: '$_id', count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ]);
    }

    // 获取热门文章
    async getPopularArticles(limit: number = 10): Promise<IArticle[]> {
        return await Article.find({ status: 'published' })
            .sort({ viewCount: -1 })
            .limit(limit)
            .lean();
    }

    // 获取推荐文章
    async getRecommendedArticles(limit: number = 10): Promise<IArticle[]> {
        return await Article.find({
            status: 'published',
            isRecommend: true
        })
            .sort({ publishTime: -1 })
            .limit(limit)
            .lean();
    }
}

export default new ArticleService(); 