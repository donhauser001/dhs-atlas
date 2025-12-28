import express from 'express'
import FormController from '../controllers/FormController'
import FormData from '../models/FormData'
import { authenticateToken, optionalAuth } from '../middleware/auth'
import formService from '../services/FormService'
import FormNotificationService from '../services/FormNotificationService'

console.log('📋 Forms 路由文件被加载');
const router = express.Router()

// 获取表单列表
router.get('/', FormController.getForms)

// 根据ID获取表单
router.get('/:id', FormController.getFormById)

// 创建表单
router.post('/', FormController.createForm)

// 更新表单
router.put('/:id', FormController.updateForm)

// 删除表单
router.delete('/:id', FormController.deleteForm)

// 切换表单状态
router.patch('/:id/toggle-status', FormController.toggleFormStatus)

// 测试路由
router.get('/:id/test', (req, res) => {
    console.log('🧪 测试路由被调用，表单ID:', req.params.id);
    res.json({ success: true, message: '测试成功', id: req.params.id });
});

// 提交表单数据 (支持可选认证)
router.post('/:id/submit', optionalAuth, async (req, res) => {
    console.log('=== 表单提交开始 ===');
    try {
        console.log('🚀 表单提交路由被调用，表单ID:', req.params.id);
        const { id } = req.params
        const { submissionData, formName, submitterName } = req.body

        if (!submissionData) {
            return res.status(400).json({
                success: false,
                message: '表单数据不能为空'
            })
        }

        // 获取表单信息
        const form = await formService.getFormById(id)
        if (!form) {
            return res.status(404).json({
                success: false,
                message: '表单不存在'
            })
        }

        // 获取提交者信息
        let finalSubmitterName = submitterName;
        let submittedBy = null;

        if (req.user) {
            // 用户已登录，使用真实用户信息
            finalSubmitterName = req.user.realName || req.user.username;
            submittedBy = req.user.userId;
        } else if (!finalSubmitterName) {
            // 用户未登录且未提供姓名，使用默认值
            finalSubmitterName = '匿名用户';
        }

        const formData = new FormData({
            formId: id,
            formName: formName || form.name || '未命名表单',
            submissionData,
            submitterName: finalSubmitterName,
            submittedBy: submittedBy
        })

        await formData.save()

        // 检查是否需要创建项目
        let createdProject = null;
        console.log('🔍 检查项目创建设置:', {
            hasSettings: !!form.settings,
            hasProject: !!form.settings?.project,
            enableProjectCreation: form.settings?.project?.enableProjectCreation,
            fullProjectSettings: form.settings?.project
        });

        if (form.settings?.project?.enableProjectCreation) {
            try {
                const { ProjectMappingService } = await import('../services/ProjectMappingService');
                const { ProjectService } = await import('../services/ProjectService');

                // 映射表单数据到项目数据
                const projectData = await ProjectMappingService.mapFormDataToProject(
                    form,
                    submissionData,
                    req.user as any
                );

                if (projectData) {
                    // 验证项目数据
                    const validationErrors = ProjectMappingService.validateProjectData(projectData);
                    if (validationErrors.length > 0) {
                        console.warn('项目数据验证失败，跳过项目创建:', validationErrors);
                    } else {
                        // 创建项目
                        const projectService = new ProjectService();

                        // 将任务列表数据映射为任务格式
                        const tasks = projectData.taskList ? mapTasksFromOrderData(projectData.taskList) : [];

                        createdProject = await projectService.createProject({
                            ...projectData,
                            undertakingTeam: 'default', // 使用默认团队，后续可配置
                            mainDesigners: [], // 暂时为空，后续可配置
                            assistantDesigners: [], // 暂时为空，后续可配置
                            createdBy: submittedBy || 'system',
                            tasks
                        });

                        console.log('自动创建项目成功:', createdProject.projectName);
                    }
                }
            } catch (projectError) {
                console.error('自动创建项目失败:', projectError);
                // 项目创建失败不影响表单提交成功
            }
        }

        // 检查是否需要创建文章
        let createdArticle = null;
        console.log('🔍 检查文章创建设置:', {
            hasSettings: !!form.settings,
            hasArticle: !!form.settings?.article,
            enableArticleCreation: form.settings?.article?.enableArticleCreation,
            fullArticleSettings: form.settings?.article
        });

        if (form.settings?.article?.enableArticleCreation) {
            try {
                const { ArticleMappingService } = await import('../services/ArticleMappingService');
                const Article = (await import('../models/Article')).default;

                // 映射表单数据到文章数据
                const articleData = await ArticleMappingService.mapFormDataToArticle(
                    form,
                    submissionData,
                    req.user as any
                );

                if (articleData) {
                    // 验证文章数据
                    const validationErrors = ArticleMappingService.validateArticleData(articleData);
                    if (validationErrors.length > 0) {
                        console.warn('文章数据验证失败，跳过文章创建:', validationErrors);
                    } else {
                        // 创建文章
                        const mongoose = (await import('mongoose')).default;
                        createdArticle = new Article({
                            ...articleData,
                            category: new mongoose.Types.ObjectId(articleData.category),
                            viewCount: 0,
                            isTop: false,
                            isRecommend: false,
                            createTime: new Date(),
                            updateTime: new Date()
                        });

                        await createdArticle.save();
                        console.log('自动创建文章成功:', createdArticle.title);
                    }
                }
            } catch (articleError) {
                console.error('自动创建文章失败:', articleError);
                // 文章创建失败不影响表单提交成功
            }
        }

        // 异步发送邮件通知（不影响表单提交成功响应）
        setImmediate(async () => {
            console.log('🚨🚨🚨 setImmediate 邮件通知被执行！')
            console.log('🚨 formData ID:', formData._id)
            console.log('🚨 form name:', form.name)
            try {
                await FormNotificationService.handleFormSubmissionNotification(
                    formData,
                    form,
                    req.user as any, // 提交者信息
                    { ip: req.ip } // 请求信息
                )
            } catch (error) {
                console.error('邮件通知发送失败:', error)
            }
        })

        const response: any = {
            success: true,
            message: '表单提交成功',
            data: formData
        };

        // 如果创建了项目，在响应中包含项目信息
        if (createdProject) {
            response.project = {
                id: createdProject._id,
                name: createdProject.projectName,
                message: '已自动创建项目'
            };
        }

        // 如果创建了文章，在响应中包含文章信息
        if (createdArticle) {
            response.article = {
                id: createdArticle._id,
                title: createdArticle.title,
                status: createdArticle.status,
                message: `已自动创建文章${createdArticle.status === 'published' ? '并发布' : '(草稿状态)'}`
            };
        }

        return res.json(response)
    } catch (error) {
        console.error('表单提交失败:', error)
        return res.status(500).json({
            success: false,
            message: '表单提交失败'
        })
    }
})

