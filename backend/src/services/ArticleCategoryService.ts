import ArticleCategory, { IArticleCategory } from '../models/ArticleCategory'
import mongoose from 'mongoose'

export interface CreateCategoryRequest {
    name: string
    description?: string
    slug: string
    color?: string
    parentId?: string
}

export interface UpdateCategoryRequest {
    name?: string
    description?: string
    slug?: string
    color?: string
    isActive?: boolean
    parentId?: string
}

export interface CategoryQuery {
    searchText?: string
    isActive?: boolean
    parentId?: string
    level?: number
}

export interface CategoryListResponse {
    categories: IArticleCategory[]
    total: number
    stats: {
        total: number
        active: number
        totalArticles: number
    }
}

export class ArticleCategoryService {
    // 创建分类
    static async createCategory(data: CreateCategoryRequest): Promise<IArticleCategory> {
        const { parentId, ...categoryData } = data

        // 计算层级和路径
        let level = 1
        let path: string[] = []

        if (parentId) {
            const parent = await ArticleCategory.findById(parentId)
            if (!parent) {
                throw new Error('父分类不存在')
            }
            level = parent.level + 1
            path = [...parent.path, parentId]
        }

        const category = new ArticleCategory({
            ...categoryData,
            parentId,
            level,
            path
        })

        return await category.save()
    }

    // 获取分类列表（树形结构）
    static async getCategories(query: CategoryQuery = {}): Promise<IArticleCategory[]> {
        const { searchText, isActive, parentId, level } = query

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

        if (parentId !== undefined) {
            filter.parentId = parentId
        }

        if (level !== undefined) {
            filter.level = level
        }

        const categories = await ArticleCategory.find(filter)
            .sort({ createTime: -1 })
            .lean()

        return this.buildCategoryTree(categories)
    }

    // 构建分类树
    static buildCategoryTree(categories: any[]): IArticleCategory[] {
        const categoryMap = new Map()
        const roots: IArticleCategory[] = []

        // 创建映射
        categories.forEach(category => {
            categoryMap.set(category._id.toString(), { ...category, children: [] })
        })

        // 构建树
        categories.forEach(category => {
            const categoryNode = categoryMap.get(category._id.toString())

            if (category.parentId) {
                const parent = categoryMap.get(category.parentId.toString())
                if (parent) {
                    parent.children.push(categoryNode)
                }
            } else {
                roots.push(categoryNode)
            }
        })

        return roots
    }

    // 根据ID获取分类
    static async getCategoryById(id: string): Promise<IArticleCategory | null> {
        return await ArticleCategory.findById(id)
    }

    // 更新分类
    static async updateCategory(id: string, data: UpdateCategoryRequest): Promise<IArticleCategory | null> {
        const { parentId, ...updateData } = data

        // 如果要更新父分类，需要重新计算层级和路径
        if (parentId !== undefined) {
            let level = 1
            let path: string[] = []

            if (parentId) {
                const parent = await ArticleCategory.findById(parentId)
                if (!parent) {
                    throw new Error('父分类不存在')
                }
                level = parent.level + 1
                path = [...parent.path, parentId]
            }

            (updateData as any).level = level;
            (updateData as any).path = path;
        }

        return await ArticleCategory.findByIdAndUpdate(
            id,
            { ...updateData, updateTime: new Date() },
            { new: true }
        )
    }

    // 删除分类
    static async deleteCategory(id: string): Promise<boolean> {
        // 检查是否有子分类
        const hasChildren = await ArticleCategory.exists({ parentId: id })
        if (hasChildren) {
            throw new Error('无法删除有子分类的分类')
        }

        const result = await ArticleCategory.findByIdAndDelete(id)
        return !!result
    }

    // 切换分类状态
    static async toggleCategoryStatus(id: string): Promise<IArticleCategory | null> {
        const category = await ArticleCategory.findById(id)
        if (!category) {
            throw new Error('分类不存在')
        }

        category.isActive = !category.isActive
        return await category.save()
    }

    // 获取分类统计
    static async getCategoryStats(): Promise<{ total: number; active: number; totalArticles: number }> {
        const [total, active, totalArticles] = await Promise.all([
            ArticleCategory.countDocuments(),
            ArticleCategory.countDocuments({ isActive: true }),
            ArticleCategory.aggregate([
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
    static async updateArticleCount(categoryId: string, increment: number = 1): Promise<void> {
        await ArticleCategory.findByIdAndUpdate(
            categoryId,
            { $inc: { articleCount: increment } }
        )
    }

    // 获取所有可用的父分类（排除自己和自己的子分类）
    static async getAvailableParentCategories(excludeId?: string): Promise<IArticleCategory[]> {
        let filter: any = {}

        if (excludeId) {
            // 排除自己和自己的所有子分类
            const excludeCategory = await ArticleCategory.findById(excludeId)
            if (excludeCategory) {
                const excludeIds = [excludeId]
                // 获取所有子分类ID
                const children = await ArticleCategory.find({
                    path: { $in: [excludeId] }
                })
                excludeIds.push(...children.map((c: any) => c._id.toString()))
                filter._id = { $nin: excludeIds }
            }
        }

        return await ArticleCategory.find(filter)
            .sort({ level: 1, createTime: -1 })
            .lean()
    }
} 