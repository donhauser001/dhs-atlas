import { Request, Response } from 'express';
import { MessageTemplate, IMessageTemplate } from '../models/MessageTemplate';

export class MessageTemplateController {
    /**
     * 获取消息模板列表
     */
    async getTemplates(req: Request, res: Response) {
        try {
            const { type, enabled } = req.query;

            // 构建查询条件
            const query: any = {};
            if (type) query.type = type;
            if (enabled !== undefined) query.enabled = enabled === 'true';

            const templates = await MessageTemplate.find(query)
                .sort({ name: 1 })
                .lean();

            return res.json({
                success: true,
                data: templates
            });

        } catch (error) {
            console.error('获取消息模板列表失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取消息模板列表失败'
            });
        }
    }

    /**
     * 获取消息模板详情
     */
    async getTemplateById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const template = await MessageTemplate.findById(id);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: '消息模板不存在'
                });
            }

            return res.json({
                success: true,
                data: template
            });

        } catch (error) {
            console.error('获取消息模板详情失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取消息模板详情失败'
            });
        }
    }

    /**
     * 根据代码获取消息模板
     */
    async getTemplateByCode(req: Request, res: Response) {
        try {
            const { code } = req.params;

            const template = await MessageTemplate.findOne({ code });

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: '消息模板不存在'
                });
            }

            return res.json({
                success: true,
                data: template
            });

        } catch (error) {
            console.error('获取消息模板失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取消息模板失败'
            });
        }
    }

    /**
     * 创建消息模板
     */
    async createTemplate(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            const templateData = {
                ...req.body,
                createdBy: userId
            };

            // 验证必填字段
            console.log('验证模板数据:', {
                name: templateData.name,
                titleTemplate: templateData.titleTemplate,
                contentTemplate: templateData.contentTemplate,
                businessModule: templateData.businessModule,
                triggerCondition: templateData.triggerCondition
            });

            if (!templateData.name || !templateData.titleTemplate || !templateData.contentTemplate ||
                !templateData.businessModule || !templateData.triggerCondition) {
                console.error('必填字段验证失败:', {
                    name: !!templateData.name,
                    titleTemplate: !!templateData.titleTemplate,
                    contentTemplate: !!templateData.contentTemplate,
                    businessModule: !!templateData.businessModule,
                    triggerCondition: !!templateData.triggerCondition
                });
                res.status(400).json({
                    success: false,
                    message: '模板名称、标题模板、内容模板、业务模块和触发条件为必填项'
                });
                return;
            }

            // 检查代码是否已存在
            const existingTemplate = await MessageTemplate.findOne({ code: templateData.code.toUpperCase() });
            if (existingTemplate) {
                res.status(400).json({
                    success: false,
                    message: '模板代码已存在'
                });
                return;
            }

            const template = new MessageTemplate(templateData);
            await template.save();

            return res.status(201).json({
                success: true,
                data: template,
                message: '消息模板创建成功'
            });

        } catch (error: any) {
            console.error('创建消息模板失败:', error);
            console.error('请求数据:', req.body);

            // 如果是验证错误，返回具体错误信息
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map((err: any) => err.message);
                return res.status(400).json({
                    success: false,
                    message: '数据验证失败',
                    errors: validationErrors
                });
            }
            return res.status(500).json({
                success: false,
                message: '创建消息模板失败',
                error: error.message
            });
        }
    }

    /**
     * 更新消息模板
     */
    async updateTemplate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
                return;
            }

            const template = await MessageTemplate.findById(id);

            if (!template) {
                res.status(404).json({
                    success: false,
                    message: '消息模板不存在'
                });
                return;
            }

            // 更新模板
            Object.assign(template, req.body);
            template.updatedBy = userId;
            template.version += 1;

            await template.save();

            res.json({
                success: true,
                data: template,
                message: '消息模板更新成功'
            });

        } catch (error) {
            console.error('更新消息模板失败:', error);
            res.status(500).json({
                success: false,
                message: '更新消息模板失败'
            });
        }
    }

    /**
     * 删除消息模板
     */
    async deleteTemplate(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const template = await MessageTemplate.findById(id);

            if (!template) {
                res.status(404).json({
                    success: false,
                    message: '消息模板不存在'
                });
                return;
            }

            await MessageTemplate.findByIdAndDelete(id);

            res.json({
                success: true,
                message: '消息模板删除成功'
            });

        } catch (error) {
            console.error('删除消息模板失败:', error);
            res.status(500).json({
                success: false,
                message: '删除消息模板失败'
            });
        }
    }

    /**
     * 启用/禁用消息模板
     */
    async toggleTemplate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { enabled } = req.body;

            const template = await MessageTemplate.findById(id);

            if (!template) {
                res.status(404).json({
                    success: false,
                    message: '消息模板不存在'
                });
                return;
            }

            template.enabled = enabled;
            await template.save();

            res.json({
                success: true,
                data: template,
                message: `消息模板${enabled ? '启用' : '禁用'}成功`
            });

        } catch (error) {
            console.error('切换消息模板状态失败:', error);
            res.status(500).json({
                success: false,
                message: '切换消息模板状态失败'
            });
        }
    }

    /**
     * 根据触发器获取模板
     */
    async getTemplatesByTrigger(req: Request, res: Response) {
        try {
            const { trigger } = req.params;

            const templates = await MessageTemplate.find({ trigger });

            return res.json({
                success: true,
                data: templates
            });

        } catch (error: any) {
            console.error('获取触发器模板失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取触发器模板失败'
            });
        }
    }
}
