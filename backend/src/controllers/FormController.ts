import { Request, Response } from 'express'
import FormService, { CreateFormData, UpdateFormData, FormQuery } from '../services/FormService'

class FormController {
    // 获取表单列表
    async getForms(req: Request, res: Response) {
        try {
            const query: FormQuery = {
                search: req.query.search as string,
                categoryId: req.query.categoryId as string,
                status: req.query.status as string,
                createdBy: req.query.createdBy as string,
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 10
            }
            
            const result = await FormService.getForms(query)
            
            res.json({
                success: true,
                data: result
            })
            return
        } catch (error) {
            console.error('获取表单列表失败:', error)
            res.status(500).json({
                success: false,
                message: '获取表单列表失败'
            })
            return
        }
    }
    
    // 根据ID获取表单
    async getFormById(req: Request, res: Response) {
        try {
            const { id } = req.params
            const form = await FormService.getFormById(id)
            
            if (!form) {
                return res.status(404).json({
                    success: false,
                    message: '表单不存在'
                })
            }
            
            res.json({
                success: true,
                data: form
            })
            return
        } catch (error) {
            console.error('获取表单失败:', error)
            res.status(500).json({
                success: false,
                message: '获取表单失败'
            })
            return
        }
    }
    
    // 创建表单
    async createForm(req: Request, res: Response) {
        try {
            const { name, description, categoryId, content, status } = req.body
            
            if (!name || !categoryId) {
                return res.status(400).json({
                    success: false,
                    message: '表单名称和分类ID为必填项'
                })
            }
            
            const formData: CreateFormData = {
                name,
                description,
                categoryId,
                content,
                status: status || 'draft',
                createdBy: (req.user as any)?._id || undefined // 从认证中间件获取用户ID，如果没有则设为undefined
            }
            
            const form = await FormService.createForm(formData)
            
            res.status(201).json({
                success: true,
                data: form,
                message: '表单创建成功'
            })
            return
        } catch (error) {
            console.error('创建表单失败:', error)
            res.status(500).json({
                success: false,
                message: '创建表单失败'
            })
            return
        }
    }
    
    // 更新表单
    async updateForm(req: Request, res: Response) {
        try {
            const { id } = req.params
            const updateData: UpdateFormData = req.body
            
            const form = await FormService.updateForm(id, updateData)
            
            if (!form) {
                return res.status(404).json({
                    success: false,
                    message: '表单不存在'
                })
            }
            
            res.json({
                success: true,
                data: form,
                message: '表单更新成功'
            })
            return
        } catch (error) {
            console.error('更新表单失败:', error)
            res.status(500).json({
                success: false,
                message: '更新表单失败'
            })
            return
        }
    }
    
    // 删除表单
    async deleteForm(req: Request, res: Response) {
        try {
            const { id } = req.params
            const success = await FormService.deleteForm(id)
            
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: '表单不存在'
                })
            }
            
            res.json({
                success: true,
                message: '表单删除成功'
            })
            return
        } catch (error) {
            console.error('删除表单失败:', error)
            res.status(500).json({
                success: false,
                message: '删除表单失败'
            })
            return
        }
    }
    
    // 切换表单状态
    async toggleFormStatus(req: Request, res: Response) {
        try {
            const { id } = req.params
            const form = await FormService.toggleFormStatus(id)
            
            if (!form) {
                return res.status(404).json({
                    success: false,
                    message: '表单不存在'
                })
            }
            
            res.json({
                success: true,
                data: form,
                message: `表单已${form.status === 'published' ? '发布' : '停用'}`
            })
            return
        } catch (error) {
            console.error('切换表单状态失败:', error)
            res.status(500).json({
                success: false,
                message: '切换表单状态失败'
            })
            return
        }
    }
}

export default new FormController()