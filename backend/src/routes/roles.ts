import { Router } from 'express';
import { RoleController } from '../controllers/RoleController';

const router = Router();

// 获取角色列表（支持分页和搜索）
router.get('/', RoleController.getRoles);

// 获取所有角色（不分页）
router.get('/all', RoleController.getAllRoles);

// 根据ID获取角色详情
router.get('/:id', RoleController.getRoleById);

// 创建新角色
router.post('/', RoleController.createRole);

// 更新角色
router.put('/:id', RoleController.updateRole);

// 删除角色
router.delete('/:id', RoleController.deleteRole);

export default router; 