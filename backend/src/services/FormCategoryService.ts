import FormCategory, { IFormCategory } from '../models/FormCategory'

export interface CreateFormCategoryData {
    name: string
    description?: string
    color: string
    isActive?: boolean
}

export interface UpdateFormCategoryData {
    name?: string
    description?: string
    color?: string
    isActive?: boolean
}

export interface FormCategoryQuery {
    search?: string
    isActive?: boolean
    page?: number
    limit?: number
}

export interface FormCategoryListResponse {
    categories: IFormCategory[]
    total: number
    page: number
    limit: number
    totalPages: number
}

class FormCategoryService {
    // 创建表单分类
    async createCategory(data: CreateFormCategoryData): Promise<IFormCategory> {
        const category = new FormCategory({
            ...data,
            formCount: 0
        })
        return await category.save()
    }

    // 获取表单分类列表
    async getCategories(query: FormCategoryQuery = {}): Promise<FormCategoryListResponse> {
        const { search, isActive, page = 1, limit = 10 } = query
        const skip = (page - 1) * limit

        // 构建查询条件
        const filter: any = {}
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        }
        if (isActive !== undefined) {
            filter.isActive = isActive
        }

        // 执行查询
        const [categories, total] = await Promise.all([
            FormCategory.find(filter)
                .sort({ createTime: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            FormCategory.countDocuments(filter)
        ])

        return {
            categories,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    // 获取所有启用的分类（用于下拉选择）
    async getActiveCategories(): Promise<IFormCategory[]> {
        return await FormCategory.find({ isActive: true })
            .sort({ name: 1 })
            .lean()
    }

    // 根据ID获取表单分类
    async getCategoryById(id: string): Promise<IFormCategory | null> {
        return await FormCategory.findById(id).lean()
    }

    // 更新表单分类
    async updateCategory(id: string, data: UpdateFormCategoryData): Promise<IFormCategory | null> {
        return await FormCategory.findByIdAndUpdate(
            id,
            { ...data, updateTime: new Date() },
            { new: true }
        )
    }

    // 删除表单分类
    async deleteCategory(id: string): Promise<boolean> {
        const category = await FormCategory.findById(id)
        if (!category) {
            return false
        }

        // 检查是否有关联的表单
        if (category.formCount > 0) {
            throw new Error('该分类下还有表单，无法删除')
        }

        const result = await FormCategory.findByIdAndDelete(id)
        return !!result
    }

    // 切换分类状态
    async toggleCategoryStatus(id: string): Promise<IFormCategory | null> {
        const category = await FormCategory.findById(id)
        if (!category) {
            return null
        }

        category.isActive = !category.isActive
        category.updateTime = new Date()
        return await category.save()
    }

    // 增加表单数量
    async incrementFormCount(id: string): Promise<void> {
        await FormCategory.findByIdAndUpdate(id, {
            $inc: { formCount: 1 },
            updateTime: new Date()
        })
    }

    // 减少表单数量
    async decrementFormCount(id: string): Promise<void> {
        await FormCategory.findByIdAndUpdate(id, {
            $inc: { formCount: -1 },
            updateTime: new Date()
        })
    }

    // 检查分类名称是否已存在
    async isNameExists(name: string, excludeId?: string): Promise<boolean> {
        const filter: any = { name }
        if (excludeId) {
            filter._id = { $ne: excludeId }
        }
        const count = await FormCategory.countDocuments(filter)
        return count > 0
    }

    // 获取分类统计信息
    async getCategoryStats() {
        const [total, active, totalForms] = await Promise.all([
            FormCategory.countDocuments(),
            FormCategory.countDocuments({ isActive: true }),
            FormCategory.aggregate([
                { $group: { _id: null, total: { $sum: '$formCount' } } }
            ])
        ])

        return {
            total,
            active,
            totalForms: totalForms[0]?.total || 0
        }
    }
}

export default new FormCategoryService() 