import { Request, Response } from 'express';
import { DepartmentService } from '../services/DepartmentService';
import { CreateDepartmentRequest, UpdateDepartmentRequest, DepartmentQuery } from '../models/Department';

export class DepartmentController {
    private departmentService = new DepartmentService();

    // 获取部门列表
    async getDepartments(req: Request, res: Response): Promise<void> {
        try {
            const query: DepartmentQuery = {
                enterpriseId: req.query.enterpriseId as string,
                parentId: req.query.parentId as string,
                status: req.query.status as string,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
            };

            const result = await this.departmentService.getDepartments(query);

            res.json({
                success: true,
                data: result.departments,
                total: result.total,
                page: query.page || 1,
                limit: query.limit || 10
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取部门列表失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 根据ID获取部门
    async getDepartmentById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const department = await this.departmentService.getDepartmentById(id);

            if (!department) {
                res.status(404).json({
                    success: false,
                    message: '部门不存在'
                });
                return;
            }

            res.json({
                success: true,
                data: department
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取部门信息失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 创建部门
    async createDepartment(req: Request, res: Response): Promise<void> {
        try {
            const departmentData: CreateDepartmentRequest = req.body;
            const newDepartment = await this.departmentService.createDepartment(departmentData);

            res.status(201).json({
                success: true,
                message: '部门创建成功',
                data: newDepartment
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: '部门创建失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 更新部门
    async updateDepartment(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const departmentData: UpdateDepartmentRequest = req.body;

            const updatedDepartment = await this.departmentService.updateDepartment(id, departmentData);

            if (!updatedDepartment) {
                res.status(404).json({
                    success: false,
                    message: '部门不存在'
                });
                return;
            }

            res.json({
                success: true,
                message: '部门信息更新成功',
                data: updatedDepartment
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: '部门信息更新失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 删除部门
    async deleteDepartment(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const success = await this.departmentService.deleteDepartment(id);

            if (!success) {
                res.status(404).json({
                    success: false,
                    message: '部门不存在'
                });
                return;
            }

            res.json({
                success: true,
                message: '部门删除成功'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: '部门删除失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 获取上级部门选项
    async getParentDepartmentOptions(req: Request, res: Response): Promise<void> {
        try {
            const { enterpriseId } = req.params;
            const options = await this.departmentService.getParentDepartmentOptions(enterpriseId);

            res.json({
                success: true,
                data: options
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取上级部门选项失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 切换部门状态
    async toggleDepartmentStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const updatedDepartment = await this.departmentService.toggleDepartmentStatus(id);

            if (!updatedDepartment) {
                res.status(404).json({
                    success: false,
                    message: '部门不存在'
                });
                return;
            }

            res.json({
                success: true,
                message: `部门已${updatedDepartment.status === 'active' ? '启用' : '禁用'}`,
                data: updatedDepartment
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '切换部门状态失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
} 