import { Request, Response } from 'express'
import { ClientCategoryService } from '../services/ClientCategoryService'

export class ClientCategoryController {
    // 获取客户分类列表
    static async getCategories(req: Request, res: Response) {
        try {
            const categories = await ClientCategoryService.getCategories()
            res.json({ 
                success: true, 
                message: '获取客户分类成功',
                data: categories 
            })
        } catch (error) {
            console.error('获取客户分类失败:', error)
            res.status(500).json({ 
                success: false, 
                message: '获取客户分类失败',
                error: error instanceof Error ? error.message : '未知错误'
            })
        }
    }

    // 创建客户分类
    static async createCategory(req: Request, res: Response) {
        try {
            const category = await ClientCategoryService.createCategory(req.body)
            res.status(201).json({ 
                success: true, 
                message: '客户分类创建成功',
                data: category 
            })
        } catch (error: any) {
            console.error('创建客户分类失败:', error)
            res.status(400).json({ 
                success: false, 
                message: error.message || '创建客户分类失败'
            })
        }
    }

    // 更新客户分类
    static async updateCategory(req: Request, res: Response) {
        try {
            const category = await ClientCategoryService.updateCategory(req.params.id, req.body)
            if (!category) {
                res.status(404).json({ 
                    success: false, 
                    message: '客户分类不存在' 
                })
                return
            }
            res.json({ 
                success: true, 
                message: '客户分类更新成功',
                data: category 
            })
        } catch (error: any) {
            console.error('更新客户分类失败:', error)
            res.status(400).json({ 
                success: false, 
                message: error.message || '更新客户分类失败'
            })
        }
    }

    // 删除客户分类
    static async deleteCategory(req: Request, res: Response) {
        try {
            const success = await ClientCategoryService.deleteCategory(req.params.id)
            if (!success) {
                res.status(404).json({ 
                    success: false, 
                    message: '客户分类不存在' 
                })
                return
            }
            res.json({ 
                success: true, 
                message: '客户分类删除成功'
            })
        } catch (error) {
            console.error('删除客户分类失败:', error)
            res.status(500).json({ 
                success: false, 
                message: '删除客户分类失败',
                error: error instanceof Error ? error.message : '未知错误'
            })
        }
    }
}