import { Router } from 'express';
import ProjectController from '../controllers/ProjectController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 获取项目列表
router.get('/', ProjectController.getProjects);

// 获取项目统计信息
router.get('/stats', ProjectController.getProjectStats);

// 根据ID获取项目详情
router.get('/:id', ProjectController.getProjectById);

// 获取项目日志
router.get('/:id/logs', ProjectController.getProjectLogs);

// 创建项目
router.post('/', authenticateToken, ProjectController.createProject);

// 更新项目
router.put('/:id', ProjectController.updateProject);

// 更新项目状态
router.patch('/:id/status', ProjectController.updateProjectStatus);

// 更新结算状态
router.patch('/:id/settlement', ProjectController.updateSettlementStatus);

// 删除项目
router.delete('/:id', ProjectController.deleteProject);

// 添加客户嘱托
router.post('/:id/client-requirements', authenticateToken, ProjectController.addClientRequirement);

// 删除客户嘱托
router.delete('/:id/client-requirements/:index', authenticateToken, ProjectController.deleteClientRequirement);

// 更新客户嘱托
router.patch('/:id/client-requirements/:index', authenticateToken, ProjectController.updateClientRequirement);

// 添加备注
router.post('/:id/remarks', authenticateToken, ProjectController.addRemark);

// 删除备注
router.delete('/:id/remarks/:index', authenticateToken, ProjectController.deleteRemark);

// 更新备注
router.patch('/:id/remarks/:index', authenticateToken, ProjectController.updateRemark);

export default router; 