// 获取表单的提交数据列表 (需要认证)
router.get('/:id/submissions', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 50

        const skip = (page - 1) * limit

        const [submissions, total] = await Promise.all([
            FormData.find({ formId: id })
                .sort({ submittedAt: -1 })
                .skip(skip)
                .limit(limit),
            FormData.countDocuments({ formId: id })
        ])

        return res.json({
            success: true,
            data: submissions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('获取提交数据失败:', error)
        return res.status(500).json({
            success: false,
            message: '获取提交数据失败'
        })
    }
})

// 测试邮件通知模板
router.post('/:id/test-notification', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params
        const { templateId, testEmail } = req.body

        if (!templateId || !testEmail) {
            return res.status(400).json({
                success: false,
                message: '模板ID和测试邮箱都是必填的'
            })
        }

        await FormNotificationService.testNotificationTemplate(templateId, id, testEmail)

        return res.json({
            success: true,
            message: '测试邮件发送成功'
        })
    } catch (error) {
        console.error('测试邮件发送失败:', error)
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '测试邮件发送失败'
        })
    }
})

// 辅助函数：将订单数据映射为任务数据
function mapTasksFromOrderData(orderData: any[]): any[] {
    if (!Array.isArray(orderData)) {
        return [];
    }

    return orderData.map((item: any) => ({
        taskName: item.serviceName || item['服务名称'] || '未知任务',
        serviceId: item.serviceId || 'unknown',
        assignedDesigners: [],
        quantity: item.quantity || item['数量'] || 1,
        unit: item.unit || item['单位'] || '项',
        subtotal: item.subtotal || item['小计'] || 0,
        billingDescription: item.billingDescription || `${item.serviceName || '服务'} - ${item.quantity || 1}${item.unit || '项'}`,
        priority: 'medium' as const,
        remarks: item.remarks || ''
    }));
}

export default router