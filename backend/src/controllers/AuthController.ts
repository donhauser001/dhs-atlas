import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { StringValue } from 'ms';
import { UserService } from '../services/UserService';
import { CreateUserRequest } from '../models/User';

export class AuthController {
    private userService = new UserService();

    // 用户登录
    async login(req: Request, res: Response) {
        try {
            const { username, password } = req.body;

            // 验证必填字段
            if (!username || !password) {
                res.status(400).json({
                    success: false,
                    message: '用户名和密码为必填字段'
                });
                return;
            }

            // 查找用户
            const user = await this.userService.getUserByUsername(username);
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: '用户名或密码错误'
                });
                return;
            }

            // 检查用户状态
            if (user.status !== 'active') {
                res.status(401).json({
                    success: false,
                    message: '账户已被禁用，请联系管理员'
                });
                return;
            }

            // 验证密码
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                res.status(401).json({
                    success: false,
                    message: '用户名或密码错误'
                });
                return;
            }

            // 生成JWT token
            const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-for-development';
            const payload = {
                userId: user._id?.toString(),
                username: user.username,
                role: user.role
            };
            const options: jwt.SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as StringValue };
            const token = jwt.sign(payload, jwtSecret, options);

            // 更新最后登录时间
            await this.userService.updateLastLogin(user._id.toString());

            // 返回用户信息（不包含密码）
            const userInfo = {
                id: user._id,
                username: user.username,
                realName: user.realName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                department: user.department,
                enterpriseId: user.enterpriseId,
                enterpriseName: user.enterpriseName,
                departmentId: user.departmentId,
                departmentName: user.departmentName,
                position: user.position,
                permissions: user.permissions,
                permissionGroups: user.permissionGroups
            };

            res.json({
                success: true,
                message: '登录成功',
                data: {
                    user: userInfo,
                    token
                }
            });
            return;
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '登录失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 用户注册
    async register(req: Request, res: Response) {
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

            // 验证密码长度
            if (userData.password.length < 6) {
                res.status(400).json({
                    success: false,
                    message: '密码长度不能少于6位'
                });
                return;
            }

            // 创建用户
            const newUser = await this.userService.createUser(userData);

            // 返回用户信息（不包含密码）
            const userInfo = {
                id: newUser._id,
                username: newUser.username,
                realName: newUser.realName,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                department: newUser.department
            };

            res.status(201).json({
                success: true,
                message: '注册成功',
                data: userInfo
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: '注册失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 验证token
    async verifyToken(req: Request, res: Response) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                res.status(401).json({
                    success: false,
                    message: '未提供认证token'
                });
                return;
            }

            // 验证token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
            
            // 获取用户信息
            const user = await this.userService.getUserById(decoded.userId);
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: '用户不存在'
                });
                return;
            }

            // 检查用户状态
            if (user.status !== 'active') {
                res.status(401).json({
                    success: false,
                    message: '账户已被禁用'
                });
                return;
            }

            // 返回用户信息
            const userInfo = {
                id: user._id,
                username: user.username,
                realName: user.realName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                department: user.department,
                enterpriseId: user.enterpriseId,
                enterpriseName: user.enterpriseName,
                departmentId: user.departmentId,
                departmentName: user.departmentName,
                position: user.position,
                permissions: user.permissions,
                permissionGroups: user.permissionGroups
            };

            res.json({
                success: true,
                message: 'token验证成功',
                data: userInfo
            });
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                res.status(401).json({
                    success: false,
                    message: '无效的token'
                });
            } else if (error instanceof jwt.TokenExpiredError) {
                res.status(401).json({
                    success: false,
                    message: 'token已过期'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'token验证失败',
                    error: error instanceof Error ? error.message : '未知错误'
                });
            }
        }
    }

    // 刷新token
    async refreshToken(req: Request, res: Response) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                res.status(401).json({
                    success: false,
                    message: '未提供认证token'
                });
                return;
            }

            // 验证当前token
            const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-for-development';
            const decoded = jwt.verify(token, jwtSecret) as any;
            
            // 生成新的token
            const newPayload = {
                userId: decoded.userId,
                username: decoded.username,
                role: decoded.role
            };
            const options: jwt.SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as StringValue };
            const newToken = jwt.sign(newPayload, jwtSecret, options);

            return res.json({
                success: true,
                message: 'token刷新成功',
                data: {
                    token: newToken
                }
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'token刷新失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
            return;
        }
    }

    // 退出登录
    async logout(req: Request, res: Response) {
        try {
            // 这里可以实现token黑名单等逻辑
            // 目前简单返回成功
            res.json({
                success: true,
                message: '退出登录成功'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '退出登录失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
}
