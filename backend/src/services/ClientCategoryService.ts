import ClientCategory, { IClientCategory, CreateClientCategoryRequest, UpdateClientCategoryRequest } from '../models/ClientCategory'
import Client from '../models/Client'

export class ClientCategoryService {
    static async getCategories(): Promise<any[]> {
        try {
            const categories = await ClientCategory.find().sort({ createTime: -1 })

            // 为每个分类统计客户数量
            const categoriesWithCount = await Promise.all(
                categories.map(async (category) => {
                    const clientCount = await Client.countDocuments({
                        category: category.name
                    })
                    return {
                        ...category.toObject(),
                        clientCount
                    }
                })
            )

            return categoriesWithCount
        } catch (error) {
            console.error('获取客户分类失败:', error)
            throw error
        }
    }

    static async getCategoryById(id: string): Promise<IClientCategory | null> {
        try {
            return await ClientCategory.findById(id)
        } catch (error) {
            console.error('获取客户分类失败:', error)
            throw error
        }
    }

    static async createCategory(data: CreateClientCategoryRequest): Promise<IClientCategory> {
        try {
            // 检查分类名称是否已存在
            const existingCategory = await ClientCategory.findOne({ name: data.name })
            if (existingCategory) {
                throw new Error('分类名称已存在')
            }

            const newCategory = new ClientCategory({
                ...data,
                createTime: new Date().toISOString().slice(0, 10)
            })

            return await newCategory.save()
        } catch (error) {
            console.error('创建客户分类失败:', error)
            throw error
        }
    }

    static async updateCategory(id: string, data: UpdateClientCategoryRequest): Promise<IClientCategory | null> {
        try {
            // 如果更新名称，检查是否与其他分类重复
            if (data.name) {
                const existingCategory = await ClientCategory.findOne({
                    name: data.name,
                    _id: { $ne: id }
                })
                if (existingCategory) {
                    throw new Error('分类名称已存在')
                }
            }

            const updatedCategory = await ClientCategory.findByIdAndUpdate(
                id,
                data,
                { new: true }
            )

            return updatedCategory
        } catch (error) {
            console.error('更新客户分类失败:', error)
            throw error
        }
    }

    static async deleteCategory(id: string): Promise<boolean> {
        try {
            const result = await ClientCategory.findByIdAndDelete(id)
            return !!result
        } catch (error) {
            console.error('删除客户分类失败:', error)
            throw error
        }
    }
}