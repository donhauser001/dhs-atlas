import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();
const userController = new UserController();

// 获取用户列表
router.get('/', userController.getUsers.bind(userController));

// 获取所有用户（不分页）
router.get('/all', userController.getAllUsers.bind(userController));

// 获取员工和超级管理员用户
router.get('/employees-admins', userController.getEmployeesAndAdmins.bind(userController));

// 根据ID获取用户
router.get('/:id', userController.getUserById.bind(userController));

// 创建用户
router.post('/', userController.createUser.bind(userController));

// 更新用户
router.put('/:id', userController.updateUser.bind(userController));

// 删除用户
router.delete('/:id', userController.deleteUser.bind(userController));

// 重置密码
router.put('/:id/reset-password', userController.resetPassword.bind(userController));

// 更新用户权限
router.put('/:id/permissions', userController.updateUserPermissions.bind(userController));

// 切换用户状态
router.put('/:id/toggle-status', userController.toggleUserStatus.bind(userController));

// 检查用户名是否存在
router.get('/check-username/:username', userController.checkUsernameExists.bind(userController));

// 检查邮箱是否存在
router.get('/check-email/:email', userController.checkEmailExists.bind(userController));

export default router; 