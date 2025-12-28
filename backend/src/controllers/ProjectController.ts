import { Request, Response } from 'express';
import ProjectService from '../services/ProjectService';
import TaskService from '../services/TaskService';

const taskService = TaskService;

export class ProjectController {
  /**
   * 获取项目列表
   */
  static async getProjects(req: Request, res: Response) {
    try {
      const { page, limit, search, progressStatus, settlementStatus, undertakingTeam, clientId, excludeStatus } = req.query;

      const result = await ProjectService.getProjects({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        progressStatus: progressStatus as string,
        settlementStatus: settlementStatus as string,
        undertakingTeam: undertakingTeam as string,
        clientId: clientId as string,
        excludeStatus: excludeStatus as string
      });

      return res.json({
        success: true,
        data: result.projects,
        total: result.total,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50
      });
    } catch (error) {
      console.error('获取项目列表失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取项目列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 根据ID获取项目详情
   */
  static async getProjectById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const project = await ProjectService.getProjectById(id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      // 获取项目相关的任务
      const tasks = await taskService.getTasksByProject(id);

      return res.json({
        success: true,
        data: {
          ...project,
          tasks
        }
      });
    } catch (error) {
      console.error('获取项目详情失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取项目详情失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 创建项目
   */
  static async createProject(req: Request, res: Response) {
    try {
      const { project: projectData, services: servicesData } = req.body;
      console.log('🔍 项目创建请求 - 用户信息:', (req as any).user);
      const createdBy = (req as any).user?.userId || 'system';
      console.log('🔍 项目创建请求 - createdBy:', createdBy);

      // 创建项目
      const project = await ProjectService.createProject({
        ...projectData,
        createdBy
      });

      // 创建任务
      if (servicesData && servicesData.length > 0) {
        const tasks = await Promise.all(
          servicesData.map(async (service: any) => {
            return await taskService.createTask({
              taskName: service.serviceName,
              projectId: project._id?.toString() || '',
              serviceId: service.serviceId,
              quantity: service.quantity,
              unit: service.unit,
              subtotal: service.subtotal,
              pricingPolicies: service.pricingPolicies?.map((policyId: string) => ({
                policyId,
                policyName: service.pricingPolicyNames || '未知政策',
                policyType: 'uniform_discount',
                discountRatio: 100,
                calculationDetails: '标准定价'
              })) || [],
              billingDescription: service.billingDescription || `${service.serviceName} - ${service.quantity}${service.unit}`,
              status: 'pending',
              priority: 'medium',
              mainDesigners: [],
              assistantDesigners: [],
              settlementStatus: 'unpaid',
              progress: 0
            });
          })
        );

        // 更新项目的 taskIds
        const taskIds = tasks.map((task: any) => task._id?.toString() || task._id).filter(Boolean);
        if (taskIds.length > 0) {
          await ProjectService.updateProject(project._id?.toString() || '', {
            taskIds,
            updatedBy: (req as any).user?.userId || 'system'
          });
        }

        // 重新获取更新后的项目
        const updatedProject = await ProjectService.getProjectById(project._id?.toString() || '');

        return res.status(201).json({
          success: true,
          message: '项目创建成功',
          data: {
            project: updatedProject || project,
            tasks
          }
        });
      } else {
        return res.status(201).json({
          success: true,
          message: '项目创建成功',
          data: {
            project,
            tasks: []
          }
        });
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      return res.status(500).json({
        success: false,
        message: '创建项目失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 更新项目
   */
  static async updateProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req as any).user?.id || 'system';

      const project = await ProjectService.updateProject(id, {
        ...updateData,
        updatedBy
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      return res.json({
        success: true,
        message: '项目更新成功',
        data: project
      });
    } catch (error) {
      console.error('更新项目失败:', error);
      return res.status(500).json({
        success: false,
        message: '更新项目失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 删除项目
   */
  static async deleteProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedBy = (req as any).user?.id || 'system';

      await ProjectService.deleteProject(id, deletedBy);

      return res.json({
        success: true,
        message: '项目删除成功'
      });
    } catch (error) {
      console.error('删除项目失败:', error);
      return res.status(500).json({
        success: false,
        message: '删除项目失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 更新项目状态
   */
  static async updateProjectStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedBy = (req as any).user?.id || 'system';

      const project = await ProjectService.updateProjectStatus(id, status, updatedBy);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      return res.json({
        success: true,
        message: '项目状态更新成功',
        data: project
      });
    } catch (error) {
      console.error('更新项目状态失败:', error);
      return res.status(500).json({
        success: false,
        message: '更新项目状态失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 更新结算状态
   */
  static async updateSettlementStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedBy = (req as any).user?.id || 'system';

      const project = await ProjectService.updateSettlementStatus(id, status, updatedBy);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      return res.json({
        success: true,
        message: '结算状态更新成功',
        data: project
      });
    } catch (error) {
      console.error('更新结算状态失败:', error);
      return res.status(500).json({
        success: false,
        message: '更新结算状态失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 获取项目统计信息
   */
  static async getProjectStats(req: Request, res: Response) {
    try {
      const stats = await ProjectService.getProjectStats();

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取项目统计失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取项目统计失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 获取项目日志
   */
  static async getProjectLogs(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;

      const result = await ProjectService.getProjectLogs(
        id,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 20
      );

      return res.json({
        success: true,
        data: result.logs,
        total: result.total,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20
      });
    } catch (error) {
      console.error('获取项目日志失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取项目日志失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 添加客户嘱托
   */
  static async addClientRequirement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: '客户嘱托内容不能为空'
        });
      }

      const project = await ProjectService.addClientRequirement(id, content.trim());

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      return res.json({
        success: true,
        message: '客户嘱托添加成功',
        data: project
      });
    } catch (error) {
      console.error('添加客户嘱托失败:', error);
      return res.status(500).json({
        success: false,
        message: '添加客户嘱托失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 更新客户嘱托（按索引）
   */
  static async updateClientRequirement(req: Request, res: Response) {
    try {
      const { id, index } = req.params;
      const indexNum = parseInt(index);
      const { content } = req.body;

      if (isNaN(indexNum) || indexNum < 0) {
        return res.status(400).json({ success: false, message: '无效的索引' });
      }
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: '客户嘱托内容不能为空' });
      }

      const project = await ProjectService.updateClientRequirement(id, indexNum, content.trim());
      if (!project) {
        return res.status(404).json({ success: false, message: '项目不存在或索引超出范围' });
      }

      return res.json({ success: true, message: '客户嘱托更新成功', data: project });
    } catch (error) {
      console.error('更新客户嘱托失败:', error);
      return res.status(500).json({ success: false, message: '更新客户嘱托失败', error: error instanceof Error ? error.message : '未知错误' });
    }
  }

  /**
   * 删除客户嘱托
   */
  static async deleteClientRequirement(req: Request, res: Response) {
    try {
      const { id, index } = req.params;
      const indexNum = parseInt(index);

      if (isNaN(indexNum) || indexNum < 0) {
        return res.status(400).json({
          success: false,
          message: '无效的索引'
        });
      }

      const project = await ProjectService.deleteClientRequirement(id, indexNum);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在或索引超出范围'
        });
      }

      return res.json({
        success: true,
        message: '客户嘱托删除成功',
        data: project
      });
    } catch (error) {
      console.error('删除客户嘱托失败:', error);
      return res.status(500).json({
        success: false,
        message: '删除客户嘱托失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 添加备注
   */
  static async addRemark(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: '备注内容不能为空'
        });
      }

      const project = await ProjectService.addRemark(id, content.trim());

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      return res.json({
        success: true,
        message: '备注添加成功',
        data: project
      });
    } catch (error) {
      console.error('添加备注失败:', error);
      return res.status(500).json({
        success: false,
        message: '添加备注失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 更新备注（按索引）
   */
  static async updateRemark(req: Request, res: Response) {
    try {
      const { id, index } = req.params;
      const indexNum = parseInt(index);
      const { content } = req.body;

      if (isNaN(indexNum) || indexNum < 0) {
        return res.status(400).json({ success: false, message: '无效的索引' });
      }
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: '备注内容不能为空' });
      }

      const project = await ProjectService.updateRemark(id, indexNum, content.trim());
      if (!project) {
        return res.status(404).json({ success: false, message: '项目不存在或索引超出范围' });
      }

      return res.json({ success: true, message: '备注更新成功', data: project });
    } catch (error) {
      console.error('更新备注失败:', error);
      return res.status(500).json({ success: false, message: '更新备注失败', error: error instanceof Error ? error.message : '未知错误' });
    }
  }

  /**
   * 删除备注
   */
  static async deleteRemark(req: Request, res: Response) {
    try {
      const { id, index } = req.params;
      const indexNum = parseInt(index);

      if (isNaN(indexNum) || indexNum < 0) {
        return res.status(400).json({
          success: false,
          message: '无效的索引'
        });
      }

      const project = await ProjectService.deleteRemark(id, indexNum);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在或索引超出范围'
        });
      }

      return res.json({
        success: true,
        message: '备注删除成功',
        data: project
      });
    } catch (error) {
      console.error('删除备注失败:', error);
      return res.status(500).json({
        success: false,
        message: '删除备注失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
}

export default ProjectController;