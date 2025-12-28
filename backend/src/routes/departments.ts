import { Router } from 'express';
import { DepartmentController } from '../controllers/DepartmentController';

const router = Router();
const departmentController = new DepartmentController();

// 获取部门列表
router.get('/', departmentController.getDepartments.bind(departmentController));

// 根据ID获取部门
router.get('/:id', departmentController.getDepartmentById.bind(departmentController));

// 创建部门
router.post('/', departmentController.createDepartment.bind(departmentController));

// 更新部门
router.put('/:id', departmentController.updateDepartment.bind(departmentController));

// 删除部门
router.delete('/:id', departmentController.deleteDepartment.bind(departmentController));

// 获取上级部门选项
router.get('/parent-options/:enterpriseId', departmentController.getParentDepartmentOptions.bind(departmentController));

// 切换部门状态
router.put('/:id/toggle-status', departmentController.toggleDepartmentStatus.bind(departmentController));

export default router; 