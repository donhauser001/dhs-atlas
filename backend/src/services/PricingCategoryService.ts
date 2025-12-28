import { PricingCategory, IPricingCategory, CreatePricingCategoryRequest, UpdatePricingCategoryRequest } from '../models/PricingCategory'

export class PricingCategoryService {
    // 获取所有分类
    static async getCategories(): Promise<PricingCategory[]> {
        try {
            const categories = await PricingCategory.find().sort({ createTime: -1 })
            return categories.map(category => ({
                _id: category._id?.toString() || '',
                name: category.name,
                description: category.description,
                status: category.status,
                serviceCount: category.serviceCount,
                createTime: category.createTime.toLocaleDateString('zh-CN'),
                updateTime: category.updateTime.toLocaleDateString('zh-CN')
            }))
        } catch (error) {
            throw new Error('获取定价分类列表失败')
        }
    }

    // 根据ID获取分类
    static async getCategoryById(id: string): Promise<PricingCategory | null> {
        try {
            const category = await PricingCategory.findById(id)
            if (!category) return null

            return {
                _id: category._id?.toString() || '',
                name: category.name,
                description: category.description,
                status: category.status,
                serviceCount: category.serviceCount,
                createTime: category.createTime.toLocaleDateString('zh-CN'),
                updateTime: category.updateTime.toLocaleDateString('zh-CN')
            }
        } catch (error) {
            throw new Error('获取定价分类详情失败')
        }
    }

    // 创建分类
    static async createCategory(data: CreatePricingCategoryRequest): Promise<PricingCategory> {
        try {
            // 检查分类名称是否已存在
            const existingCategory = await PricingCategory.findOne({ name: data.name })
            if (existingCategory) {
                throw new Error('分类名称已存在')
            }

            const category = new PricingCategory({
                name: data.name,
                description: data.description || '',
                status: data.status || 'active',
                serviceCount: 0
            })

            const savedCategory = await category.save()
            return {
                _id: savedCategory._id?.toString() || '',
                name: savedCategory.name,
                description: savedCategory.description,
                status: savedCategory.status,
                serviceCount: savedCategory.serviceCount,
                createTime: savedCategory.createTime.toLocaleDateString('zh-CN'),
                updateTime: savedCategory.updateTime.toLocaleDateString('zh-CN')
            }
        } catch (error) {
            if (error instanceof Error) {
                throw error
            }
            throw new Error('创建定价分类失败')
        }
    }

    // 更新分类
    static async updateCategory(id: string, data: UpdatePricingCategoryRequest): Promise<PricingCategory | null> {
        try {
            // 检查分类是否存在
            const existingCategory = await PricingCategory.findById(id)
            if (!existingCategory) {
                return null
            }

            // 如果要更新名称，检查新名称是否已存在
            if (data.name && data.name !== existingCategory.name) {
                const duplicateCategory = await PricingCategory.findOne({ name: data.name })
                if (duplicateCategory) {
                    throw new Error('分类名称已存在')
                }
            }

            const updatedCategory = await PricingCategory.findByIdAndUpdate(
                id,
                data,
                { new: true, runValidators: true }
            )

            if (!updatedCategory) return null

            return {
                _id: updatedCategory._id?.toString() || '',
                name: updatedCategory.name,
                description: updatedCategory.description,
                status: updatedCategory.status,
                serviceCount: updatedCategory.serviceCount,
                createTime: updatedCategory.createTime.toLocaleDateString('zh-CN'),
                updateTime: updatedCategory.updateTime.toLocaleDateString('zh-CN')
            }
        } catch (error) {
            if (error instanceof Error) {
                throw error
            }
            throw new Error('更新定价分类失败')
        }
    }

    // 删除分类
    static async deleteCategory(id: string): Promise<boolean> {
        try {
            const result = await PricingCategory.findByIdAndDelete(id)
            return !!result
        } catch (error) {
            throw new Error('删除定价分类失败')
        }
    }

    // 切换分类状态
    static async toggleCategoryStatus(id: string): Promise<PricingCategory | null> {
        try {
            const category = await PricingCategory.findById(id)
            if (!category) return null

            const newStatus = category.status === 'active' ? 'inactive' : 'active'
            const updatedCategory = await PricingCategory.findByIdAndUpdate(
                id,
                { status: newStatus },
                { new: true }
            )

            if (!updatedCategory) return null

            return {
                _id: updatedCategory._id?.toString() || '',
                name: updatedCategory.name,
                description: updatedCategory.description,
                status: updatedCategory.status,
                serviceCount: updatedCategory.serviceCount,
                createTime: updatedCategory.createTime.toLocaleDateString('zh-CN'),
                updateTime: updatedCategory.updateTime.toLocaleDateString('zh-CN')
            }
        } catch (error) {
            throw new Error('切换定价分类状态失败')
        }
    }

    // 更新服务数量
    static async updateServiceCount(id: string, count: number): Promise<void> {
        try {
            await PricingCategory.findByIdAndUpdate(id, { serviceCount: count })
        } catch (error) {
            throw new Error('更新服务数量失败')
        }
    }

    // 搜索分类
    static async searchCategories(searchTerm: string): Promise<PricingCategory[]> {
        try {
            const categories = await PricingCategory.find({
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } }
                ]
            }).sort({ createTime: -1 })

            return categories.map(category => ({
                _id: category._id?.toString() || '',
                name: category.name,
                description: category.description,
                status: category.status,
                serviceCount: category.serviceCount,
                createTime: category.createTime.toLocaleDateString('zh-CN'),
                updateTime: category.updateTime.toLocaleDateString('zh-CN')
            }))
        } catch (error) {
            throw new Error('搜索定价分类失败')
        }
    }
} 