import { NotificationTemplate } from '../../../models/Form';
import { isValidEmail } from './index';
import EmailSettingService from '../../EmailSettingService';

/**
 * 收件人管理器 - 负责获取邮件收件人列表
 */
export class RecipientManager {
    /**
     * 获取收件人邮箱列表
     */
    static async getRecipients(template: NotificationTemplate, submitterInfo?: any): Promise<string[]> {
        const recipients: string[] = []

        switch (template.to) {
            case 'admin':
                try {
                    // 从邮件设置中获取管理员邮箱
                    const emailSetting = await EmailSettingService.getEmailSetting()
                    console.log('获取到的邮件设置:', {
                        senderEmail: emailSetting?.senderEmail,
                        replyEmail: emailSetting?.replyEmail,
                        senderName: emailSetting?.senderName
                    })
                    if (emailSetting?.senderEmail) {
                        recipients.push(emailSetting.senderEmail)
                        console.log(`使用系统配置的发件人邮箱作为管理员邮箱: ${emailSetting.senderEmail}`)
                    }
                } catch (error) {
                    console.error('获取邮件设置失败，尝试使用环境变量:', error)
                    // 备用方案：使用环境变量
                    const adminEmail = process.env.ADMIN_EMAIL
                    if (adminEmail) {
                        recipients.push(adminEmail)
                        console.log(`使用环境变量管理员邮箱: ${adminEmail}`)
                    }
                }
                break

            case 'submitter':
                const submitterEmail = submitterInfo?.email
                if (submitterEmail) {
                    recipients.push(submitterEmail)
                }
                break

            case 'custom':
                if (template.customEmails) {
                    const emails = template.customEmails
                        .split(',')
                        .map(email => email.trim())
                        .filter(email => isValidEmail(email))
                    recipients.push(...emails)
                }
                break
        }

        return recipients
    }
}
