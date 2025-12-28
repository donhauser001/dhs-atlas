import Task, { ITask } from '../models/Task';
import ProjectLog from '../models/ProjectLog';
import { UserService } from './UserService';
import { SpecificationService } from './SpecificationService';
import { ServicePricingService } from './ServicePricingService';
import { ServiceProcessService } from './ServiceProcessService';
import BusinessMessageService from './BusinessMessageService';

class TaskService {
    private userService = new UserService();
    private specificationService = new SpecificationService();
    private serviceProcessService = new ServiceProcessService();
    private businessMessageService = BusinessMessageService;
    /**
     * 创建任务
     */
    async createTask(taskData: Partial<ITask>): Promise<ITask> {
        try {
            // 验证必填字段
            const requiredFields = ['taskName', 'serviceId', 'projectId', 'quantity', 'unit', 'subtotal', 'billingDescription'];
            const missingFields = requiredFields.filter(field => !taskData[field as keyof ITask]);

            if (missingFields.length > 0) {
                throw new Error(`缺少必填字段: ${missingFields.join(', ')}`);
            }

            // 验证数值字段
            if (typeof taskData.quantity !== 'number' || taskData.quantity <= 0) {
                throw new Error('数量必须是大于0的数字');
            }

            if (typeof taskData.subtotal !== 'number' || taskData.subtotal < 0) {
                throw new Error('小计金额不能为负数');
            }

            // 验证字符串字段
            if (typeof taskData.taskName !== 'string' || taskData.taskName.trim().length === 0) {
                throw new Error('任务名称不能为空');
            }

            if (typeof taskData.unit !== 'string' || taskData.unit.trim().length === 0) {
                throw new Error('单位不能为空');
            }

            // 创建任务
            const task = new Task(taskData);
            const savedTask = await task.save();

            // 发送任务分配通知
            try {
                const assignedUsers = [
                    ...(taskData.mainDesigners || []),
                    ...(taskData.assistantDesigners || [])
                ];

                if (assignedUsers.length > 0) {
                    await this.businessMessageService.notifyTaskAssignment(
                        savedTask,
                        assignedUsers,
                        'system' // 创建任务时默认为系统分配
                    );
                }
            } catch (error) {
                console.error('发送任务分配通知失败:', error);
                // 不影响任务创建，只记录错误
            }

            return savedTask;
        } catch (error) {
            console.error('任务服务创建任务失败:', error);
            throw error;
        }
    }

    /**
 * 批量创建任务
 */
    async createTasks(tasksData: Partial<ITask>[]): Promise<ITask[]> {
        return await Task.insertMany(tasksData) as ITask[];
    }

    /**
     * 根据ID获取任务
     */
    async getTaskById(id: string): Promise<ITask | null> {
        return await Task.findById(id);
    }

    /**
     * 根据ID列表批量获取任务
     */
    async getTasksByIds(ids: string[]): Promise<any[]> {
        // 确保ID格式正确（MongoDB ObjectId）
        const mongoose = require('mongoose');
        const objectIds = ids.map(id => {
            try {
                // 如果已经是ObjectId，直接返回；否则尝试转换
                return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
            } catch (error) {
                return id;
            }
        });

        const tasks = await Task.find({ _id: { $in: objectIds } }).lean();

        // 为每个任务获取服务定价信息
        const tasksWithPricing = await Promise.all(
            tasks.map(async (task) => {
                let unitPrice = 0;

                // 尝试从服务定价获取单价
                if (task.serviceId) {
                    try {
                        const servicePricing = await ServicePricingService.getServicePricingById(task.serviceId);
                        if (servicePricing && servicePricing.unitPrice) {
                            unitPrice = servicePricing.unitPrice;
                        }
                    } catch (error) {
                        console.error('获取服务定价失败:', error);
                    }
                }

                // 如果无法从服务定价获取，则通过 subtotal / quantity 计算
                if (unitPrice === 0 && task.quantity && task.quantity > 0 && task.subtotal) {
                    unitPrice = task.subtotal / task.quantity;
                }

                return {
                    ...task,
                    _id: task._id.toString(),
                    unitPrice: unitPrice
                };
            })
        );

        return tasksWithPricing;
    }

