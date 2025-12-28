import { Request, Response } from 'express';
import { RoleService } from '../services/RoleService';
import { CreateRoleRequest, UpdateRoleRequest, RoleQuery } from '../models/Role';

export class RoleController {
    // 获取角色列表
    static async getRoles(req: Request, res: Response) {
        try {
            const query: RoleQuery = {
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
                search: req.query.search as string,
                status: req.query.status as 'active' | 'inactive'
            };

            const result = RoleService.getRoles(query);

            res.json({
                success: true,
                data: result.data,
                total: result.total,
                page: result.page,
                limit: result.limit
            });
        } catch (error) {
            console.error('获取角色列表失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器内部错误'
            });
        }
    }

    // 根据ID获取角色
    static async getRoleById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const role = RoleService.getRoleById(id);

            if (!role) {
                return res.status(404).json({
                    success: false,
                    error: '角色不存在'
                });
            }

            return res.json({
                success: true,
                data: role
            });
        } catch (error) {
            console.error('获取角色详情失败:', error);
            return res.status(500).json({
                success: false,
                error: '服务器内部错误'
            });
        }
    }

    // 创建角色
    static async createRole(req: Request, res: Response) {
        try {
            const roleData: CreateRoleRequest = req.body;

            // 验证必填字段
            if (!roleData.roleName || !roleData.description) {
                return res.status(400).json({
                    success: false,
                    error: '角色名称和描述不能为空'
                });
            }

            // 检查角色名称是否已存在
            if (RoleService.isRoleNameExists(roleData.roleName)) {
                return res.status(400).json({
                    success: false,
                    error: '角色名称已存在'
                });
            }

            const newRole = RoleService.createRole(roleData);

            return res.status(201).json({
                success: true,
                data: newRole,
                message: '角色创建成功'
            });
        } catch (error) {
            console.error('创建角色失败:', error);
            return res.status(500).json({
                success: false,
                error: '服务器内部错误'
            });
        }
    }

    // 更新角色
    static async updateRole(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const roleData: UpdateRoleRequest = req.body;

            // 检查角色是否存在
            const existingRole = RoleService.getRoleById(id);
            if (!existingRole) {
                return res.status(404).json({
                    success: false,
                    error: '角色不存在'
                });
            }

            // 如果更新角色名称，检查是否与其他角色重复
            if (roleData.roleName && roleData.roleName !== existingRole.roleName) {
                if (RoleService.isRoleNameExists(roleData.roleName, id)) {
                    return res.status(400).json({
                        success: false,
                        error: '角色名称已存在'
                    });
                }
            }

            const updatedRole = RoleService.updateRole(id, roleData);

            if (!updatedRole) {
                return res.status(404).json({
                    success: false,
                    error: '角色不存在'
                });
            }

            return res.json({
                success: true,
                data: updatedRole,
                message: '角色更新成功'
            });
        } catch (error) {
            console.error('更新角色失败:', error);
            return res.status(500).json({
                success: false,
                error: '服务器内部错误'
            });
        }
    }

    // 删除角色
    static async deleteRole(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // 检查角色是否存在
            const existingRole = RoleService.getRoleById(id);
            if (!existingRole) {
                return res.status(404).json({
                    success: false,
                    error: '角色不存在'
                });
            }

            // 检查是否有用户使用该角色
            if (existingRole.userCount > 0) {
                return res.status(400).json({
                    success: false,
                    error: '该角色正在被用户使用，无法删除'
                });
            }

            const success = RoleService.deleteRole(id);

            if (!success) {
                return res.status(400).json({
                    success: false,
                    error: '删除角色失败'
                });
            }

            return res.json({
                success: true,
                message: '角色删除成功'
            });
        } catch (error) {
            console.error('删除角色失败:', error);
            return res.status(500).json({
                success: false,
                error: '服务器内部错误'
            });
        }
    }

    // 获取所有角色（不分页）
    static async getAllRoles(req: Request, res: Response) {
        try {
            const roles = RoleService.getAllRoles();

            res.json({
                success: true,
                data: roles
            });
        } catch (error) {
            console.error('获取所有角色失败:', error);
            res.status(500).json({
                success: false,
                error: '服务器内部错误'
            });
        }
    }
}