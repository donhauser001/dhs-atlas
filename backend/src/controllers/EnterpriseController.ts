import { Request, Response } from 'express';
import { EnterpriseService } from '../services/EnterpriseService';
import { CreateEnterpriseRequest, UpdateEnterpriseRequest, EnterpriseQuery } from '../models/Enterprise';

export class EnterpriseController {
    private enterpriseService = new EnterpriseService();

    // 获取企业列表
    async getEnterprises(req: Request, res: Response): Promise<void> {
        try {
            const query: EnterpriseQuery = {
                search: req.query.search as string,
                status: req.query.status as string,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
            };

            const result = await this.enterpriseService.getEnterprises(query);

            res.json({
                success: true,
                data: result.enterprises,
                total: result.total,
                page: query.page || 1,
                limit: query.limit || 10
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取企业列表失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 根据ID获取企业
    async getEnterpriseById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const enterprise = await this.enterpriseService.getEnterpriseById(id);

            if (!enterprise) {
                res.status(404).json({
                    success: false,
                    message: '企业不存在'
                });
                return;
            }

            res.json({
                success: true,
                data: enterprise
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取企业信息失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 创建企业
    async createEnterprise(req: Request, res: Response): Promise<void> {
        try {
            const enterpriseData: CreateEnterpriseRequest = req.body;
            const newEnterprise = await this.enterpriseService.createEnterprise(enterpriseData);

            res.status(201).json({
                success: true,
                message: '企业创建成功',
                data: newEnterprise
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: '企业创建失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 更新企业
    async updateEnterprise(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const enterpriseData: UpdateEnterpriseRequest = req.body;

            const updatedEnterprise = await this.enterpriseService.updateEnterprise(id, enterpriseData);

            if (!updatedEnterprise) {
                res.status(404).json({
                    success: false,
                    message: '企业不存在'
                });
                return;
            }

            res.json({
                success: true,
                message: '企业信息更新成功',
                data: updatedEnterprise
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: '企业信息更新失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 删除企业
    async deleteEnterprise(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const success = await this.enterpriseService.deleteEnterprise(id);

            if (!success) {
                res.status(404).json({
                    success: false,
                    message: '企业不存在'
                });
                return;
            }

            res.json({
                success: true,
                message: '企业删除成功'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '企业删除失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 切换企业状态
    async toggleEnterpriseStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const updatedEnterprise = await this.enterpriseService.toggleEnterpriseStatus(id);

            if (!updatedEnterprise) {
                res.status(404).json({
                    success: false,
                    message: '企业不存在'
                });
                return;
            }

            res.json({
                success: true,
                message: `企业已${updatedEnterprise.status === 'active' ? '启用' : '禁用'}`,
                data: updatedEnterprise
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '切换企业状态失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
} 