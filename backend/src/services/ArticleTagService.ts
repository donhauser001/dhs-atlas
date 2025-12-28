import ArticleTag, { IArticleTag } from '../models/ArticleTag'

export interface CreateTagRequest {
    name: string
    description?: string
    slug: string
    color?: string
}

export interface UpdateTagRequest {
    name?: string
    description?: string
    slug?: string
    color?: string
    isActive?: boolean
}

export interface TagQuery {
    searchText?: string
    isActive?: boolean
    page?: number
    pageSize?: number
}

export interface TagListResponse {
    tags: IArticleTag[]
    total: number
    stats: {
        total: number
        active: number
        totalArticles: number
    }
}

export class ArticleTagService {
    // 创建标签
    static async createTag(data: CreateTagRequest): Promise<IArticleTag> {
        const tag = new ArticleTag(data)
        return await tag.save()
    }

    // 获取标签列表
    static async getTags(query: TagQuery = {}): Promise<TagListResponse> {
        const { searchText, isActive, page = 1, pageSize = 10 } = query

        let filter: any = {}

        if (searchText) {
            filter.$or = [
                { name: { $regex: searchText, $options: 'i' } },
                { description: { $regex: searchText, $options: 'i' } },
                { slug: { $regex: searchText, $options: 'i' } }
            ]
        }

        if (isActive !== undefined) {
            filter.isActive = isActive
        }

        const skip = (page - 1) * pageSize

        const [tags, total] = await Promise.all([
            ArticleTag.find(filter)
                .sort({ createTime: -1 })
                .skip(skip)
                .limit(pageSize)
                .lean(),
            ArticleTag.countDocuments(filter)
        ])

        const stats = await this.getTagStats()

        return {
            tags,
            total,
            stats
        }
    }

    // 根据ID获取标签
    static async getTagById(id: string): Promise<IArticleTag | null> {
        return await ArticleTag.findById(id)
    }

    // 更新标签
    static async updateTag(id: string, data: UpdateTagRequest): Promise<IArticleTag | null> {
        return await ArticleTag.findByIdAndUpdate(
            id,
            { ...data, updateTime: new Date() },
            { new: true }
        )
    }

    // 删除标签
    static async deleteTag(id: string): Promise<boolean> {
        const result = await ArticleTag.findByIdAndDelete(id)
        return !!result
    }

    // 切换标签状态
    static async toggleTagStatus(id: string): Promise<IArticleTag | null> {
        const tag = await ArticleTag.findById(id)
        if (!tag) {
            throw new Error('标签不存在')
        }

        tag.isActive = !tag.isActive
        return await tag.save()
    }

    // 获取标签统计
    static async getTagStats(): Promise<{ total: number; active: number; totalArticles: number }> {
        const [total, active, totalArticles] = await Promise.all([
            ArticleTag.countDocuments(),
            ArticleTag.countDocuments({ isActive: true }),
            ArticleTag.aggregate([
                { $group: { _id: null, total: { $sum: '$articleCount' } } }
            ])
        ])

        return {
            total,
            active,
            totalArticles: totalArticles[0]?.total || 0
        }
    }

    // 更新文章数量
    static async updateArticleCount(tagId: string, increment: number = 1): Promise<void> {
        await ArticleTag.findByIdAndUpdate(
            tagId,
            { $inc: { articleCount: increment } }
        )
    }

    // 根据名称或别名获取标签
    static async getTagByNameOrSlug(nameOrSlug: string): Promise<IArticleTag | null> {
        return await ArticleTag.findOne({
            $or: [
                { name: nameOrSlug },
                { slug: nameOrSlug }
            ]
        })
    }

    // 批量获取标签
    static async getTagsByIds(ids: string[]): Promise<IArticleTag[]> {
        return await ArticleTag.find({ _id: { $in: ids } })
    }

    // 获取所有启用的标签
    static async getActiveTags(): Promise<IArticleTag[]> {
        return await ArticleTag.find({ isActive: true })
            .sort({ articleCount: -1, createTime: -1 })
            .lean()
    }
} 