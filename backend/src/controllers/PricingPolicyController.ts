import { Request, Response } from 'express'
import { PricingPolicyService } from '../services/PricingPolicyService'

export class PricingPolicyController {
    // 获取所有价格政策
    static async getAllPolicies(req: Request, res: Response) {
        try {
            const policies = await PricingPolicyService.getAllPolicies()
            return res.json({
                success: true,
                data: policies
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取价格政策列表失败'
            })
        }
    }

    // 根据ID获取价格政策
    static async getPolicyById(req: Request, res: Response) {
        try {
            const { id } = req.params
            const policy = await PricingPolicyService.getPolicyById(id)
            
            if (!policy) {
                return res.status(404).json({
                    success: false,
                    error: '价格政策不存在'
                })
            }

            return res.json({
                success: true,
                data: policy
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '获取价格政策详情失败'
            })
        }
    }

    // 创建价格政策
    static async createPolicy(req: Request, res: Response) {
        try {
            const policyData = req.body
            const policy = await PricingPolicyService.createPolicy(policyData)
            
            return res.status(201).json({
                success: true,
                data: policy
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '创建价格政策失败'
            })
        }
    }

    // 更新价格政策
    static async updatePolicy(req: Request, res: Response) {
        try {
            const { id } = req.params
            const policyData = req.body
            const policy = await PricingPolicyService.updatePolicy(id, policyData)
            
            if (!policy) {
                return res.status(404).json({
                    success: false,
                    error: '价格政策不存在'
                })
            }

            return res.json({
                success: true,
                data: policy
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '更新价格政策失败'
            })
        }
    }

    // 切换价格政策状态
    static async togglePolicyStatus(req: Request, res: Response) {
        try {
            const { id } = req.params
            const policy = await PricingPolicyService.togglePolicyStatus(id)
            
            if (!policy) {
                return res.status(404).json({
                    success: false,
                    error: '价格政策不存在'
                })
            }

            return res.json({
                success: true,
                data: policy
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '切换价格政策状态失败'
            })
        }
    }

    // 删除价格政策
    static async deletePolicy(req: Request, res: Response) {
        try {
            const { id } = req.params
            await PricingPolicyService.deletePolicy(id)
            
            return res.json({
                success: true,
                message: '价格政策删除成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '删除价格政策失败'
            })
        }
    }

    // 搜索价格政策
    static async searchPolicies(req: Request, res: Response) {
        try {
            const { search } = req.query
            
            if (!search || typeof search !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: '搜索关键词不能为空'
                })
            }

            const policies = await PricingPolicyService.searchPolicies(search)
            
            return res.json({
                success: true,
                data: policies
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '搜索价格政策失败'
            })
        }
    }
}