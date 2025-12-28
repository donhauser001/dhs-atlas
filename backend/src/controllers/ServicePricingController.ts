import { Request, Response } from 'express'
import { ServicePricingService } from '../services/ServicePricingService'

export class ServicePricingController {
    // 获取所有服务定价
    static async getAllServicePricing(req: Request, res: Response) {
        try {
            const servicePricing = await ServicePricingService.getAllServicePricing()
            return res.json({
                success: true,
                data: servicePricing
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取服务定价列表失败'
            })
        }
    }

    // 根据ID获取服务定价
    static async getServicePricingById(req: Request, res: Response) {
        try {
            const { id } = req.params
            const servicePricing = await ServicePricingService.getServicePricingById(id)

            if (!servicePricing) {
                return res.status(404).json({
                    success: false,
                    error: '服务定价不存在'
                })
            }

            return res.json({
                success: true,
                data: servicePricing
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取服务定价详情失败'
            })
        }
    }

    // 根据ID列表获取服务定价
    static async getServicePricingByIds(req: Request, res: Response) {
        try {
            const { ids } = req.query
            if (!ids || typeof ids !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: '请提供有效的ID列表'
                })
            }

            const idList = ids.split(',').filter(id => id.trim())
            if (idList.length === 0) {
                return res.json({
                    success: true,
                    data: []
                })
            }

            const servicePricing = await ServicePricingService.getServicePricingByIds(idList)
            return res.json({
                success: true,
                data: servicePricing
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取服务定价列表失败'
            })
        }
    }

    // 创建服务定价
    static async createServicePricing(req: Request, res: Response) {
        try {
            const servicePricingData = req.body
            const servicePricing = await ServicePricingService.createServicePricing(servicePricingData)

            return res.status(201).json({
                success: true,
                data: servicePricing
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '创建服务定价失败'
            })
        }
    }

    // 更新服务定价
    static async updateServicePricing(req: Request, res: Response) {
        try {
            const { id } = req.params
            const servicePricingData = req.body
            const servicePricing = await ServicePricingService.updateServicePricing(id, servicePricingData)

            if (!servicePricing) {
                return res.status(404).json({
                    success: false,
                    error: '服务定价不存在'
                })
            }

            return res.json({
                success: true,
                data: servicePricing
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '更新服务定价失败'
            })
        }
    }

    // 切换服务定价状态
    static async toggleServicePricingStatus(req: Request, res: Response) {
        try {
            const { id } = req.params
            const servicePricing = await ServicePricingService.toggleServicePricingStatus(id)

            if (!servicePricing) {
                return res.status(404).json({
                    success: false,
                    error: '服务定价不存在'
                })
            }

            return res.json({
                success: true,
                data: servicePricing
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '切换服务定价状态失败'
            })
        }
    }

    // 删除服务定价
    static async deleteServicePricing(req: Request, res: Response) {
        try {
            const { id } = req.params
            await ServicePricingService.deleteServicePricing(id)

            return res.json({
                success: true,
                message: '服务定价删除成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '删除服务定价失败'
            })
        }
    }

    // 搜索服务定价
    static async searchServicePricing(req: Request, res: Response) {
        try {
            const { search } = req.query

            if (!search || typeof search !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: '搜索关键词不能为空'
                })
            }

            const servicePricing = await ServicePricingService.searchServicePricing(search)

            return res.json({
                success: true,
                data: servicePricing
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '搜索服务定价失败'
            })
        }
    }

    // 复制服务定价
    static async copyServicePricing(req: Request, res: Response) {
        try {
            const { id } = req.params
            const servicePricing = await ServicePricingService.copyServicePricing(id)

            if (!servicePricing) {
                return res.status(404).json({
                    success: false,
                    error: '服务定价不存在'
                })
            }

            return res.status(201).json({
                success: true,
                data: servicePricing,
                message: '服务定价复制成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '复制服务定价失败'
            })
        }
    }
}