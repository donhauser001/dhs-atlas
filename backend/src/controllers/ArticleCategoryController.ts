import { Request, Response } from 'express'
import { ArticleCategoryService, CreateCategoryRequest, UpdateCategoryRequest, CategoryQuery } from '../services/ArticleCategoryService'

export class ArticleCategoryController {
    // 创建分类
    static async createCategory(req: Request, res: Response): Promise<void> {
        try {
            const categoryData: CreateCategoryRequest = req.body

            // 验证必填字段
            if (!categoryData.name || !categoryData.slug) {
                res.status(400).json({
                    success: false,
                    message: '分类名称和别名不能为空'
                })
                return
            }

            const category = await ArticleCategoryService.createCategory(categoryData)

            res.status(201).json({
                success: true,
                data: category,
                message: '分类创建成功'
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '创建分类失败'
            })
        }
    }

    // 获取分类列表
    static async getCategories(req: Request, res: Response) {
        try {
            const query: CategoryQuery = {
                searchText: req.query.searchText as string,
                isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
                parentId: req.query.parentId as string,
                level: req.query.level ? parseInt(req.query.level as string) : undefined
            }

            const categories = await ArticleCategoryService.getCategories(query)
            const stats = await ArticleCategoryService.getCategoryStats()

            res.json({
                success: true,
                data: {
                    categories,
                    stats
                }
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '获取分类列表失败'
            })
        }
    }

    // 根据ID获取分类
    static async getCategoryById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params
            const category = await ArticleCategoryService.getCategoryById(id)

            if (!category) {
                res.status(404).json({
                    success: false,
                    message: '分类不存在'
                })
                return
            }

            res.json({
                success: true,
                data: category
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '获取分类失败'
            })
        }
    }

    // 更新分类
    static async updateCategory(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params
            const updateData: UpdateCategoryRequest = req.body

            const category = await ArticleCategoryService.updateCategory(id, updateData)

            if (!category) {
                res.status(404).json({
                    success: false,
                    message: '分类不存在'
                })
                return
            }

            res.json({
                success: true,
                data: category,
                message: '分类更新成功'
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '更新分类失败'
            })
        }
    }

    // 删除分类
    static async deleteCategory(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params
            const success = await ArticleCategoryService.deleteCategory(id)

            if (!success) {
                res.status(404).json({
                    success: false,
                    message: '分类不存在'
                })
                return
            }

            res.json({
                success: true,
                message: '分类删除成功'
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '删除分类失败'
            })
        }
    }

    // 切换分类状态
    static async toggleCategoryStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params
            const category = await ArticleCategoryService.toggleCategoryStatus(id)

            if (!category) {
                res.status(404).json({
                    success: false,
                    message: '分类不存在'
                })
                return
            }

            res.json({
                success: true,
                data: category,
                message: `分类已${category.isActive ? '启用' : '禁用'}`
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '切换分类状态失败'
            })
        }
    }

    // 获取分类统计
    static async getCategoryStats(req: Request, res: Response) {
        try {
            const stats = await ArticleCategoryService.getCategoryStats()

            res.json({
                success: true,
                data: stats
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '获取分类统计失败'
            })
        }
    }

    // 获取可用的父分类
    static async getAvailableParentCategories(req: Request, res: Response) {
        try {
            const { excludeId } = req.query
            const categories = await ArticleCategoryService.getAvailableParentCategories(excludeId as string)

            res.json({
                success: true,
                data: categories
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '获取父分类列表失败'
            })
        }
    }
} 