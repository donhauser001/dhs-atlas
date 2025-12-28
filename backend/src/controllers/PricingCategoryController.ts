import { Request, Response } from 'express'
import { PricingCategoryService } from '../services/PricingCategoryService'

export class PricingCategoryController {
    // 获取所有分类
    getCategories = async (req: Request, res: Response) => {
        try {
            const categories = await PricingCategoryService.getCategories()
            res.json({ success: true, data: categories })
        } catch (error) {
            res.status(500).json({ success: false, message: '获取分类列表失败' })
        }
    }

    // 根据ID获取分类
    getCategoryById = async (req: Request, res: Response) => {
        try {
            const category = await PricingCategoryService.getCategoryById(req.params.id)
            if (!category) {
                res.status(404).json({ success: false, message: '分类不存在' })
                return
            }
            res.json({ success: true, data: category })
        } catch (error) {
            res.status(500).json({ success: false, message: '获取分类详情失败' })
        }
    }

    // 创建分类
    createCategory = async (req: Request, res: Response) => {
        try {
            const category = await PricingCategoryService.createCategory(req.body)
            res.json({ success: true, data: category })
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message })
        }
    }

    // 更新分类
    updateCategory = async (req: Request, res: Response) => {
        try {
            const category = await PricingCategoryService.updateCategory(req.params.id, req.body)
            if (!category) {
                res.status(404).json({ success: false, message: '分类不存在' })
                return
            }
            res.json({ success: true, data: category })
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message })
        }
    }

    // 删除分类
    deleteCategory = async (req: Request, res: Response) => {
        try {
            const success = await PricingCategoryService.deleteCategory(req.params.id)
            if (!success) {
                res.status(404).json({ success: false, message: '分类不存在' })
                return
            }
            res.json({ success: true, message: '删除成功' })
        } catch (error) {
            res.status(500).json({ success: false, message: '删除分类失败' })
        }
    }

    // 切换分类状态
    toggleCategoryStatus = async (req: Request, res: Response) => {
        try {
            const category = await PricingCategoryService.toggleCategoryStatus(req.params.id)
            if (!category) {
                res.status(404).json({ success: false, message: '分类不存在' })
                return
            }
            res.json({ success: true, data: category })
        } catch (error) {
            res.status(500).json({ success: false, message: '切换分类状态失败' })
        }
    }

    // 搜索分类
    searchCategories = async (req: Request, res: Response) => {
        try {
            const { q } = req.query
            if (!q || typeof q !== 'string') {
                res.status(400).json({ success: false, message: '搜索关键词不能为空' })
                return
            }
            const categories = await PricingCategoryService.searchCategories(q)
            res.json({ success: true, data: categories })
        } catch (error) {
            res.status(500).json({ success: false, message: '搜索分类失败' })
        }
    }
} 