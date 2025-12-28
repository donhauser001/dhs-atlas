import { Request, Response } from 'express';
import ContractTemplateCategory from '../models/ContractTemplateCategory';
import ContractTemplate from '../models/ContractTemplate';

class ContractTemplateCategoryController {
    // 获取分类列表
    static async getCategories(req: Request, res: Response) {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                sortBy = 'createTime',
                sortOrder = 'desc'
            } = req.query;

            // 构建查询条件
            const query: any = {};

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            // 执行查询
            const skip = (Number(page) - 1) * Number(limit);
            const sort: any = {};
            sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

            const [categories, total] = await Promise.all([
                ContractTemplateCategory.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(Number(limit)),
                ContractTemplateCategory.countDocuments(query)
            ]);

            // 获取每个分类的模板数量
            const categoriesWithCount = await Promise.all(
                categories.map(async (category) => {
                    const templateCount = await ContractTemplate.countDocuments({
                        category: category._id
                    });
                    return {
                        ...category.toObject(),
                        templateCount
                    };
                })
            );

            res.json({
                success: true,
                data: categoriesWithCount,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            console.error('获取分类列表失败:', error);
            res.status(500).json({
                success: false,
                message: '获取分类列表失败'
            });
        }
    }

    // 根据ID获取分类
    static async getCategoryById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const category = await ContractTemplateCategory.findById(id);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: '分类不存在'
                });
            }

            // 获取模板数量
            const templateCount = await ContractTemplate.countDocuments({
                category: category.name.toLowerCase().replace(/\s+/g, '')
            });

            return res.json({
                success: true,
                data: {
                    ...category.toObject(),
                    templateCount
                }
            });
        } catch (error) {
            console.error('获取分类失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取分类失败'
            });
        }
    }

    // 创建分类
    static async createCategory(req: Request, res: Response) {
        try {
            const {
                name,
                description,
                color = 'blue',
                isDefault = false
            } = req.body;

            // 验证必填字段
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: '分类名称是必填的'
                });
            }

            // 检查名称是否重复
            const existingCategory = await ContractTemplateCategory.findOne({ name });
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: '分类名称已存在'
                });
            }

            // 如果设置为默认，先取消其他默认分类
            if (isDefault) {
                await ContractTemplateCategory.updateMany(
                    { isDefault: true },
                    { isDefault: false }
                );
            }

            // 获取创建者信息
            const createdBy = (req as any).user?.userId || 'system';

            // 创建分类
            const category = new ContractTemplateCategory({
                name,
                description,
                color,
                isDefault,
                createdBy
            });

            await category.save();

            return res.status(201).json({
                success: true,
                data: {
                    ...category.toObject(),
                    templateCount: 0
                },
                message: '分类创建成功'
            });
        } catch (error) {
            console.error('创建分类失败:', error);
            return res.status(500).json({
                success: false,
                message: '创建分类失败'
            });
        }
    }

    // 更新分类
    static async updateCategory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                name,
                description,
                color,
                isDefault
            } = req.body;

            const category = await ContractTemplateCategory.findById(id);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: '分类不存在'
                });
            }

            // 检查名称是否重复（排除自己）
            if (name && name !== category.name) {
                const existingCategory = await ContractTemplateCategory.findOne({
                    name,
                    _id: { $ne: id }
                });
                if (existingCategory) {
                    return res.status(400).json({
                        success: false,
                        message: '分类名称已存在'
                    });
                }
            }

            // 如果设置为默认，先取消其他默认分类
            if (isDefault && !category.isDefault) {
                await ContractTemplateCategory.updateMany(
                    { isDefault: true, _id: { $ne: id } },
                    { isDefault: false }
                );
            }

            // 更新字段
            const updateData: any = {
                updateTime: new Date()
            };

            if (name !== undefined) updateData.name = name;
            if (description !== undefined) updateData.description = description;
            if (color !== undefined) updateData.color = color;
            if (isDefault !== undefined) updateData.isDefault = isDefault;

            const updatedCategory = await ContractTemplateCategory.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );

            // 获取模板数量
            const templateCount = await ContractTemplate.countDocuments({
                category: updatedCategory!.name.toLowerCase().replace(/\s+/g, '')
            });

            return res.json({
                success: true,
                data: {
                    ...updatedCategory!.toObject(),
                    templateCount
                },
                message: '分类更新成功'
            });
        } catch (error) {
            console.error('更新分类失败:', error);
            return res.status(500).json({
                success: false,
                message: '更新分类失败'
            });
        }
    }

    // 删除分类
    static async deleteCategory(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const category = await ContractTemplateCategory.findById(id);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: '分类不存在'
                });
            }

            // 检查是否为默认分类
            if (category.isDefault) {
                return res.status(400).json({
                    success: false,
                    message: '默认分类不能删除'
                });
            }

            // 检查是否有模板使用此分类
            const templateCount = await ContractTemplate.countDocuments({
                category: category.name.toLowerCase().replace(/\s+/g, '')
            });

            if (templateCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `该分类下还有 ${templateCount} 个模板，不能删除`
                });
            }

            await ContractTemplateCategory.findByIdAndDelete(id);

            return res.json({
                success: true,
                message: '分类删除成功'
            });
        } catch (error) {
            console.error('删除分类失败:', error);
            return res.status(500).json({
                success: false,
                message: '删除分类失败'
            });
        }
    }

    // 获取分类统计
    static async getCategoryStats(req: Request, res: Response) {
        try {
            const stats = await ContractTemplateCategory.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        defaultCount: { $sum: { $cond: [{ $eq: ['$isDefault', true] }, 1, 0] } }
                    }
                }
            ]);

            res.json({
                success: true,
                data: {
                    overview: stats[0] || { total: 0, defaultCount: 0 }
                }
            });
        } catch (error) {
            console.error('获取分类统计失败:', error);
            res.status(500).json({
                success: false,
                message: '获取分类统计失败'
            });
        }
    }
}

export default ContractTemplateCategoryController;
