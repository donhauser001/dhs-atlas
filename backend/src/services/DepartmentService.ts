import { Department, IDepartment, CreateDepartmentRequest, UpdateDepartmentRequest, DepartmentQuery } from '../models/Department';
import { EnterpriseService } from './EnterpriseService';

export class DepartmentService {
  private enterpriseService = new EnterpriseService();

  // 获取部门列表
  async getDepartments(query: DepartmentQuery = {}): Promise<{ departments: any[]; total: number }> {
    try {
      let filter: any = {};

      // 企业过滤
      if (query.enterpriseId) {
        filter.enterpriseId = query.enterpriseId;
      }

      // 父部门过滤
      if (query.parentId) {
        filter.parentId = query.parentId;
      }

      // 状态过滤
      if (query.status && query.status !== 'all') {
        filter.status = query.status;
      }

      // 计算总数
      const total = await Department.countDocuments(filter);

      // 构建查询
      let departmentQuery = Department.find(filter).sort({ level: 1, createTime: 1 });

      // 分页
      if (query.page && query.limit) {
        const skip = (query.page - 1) * query.limit;
        departmentQuery = departmentQuery.skip(skip).limit(query.limit);
      }

      const departments = await departmentQuery.lean();

      // 将MongoDB的_id转换为id
      const departmentsWithId = departments.map(department => ({
        ...department,
        id: department._id.toString()
      }));

      return { departments: departmentsWithId, total };
    } catch (error) {
      throw new Error('获取部门列表失败');
    }
  }

  // 根据ID获取部门
  async getDepartmentById(id: string): Promise<any | null> {
    try {
      const department = await Department.findById(id).lean();
      if (department) {
        return {
          ...department,
          id: department._id.toString()
        };
      }
      return null;
    } catch (error) {
      throw new Error('获取部门信息失败');
    }
  }

  // 创建部门
  async createDepartment(departmentData: CreateDepartmentRequest): Promise<any> {
    try {
      // 获取企业信息
      const enterprise = await this.enterpriseService.getEnterpriseById(departmentData.enterpriseId);
      if (!enterprise) {
        throw new Error('企业不存在');
      }

      // 计算部门层级
      let level = 1;
      if (departmentData.parentId) {
        const parentDepartment = await this.getDepartmentById(departmentData.parentId);
        if (!parentDepartment) {
          throw new Error('父部门不存在');
        }
        level = parentDepartment.level + 1;
      }

      const newDepartment = new Department({
        ...departmentData,
        enterpriseName: enterprise.enterpriseName,
        level,
        employeeCount: 0,
        createTime: new Date().toLocaleString()
      });

      const savedDepartment = await newDepartment.save();
      return {
        ...savedDepartment.toObject(),
        id: (savedDepartment._id as any).toString()
      };
    } catch (error) {
      throw new Error('创建部门失败');
    }
  }

  // 更新部门
  async updateDepartment(id: string, departmentData: UpdateDepartmentRequest): Promise<any | null> {
    try {
      // 如果更新企业ID，需要验证企业是否存在
      if (departmentData.enterpriseId) {
        const enterprise = await this.enterpriseService.getEnterpriseById(departmentData.enterpriseId);
        if (!enterprise) {
          throw new Error('企业不存在');
        }
        departmentData.enterpriseName = enterprise.enterpriseName;
      }

      // 如果更新父部门，需要重新计算层级
      if (departmentData.parentId) {
        const parentDepartment = await this.getDepartmentById(departmentData.parentId);
        if (!parentDepartment) {
          throw new Error('父部门不存在');
        }
        // 检查是否形成循环引用
        if (parentDepartment.id === id) {
          throw new Error('不能将自己设为父部门');
        }
        // 检查父部门是否为自己的子部门
        const isChild = await this.isChildDepartment(id, departmentData.parentId);
        if (isChild) {
          throw new Error('不能将子部门设为父部门');
        }
      }

      const updatedDepartment = await Department.findByIdAndUpdate(
        id,
        departmentData,
        { new: true, runValidators: true }
      ).lean();

      if (updatedDepartment) {
        return {
          ...updatedDepartment,
          id: (updatedDepartment._id as any).toString()
        };
      }
      return null;
    } catch (error) {
      throw new Error('更新部门失败');
    }
  }

  // 删除部门
  async deleteDepartment(id: string): Promise<boolean> {
    try {
      // 检查是否有子部门
      const childDepartments = await Department.find({ parentId: id });
      if (childDepartments.length > 0) {
        throw new Error('该部门下还有子部门，无法删除');
      }

      // 检查是否有员工
      const department = await Department.findById(id);
      if (department && department.employeeCount > 0) {
        throw new Error('该部门下还有员工，无法删除');
      }

      const result = await Department.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error('删除部门失败');
    }
  }

  // 获取父部门选项
  async getParentDepartmentOptions(enterpriseId: string): Promise<{ label: string; value: string }[]> {
    try {
      const departments = await Department.find({
        enterpriseId,
        status: 'active'
      }).sort({ level: 1, name: 1 }).lean();

      return departments.map(dept => ({
        label: dept.name,
        value: dept._id.toString()
      }));
    } catch (error) {
      throw new Error('获取父部门选项失败');
    }
  }

  // 更新员工数量
  async updateEmployeeCount(departmentId: string, count: number): Promise<boolean> {
    try {
      await Department.findByIdAndUpdate(departmentId, { employeeCount: count });
      return true;
    } catch (error) {
      throw new Error('更新员工数量失败');
    }
  }

  // 切换部门状态
  async toggleDepartmentStatus(id: string): Promise<any | null> {
    try {
      const department = await Department.findById(id);
      if (!department) {
        return null;
      }

      department.status = department.status === 'active' ? 'inactive' : 'active';
      const updatedDepartment = await department.save();

      return {
        ...updatedDepartment.toObject(),
        id: (updatedDepartment._id as any).toString()
      };
    } catch (error) {
      throw new Error('切换部门状态失败');
    }
  }

  // 检查是否为子部门
  private async isChildDepartment(departmentId: string, parentId: string): Promise<boolean> {
    try {
      const parent = await Department.findById(parentId);
      if (!parent) {
        return false;
      }

      if (parent.parentId === departmentId) {
        return true;
      }

      if (parent.parentId) {
        return await this.isChildDepartment(departmentId, parent.parentId);
      }

      return false;
    } catch (error) {
      return false;
    }
  }
} 