import { Request, Response } from 'express';
import { PermissionService } from '../services/PermissionService';
import { CreatePermissionGroupRequest, UpdatePermissionGroupRequest, PermissionGroupQuery } from '../models/Permission';

export class PermissionController {
    private permissionService = new PermissionService();

    // 获取权限树数据
    async getPermissionTree(req: Request, res: Response): Promise<void> {
        try {
            const treeData = await this.permissionService.getPermissionTree();

            res.json({
                success: true,
                data: treeData
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取权限树失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 获取权限组列表
    async getPermissionGroups(req: Request, res: Response): Promise<void> {
        try {
            const query: PermissionGroupQuery = {
                search: req.query.search as string,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
            };

            const result = await this.permissionService.getPermissionGroups(query);

            res.json({
                success: true,
                data: result.permissionGroups,
                total: result.total,
                page: query.page || 1,
                limit: query.limit || 10
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取权限组列表失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 根据ID获取权限组
    async getPermissionGroupById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const permissionGroup = await this.permissionService.getPermissionGroupById(id);

            if (!permissionGroup) {
                res.status(404).json({
                    success: false,
                    message: '权限组不存在'
                });
                return;
            }

            res.json({
                success: true,
                data: permissionGroup
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取权限组信息失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 创建权限组
    async createPermissionGroup(req: Request, res: Response): Promise<void> {
        try {
            const groupData: CreatePermissionGroupRequest = req.body;

            // 验证权限是否存在
            const { valid, invalid } = this.permissionService.validatePermissions(groupData.permissions);
            if (invalid.length > 0) {
                res.status(400).json({
                    success: false,
                    message: '存在无效的权限',
                    data: { invalid }
                });
                return;
            }

            const newPermissionGroup = await this.permissionService.createPermissionGroup({
                ...groupData,
                permissions: valid
            });

            res.status(201).json({
                success: true,
                message: '权限组创建成功',
                data: newPermissionGroup
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: '权限组创建失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 更新权限组
    async updatePermissionGroup(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const groupData: UpdatePermissionGroupRequest = req.body;

            // 如果更新权限，验证权限是否存在
            if (groupData.permissions) {
                const { valid, invalid } = this.permissionService.validatePermissions(groupData.permissions);
                if (invalid.length > 0) {
                    res.status(400).json({
                        success: false,
                        message: '存在无效的权限',
                        data: { invalid }
                    });
                    return;
                }
                groupData.permissions = valid;
            }

            const updatedPermissionGroup = await this.permissionService.updatePermissionGroup(id, groupData);

            if (!updatedPermissionGroup) {
                res.status(404).json({
                    success: false,
                    message: '权限组不存在'
                });
                return;
            }

            res.json({
                success: true,
                message: '权限组信息更新成功',
                data: updatedPermissionGroup
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: '权限组信息更新失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 删除权限组
    async deletePermissionGroup(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            
            // 检查是否为超级管理员权限组
            const permissionGroup = await this.permissionService.getPermissionGroupById(id);
            if (permissionGroup && permissionGroup.name === '超级管理员权限组') {
                res.status(400).json({
                    success: false,
                    message: '超级管理员权限组不能删除'
                });
                return;
            }

            const success = await this.permissionService.deletePermissionGroup(id);

            if (!success) {
                res.status(404).json({
                    success: false,
                    message: '权限组不存在'
                });
                return;
            }

            res.json({
                success: true,
                message: '权限组删除成功'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '权限组删除失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 获取所有权限列表
    async getAllPermissions(req: Request, res: Response): Promise<void> {
        try {
            const permissions = this.permissionService.getAllPermissions();

            res.json({
                success: true,
                data: permissions
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取权限列表失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 验证权限
    async validatePermissions(req: Request, res: Response): Promise<void> {
        try {
            const { permissions } = req.body;

            if (!Array.isArray(permissions)) {
                res.status(400).json({
                    success: false,
                    message: '权限参数必须是数组'
                });
                return;
            }

            const { valid, invalid } = this.permissionService.validatePermissions(permissions);

            res.json({
                success: true,
                data: { valid, invalid }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '权限验证失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
} 