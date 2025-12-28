import { Request, Response } from 'express'
import { AdditionalConfigService } from '../services/AdditionalConfigService'

export class AdditionalConfigController {
    // 获取所有附加配置
    static async getAllConfigs(req: Request, res: Response) {
        try {
            const configs = await AdditionalConfigService.getAllConfigs()
            return res.json({
                success: true,
                data: configs
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '获取附加配置列表失败'
            })
        }
    }

    // 根据ID获取附加配置
    static async getConfigById(req: Request, res: Response) {
        try {
            const { id } = req.params
            const config = await AdditionalConfigService.getConfigById(id)

            if (!config) {
                return res.status(404).json({
                    success: false,
                    message: '附加配置不存在'
                })
            }

            return res.json({
                success: true,
                data: config
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '获取附加配置详情失败'
            })
        }
    }

    // 创建附加配置
    static async createConfig(req: Request, res: Response) {
        try {
            const configData = req.body
            const config = await AdditionalConfigService.createConfig(configData)

            return res.status(201).json({
                success: true,
                data: config
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '创建附加配置失败'
            })
        }
    }

    // 更新附加配置
    static async updateConfig(req: Request, res: Response) {
        try {
            const { id } = req.params
            const configData = req.body
            const config = await AdditionalConfigService.updateConfig(id, configData)

            if (!config) {
                return res.status(404).json({
                    success: false,
                    message: '附加配置不存在'
                })
            }

            return res.json({
                success: true,
                data: config
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '更新附加配置失败'
            })
        }
    }

    // 切换附加配置状态
    static async toggleConfigStatus(req: Request, res: Response) {
        try {
            const { id } = req.params
            const config = await AdditionalConfigService.toggleConfigStatus(id)

            if (!config) {
                return res.status(404).json({
                    success: false,
                    message: '附加配置不存在'
                })
            }

            return res.json({
                success: true,
                data: config
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '切换附加配置状态失败'
            })
        }
    }

    // 删除附加配置
    static async deleteConfig(req: Request, res: Response) {
        try {
            const { id } = req.params
            await AdditionalConfigService.deleteConfig(id)

            return res.json({
                success: true,
                message: '删除成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '删除附加配置失败'
            })
        }
    }

    // 搜索附加配置
    static async searchConfigs(req: Request, res: Response) {
        try {
            const { search } = req.query
            const searchTerm = typeof search === 'string' ? search : ''
            const configs = await AdditionalConfigService.searchConfigs(searchTerm)

            return res.json({
                success: true,
                data: configs
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '搜索附加配置失败'
            })
        }
    }

    // 复制附加配置
    static async copyConfig(req: Request, res: Response) {
        try {
            const { id } = req.params
            const config = await AdditionalConfigService.copyConfig(id)

            if (!config) {
                return res.status(404).json({
                    success: false,
                    message: '附加配置不存在'
                })
            }

            return res.status(201).json({
                success: true,
                data: config,
                message: '复制成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '复制附加配置失败'
            })
        }
    }
}