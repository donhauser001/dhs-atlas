import { Request, Response } from 'express'
import FormCategoryService, {
    CreateFormCategoryData,
    UpdateFormCategoryData,
    FormCategoryQuery
} from '../services/FormCategoryService'

class FormCategoryController {
    // 创建表单分类
    async createCategory(req: Request, res: Response) {
        try {
            const data: CreateFormCategoryData = req.body

            // 验证必填字段
            if (!data.name || !data.color) {
                return res.status(400).json({
                    success: false,
                    message: '分类名称和颜色为必填项'
                })
            }

            // 检查名称是否已存在
            const nameExists = await FormCategoryService.isNameExists(data.name)
            if (nameExists) {
                return res.status(400).json({
                    success: false,
                    message: '分类名称已存在'
                })
            }

            const category = await FormCategoryService.createCategory(data)

            res.status(201).json({
                success: true,
                message: '表单分类创建成功',
                data: category
            })
            return
        } catch (error) {
            console.error('创建表单分类失败:', error)
            res.status(500).json({
                success: false,
                message: '创建表单分类失败'
            })
            return
        }
    }

    // 获取表单分类列表
    async getCategories(req: Request, res: Response) {
        try {
            const query: FormCategoryQuery = {
                search: req.query.search as string,
                isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10
            }

            const result = await FormCategoryService.getCategories(query)

            res.json({
                success: true,
                message: '获取表单分类列表成功',
                data: result
            })
            return
        } catch (error) {
            console.error('获取表单分类列表失败:', error)
            res.status(500).json({
                success: false,
                message: '获取表单分类列表失败'
            })
            return
        }
    }

    // 获取所有启用的分类
    async getActiveCategories(req: Request, res: Response) {
        try {
            const categories = await FormCategoryService.getActiveCategories()

            res.json({
                success: true,
                message: '获取启用分类列表成功',
                data: categories
            })
            return
        } catch (error) {
            console.error('获取启用分类列表失败:', error)
            res.status(500).json({
                success: false,
                message: '获取启用分类列表失败'
            })
            return
        }
    }

    // 根据ID获取表单分类
    async getCategoryById(req: Request, res: Response) {
        try {
            const { id } = req.params

            const category = await FormCategoryService.getCategoryById(id)
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: '表单分类不存在'
                })
            }

            res.json({
                success: true,
                message: '获取表单分类成功',
                data: category
            })
            return
        } catch (error) {
            console.error('获取表单分类失败:', error)
            res.status(500).json({
                success: false,
                message: '获取表单分类失败'
            })
            return
        }
    }

    // 更新表单分类
    async updateCategory(req: Request, res: Response) {
        try {
            const { id } = req.params
            const data: UpdateFormCategoryData = req.body

            // 检查分类是否存在
            const existingCategory = await FormCategoryService.getCategoryById(id)
            if (!existingCategory) {
                return res.status(404).json({
                    success: false,
                    message: '表单分类不存在'
                })
            }

            // 如果更新名称，检查是否重复
            if (data.name && data.name !== existingCategory.name) {
                const nameExists = await FormCategoryService.isNameExists(data.name, id)
                if (nameExists) {
                    return res.status(400).json({
                        success: false,
                        message: '分类名称已存在'
                    })
                }
            }

            const category = await FormCategoryService.updateCategory(id, data)
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: '表单分类不存在'
                })
            }

            res.json({
                success: true,
                message: '表单分类更新成功',
                data: category
            })
            return
        } catch (error) {
            console.error('更新表单分类失败:', error)
            res.status(500).json({
                success: false,
                message: '更新表单分类失败'
            })
            return
        }
    }

    // 删除表单分类
    async deleteCategory(req: Request, res: Response) {
        try {
            const { id } = req.params

            const success = await FormCategoryService.deleteCategory(id)
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: '表单分类不存在'
                })
            }

            res.json({
                success: true,
                message: '表单分类删除成功'
            })
            return
        } catch (error: any) {
            console.error('删除表单分类失败:', error)
            
            if (error.message === '该分类下还有表单，无法删除') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                })
            }

            res.status(500).json({
                success: false,
                message: '删除表单分类失败'
            })
            return
        }
    }

    // 切换分类状态
    async toggleCategoryStatus(req: Request, res: Response) {
        try {
            const { id } = req.params

            const category = await FormCategoryService.toggleCategoryStatus(id)
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: '表单分类不存在'
                })
            }

            res.json({
                success: true,
                message: `表单分类已${category.isActive ? '启用' : '禁用'}`,
                data: category
            })
            return
        } catch (error) {
            console.error('切换分类状态失败:', error)
            res.status(500).json({
                success: false,
                message: '切换分类状态失败'
            })
            return
        }
    }

    // 获取分类统计信息
    async getCategoryStats(req: Request, res: Response) {
        try {
            const stats = await FormCategoryService.getCategoryStats()

            res.json({
                success: true,
                message: '获取分类统计信息成功',
                data: stats
            })
            return
        } catch (error) {
            console.error('获取分类统计信息失败:', error)
            res.status(500).json({
                success: false,
                message: '获取分类统计信息失败'
            })
            return
        }
    }
}

export default new FormCategoryController()