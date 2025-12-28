import { Request, Response } from 'express'
import { ArticleTagService, CreateTagRequest, UpdateTagRequest, TagQuery } from '../services/ArticleTagService'

export class ArticleTagController {
    // 创建标签
    static async createTag(req: Request, res: Response): Promise<void> {
        try {
            const tagData: CreateTagRequest = req.body

            // 验证必填字段
            if (!tagData.name || !tagData.slug) {
                res.status(400).json({
                    success: false,
                    message: '标签名称和别名不能为空'
                })
                return
            }

            const tag = await ArticleTagService.createTag(tagData)

            res.status(201).json({
                success: true,
                data: tag,
                message: '标签创建成功'
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '创建标签失败'
            })
        }
    }

    // 获取标签列表
    static async getTags(req: Request, res: Response) {
        try {
            const query: TagQuery = {
                searchText: req.query.searchText as string,
                isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 10
            }

            const result = await ArticleTagService.getTags(query)

            res.json({
                success: true,
                data: result
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '获取标签列表失败'
            })
        }
    }

    // 根据ID获取标签
    static async getTagById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params
            const tag = await ArticleTagService.getTagById(id)

            if (!tag) {
                res.status(404).json({
                    success: false,
                    message: '标签不存在'
                })
                return
            }

            res.json({
                success: true,
                data: tag
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '获取标签失败'
            })
        }
    }

        // 更新标签
    static async updateTag(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params
            const updateData: UpdateTagRequest = req.body
            
            const tag = await ArticleTagService.updateTag(id, updateData)
            
            if (!tag) {
                res.status(404).json({
                    success: false,
                    message: '标签不存在'
                })
                return
            }
            
            res.json({
                success: true,
                data: tag,
                message: '标签更新成功'
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '更新标签失败'
            })
        }
    }

        // 删除标签
    static async deleteTag(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params
            const success = await ArticleTagService.deleteTag(id)
            
            if (!success) {
                res.status(404).json({
                    success: false,
                    message: '标签不存在'
                })
                return
            }
            
            res.json({
                success: true,
                message: '标签删除成功'
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '删除标签失败'
            })
        }
    }

        // 切换标签状态
    static async toggleTagStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params
            const tag = await ArticleTagService.toggleTagStatus(id)
            
            if (!tag) {
                res.status(404).json({
                    success: false,
                    message: '标签不存在'
                })
                return
            }
            
            res.json({
                success: true,
                data: tag,
                message: `标签已${tag.isActive ? '启用' : '禁用'}`
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '切换标签状态失败'
            })
        }
    }

    // 获取标签统计
    static async getTagStats(req: Request, res: Response) {
        try {
            const stats = await ArticleTagService.getTagStats()

            res.json({
                success: true,
                data: stats
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '获取标签统计失败'
            })
        }
    }

    // 获取所有启用的标签
    static async getActiveTags(req: Request, res: Response) {
        try {
            const tags = await ArticleTagService.getActiveTags()

            res.json({
                success: true,
                data: tags
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '获取启用标签列表失败'
            })
        }
    }

        // 批量获取标签
    static async getTagsByIds(req: Request, res: Response): Promise<void> {
        try {
            const { ids } = req.query
            const tagIds = (ids as string)?.split(',') || []
            
            if (tagIds.length === 0) {
                res.json({
                    success: true,
                    data: []
                })
                return
            }
            
            const tags = await ArticleTagService.getTagsByIds(tagIds)
            
            res.json({
                success: true,
                data: tags
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || '批量获取标签失败'
            })
        }
    }
} 