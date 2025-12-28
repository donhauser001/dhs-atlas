import Project, { IProject } from '../models/Project';
import ProjectLog from '../models/ProjectLog';
import Settlement from '../models/Settlement';
import TaskService from './TaskService';
import { UserService } from './UserService';
import { EnterpriseService } from './EnterpriseService';
import BusinessMessageService from './BusinessMessageService';

export class ProjectService {
  private taskService = TaskService;
  private userService = new UserService();
  private enterpriseService = new EnterpriseService();
  private businessMessageService = BusinessMessageService;

  /**
   * 获取项目列表
   */
  async getProjects(params: {
    page?: number;
    limit?: number;
    search?: string;
    progressStatus?: string;
    settlementStatus?: string;
    undertakingTeam?: string;
    clientId?: string;
    excludeStatus?: string;
  }): Promise<{ projects: IProject[], total: number }> {
    const { page = 1, limit = 50, search, progressStatus, settlementStatus, undertakingTeam, clientId, excludeStatus } = params;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } }
      ];
    }
    if (progressStatus) filter.progressStatus = progressStatus;
    if (settlementStatus) filter.settlementStatus = settlementStatus;
    if (undertakingTeam) filter.undertakingTeam = undertakingTeam;
    if (clientId) filter.clientId = clientId;
    if (excludeStatus) filter.progressStatus = { $ne: excludeStatus };

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter)
    ]);

    // 为项目列表添加企业别名信息和结算单信息
    const projectsWithTeamNames = await Promise.all(
      projects.map(async (project) => {
        let undertakingTeamName = project.undertakingTeam;
        if (project.undertakingTeam) {
          try {
            const enterprise = await this.enterpriseService.getEnterpriseById(project.undertakingTeam);
            if (enterprise) {
              // 优先使用企业别名，如果没有则使用企业名称
              undertakingTeamName = enterprise.enterpriseAlias || enterprise.enterpriseName;
            }
          } catch (error) {
            console.error('获取企业信息失败:', error);
          }
        }

        // 检查项目是否有关联的结算单，并同步结算状态
        let hasSettlement = false;
        let settlementId: string | null = null;
        let settlementStatus = 'unpaid' as 'unpaid' | 'prepaid' | 'partial-paid' | 'fully-paid'; // 默认待结算

        if (project.settlementIds && project.settlementIds.length > 0) {
          // 验证结算单是否存在（可能已被删除但ID还在）
          const existingSettlement = await Settlement.findOne({
            _id: { $in: project.settlementIds }
          }).lean();

          if (existingSettlement) {
            hasSettlement = true;
            settlementId = (existingSettlement as any)._id.toString();

            // 根据结算单状态同步到项目结算状态
            const settlementStatusValue = (existingSettlement as any).status;
            if (settlementStatusValue === 'pending') {
              settlementStatus = 'unpaid'; // 待结清 -> 未付款
            } else if (settlementStatusValue === 'partial') {
              settlementStatus = 'partial-paid'; // 部分结清 -> 部分付款
            } else if (settlementStatusValue === 'completed') {
              settlementStatus = 'fully-paid'; // 全部结清 -> 已付清
            }

            // 如果项目的结算状态与结算单状态不一致，更新项目状态
            if (project.settlementStatus !== settlementStatus) {
              await Project.findByIdAndUpdate(project._id, {
                $set: { settlementStatus }
              });
            }
          } else {
            // 如果结算单不存在，清理项目中的无效ID，并设置为待结算
            await Project.findByIdAndUpdate(project._id, {
              $set: {
                settlementIds: [],
                settlementStatus: 'unpaid' // 没有结算单，显示待结算
              }
            });
            settlementStatus = 'unpaid';
          }
        } else {
          // 没有关联结算单，设置为待结算
          if (project.settlementStatus !== 'unpaid') {
            await Project.findByIdAndUpdate(project._id, {
              $set: { settlementStatus: 'unpaid' }
            });
          }
          settlementStatus = 'unpaid';
        }

        return {
          ...project,
          undertakingTeamName,
          hasSettlement,
          settlementId,
          settlementStatus // 返回同步后的结算状态
        };
      })
    );

    return { projects: projectsWithTeamNames, total };
  }

  /**
   * 根据ID获取项目详情
   */
  async getProjectById(id: string): Promise<any | null> {
    const project = await Project.findById(id).lean();

    if (!project) {
      return null;
    }

    // 获取承接团队名称
    let undertakingTeamName = project.undertakingTeam;
    if (project.undertakingTeam) {
      try {
        const enterprise = await this.enterpriseService.getEnterpriseById(project.undertakingTeam);
        if (enterprise) {
          // 优先使用企业别名，如果没有则使用企业名称
          undertakingTeamName = enterprise.enterpriseAlias || enterprise.enterpriseName;
        }
      } catch (error) {
        console.error('获取企业信息失败:', error);
      }
    }

    // 获取主创设计师姓名
    let mainDesignerNames: string[] = [];
    if (project.mainDesigners && project.mainDesigners.length > 0) {
      try {
        const designerPromises = project.mainDesigners.map(async (designerId: string) => {
          const user = await this.userService.getUserById(designerId);
          return user ? user.realName || user.username : designerId;
        });
        mainDesignerNames = await Promise.all(designerPromises);
      } catch (error) {
        console.error('获取主创设计师信息失败:', error);
        mainDesignerNames = project.mainDesigners;
      }
    }

    // 获取助理设计师姓名
    let assistantDesignerNames: string[] = [];
    if (project.assistantDesigners && project.assistantDesigners.length > 0) {
      try {
        const designerPromises = project.assistantDesigners.map(async (designerId: string) => {
          const user = await this.userService.getUserById(designerId);
          return user ? user.realName || user.username : designerId;
        });
        assistantDesignerNames = await Promise.all(designerPromises);
      } catch (error) {
        console.error('获取助理设计师信息失败:', error);
        assistantDesignerNames = project.assistantDesigners;
      }
    }

    return {
      ...project,
      undertakingTeamName,
      mainDesignerNames,
      assistantDesignerNames
    };
  }

  /**
   * 创建项目
   */
  async createProject(projectData: {
    projectName: string;
    clientId: string;
    clientName: string;
    contactIds: string[];
    contactNames: string[];
    contactPhones: string[];
    undertakingTeam: string;
    mainDesigners: string[];
    assistantDesigners: string[];
    clientRequirements?: string | Array<{ content: string; createdAt: string | Date }>;
    quotationId?: string;
    remark?: string | Array<{ content: string; createdAt: string | Date }>;
    tasks?: Array<{
      taskName: string;
      serviceId: string;
      assignedDesigners: string[];
      specificationId?: string;
      quantity: number;
      unit: string;
      subtotal: number;
      pricingPolicies?: Array<{
        policyId: string;
        policyName: string;
        policyType: 'uniform_discount' | 'tiered_discount';
        discountRatio: number;
        calculationDetails: string;
      }>;
      billingDescription: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      dueDate?: Date;
      remarks?: string;
    }>;
    createdBy: string;
  }): Promise<IProject> {
    const { tasks, createdBy, ...projectBasicData } = projectData;

    // 处理客户嘱托：如果是字符串，转换为数组格式
    let clientRequirements = projectBasicData.clientRequirements;
    if (clientRequirements && typeof clientRequirements === 'string' && clientRequirements.trim()) {
      clientRequirements = [{ content: clientRequirements.trim(), createdAt: new Date() }];
    } else if (Array.isArray(clientRequirements) && clientRequirements.length > 0) {
      // 确保数组中的createdAt是Date类型
      clientRequirements = clientRequirements.map(req => ({
        content: req.content,
        createdAt: req.createdAt instanceof Date ? req.createdAt : new Date(req.createdAt || new Date())
      }));
    } else {
      clientRequirements = undefined;
    }

    // 处理备注：如果是字符串，转换为数组格式
    let remark = projectBasicData.remark;
    if (remark && typeof remark === 'string' && remark.trim()) {
      remark = [{ content: remark.trim(), createdAt: new Date() }];
    } else if (Array.isArray(remark) && remark.length > 0) {
      // 确保数组中的createdAt是Date类型
      remark = remark.map(rm => ({
        content: rm.content,
        createdAt: rm.createdAt instanceof Date ? rm.createdAt : new Date(rm.createdAt || new Date())
      }));
    } else {
      remark = undefined;
    }

    // 创建项目
    const project = new Project({
      ...projectBasicData,
      clientRequirements,
      remark,
      taskIds: [], // 先创建空数组，后面会更新
      fileIds: [],
      contractIds: [],
      invoiceIds: [],
      proposalIds: [],
      logIds: []
    });

    const savedProject = await project.save() as IProject;

    // 发送项目创建通知
    try {
      await this.businessMessageService.notifyProjectCreation(savedProject, createdBy);
    } catch (error) {
      console.error('发送项目创建通知失败:', error);
      // 不影响项目创建，只记录错误
    }

    // 创建项目日志
    await this.createProjectLog({
      projectId: (savedProject as any)._id.toString(),
      type: 'system',
      title: '项目创建',
      content: `项目 "${projectData.projectName}" 已创建`,
      createdBy
    });

    // 创建任务
    if (tasks && tasks.length > 0) {
      const tasksData = tasks.map(task => ({
        ...task,
        projectId: (savedProject as any)._id.toString(),
        status: 'pending' as const,
        progress: 0,
        settlementStatus: 'unpaid' as const,
        attachmentIds: [],
        pricingPolicies: task.pricingPolicies || []
      }));

      const createdTasks = await this.taskService.createTasks(tasksData);

      // 更新项目中的任务ID列表
      const taskIds = createdTasks.map((task: any) => task._id.toString());
      await Project.findByIdAndUpdate(savedProject._id, { taskIds });

      // 创建任务创建日志
      await this.createProjectLog({
        projectId: (savedProject as any)._id.toString(),
        type: 'task_update',
        title: '任务创建',
        content: `创建了 ${tasks.length} 个任务`,
        createdBy,
        details: { relatedIds: taskIds }
      });

      // 返回更新后的项目
      return await Project.findById(savedProject._id).lean() as IProject;
    }

    return savedProject;
  }

  /**
   * 更新项目
   */
  async updateProject(id: string, updateData: {
    projectName?: string;
    clientId?: string;
    clientName?: string;
    contactIds?: string[];
    contactNames?: string[];
    contactPhones?: string[];
    undertakingTeam?: string;
    mainDesigners?: string[];
    assistantDesigners?: string[];
    progressStatus?: string;
    settlementStatus?: string;
    startedAt?: Date;
    deliveredAt?: Date;
    settledAt?: Date;
    clientRequirements?: string;
    quotationId?: string;
    remark?: string;
    taskIds?: string[];
    updatedBy: string;
  }): Promise<IProject | null> {
    const { updatedBy, ...updateFields } = updateData;
    const project = await Project.findById(id);

    if (!project) {
      return null;
    }

    // 记录状态变更日志和发送通知
    if (updateFields.progressStatus && updateFields.progressStatus !== project.progressStatus) {
      await this.createProjectLog({
        projectId: id,
        type: 'status_change',
        title: '进度状态变更',
        content: `项目进度状态从 "${project.progressStatus}" 变更为 "${updateFields.progressStatus}"`,
        createdBy: updatedBy,
        details: {
          oldValue: project.progressStatus,
          newValue: updateFields.progressStatus
        }
      });

      // 发送项目状态变更通知
      try {
        await this.businessMessageService.notifyProjectStatusChange(
          project,
          project.progressStatus,
          updateFields.progressStatus,
          updatedBy
        );

        // 检查是否达成里程碑
        if (updateFields.progressStatus === 'in-progress' && project.progressStatus !== 'in-progress') {
          await this.businessMessageService.notifyProjectMilestone(project, 'started', updatedBy);
        } else if (updateFields.progressStatus === 'completed' && project.progressStatus !== 'completed') {
          await this.businessMessageService.notifyProjectMilestone(project, 'delivered', updatedBy);
        }
      } catch (error) {
        console.error('发送项目状态变更通知失败:', error);
        // 不影响项目更新，只记录错误
      }
    }

    if (updateFields.settlementStatus && updateFields.settlementStatus !== project.settlementStatus) {
      await this.createProjectLog({
        projectId: id,
        type: 'settlement',
        title: '结算状态变更',
        content: `项目结算状态从 "${project.settlementStatus}" 变更为 "${updateFields.settlementStatus}"`,
        createdBy: updatedBy,
        details: {
          oldValue: project.settlementStatus,
          newValue: updateFields.settlementStatus
        }
      });

      // 发送结算完成里程碑通知
      try {
        if (updateFields.settlementStatus === 'fully-paid' && project.settlementStatus !== 'fully-paid') {
          await this.businessMessageService.notifyProjectMilestone(project, 'settled', updatedBy);
        }
      } catch (error) {
        console.error('发送项目结算通知失败:', error);
        // 不影响项目更新，只记录错误
      }
    }

    // 记录团队变更日志和发送通知
    if (updateFields.mainDesigners || updateFields.assistantDesigners) {
      await this.createProjectLog({
        projectId: id,
        type: 'team_change',
        title: '团队变更',
        content: '项目团队人员已更新',
        createdBy: updatedBy,
        details: {
          oldValue: {
            mainDesigners: project.mainDesigners,
            assistantDesigners: project.assistantDesigners
          },
          newValue: {
            mainDesigners: updateFields.mainDesigners || project.mainDesigners,
            assistantDesigners: updateFields.assistantDesigners || project.assistantDesigners
          }
        }
      });

      // 发送团队变更通知
      try {
        // 处理主创设计师变更
        if (updateFields.mainDesigners) {
          const oldMainDesigners = project.mainDesigners || [];
          const newMainDesigners = updateFields.mainDesigners || [];

          // 找出新增的设计师
          const addedMainDesigners = newMainDesigners.filter(id => !oldMainDesigners.includes(id));
          if (addedMainDesigners.length > 0) {
            await this.businessMessageService.notifyProjectTeamChange(
              project, 'added', addedMainDesigners, 'main', updatedBy
            );
          }

          // 找出移除的设计师
          const removedMainDesigners = oldMainDesigners.filter(id => !newMainDesigners.includes(id));
          if (removedMainDesigners.length > 0) {
            await this.businessMessageService.notifyProjectTeamChange(
              project, 'removed', removedMainDesigners, 'main', updatedBy
            );
          }
        }

        // 处理助理设计师变更
        if (updateFields.assistantDesigners) {
          const oldAssistantDesigners = project.assistantDesigners || [];
          const newAssistantDesigners = updateFields.assistantDesigners || [];

          // 找出新增的设计师
          const addedAssistantDesigners = newAssistantDesigners.filter(id => !oldAssistantDesigners.includes(id));
          if (addedAssistantDesigners.length > 0) {
            await this.businessMessageService.notifyProjectTeamChange(
              project, 'added', addedAssistantDesigners, 'assistant', updatedBy
            );
          }

          // 找出移除的设计师
          const removedAssistantDesigners = oldAssistantDesigners.filter(id => !newAssistantDesigners.includes(id));
          if (removedAssistantDesigners.length > 0) {
            await this.businessMessageService.notifyProjectTeamChange(
              project, 'removed', removedAssistantDesigners, 'assistant', updatedBy
            );
          }
        }
      } catch (error) {
        console.error('发送项目团队变更通知失败:', error);
        // 不影响项目更新，只记录错误
      }
    }

    return await Project.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );
  }

  /**
   * 删除项目
   */
  async deleteProject(id: string, deletedBy: string): Promise<void> {
    const project = await Project.findById(id);
    if (!project) {
      throw new Error('项目不存在');
    }

    // 发送项目删除通知
    try {
      await this.businessMessageService.notifyProjectDeletion(project, deletedBy);
    } catch (error) {
      console.error('发送项目删除通知失败:', error);
      // 不影响项目删除，只记录错误
    }

    // 删除项目相关的所有任务
    await this.taskService.deleteTasksByProject(id);

    // 创建删除日志
    await this.createProjectLog({
      projectId: id,
      type: 'system',
      title: '项目删除',
      content: `项目 "${project.projectName}" 已被删除`,
      createdBy: deletedBy
    });

    // 删除项目
    await Project.findByIdAndDelete(id);
  }

  /**
   * 更新项目状态
   */
  async updateProjectStatus(id: string, status: string, updatedBy: string): Promise<IProject | null> {
    return await this.updateProject(id, { progressStatus: status, updatedBy });
  }

  /**
   * 更新结算状态
   */
  async updateSettlementStatus(id: string, status: string, updatedBy: string): Promise<IProject | null> {
    const updateData: any = { settlementStatus: status, updatedBy };

    // 如果状态变为完全结算，设置结算时间
    if (status === 'fully-paid') {
      updateData.settledAt = new Date();
    }

    return await this.updateProject(id, updateData);
  }

  /**
   * 获取项目统计信息
   */
  async getProjectStats(): Promise<{
    total: number;
    consulting: number;
    inProgress: number;
    partialDelivery: number;
    completed: number;
    onHold: number;
    cancelled: number;
    unpaid: number;
    prepaid: number;
    partialPaid: number;
    fullyPaid: number;
  }> {
    const [
      total,
      consulting,
      inProgress,
      partialDelivery,
      completed,
      onHold,
      cancelled,
      unpaid,
      prepaid,
      partialPaid,
      fullyPaid
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ progressStatus: 'consulting' }),
      Project.countDocuments({ progressStatus: 'in-progress' }),
      Project.countDocuments({ progressStatus: 'partial-delivery' }),
      Project.countDocuments({ progressStatus: 'completed' }),
      Project.countDocuments({ progressStatus: 'on-hold' }),
      Project.countDocuments({ progressStatus: 'cancelled' }),
      Project.countDocuments({ settlementStatus: 'unpaid' }),
      Project.countDocuments({ settlementStatus: 'prepaid' }),
      Project.countDocuments({ settlementStatus: 'partial-paid' }),
      Project.countDocuments({ settlementStatus: 'fully-paid' })
    ]);

    return {
      total,
      consulting,
      inProgress,
      partialDelivery,
      completed,
      onHold,
      cancelled,
      unpaid,
      prepaid,
      partialPaid,
      fullyPaid
    };
  }

  /**
   * 创建项目日志
   */
  async createProjectLog(logData: {
    projectId: string;
    type: string;
    title: string;
    content: string;
    createdBy: string;
    details?: any;
  }): Promise<void> {
    const log = new ProjectLog(logData);
    await log.save();

    // 更新项目的日志ID列表
    await Project.findByIdAndUpdate(
      logData.projectId,
      { $push: { logIds: (log as any)._id.toString() } }
    );
  }

  /**
   * 获取项目日志
   */
  async getProjectLogs(projectId: string, page = 1, limit = 20): Promise<{ logs: any[], total: number }> {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ProjectLog.find({ projectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProjectLog.countDocuments({ projectId })
    ]);

    return { logs, total };
  }

  /**
   * 添加客户嘱托
   */
  async addClientRequirement(projectId: string, content: string): Promise<IProject | null> {
    const project = await Project.findById(projectId);
    if (!project) return null;

    // 处理旧数据格式：如果是字符串，转换为数组
    if (typeof (project.clientRequirements as any) === 'string') {
      const reqStr = (project.clientRequirements as any) as string;
      project.clientRequirements = reqStr.trim() ? [{
        content: reqStr,
        createdAt: new Date()
      }] : [];
    }

    if (!project.clientRequirements || !Array.isArray(project.clientRequirements)) {
      project.clientRequirements = [];
    }

    // 清理空记录
    project.clientRequirements = project.clientRequirements.filter(
      (req: any) => req && req.content && req.content.trim()
    );

    // 同步清理备注中的空记录，避免保存时触发校验错误（兼容旧数据）
    if (typeof (project as any).remark === 'string') {
      (project as any).remark = (project as any).remark.trim() ? [{
        content: (project as any).remark,
        createdAt: new Date()
      }] : [];
    }
    if (!(project as any).remark || !Array.isArray((project as any).remark)) {
      (project as any).remark = [];
    }
    (project as any).remark = (project as any).remark.filter(
      (rm: any) => rm && rm.content && rm.content.trim()
    );

    project.clientRequirements.push({
      content,
      createdAt: new Date()
    });

    await project.save();
    return project;
  }

  /**
   * 删除客户嘱托
   */
  async deleteClientRequirement(projectId: string, index: number): Promise<IProject | null> {
    const project = await Project.findById(projectId);
    if (!project) return null;

    // 处理旧数据格式
    if (typeof (project.clientRequirements as any) === 'string') {
      const reqStr = (project.clientRequirements as any) as string;
      project.clientRequirements = reqStr.trim() ? [{
        content: reqStr,
        createdAt: new Date()
      }] : [];
    }

    if (!project.clientRequirements || !Array.isArray(project.clientRequirements) || index >= project.clientRequirements.length || index < 0) {
      return null;
    }

    // 清理空记录
    project.clientRequirements = project.clientRequirements.filter(
      (req: any) => req && req.content && req.content.trim()
    );

    // 重新计算索引（因为可能过滤了一些记录）
    if (index >= project.clientRequirements.length) {
      return null;
    }

    project.clientRequirements.splice(index, 1);
    await project.save();
    return project;
  }

  /**
   * 更新客户嘱托（按索引）
   */
  async updateClientRequirement(projectId: string, index: number, content: string): Promise<IProject | null> {
    const project = await Project.findById(projectId);
    if (!project) return null;

    // 兼容与清理
    if (typeof (project as any).clientRequirements === 'string') {
      (project as any).clientRequirements = (project as any).clientRequirements.trim() ? [{ content: (project as any).clientRequirements, createdAt: new Date() }] : [];
    }
    (project as any).clientRequirements = (project as any).clientRequirements?.filter((req: any) => req && req.content && req.content.trim()) || [];
    if (!(project as any).clientRequirements[index]) return null;

    // 仅更新内容，保留原创建时间
    (project as any).clientRequirements[index].content = content;
    await project.save();
    return project;
  }

  /**
   * 添加备注
   */
  async addRemark(projectId: string, content: string): Promise<IProject | null> {
    const project = await Project.findById(projectId);
    if (!project) return null;

    // 处理旧数据格式：如果是字符串，转换为数组
    if (typeof (project.remark as any) === 'string') {
      const remarkStr = (project.remark as any) as string;
      project.remark = remarkStr.trim() ? [{
        content: remarkStr,
        createdAt: new Date()
      }] : [];
    }

    if (!project.remark || !Array.isArray(project.remark)) {
      project.remark = [];
    }

    // 清理空记录
    project.remark = project.remark.filter(
      (rm: any) => rm && rm.content && rm.content.trim()
    );

    // 同步清理客户嘱托中的空记录，避免保存时触发校验错误（兼容旧数据）
    if (typeof (project as any).clientRequirements === 'string') {
      (project as any).clientRequirements = (project as any).clientRequirements.trim() ? [{
        content: (project as any).clientRequirements,
        createdAt: new Date()
      }] : [];
    }
    if (!(project as any).clientRequirements || !Array.isArray((project as any).clientRequirements)) {
      (project as any).clientRequirements = [];
    }
    (project as any).clientRequirements = (project as any).clientRequirements.filter(
      (req: any) => req && req.content && req.content.trim()
    );

    project.remark.push({
      content,
      createdAt: new Date()
    });

    await project.save();
    return project;
  }

  /**
   * 删除备注
   */
  async deleteRemark(projectId: string, index: number): Promise<IProject | null> {
    const project = await Project.findById(projectId);
    if (!project) return null;

    // 处理旧数据格式
    if (typeof (project.remark as any) === 'string') {
      const remarkStr = (project.remark as any) as string;
      project.remark = remarkStr.trim() ? [{
        content: remarkStr,
        createdAt: new Date()
      }] : [];
    }

    if (!project.remark || !Array.isArray(project.remark) || index >= project.remark.length || index < 0) {
      return null;
    }

    // 清理空记录
    project.remark = project.remark.filter(
      (rm: any) => rm && rm.content && rm.content.trim()
    );

    // 重新计算索引（因为可能过滤了一些记录）
    if (index >= project.remark.length) {
      return null;
    }

    project.remark.splice(index, 1);
    await project.save();
    return project;
  }

  /**
   * 更新备注（按索引）
   */
  async updateRemark(projectId: string, index: number, content: string): Promise<IProject | null> {
    const project = await Project.findById(projectId);
    if (!project) return null;

    // 兼容与清理
    if (typeof (project as any).remark === 'string') {
      (project as any).remark = (project as any).remark.trim() ? [{ content: (project as any).remark, createdAt: new Date() }] : [];
    }
    (project as any).remark = (project as any).remark?.filter((rm: any) => rm && rm.content && rm.content.trim()) || [];
    if (!(project as any).remark[index]) return null;

    // 仅更新内容，保留原创建时间
    (project as any).remark[index].content = content;
    await project.save();
    return project;
  }
}

export default new ProjectService();