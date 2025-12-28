import { Request, Response } from 'express'
import QuotationService from '../services/QuotationService'

export class QuotationController {
    // 获取所有报价单
    async getAllQuotations(req: Request, res: Response) {
        try {
            const quotations = await QuotationService.getAllQuotations()
            res.json({
                success: true,
                data: quotations
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取报价单列表失败',
                error: error instanceof Error ? error.message : '未知错误'
            })
        }
    }

    // 根据ID获取报价单
    async getQuotationById(req: Request, res: Response) {
        try {
            const { id } = req.params
            const quotation = await QuotationService.getQuotationById(id)

            if (!quotation) {
                return res.status(404).json({
                    success: false,
                    message: '报价单不存在'
                })
            }

            return res.json({
                success: true,
                data: quotation
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '获取报价单详情失败',
                error: error instanceof Error ? error.message : '未知错误'
            })
        }
    }

    // 创建报价单
    async createQuotation(req: Request, res: Response) {
        try {
            const { name, description, isDefault, selectedServices, validUntil } = req.body

            if (!name || !selectedServices || selectedServices.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '报价单名称和选择的服务项目不能为空'
                })
            }

            const quotation = await QuotationService.createQuotation({
                name,
                description: description || '',
                isDefault: isDefault || false,
                selectedServices,
                validUntil: validUntil ? new Date(validUntil) : undefined
            })

            return res.status(201).json({
                success: true,
                data: quotation,
                message: '报价单创建成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '创建报价单失败',
                error: error instanceof Error ? error.message : '未知错误'
            })
        }
    }

    // 更新报价单
    async updateQuotation(req: Request, res: Response) {
        try {
            const { id } = req.params
            const { name, description, isDefault, selectedServices, validUntil } = req.body

            if (!name || !selectedServices || selectedServices.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '报价单名称和选择的服务项目不能为空'
                })
            }

            const quotation = await QuotationService.updateQuotation(id, {
                name,
                description: description || '',
                isDefault: isDefault || false,
                selectedServices,
                validUntil: validUntil ? new Date(validUntil) : undefined
            })

            if (!quotation) {
                return res.status(404).json({
                    success: false,
                    message: '报价单不存在'
                })
            }

            return res.json({
                success: true,
                data: quotation,
                message: '报价单更新成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '更新报价单失败',
                error: error instanceof Error ? error.message : '未知错误'
            })
        }
    }

    // 删除报价单
    async deleteQuotation(req: Request, res: Response) {
        try {
            const { id } = req.params
            const success = await QuotationService.deleteQuotation(id)

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: '报价单不存在'
                })
            }

            return res.json({
                success: true,
                message: '报价单删除成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '删除报价单失败',
                error: error instanceof Error ? error.message : '未知错误'
            })
        }
    }

    // 切换报价单状态
    async toggleQuotationStatus(req: Request, res: Response) {
        try {
            const { id } = req.params
            const quotation = await QuotationService.toggleQuotationStatus(id)

            if (!quotation) {
                return res.status(404).json({
                    success: false,
                    message: '报价单不存在'
                })
            }

            return res.json({
                success: true,
                data: quotation,
                message: '状态切换成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '切换状态失败',
                error: error instanceof Error ? error.message : '未知错误'
            })
        }
    }

    // 搜索报价单
    async searchQuotations(req: Request, res: Response) {
        try {
            const { q } = req.query
            const searchText = typeof q === 'string' ? q : ''

            if (!searchText.trim()) {
                return res.status(400).json({
                    success: false,
                    message: '搜索关键词不能为空'
                })
            }

            const quotations = await QuotationService.searchQuotations(searchText)
            return res.json({
                success: true,
                data: quotations
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '搜索报价单失败',
                error: error instanceof Error ? error.message : '未知错误'
            })
        }
    }

    // 根据客户ID获取关联的报价单
    async getQuotationsByClientId(req: Request, res: Response) {
        try {
            const { clientId } = req.params

            // 先获取客户信息
            const Client = require('../models/Client').default
            const client = await Client.findById(clientId)

            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: '客户不存在'
                })
            }

            // 如果客户有关联的报价单ID
            if (client.quotationId) {
                const quotation = await QuotationService.getQuotationById(client.quotationId)
                if (quotation) {
                    return res.json({
                        success: true,
                        data: [quotation]
                    })
                }
            }

            // 如果没有关联的报价单，返回空数组
            return res.json({
                success: true,
                data: []
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '获取客户关联报价单失败',
                error: error instanceof Error ? error.message : '未知错误'
            })
        }
    }

    // 获取默认报价单
    async getDefaultQuotation(req: Request, res: Response) {
        try {
            const quotation = await QuotationService.getDefaultQuotation()

            if (!quotation) {
                return res.json({
                    success: true,
                    data: null,
                    message: '未找到默认报价单'
                })
            }

            return res.json({
                success: true,
                data: quotation
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '获取默认报价单失败',
                error: error instanceof Error ? error.message : '未知错误'
            })
        }
    }
}

export default new QuotationController()