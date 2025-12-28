import { Request, Response } from 'express';
import TaskService from '../services/TaskService';

const taskService = TaskService;

export class TaskController {
    /**
     * 获取任务列表
     */
    static async getTasks(req: Request, res: Response) {
        try {
            const { page, limit, projectId, designerId, status, priority, settlementStatus, search, ids } = req.query;

            // 如果提供了 ids 参数，批量获取任务
            if (ids) {
                const taskIds = (ids as string).split(',').filter(id => id.trim());
                if (taskIds.length > 0) {
                    const tasks = await taskService.getTasksByIds(taskIds);
                    return res.json({
                        success: true,
                        data: tasks
                    });
                } else {
                    return res.json({
                        success: true,
                        data: []
                    });
                }
            }

            const result = await taskService.getTasks({
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined,
                projectId: projectId as string,
                designerId: designerId as string,
                status: status as string,
                priority: priority as string,
                settlementStatus: settlementStatus as string,
                search: search as string
            });

            return res.json({
                success: true,
                data: result.tasks,
                total: result.total,
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 20
            });
        } catch (error) {
            console.error('获取任务列表失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取任务列表失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 根据ID获取任务详情
     */
    static async getTaskById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const task = await taskService.getTaskById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: '任务不存在'
                });
            }

            return res.json({
                success: true,
                data: task
            });
        } catch (error) {
            console.error('获取任务详情失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取任务详情失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 获取项目相关的任务
     */
    static async getTasksByProject(req: Request, res: Response) {
        try {
            const { projectId } = req.params;

            const tasks = await taskService.getTasksByProject(projectId);

            res.json({
                success: true,
                data: tasks
            });
        } catch (error) {
            console.error('获取项目任务失败:', error);
            res.status(500).json({
                success: false,
                message: '获取项目任务失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 获取设计师分配的任务
     */
    static async getTasksByDesigner(req: Request, res: Response) {
        try {
            const { designerId } = req.params;
            const { status } = req.query;

            const tasks = await taskService.getTasksByDesigner(designerId, status as string);

            res.json({
                success: true,
                data: tasks
            });
        } catch (error) {
            console.error('获取设计师任务失败:', error);
            res.status(500).json({
                success: false,
                message: '获取设计师任务失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 创建任务
     */
    static async createTask(req: Request, res: Response) {
        try {
            const taskData = req.body;

            const task = await taskService.createTask(taskData);

            // 更新项目的 taskIds
            if (task.projectId) {
                const ProjectService = (await import('../services/ProjectService')).default;
                const project = await ProjectService.getProjectById(task.projectId);
                if (project) {
                    const currentTaskIds = project.taskIds || [];
                    const taskId = (task._id as any)?.toString() || task._id;
                    if (!currentTaskIds.includes(taskId)) {
                        await ProjectService.updateProject(task.projectId, {
                            taskIds: [...currentTaskIds, taskId],
                            updatedBy: (req as any).user?.userId || 'system'
                        });
                    }
                }
            }

            res.status(201).json({
                success: true,
                message: '任务创建成功',
                data: task
            });
        } catch (error) {
            console.error('创建任务失败:', error);
            res.status(500).json({
                success: false,
                message: '创建任务失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 批量创建任务
     */
    static async createTasks(req: Request, res: Response) {
        try {
            const { tasks } = req.body;

            if (!Array.isArray(tasks)) {
                return res.status(400).json({
                    success: false,
                    message: '任务数据必须是数组'
                });
            }

            const createdTasks = await taskService.createTasks(tasks);

            return res.status(201).json({
                success: true,
                message: `成功创建 ${createdTasks.length} 个任务`,
                data: createdTasks
            });
        } catch (error) {
            console.error('批量创建任务失败:', error);
            return res.status(500).json({
                success: false,
                message: '批量创建任务失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 更新任务
     */
    static async updateTask(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedBy = (req as any).user?.userId || 'system';

            const task = await taskService.updateTask(id, updateData, updatedBy);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: '任务不存在'
                });
            }

            return res.json({
                success: true,
                message: '任务更新成功',
                data: task
            });
        } catch (error) {
            console.error('更新任务失败:', error);
            return res.status(500).json({
                success: false,
                message: '更新任务失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 更新任务状态
     */
    static async updateTaskStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, progress } = req.body;
            const updatedBy = (req as any).user?.userId || 'system';

            const task = await taskService.updateTaskStatus(id, status, updatedBy, progress);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: '任务不存在'
                });
            }

            return res.json({
                success: true,
                message: '任务状态更新成功',
                data: task
            });
        } catch (error) {
            console.error('更新任务状态失败:', error);
            return res.status(500).json({
                success: false,
                message: '更新任务状态失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 更新任务结算状态
     */
    static async updateTaskSettlementStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const updatedBy = (req as any).user?.userId || 'system';

            const task = await taskService.updateTaskSettlementStatus(id, status, updatedBy);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: '任务不存在'
                });
            }

            return res.json({
                success: true,
                message: '任务结算状态更新成功',
                data: task
            });
        } catch (error) {
            console.error('更新任务结算状态失败:', error);
            return res.status(500).json({
                success: false,
                message: '更新任务结算状态失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 分配设计师
     */
    static async assignDesigners(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { mainDesignerIds, assistantDesignerIds } = req.body;
            const updatedBy = (req as any).user?.id || 'system';

            if (!Array.isArray(mainDesignerIds)) {
                return res.status(400).json({
                    success: false,
                    message: '主创设计师ID必须是数组'
                });
            }

            if (!Array.isArray(assistantDesignerIds)) {
                return res.status(400).json({
                    success: false,
                    message: '助理设计师ID必须是数组'
                });
            }

            const task = await taskService.assignDesigners(id, mainDesignerIds, assistantDesignerIds, updatedBy);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: '任务不存在'
                });
            }

            return res.json({
                success: true,
                message: '设计师分配成功',
                data: task
            });
        } catch (error) {
            console.error('分配设计师失败:', error);
            return res.status(500).json({
                success: false,
                message: '分配设计师失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 删除任务
     */
    static async deleteTask(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deletedBy = (req as any).user?.userId || 'system';

            const success = await taskService.deleteTask(id, deletedBy);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: '任务不存在'
                });
            }

            return res.json({
                success: true,
                message: '任务删除成功'
            });
        } catch (error) {
            console.error('删除任务失败:', error);
            return res.status(500).json({
                success: false,
                message: '删除任务失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 获取任务统计信息
     */
    static async getTaskStats(req: Request, res: Response) {
        try {
            const { projectId, designerId } = req.query;

            const stats = await taskService.getTaskStats(
                projectId as string,
                designerId as string
            );

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('获取任务统计失败:', error);
            res.status(500).json({
                success: false,
                message: '获取任务统计失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    /**
     * 清理没有关联项目的孤立任务
     */
    static async cleanupOrphanedTasks(req: Request, res: Response) {
        try {
            const result = await taskService.cleanupOrphanedTasks();

            return res.json({
                success: true,
                message: `清理完成: 总任务数=${result.totalTasks}, 孤立任务数=${result.orphanedTasks}, 已删除=${result.deletedTasks}`,
                data: result
            });
        } catch (error) {
            console.error('清理孤立任务失败:', error);
            return res.status(500).json({
                success: false,
                message: '清理孤立任务失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
}

export default TaskController;