    /**
     * 获取项目相关的所有任务
     */
    async getTasksByProject(projectId: string): Promise<any[]> {
        const tasks = await Task.find({ projectId }).sort({ createdAt: 1 });

        // 为每个任务获取设计师名字、规格信息和流程信息
        const tasksWithDetails = await Promise.all(
            tasks.map(async (task) => {
                let mainDesignerNames: string[] = [];
                let assistantDesignerNames: string[] = [];
                let specification = null;
                let processSteps: Array<{
                    id: string;
                    name: string;
                    description: string;
                    order: number;
                    progressRatio: number;
                    cycle: number;
                }> = [];
                let currentProcessStep: {
                    id: string;
                    name: string;
                    description: string;
                    order: number;
                    progressRatio: number;
                    cycle: number;
                } | null = null;

                // 获取主创设计师名字
                if (task.mainDesigners && task.mainDesigners.length > 0) {
                    try {
                        const designerPromises = task.mainDesigners.map(async (designerId: string) => {
                            const user = await this.userService.getUserById(designerId);
                            return user ? user.realName || user.username : designerId;
                        });
                        mainDesignerNames = await Promise.all(designerPromises);
                    } catch (error) {
                        console.error('获取主创设计师信息失败:', error);
                        mainDesignerNames = task.mainDesigners;
                    }
                }

                // 获取助理设计师名字
                if (task.assistantDesigners && task.assistantDesigners.length > 0) {
                    try {
                        const designerPromises = task.assistantDesigners.map(async (designerId: string) => {
                            const user = await this.userService.getUserById(designerId);
                            return user ? user.realName || user.username : designerId;
                        });
                        assistantDesignerNames = await Promise.all(designerPromises);
                    } catch (error) {
                        console.error('获取助理设计师信息失败:', error);
                        assistantDesignerNames = task.assistantDesigners;
                    }
                }

                // 获取规格信息
                if (task.specificationId) {
                    try {
                        const spec = await this.specificationService.getSpecificationById(task.specificationId);
                        if (spec) {
                            specification = {
                                id: (spec as any)._id.toString(),
                                name: spec.name,
                                length: spec.length,
                                width: spec.width,
                                height: spec.height,
                                unit: spec.unit,
                                resolution: spec.resolution
                            };
                        }
                    } catch (error) {
                        console.error('获取规格信息失败:', error);
                    }
                }

                // 获取服务信息和流程信息
                let categoryName = '默认类别';
                let serviceName = '';
                let unitPrice = 0;
                let priceDescription = '';
                let unit = task.unit || '';
                try {
                    // 获取服务定价信息
                    const servicePricing = await ServicePricingService.getServicePricingById(task.serviceId);
                    if (servicePricing) {
                        // 获取服务类别名称
                        categoryName = servicePricing.categoryName || '默认类别';
                        serviceName = servicePricing.serviceName || '';
                        unitPrice = servicePricing.unitPrice || 0;
                        priceDescription = servicePricing.priceDescription || '';
                        unit = servicePricing.unit || task.unit || '';

                        if (servicePricing.serviceProcessId) {
                            // 获取服务流程
                            const serviceProcess = await this.serviceProcessService.getProcessById(servicePricing.serviceProcessId);
                            if (serviceProcess && serviceProcess.steps) {
                                processSteps = serviceProcess.steps.map((step: any) => ({
                                    id: step.id,
                                    name: step.name,
                                    description: step.description,
                                    order: step.order,
                                    progressRatio: step.progressRatio,
                                    lossBillingRatio: step.lossBillingRatio,
                                    cycle: step.cycle
                                }));

                                // 如果任务没有设置流程节点，默认选择第一个
                                if (!task.processStepId && processSteps.length > 0) {
                                    const firstStep = processSteps[0];
                                    currentProcessStep = firstStep;

                                    // 更新任务的流程节点信息
                                    await Task.findByIdAndUpdate(task._id, {
                                        processStepId: firstStep.id,
                                        processStepName: firstStep.name
                                    });
                                } else if (task.processStepId) {
                                    // 找到当前流程节点
                                    const foundStep = processSteps.find((step: any) => step.id === task.processStepId);
                                    currentProcessStep = foundStep || null;
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('获取服务信息失败:', error);
                }

                // 如果无法从服务定价获取单价，则通过 subtotal / quantity 计算
                if (unitPrice === 0 && task.quantity && task.quantity > 0 && task.subtotal) {
                    unitPrice = task.subtotal / task.quantity;
                }

                return {
                    ...task.toObject(),
                    mainDesignerNames,
                    assistantDesignerNames,
                    specification,
                    processSteps,
                    currentProcessStep,
                    categoryName,     // 添加真实的服务类别名称
                    serviceName,      // 添加服务名称
                    unitPrice,       // 添加单价
                    priceDescription, // 添加价格描述
                    unit              // 添加单位（从服务定价表获取）
                };
            })
        );

        return tasksWithDetails;
    }

    /**
     * 获取设计师分配的任务
     */
    async getTasksByDesigner(designerId: string, status?: string): Promise<ITask[]> {
        const query: any = {
            $or: [
                { mainDesigners: designerId },
                { assistantDesigners: designerId }
            ]
        };
        if (status) {
            query.status = status;
        }
        return await Task.find(query).sort({ priority: -1, createdAt: 1 });
    }

    /**
     * 获取任务列表（支持分页和筛选）
     */
    async getTasks(query: {
        page?: number;
        limit?: number;
        projectId?: string;
        designerId?: string;
        status?: string;
        priority?: string;
        settlementStatus?: string;
        search?: string;
    }): Promise<{ tasks: ITask[]; total: number }> {
        const { page = 1, limit = 20, projectId, designerId, status, priority, settlementStatus, search } = query;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (projectId) filter.projectId = projectId;
        if (designerId) {
            filter.$or = [
                { mainDesigners: designerId },
                { assistantDesigners: designerId }
            ];
        }
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (settlementStatus) filter.settlementStatus = settlementStatus;
        if (search) {
            filter.$or = [
                { taskName: { $regex: search, $options: 'i' } },
                { remarks: { $regex: search, $options: 'i' } }
            ];
        }

        const [tasks, total] = await Promise.all([
            Task.find(filter).sort({ priority: -1, createdAt: 1 }).skip(skip).limit(limit),
            Task.countDocuments(filter)
        ]);

        return { tasks, total };
    }

    /**
     * 更新任务
     */
    async updateTask(id: string, updateData: Partial<ITask>, updatedBy: string): Promise<ITask | null> {
        const task = await Task.findById(id);
        if (!task) {
            return null;
        }

        // 只更新明确传递的字段，忽略 undefined 的字段（保留原有值）
        const processedData: any = {};

        // 遍历 updateData，只处理非 undefined 的字段
        Object.keys(updateData).forEach(key => {
            const value = (updateData as any)[key];
            // 只有当值不是 undefined 时才添加到 processedData
            // 如果值是 null，则明确设置为 null（表示清除该字段）
            if (value !== undefined) {
                processedData[key] = value;
            }
        });

        const updatedTask = await Task.findByIdAndUpdate(id, processedData, { new: true });

        // 记录任务更新日志
        if (updatedTask) {
            await this.createTaskLog({
                taskId: id,
                projectId: updatedTask.projectId,
                type: 'task_update',
                title: '任务更新',
                content: `任务 "${updatedTask.taskName}" 已更新`,
                createdBy: updatedBy,
                details: { oldValue: task.toObject(), newValue: updatedTask.toObject() }
            });
        }

        return updatedTask;
    }

    /**
     * 更新任务状态
     */
    async updateTaskStatus(id: string, status: string, updatedBy: string, progress?: number): Promise<ITask | null> {
        // 获取原始任务信息
        const originalTask = await Task.findById(id);
        if (!originalTask) {
            return null;
        }

        const oldStatus = originalTask.status;
        const updateData: any = { status };
        if (progress !== undefined) updateData.progress = progress;
        if (status === 'completed') updateData.completedDate = new Date();

        const updatedTask = await Task.findByIdAndUpdate(id, updateData, { new: true });

        // 记录状态变更日志
        if (updatedTask) {
            await this.createTaskLog({
                taskId: id,
                projectId: updatedTask.projectId,
                type: 'status_change',
                title: '任务状态变更',
                content: `任务状态变更为 "${status}"`,
                createdBy: updatedBy,
                details: { oldValue: { status: oldStatus }, newValue: { status, progress } }
            });

            // 发送状态变更通知
            try {
                if (oldStatus !== status) {
                    await this.businessMessageService.notifyTaskStatusChange(
                        updatedTask,
                        oldStatus,
                        status,
                        updatedBy
                    );
                }
            } catch (error) {
                console.error('发送任务状态变更通知失败:', error);
                // 不影响状态更新，只记录错误
            }
        }

        return updatedTask;
    }

    /**
     * 更新任务结算状态
     */
    async updateTaskSettlementStatus(id: string, status: string, updatedBy: string): Promise<ITask | null> {
        const updateData: any = { settlementStatus: status };
        if (status === 'fully-paid') updateData.settlementTime = new Date();

        const updatedTask = await Task.findByIdAndUpdate(id, updateData, { new: true });

        // 记录结算状态变更日志
        if (updatedTask) {
            await this.createTaskLog({
                taskId: id,
                projectId: updatedTask.projectId,
                type: 'settlement',
                title: '任务结算状态变更',
                content: `任务结算状态变更为 "${status}"`,
                createdBy: updatedBy,
                details: { oldValue: { settlementStatus: status }, newValue: { settlementStatus: status } }
            });
        }

        return updatedTask;
    }

    /**
     * 分配设计师
     */
    async assignDesigners(taskId: string, mainDesignerIds: string[], assistantDesignerIds: string[], updatedBy: string): Promise<ITask | null> {
        const task = await Task.findById(taskId);
        if (!task) {
            return null;
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            {
                mainDesigners: mainDesignerIds,
                assistantDesigners: assistantDesignerIds
            },
            { new: true }
        );

        // 记录设计师分配日志
        if (updatedTask) {
            await this.createTaskLog({
                taskId,
                projectId: updatedTask.projectId,
                type: 'team_change',
                title: '设计师分配',
                content: `任务设计师已重新分配`,
                createdBy: updatedBy,
                details: {
                    oldValue: {
                        mainDesigners: task.mainDesigners,
                        assistantDesigners: task.assistantDesigners
                    },
                    newValue: {
                        mainDesigners: mainDesignerIds,
                        assistantDesigners: assistantDesignerIds
                    }
                }
            });
        }

        return updatedTask;
    }

    /**
     * 删除任务
     */
    async deleteTask(id: string, deletedBy: string): Promise<boolean> {
        const task = await Task.findById(id);
        if (!task) {
            return false;
        }

        // 记录删除日志
        await this.createTaskLog({
            taskId: id,
            projectId: task.projectId,
            type: 'system',
            title: '任务删除',
            content: `任务 "${task.taskName}" 已被删除`,
            createdBy: deletedBy
        });

        const result = await Task.findByIdAndDelete(id);
        return !!result;
    }

    /**
     * 删除项目相关的所有任务
     */
    async deleteTasksByProject(projectId: string): Promise<number> {
        const result = await Task.deleteMany({ projectId });
        return result.deletedCount || 0;
    }

    /**
     * 清理没有关联项目的孤立任务
     * 检查所有任务，删除那些 projectId 对应的项目不存在的任务
     */
    async cleanupOrphanedTasks(): Promise<{
        totalTasks: number;
        orphanedTasks: number;
        deletedTasks: number;
        orphanedTaskIds: string[];
    }> {
        try {
            // 获取所有任务
            const allTasks = await Task.find({}).select('_id projectId taskName').lean();
            const totalTasks = allTasks.length;

            // 获取所有存在的项目ID
            const Project = (await import('../models/Project')).default;
            const existingProjects = await Project.find({}).select('_id').lean();
            const existingProjectIds = new Set(
                existingProjects.map(p => p._id.toString())
            );

            // 找出孤立任务（projectId 对应的项目不存在）
            const orphanedTasks: Array<{ _id: string; projectId: string; taskName: string }> = [];
            const orphanedTaskIds: string[] = [];

            for (const task of allTasks) {
                const taskId = task._id.toString();
                const projectId = task.projectId;

                // 检查项目是否存在
                if (!existingProjectIds.has(projectId)) {
                    orphanedTasks.push({
                        _id: taskId,
                        projectId,
                        taskName: task.taskName
                    });
                    orphanedTaskIds.push(taskId);
                }
            }

            // 删除孤立任务
            let deletedTasks = 0;
            if (orphanedTaskIds.length > 0) {
                const result = await Task.deleteMany({
                    _id: { $in: orphanedTaskIds }
                });
                deletedTasks = result.deletedCount || 0;
            }

            console.log(`✅ 任务清理完成: 总任务数=${totalTasks}, 孤立任务数=${orphanedTasks.length}, 已删除=${deletedTasks}`);

            return {
                totalTasks,
                orphanedTasks: orphanedTasks.length,
                deletedTasks,
                orphanedTaskIds
            };
        } catch (error) {
            console.error('清理孤立任务失败:', error);
            throw error;
        }
    }

    /**
     * 获取任务统计信息
     */
    async getTaskStats(projectId?: string, designerId?: string): Promise<{
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        cancelled: number;
        onHold: number;
        unpaid: number;
        prepaid: number;
        draftPaid: number;
        fullyPaid: number;
    }> {
        const filter: any = {};
        if (projectId) filter.projectId = projectId;
        if (designerId) {
            filter.$or = [
                { mainDesigners: designerId },
                { assistantDesigners: designerId }
            ];
        }

        const stats = await Task.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                    onHold: { $sum: { $cond: [{ $eq: ['$status', 'on-hold'] }, 1, 0] } },
                    unpaid: { $sum: { $cond: [{ $eq: ['$settlementStatus', 'unpaid'] }, 1, 0] } },
                    prepaid: { $sum: { $cond: [{ $eq: ['$settlementStatus', 'prepaid'] }, 1, 0] } },
                    draftPaid: { $sum: { $cond: [{ $eq: ['$settlementStatus', 'draft-paid'] }, 1, 0] } },
                    fullyPaid: { $sum: { $cond: [{ $eq: ['$settlementStatus', 'fully-paid'] }, 1, 0] } }
                }
            }
        ]);

        const result = stats[0] || {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0,
            cancelled: 0,
            onHold: 0,
            unpaid: 0,
            prepaid: 0,
            draftPaid: 0,
            fullyPaid: 0
        };

        return result;
    }

    /**
     * 创建任务日志
     */
    async createTaskLog(logData: {
        taskId: string;
        projectId: string;
        type: string;
        title: string;
        content: string;
        createdBy: string;
        details?: any;
    }): Promise<void> {
        const log = new ProjectLog({
            projectId: logData.projectId,
            type: logData.type,
            title: logData.title,
            content: logData.content,
            createdBy: logData.createdBy,
            details: {
                ...logData.details,
                taskId: logData.taskId
            }
        });
        await log.save();
    }
}

export { TaskService };
export default new TaskService();