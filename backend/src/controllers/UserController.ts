import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { CreateUserRequest, UpdateUserRequest, UserQuery, ResetPasswordRequest, UpdateUserPermissionsRequest } from '../models/User';

export class UserController {
    private userService = new UserService();

    // 获取用户列表
    async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const query: UserQuery = {
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
                search: req.query.search as string,
                role: req.query.role as string,
                status: req.query.status as 'active' | 'inactive',
                department: req.query.department as string
            };

            const result = await this.userService.getUsers(query);

            res.json({
                success: true,
                message: '获取用户列表成功',
                data: result.users,
                total: result.total,
                page: query.page,
                limit: query.limit
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取用户列表失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 根据ID获取用户
    async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = await this.userService.getUserById(id);

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
                return;
            }

            res.json({
                success: true,
                message: '获取用户信息成功',
                data: user
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取用户信息失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 创建用户
    async createUser(req: Request, res: Response): Promise<void> {
        try {
            const userData: CreateUserRequest = req.body;

            // 验证必填字段
            if (!userData.username || !userData.password || !userData.realName) {
                res.status(400).json({
                    success: false,
                    message: '用户名、密码和真实姓名为必填字段'
                });
                return;
            }

            const newUser = await this.userService.createUser(userData);

            res.status(201).json({
                success: true,
                message: '用户创建成功',
                data: newUser
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: '用户创建失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 更新用户
    async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userData: UpdateUserRequest = req.body;

            const updatedUser = await this.userService.updateUser(id, userData);

            if (!updatedUser) {
                res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
                return;
            }

            res.json({
                success: true,
                message: '用户信息更新成功',
                data: updatedUser
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: '用户信息更新失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 删除用户
    async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const success = await this.userService.deleteUser(id);

            if (!success) {
                res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
                return;
            }

            res.json({
                success: true,
                message: '用户删除成功'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: '用户删除失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 重置密码
    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const passwordData: ResetPasswordRequest = req.body;

            if (!passwordData.newPassword) {
                res.status(400).json({
                    success: false,
                    message: '新密码不能为空'
                });
                return;
            }

            const success = await this.userService.resetPassword(id, passwordData);

            if (!success) {
                res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
                return;
            }

            res.json({
                success: true,
                message: '密码重置成功'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: '密码重置失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 更新用户权限
    async updateUserPermissions(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const permissionData: UpdateUserPermissionsRequest = req.body;

            const updatedUser = await this.userService.updateUserPermissions(id, permissionData);

            if (!updatedUser) {
                res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
                return;
            }

            res.json({
                success: true,
                message: '用户权限更新成功',
                data: updatedUser
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: '用户权限更新失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 切换用户状态
    async toggleUserStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const updatedUser = await this.userService.toggleUserStatus(id);

            if (!updatedUser) {
                res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
                return;
            }

            res.json({
                success: true,
                message: '用户状态更新成功',
                data: updatedUser
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: '用户状态更新失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 获取所有用户（不分页）
    async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await this.userService.getAllUsers();

            res.json({
                success: true,
                message: '获取所有用户成功',
                data: users
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取所有用户失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 获取员工和超级管理员用户
    async getEmployeesAndAdmins(req: Request, res: Response): Promise<void> {
        try {
            const users = await this.userService.getEmployeesAndAdmins();

            res.json({
                success: true,
                message: '获取员工和管理员成功',
                data: users
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取员工和管理员失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 检查用户名是否存在
    async checkUsernameExists(req: Request, res: Response): Promise<void> {
        try {
            const { username } = req.params;
            const exists = await this.userService.isUsernameExists(username);

            res.json({
                success: true,
                message: '检查用户名成功',
                data: { exists }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '检查用户名失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 检查邮箱是否存在
    async checkEmailExists(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.params;
            const user = await this.userService.getUserByEmail(email);

            res.json({
                success: true,
                message: '检查邮箱成功',
                data: {
                    exists: !!user,
                    userId: user?._id?.toString() || null
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '检查邮箱失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
} 