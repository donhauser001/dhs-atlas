import EmailSettingService from './EmailSettingService'
import formService from './FormService'
import { IForm } from '../models/Form'
import { IFormData } from '../models/FormData'
import { NotificationTemplate } from '../models/Form'

// 导入模块化组件
import { PlaceholderData } from './FormNotification/types'
import { PlaceholderBuilder } from './FormNotification/formatters/PlaceholderBuilder'
import { HtmlGenerator } from './FormNotification/generators/HtmlGenerator'
import { AttachmentHandler } from './FormNotification/utils/AttachmentHandler'
import { RecipientManager } from './FormNotification/utils/RecipientManager'
import { replacePlaceholders } from './FormNotification/utils'

/**
 * 表单通知服务 - 重构后的主服务类
 */
class FormNotificationService {

    /**
     * 处理表单提交时的邮件通知
     */
    async handleFormSubmissionNotification(
        formData: IFormData,
        form: IForm,
        submitterInfo?: any,
        requestInfo?: any
    ): Promise<void> {
        console.log('🚨🚨🚨 FormNotificationService.handleFormSubmissionNotification 被调用!');
        console.log('🚨 formData._id:', formData._id);
        console.log('🚨 form.name:', form.name);
        try {
            // 检查表单是否配置了通知模板
            const notificationTemplates = form.settings?.notification?.templates
            if (!notificationTemplates || notificationTemplates.length === 0) {
                console.log('表单未配置通知模板，跳过邮件发送')
                return
            }

            // 过滤出启用的且包含'submit'触发条件的模板
            const submitTemplates = notificationTemplates.filter(
                template => template.enabled && template.triggers.includes('submit')
            )

            if (submitTemplates.length === 0) {
                console.log('没有启用的提交通知模板，跳过邮件发送')
                return
            }

            // 构建占位符数据
            const placeholderData = PlaceholderBuilder.buildPlaceholderData(formData, form, submitterInfo, requestInfo)

            // 发送每个模板的邮件
            for (const template of submitTemplates) {
                try {
                    await this.sendTemplateEmail(template, placeholderData, form, submitterInfo, formData)
                    console.log(`表单 ${form.name} 的通知模板 ${template.name} 发送成功`)
                } catch (error) {
                    console.error(`表单 ${form.name} 的通知模板 ${template.name} 发送失败:`, error)
                    // 继续发送其他模板，不因为一个模板失败而停止
                }
            }

        } catch (error) {
            console.error('表单通知发送失败:', error)
            // 邮件发送失败不应该影响表单提交成功
        }
    }

    /**
     * 发送模板邮件
     */
    private async sendTemplateEmail(
        template: NotificationTemplate,
        placeholderData: PlaceholderData,
        form: IForm,
        submitterInfo?: any,
        formData?: IFormData
    ): Promise<void> {
        try {
            // 替换主题中的占位符
            const subject = replacePlaceholders(template.subject, placeholderData)

            // 替换内容中的占位符
            const rawContent = replacePlaceholders(template.content, placeholderData)

            // 包装邮件内容到1200px容器中
            const content = HtmlGenerator.wrapEmailContent(rawContent)

            // 确定收件人邮箱
            const recipients = await RecipientManager.getRecipients(template, submitterInfo)

            if (recipients.length === 0) {
                console.warn(`模板 ${template.name} 没有有效的收件人邮箱`)
                return
            }

            // 处理邮件附件 - 从原始表单数据中提取
            const attachments = await AttachmentHandler.prepareEmailAttachments(placeholderData, form, formData)

            // 发送邮件给每个收件人
            for (const recipient of recipients) {
                await EmailSettingService.sendEmail(recipient, subject, content, true, attachments)
                console.log(`邮件发送成功: ${template.name} -> ${recipient}${attachments.length > 0 ? ` (${attachments.length}个附件)` : ''}`)
            }

        } catch (error) {
            console.error(`模板 ${template.name} 邮件发送失败:`, error)
            throw error
        }
    }

    /**
     * 测试发送通知模板
     */
    async testNotificationTemplate(
        templateId: string,
        formId: string,
        testEmail: string
    ): Promise<void> {
        try {
            const form = await formService.getFormById(formId)
            if (!form) {
                throw new Error('表单不存在')
            }

            const template = form.settings?.notification?.templates?.find(
                t => t.id === templateId
            )
            if (!template) {
                throw new Error('通知模板不存在')
            }

            // 构建测试占位符数据
            const testPlaceholderData: PlaceholderData = {
                form_title: form.name,
                form_description: form.description || '',
                submission_id: 'TEST_SUBMISSION_ID',
                submission_date: new Date().toLocaleDateString('zh-CN'),
                submission_time: new Date().toLocaleTimeString('zh-CN'),
                submitter_name: '测试用户',
                submitter_email: testEmail,
                submitter_ip: '192.168.1.100',
                admin_email: process.env.ADMIN_EMAIL || '',
                site_title: process.env.SITE_TITLE || '表单系统',
                site_url: process.env.SITE_URL || 'http://localhost:3000',
                // 添加一些示例字段数据
                '姓名': '张三',
                '电话': '13800138000',
                '邮箱': testEmail,
                '公司': '测试公司'
            }

            // 替换占位符
            const subject = replacePlaceholders(template.subject, testPlaceholderData)
            const content = replacePlaceholders(template.content, testPlaceholderData)

            // 发送测试邮件
            await EmailSettingService.sendEmail(testEmail, `[测试] ${subject}`, content, true)

        } catch (error) {
            console.error('测试邮件发送失败:', error)
            throw error
        }
    }
}

export default new FormNotificationService()