import { Request, Response } from 'express'
import ServiceProcessService from '../services/ServiceProcessService'

export class ServiceProcessController {
    // 获取所有服务流程
    async getAllProcesses(req: Request, res: Response) {
        try {
            const processes = await ServiceProcessService.getAllProcesses()
            return res.json({
                success: true,
                data: processes,
                message: '获取服务流程列表成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '获取服务流程列表失败'
            })
        }
    }

    // 根据ID获取服务流程
    async getProcessById(req: Request, res: Response) {
        try {
            const { id } = req.params
            const process = await ServiceProcessService.getProcessById(id)
            return res.json({
                success: true,
                data: process,
                message: '获取服务流程详情成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '获取服务流程详情失败'
            })
        }
    }

    // 创建服务流程
    async createProcess(req: Request, res: Response) {
        try {
            const { name, description, steps } = req.body

            if (!name || !steps || steps.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '流程名称和步骤不能为空'
                })
            }

            const process = await ServiceProcessService.createProcess({
                name,
                description: description || '',
                steps
            })

            return res.status(201).json({
                success: true,
                data: process,
                message: '创建服务流程成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '创建服务流程失败'
            })
        }
    }

    // 更新服务流程
    async updateProcess(req: Request, res: Response) {
        try {
            const { id } = req.params
            const { name, description, steps } = req.body

            if (!name || !steps || steps.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '流程名称和步骤不能为空'
                })
            }

            const process = await ServiceProcessService.updateProcess(id, {
                name,
                description: description || '',
                steps
            })

            return res.json({
                success: true,
                data: process,
                message: '更新服务流程成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '更新服务流程失败'
            })
        }
    }

    // 切换服务流程状态
    async toggleProcessStatus(req: Request, res: Response) {
        try {
            const { id } = req.params
            const process = await ServiceProcessService.toggleProcessStatus(id)
            return res.json({
                success: true,
                data: process,
                message: `服务流程已${process.status === 'active' ? '启用' : '禁用'}`
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '切换服务流程状态失败'
            })
        }
    }

    // 删除服务流程
    async deleteProcess(req: Request, res: Response) {
        try {
            const { id } = req.params
            await ServiceProcessService.deleteProcess(id)
            return res.json({
                success: true,
                message: '删除服务流程成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '删除服务流程失败'
            })
        }
    }

    // 搜索服务流程
    async searchProcesses(req: Request, res: Response) {
        try {
            const { search } = req.query
            const searchTerm = search as string

            if (!searchTerm) {
                return res.status(400).json({
                    success: false,
                    message: '搜索关键词不能为空'
                })
            }

            const processes = await ServiceProcessService.searchProcesses(searchTerm)
            return res.json({
                success: true,
                data: processes,
                message: '搜索服务流程成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '搜索服务流程失败'
            })
        }
    }

    // 复制服务流程
    async copyProcess(req: Request, res: Response) {
        try {
            const { id } = req.params
            const process = await ServiceProcessService.copyProcess(id)
            return res.status(201).json({
                success: true,
                data: process,
                message: '复制服务流程成功'
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '复制服务流程失败'
            })
        }
    }
}

export default new ServiceProcessController()