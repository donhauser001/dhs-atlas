import { Request, Response } from 'express';
import ContractTemplate from '../models/ContractTemplate';
import { extractPlaceholdersFromText } from '../utils/contractUtils';

class ContractTemplateController {
    // 获取模板列表
    static async getTemplates(req: Request, res: Response) {
        try {
            const {
                page = 1,
                limit = 10,
                category,
                status,
                search,
                sortBy = 'createTime',
                sortOrder = 'desc'
            } = req.query;

            // 构建查询条件
            const query: any = {};

            if (category && category !== 'all') {
                query.category = category;
            }

            if (status && status !== 'all') {
                query.status = status;
            }

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

            const [templates, total] = await Promise.all([
                ContractTemplate.find(query)
                    .populate('category', 'name color isDefault')
                    .populate('associatedForm', 'name description')
                    .sort(sort)
                    .skip(skip)
                    .limit(Number(limit))
                    .select('-content'), // 列表不返回内容字段
                ContractTemplate.countDocuments(query)
            ]);

            res.json({
                success: true,
                data: templates,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            console.error('获取模板列表失败:', error);
            res.status(500).json({
                success: false,
                message: '获取模板列表失败'
            });
        }
    }

    // 根据ID获取模板
    static async getTemplateById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const template = await ContractTemplate.findById(id)
                .populate('category', 'name color isDefault')
                .populate('associatedForm', 'name description');

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: '模板不存在'
                });
            }

            return res.json({
                success: true,
                data: template
            });
        } catch (error) {
            console.error('获取模板失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取模板失败'
            });
        }
    }

    // 创建模板
    static async createTemplate(req: Request, res: Response) {
        try {
            const {
                name,
                contractTitle,
                description,
                category,
                content,
                associatedForm,
                bindingConfigs,
                placeholderMode,
                usedPlaceholders,
                status = 'draft',
                tags = []
            } = req.body;

            // 验证必填字段
            if (!name || !category) {
                return res.status(400).json({
                    success: false,
                    message: '模板名称和类型都是必填的'
                });
            }

            // 自动提取占位符
            const placeholders = content ? extractPlaceholdersFromText(content) : [];

            // 获取创建者信息
            const createdBy = (req as any).user?.userId || 'system';

            // 创建模板
            const template = new ContractTemplate({
                name,
                contractTitle,
                description,
                category,
                content: content || '',
                placeholders,
                associatedForm: associatedForm || undefined,
                bindingConfigs: bindingConfigs || {},
                placeholderMode: placeholderMode || 'preset',
                usedPlaceholders: usedPlaceholders || [],
                status,
                tags,
                createdBy
            });

            await template.save();

            return res.status(201).json({
                success: true,
                data: template,
                message: '模板创建成功'
            });
        } catch (error) {
            console.error('创建模板失败:', error);
            return res.status(500).json({
                success: false,
                message: '创建模板失败'
            });
        }
    }

    // 更新模板
    static async updateTemplate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                name,
                contractTitle,
                description,
                category,
                content,
                associatedForm,
                bindingConfigs,
                placeholderMode,
                usedPlaceholders,
                status,
                tags
            } = req.body;

            const template = await ContractTemplate.findById(id);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: '模板不存在'
                });
            }

            // 如果内容有变化，重新提取占位符
            let placeholders = template.placeholders;
            if (content !== undefined && content !== template.content) {
                placeholders = extractPlaceholdersFromText(content);
            }

            // 更新字段
            const updateData: any = {
                updateTime: new Date()
            };

            if (name !== undefined) updateData.name = name;
            if (contractTitle !== undefined) updateData.contractTitle = contractTitle;
            if (description !== undefined) updateData.description = description;
            if (category !== undefined) updateData.category = category;
            if (content !== undefined) {
                updateData.content = content;
                updateData.placeholders = placeholders;
            }
            if (associatedForm !== undefined) updateData.associatedForm = associatedForm || null;
            if (bindingConfigs !== undefined) updateData.bindingConfigs = bindingConfigs;
            if (placeholderMode !== undefined) updateData.placeholderMode = placeholderMode;
            if (usedPlaceholders !== undefined) updateData.usedPlaceholders = usedPlaceholders;
            if (status !== undefined) updateData.status = status;
            if (tags !== undefined) updateData.tags = tags;

            const updatedTemplate = await ContractTemplate.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            ).populate('category', 'name color isDefault')
                .populate('associatedForm', 'name description');

            return res.json({
                success: true,
                data: updatedTemplate,
                message: '模板更新成功'
            });
        } catch (error) {
            console.error('更新模板失败:', error);
            return res.status(500).json({
                success: false,
                message: '更新模板失败'
            });
        }
    }

    // 删除模板
    static async deleteTemplate(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const template = await ContractTemplate.findById(id);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: '模板不存在'
                });
            }

            await ContractTemplate.findByIdAndDelete(id);

            return res.json({
                success: true,
                message: '模板删除成功'
            });
        } catch (error) {
            console.error('删除模板失败:', error);
            return res.status(500).json({
                success: false,
                message: '删除模板失败'
            });
        }
    }

    // 复制模板
    static async cloneTemplate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name } = req.body;

            const originalTemplate = await ContractTemplate.findById(id);

            if (!originalTemplate) {
                return res.status(404).json({
                    success: false,
                    message: '原模板不存在'
                });
            }

            // 创建副本
            const clonedTemplate = new ContractTemplate({
                name: name || `${originalTemplate.name} - 副本`,
                contractTitle: originalTemplate.contractTitle,
                description: originalTemplate.description,
                category: originalTemplate.category,
                content: originalTemplate.content,
                placeholders: originalTemplate.placeholders,
                bindingConfigs: originalTemplate.bindingConfigs,
                placeholderMode: originalTemplate.placeholderMode,
                usedPlaceholders: originalTemplate.usedPlaceholders,
                status: 'draft',
                tags: originalTemplate.tags,
                createdBy: (req as any).user?.userId || 'system'
            });

            await clonedTemplate.save();

            return res.status(201).json({
                success: true,
                data: clonedTemplate,
                message: '模板复制成功'
            });
        } catch (error) {
            console.error('复制模板失败:', error);
            return res.status(500).json({
                success: false,
                message: '复制模板失败'
            });
        }
    }

    // 设置默认模板
    static async setDefaultTemplate(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const template = await ContractTemplate.findById(id);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: '模板不存在'
                });
            }

            // 取消同类别的其他默认模板
            await ContractTemplate.updateMany(
                { category: template.category, isDefault: true },
                { isDefault: false }
            );

            // 设置当前模板为默认
            template.isDefault = true;
            await template.save();

            return res.json({
                success: true,
                message: '默认模板设置成功'
            });
        } catch (error) {
            console.error('设置默认模板失败:', error);
            return res.status(500).json({
                success: false,
                message: '设置默认模板失败'
            });
        }
    }

    // 获取模板统计
    static async getTemplateStats(req: Request, res: Response) {
        try {
            const stats = await ContractTemplate.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                        archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } }
                    }
                }
            ]);

            const categoryStats = await ContractTemplate.aggregate([
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                }
            ]);

            res.json({
                success: true,
                data: {
                    overview: stats[0] || { total: 0, active: 0, archived: 0 },
                    categories: categoryStats
                }
            });
        } catch (error) {
            console.error('获取模板统计失败:', error);
            res.status(500).json({
                success: false,
                message: '获取模板统计失败'
            });
        }
    }

    // 切换模板状态
    static async toggleStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // 验证状态值
            const validStatuses = ['active', 'archived'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: '无效的状态值，只支持启用(active)和停用(archived)'
                });
            }

            const template = await ContractTemplate.findByIdAndUpdate(
                id,
                { $set: { status } },
                { new: true }
            )
                .populate('category', 'name color isDefault')
                .populate('associatedForm', 'name description');

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: '模板不存在'
                });
            }

            return res.json({
                success: true,
                message: '状态更新成功',
                data: template
            });
        } catch (error) {
            console.error('切换模板状态失败:', error);
            return res.status(500).json({
                success: false,
                message: '切换状态失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
}

export default ContractTemplateController;
