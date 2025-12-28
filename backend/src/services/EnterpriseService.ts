import { Enterprise, IEnterprise, CreateEnterpriseRequest, UpdateEnterpriseRequest, EnterpriseQuery } from '../models/Enterprise';

export class EnterpriseService {
  // 获取企业列表
  async getEnterprises(query: EnterpriseQuery = {}): Promise<{ enterprises: any[]; total: number }> {
    try {
      let filter: any = {};

      // 搜索过滤
      if (query.search) {
        filter.$or = [
          { enterpriseName: { $regex: query.search, $options: 'i' } },
          { creditCode: { $regex: query.search, $options: 'i' } },
          { legalRepresentative: { $regex: query.search, $options: 'i' } },
          { contactPerson: { $regex: query.search, $options: 'i' } }
        ];
      }

      // 状态过滤
      if (query.status && query.status !== 'all') {
        filter.status = query.status;
      }

      // 计算总数
      const total = await Enterprise.countDocuments(filter);

      // 构建查询
      let enterpriseQuery = Enterprise.find(filter).sort({ createTime: -1 });

      // 分页
      if (query.page && query.limit) {
        const skip = (query.page - 1) * query.limit;
        enterpriseQuery = enterpriseQuery.skip(skip).limit(query.limit);
      }

      const enterprises = await enterpriseQuery.lean();

      // 将MongoDB的_id转换为id
      const enterprisesWithId = enterprises.map(enterprise => ({
        ...enterprise,
        id: enterprise._id.toString()
      }));

      return { enterprises: enterprisesWithId, total };
    } catch (error) {
      throw new Error('获取企业列表失败');
    }
  }

  // 根据ID获取企业
  async getEnterpriseById(id: string): Promise<any | null> {
    try {
      const enterprise = await Enterprise.findById(id).lean();
      if (enterprise) {
        return {
          ...enterprise,
          id: enterprise._id.toString()
        };
      }
      return null;
    } catch (error) {
      throw new Error('获取企业信息失败');
    }
  }

  // 创建企业
  async createEnterprise(enterpriseData: CreateEnterpriseRequest): Promise<any> {
    try {
      // 检查统一社会信用代码是否已存在
      const existingEnterprise = await Enterprise.findOne({ creditCode: enterpriseData.creditCode });
      if (existingEnterprise) {
        throw new Error('统一社会信用代码已存在');
      }

      const newEnterprise = new Enterprise({
        ...enterpriseData,
        createTime: new Date().toLocaleString()
      });

      const savedEnterprise = await newEnterprise.save();
      return {
        ...savedEnterprise.toObject(),
        id: (savedEnterprise._id as any).toString()
      };
    } catch (error) {
      throw new Error('创建企业失败');
    }
  }

  // 更新企业
  async updateEnterprise(id: string, enterpriseData: UpdateEnterpriseRequest): Promise<any | null> {
    try {
      // 如果更新统一社会信用代码，检查是否与其他企业冲突
      if (enterpriseData.creditCode) {
        const existingEnterprise = await Enterprise.findOne({
          creditCode: enterpriseData.creditCode,
          _id: { $ne: id }
        });
        if (existingEnterprise) {
          throw new Error('统一社会信用代码已存在');
        }
      }

      const updatedEnterprise = await Enterprise.findByIdAndUpdate(
        id,
        enterpriseData,
        { new: true, runValidators: true }
      ).lean();

      if (updatedEnterprise) {
        return {
          ...updatedEnterprise,
          id: updatedEnterprise._id.toString()
        };
      }
      return null;
    } catch (error) {
      throw new Error('更新企业失败');
    }
  }

  // 删除企业
  async deleteEnterprise(id: string): Promise<boolean> {
    try {
      const result = await Enterprise.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error('删除企业失败');
    }
  }

  // 切换企业状态
  async toggleEnterpriseStatus(id: string): Promise<any | null> {
    try {
      const enterprise = await Enterprise.findById(id);
      if (!enterprise) {
        return null;
      }

      enterprise.status = enterprise.status === 'active' ? 'inactive' : 'active';
      const updatedEnterprise = await enterprise.save();

      return {
        ...updatedEnterprise.toObject(),
        id: (updatedEnterprise._id as any).toString()
      };
    } catch (error) {
      throw new Error('切换企业状态失败');
    }
  }
} 