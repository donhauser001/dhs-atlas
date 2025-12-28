import { Router } from 'express';
import { PermissionController } from '../controllers/PermissionController';

const router = Router();
const permissionController = new PermissionController();

// 获取权限树数据
router.get('/tree', permissionController.getPermissionTree.bind(permissionController));

// 获取所有权限列表
router.get('/all', permissionController.getAllPermissions.bind(permissionController));

// 验证权限
router.post('/validate', permissionController.validatePermissions.bind(permissionController));

// 获取权限组列表
router.get('/groups', permissionController.getPermissionGroups.bind(permissionController));

// 根据ID获取权限组
router.get('/groups/:id', permissionController.getPermissionGroupById.bind(permissionController));

// 创建权限组
router.post('/groups', permissionController.createPermissionGroup.bind(permissionController));

// 更新权限组
router.put('/groups/:id', permissionController.updatePermissionGroup.bind(permissionController));

// 删除权限组
router.delete('/groups/:id', permissionController.deletePermissionGroup.bind(permissionController));

export default router; 