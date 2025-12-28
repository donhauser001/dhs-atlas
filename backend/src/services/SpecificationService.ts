import { Specification, ISpecification } from '../models/Specification'

export class SpecificationService {
  /**
   * 获取规格列表
   */
  async getSpecifications(params: {
    page?: number
    limit?: number
    search?: string
    category?: string
    isDefault?: boolean
  }): Promise<{ specifications: ISpecification[], total: number }> {
    const { page = 1, limit = 50, search, category, isDefault } = params
    const skip = (page - 1) * limit

    const filter: any = {}
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    if (category) filter.category = category
    if (isDefault !== undefined) filter.isDefault = isDefault

    const [specifications, total] = await Promise.all([
      Specification.find(filter)
        .sort({ isDefault: -1, createTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Specification.countDocuments(filter)
    ])

    return { specifications, total }
  }

  /**
   * 获取规格详情
   */
  async getSpecificationById(id: string): Promise<ISpecification | null> {
    return await Specification.findById(id).lean()
  }

  /**
   * 创建规格
   */
  async createSpecification(specData: {
    name: string
    length: number
    width: number
    height?: number
    unit: string
    resolution?: string
    description?: string
    isDefault?: boolean
    category?: string
    createdBy: string
  }): Promise<ISpecification> {
    const specification = new Specification({
      ...specData,
      updatedBy: specData.createdBy
    })

    return await specification.save()
  }

  /**
   * 更新规格
   */
  async updateSpecification(id: string, updateData: {
    name?: string
    length?: number
    width?: number
    height?: number
    unit?: string
    resolution?: string
    description?: string
    isDefault?: boolean
    category?: string
    updatedBy: string
  }): Promise<ISpecification | null> {
    return await Specification.findByIdAndUpdate(
      id,
      { ...updateData, updateTime: new Date() },
      { new: true }
    )
  }

  /**
   * 删除规格
   */
  async deleteSpecification(id: string): Promise<void> {
    await Specification.findByIdAndDelete(id)
  }

  /**
   * 获取默认规格列表
   */
  async getDefaultSpecifications(): Promise<ISpecification[]> {
    return await Specification.find({ isDefault: true })
      .sort({ createTime: -1 })
      .lean()
  }

  /**
   * 设置默认规格
   */
  async setDefaultSpecification(id: string, isDefault: boolean, updatedBy: string): Promise<ISpecification | null> {
    if (isDefault) {
      // 如果设置为默认，先取消其他默认规格
      await Specification.updateMany(
        { isDefault: true },
        { isDefault: false, updatedBy, updateTime: new Date() }
      )
    }

    return await Specification.findByIdAndUpdate(
      id,
      { isDefault, updatedBy, updateTime: new Date() },
      { new: true }
    )
  }
}

export default new SpecificationService() 