import { Router } from 'express';
import TaskController from '../controllers/TaskController';

const router = Router();

// 获取任务列表
router.get('/', TaskController.getTasks);

// 获取任务统计信息
router.get('/stats', TaskController.getTaskStats);

// 清理没有关联项目的孤立任务
router.post('/cleanup-orphaned', TaskController.cleanupOrphanedTasks);

// 根据ID获取任务详情
router.get('/:id', TaskController.getTaskById);

// 获取项目相关的任务
router.get('/project/:projectId', TaskController.getTasksByProject);

// 获取设计师分配的任务
router.get('/designer/:designerId', TaskController.getTasksByDesigner);

// 创建任务
router.post('/', TaskController.createTask);

// 批量创建任务
router.post('/batch', TaskController.createTasks);

// 更新任务
router.put('/:id', TaskController.updateTask);

// 更新任务状态
router.patch('/:id/status', TaskController.updateTaskStatus);

// 更新任务结算状态
router.patch('/:id/settlement', TaskController.updateTaskSettlementStatus);

// 分配设计师
router.patch('/:id/assign', TaskController.assignDesigners);

// 删除任务
router.delete('/:id', TaskController.deleteTask);

export default router; 