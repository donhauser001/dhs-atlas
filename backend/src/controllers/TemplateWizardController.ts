import { Request, Response } from 'express';
import {
    getAllBusinessModules,
    getTriggersByModule,
    getVariablesByModule,
    getAllRecipientRules,
    BUSINESS_MODULES,
    TRIGGER_CONDITIONS,
    SEND_TARGETS,
    PRIORITY_LEVELS
} from '../config/templateWizardConfig';
import { getVariablesByCategory } from '../config/messageVariables';

/**
 * 模板向导控制器
 */
export class TemplateWizardController {
    /**
     * 获取所有业务模块
     */
    static async getBusinessModules(req: Request, res: Response): Promise<void> {
        try {
            const modules = getAllBusinessModules();
            res.json({
                success: true,
                data: modules
            });
        } catch (error) {
            console.error('获取业务模块失败:', error);
            res.status(500).json({
                success: false,
                message: '获取业务模块失败'
            });
        }
    }

    /**
     * 根据业务模块获取触发条件
     */
    static async getTriggersByModule(req: Request, res: Response): Promise<void> {
        try {
            const { moduleKey } = req.params;

            if (!BUSINESS_MODULES[moduleKey]) {
                res.status(404).json({
                    success: false,
                    message: '业务模块不存在'
                });
                return;
            }

            const triggers = getTriggersByModule(moduleKey);
            res.json({
                success: true,
                data: triggers
            });
        } catch (error) {
            console.error('获取触发条件失败:', error);
            res.status(500).json({
                success: false,
                message: '获取触发条件失败'
            });
        }
    }

    /**
     * 根据业务模块获取相关变量
     */
    static async getVariablesByModule(req: Request, res: Response): Promise<void> {
        try {
            const { moduleKey } = req.params;

            if (!BUSINESS_MODULES[moduleKey]) {
                res.status(404).json({
                    success: false,
                    message: '业务模块不存在'
                });
                return;
            }

            const variableCategories = getVariablesByModule(moduleKey);
            const variables = variableCategories.map(categoryKey =>
                getVariablesByCategory(categoryKey)
            ).filter(Boolean);

            res.json({
                success: true,
                data: variables
            });
        } catch (error) {
            console.error('获取模块变量失败:', error);
            res.status(500).json({
                success: false,
                message: '获取模块变量失败'
            });
        }
    }

    /**
     * 获取接收对象规则
     */
    static async getRecipientRules(req: Request, res: Response): Promise<void> {
        try {
            const rules = getAllRecipientRules();
            res.json({
                success: true,
                data: rules
            });
        } catch (error) {
            console.error('获取接收对象规则失败:', error);
            res.status(500).json({
                success: false,
                message: '获取接收对象规则失败'
            });
        }
    }

    /**
     * 获取发送目标配置
     */
    static async getSendTargets(req: Request, res: Response): Promise<void> {
        try {
            const targets = Object.values(SEND_TARGETS);
            res.json({
                success: true,
                data: targets
            });
        } catch (error) {
            console.error('获取发送目标失败:', error);
            res.status(500).json({
                success: false,
                message: '获取发送目标失败'
            });
        }
    }

    /**
     * 获取优先级配置
     */
    static async getPriorityLevels(req: Request, res: Response): Promise<void> {
        try {
            const priorities = Object.values(PRIORITY_LEVELS);
            res.json({
                success: true,
                data: priorities
            });
        } catch (error) {
            console.error('获取优先级配置失败:', error);
            res.status(500).json({
                success: false,
                message: '获取优先级配置失败'
            });
        }
    }

    /**
     * 获取完整的向导配置
     */
    static async getWizardConfig(req: Request, res: Response): Promise<void> {
        try {
            const config = {
                businessModules: getAllBusinessModules(),
                sendTargets: Object.values(SEND_TARGETS),
                priorityLevels: Object.values(PRIORITY_LEVELS),
                recipientRules: getAllRecipientRules()
            };

            res.json({
                success: true,
                data: config
            });
        } catch (error) {
            console.error('获取向导配置失败:', error);
            res.status(500).json({
                success: false,
                message: '获取向导配置失败'
            });
        }
    }

    /**
     * 验证模板配置
     */
    static async validateTemplateConfig(req: Request, res: Response): Promise<void> {
        try {
            const {
                businessModule,
                triggerCondition,
                messageContent,
                sendTargets,
                recipientRules,
                priority
            } = req.body;

            const errors: string[] = [];

            // 验证业务模块
            if (!businessModule || !BUSINESS_MODULES[businessModule]) {
                errors.push('请选择有效的业务模块');
            }

            // 验证触发条件
            if (!triggerCondition || !TRIGGER_CONDITIONS[triggerCondition]) {
                errors.push('请选择有效的触发条件');
            }

            // 验证消息内容
            if (!messageContent?.title || !messageContent?.content) {
                errors.push('请填写消息标题和内容');
            }

            // 验证发送目标
            if (!sendTargets || !Array.isArray(sendTargets) || sendTargets.length === 0) {
                errors.push('请选择至少一个发送目标');
            }

            // 验证接收对象
            if (!recipientRules || !Array.isArray(recipientRules) || recipientRules.length === 0) {
                errors.push('请配置接收对象规则');
            }

            // 验证优先级
            if (!priority || !PRIORITY_LEVELS[priority as keyof typeof PRIORITY_LEVELS]) {
                errors.push('请选择有效的优先级');
            }

            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: '配置验证失败',
                    errors
                });
                return;
            }

            res.json({
                success: true,
                message: '配置验证通过'
            });
        } catch (error) {
            console.error('验证模板配置失败:', error);
            res.status(500).json({
                success: false,
                message: '验证模板配置失败'
            });
        }
    }

    /**
     * 预览模板效果
     */
    static async previewTemplate(req: Request, res: Response): Promise<void> {
        try {
            const {
                messageContent,
                sampleData = {}
            } = req.body;

            if (!messageContent?.title || !messageContent?.content) {
                res.status(400).json({
                    success: false,
                    message: '请提供消息标题和内容'
                });
                return;
            }

            // 简单的变量替换预览
            let previewTitle = messageContent.title;
            let previewContent = messageContent.content;
            let previewSummary = messageContent.summary || '';

            // 替换变量（简化版本）
            Object.entries(sampleData).forEach(([key, value]) => {
                const placeholder = `{{${key}}}`;
                previewTitle = previewTitle.replace(new RegExp(placeholder, 'g'), String(value));
                previewContent = previewContent.replace(new RegExp(placeholder, 'g'), String(value));
                previewSummary = previewSummary.replace(new RegExp(placeholder, 'g'), String(value));
            });

            res.json({
                success: true,
                data: {
                    title: previewTitle,
                    content: previewContent,
                    summary: previewSummary,
                    originalData: messageContent,
                    sampleData
                }
            });
        } catch (error) {
            console.error('预览模板失败:', error);
            res.status(500).json({
                success: false,
                message: '预览模板失败'
            });
        }
    }
}

export default TemplateWizardController;
