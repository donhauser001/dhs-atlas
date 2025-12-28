import EmailSetting, { IEmailSetting } from '../models/EmailSetting'
import nodemailer from 'nodemailer'
import { Types } from 'mongoose'

export interface CreateEmailSettingData {
    enableEmail: boolean
    smtpHost: string
    smtpPort: number
    securityType: 'none' | 'tls' | 'ssl'
    requireAuth: boolean
    username: string
    password: string
    senderName: string
    senderEmail: string
    replyEmail?: string
    enableRateLimit: boolean
    maxEmailsPerHour: number
    sendInterval: number
}

export interface UpdateEmailSettingData extends Partial<CreateEmailSettingData> { }

export interface TestEmailData {
    testEmail: string
    testSubject?: string
    testContent?: string
}

class EmailSettingService {
    // 获取邮件设置
    async getEmailSetting(): Promise<IEmailSetting | null> {
        try {
            const setting = await EmailSetting.findOne()
                .populate('createdBy', 'username realName')
                .populate('updatedBy', 'username realName')
            return setting
        } catch (error) {
            throw new Error(`获取邮件设置失败: ${error}`)
        }
    }

    // 创建或更新邮件设置
    async saveEmailSetting(data: CreateEmailSettingData, userId?: string): Promise<IEmailSetting> {
        try {
            // 检查是否已存在设置
            const existingSetting = await EmailSetting.findOne()

            if (existingSetting) {
                // 更新现有设置
                Object.assign(existingSetting, data)
                if (userId) {
                    existingSetting.updatedBy = new Types.ObjectId(userId)
                }
                await existingSetting.save()
                return existingSetting
            } else {
                // 创建新设置
                const newSetting = new EmailSetting({
                    ...data,
                    createdBy: userId ? new Types.ObjectId(userId) : undefined,
                    updatedBy: userId ? new Types.ObjectId(userId) : undefined
                })
                await newSetting.save()
                return newSetting
            }
        } catch (error) {
            throw new Error(`保存邮件设置失败: ${error}`)
        }
    }

    // 更新邮件设置
    async updateEmailSetting(data: UpdateEmailSettingData, userId?: string): Promise<IEmailSetting> {
        try {
            const setting = await EmailSetting.findOne()
            if (!setting) {
                throw new Error('邮件设置不存在，请先创建设置')
            }

            Object.assign(setting, data)
            if (userId) {
                setting.updatedBy = new Types.ObjectId(userId)
            }
            await setting.save()
            return setting
        } catch (error) {
            throw new Error(`更新邮件设置失败: ${error}`)
        }
    }

    // 创建邮件传输器
    private async createTransporter(setting?: IEmailSetting) {
        const emailSetting = setting || await this.getEmailSetting()
        if (!emailSetting) {
            throw new Error('邮件设置不存在，请先配置邮件设置')
        }

        if (!emailSetting.enableEmail) {
            throw new Error('邮件服务未启用')
        }

        const transportConfig: any = {
            host: emailSetting.smtpHost,
            port: emailSetting.smtpPort,
            secure: emailSetting.securityType === 'ssl', // true for 465, false for other ports
        }

        // 设置加密类型
        if (emailSetting.securityType === 'tls') {
            transportConfig.requireTLS = true
        }

        // 设置身份验证
        if (emailSetting.requireAuth) {
            transportConfig.auth = {
                user: emailSetting.username,
                pass: emailSetting.password
            }
        }

        return nodemailer.createTransport(transportConfig)
    }

    // 发送测试邮件
    async sendTestEmail(testData: TestEmailData, setting?: IEmailSetting): Promise<void> {
        try {
            const emailSetting = setting || await this.getEmailSetting()
            if (!emailSetting) {
                throw new Error('邮件设置不存在，请先配置邮件设置')
            }

            const transporter = await this.createTransporter(emailSetting)

            const mailOptions = {
                from: `"${emailSetting.senderName}" <${emailSetting.senderEmail}>`,
                to: testData.testEmail,
                subject: testData.testSubject || '邮件配置测试',
                text: testData.testContent || '这是一封测试邮件，用于验证SMTP配置是否正确。如果您收到此邮件，说明邮件服务配置成功。',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1890ff;">邮件配置测试</h2>
                        <p>${testData.testContent || '这是一封测试邮件，用于验证SMTP配置是否正确。如果您收到此邮件，说明邮件服务配置成功。'}</p>
                        <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">
                            此邮件由 ${emailSetting.senderName} 自动发送，请勿回复。<br>
                            发送时间：${new Date().toLocaleString('zh-CN')}
                        </p>
                    </div>
                `,
                replyTo: emailSetting.replyEmail || emailSetting.senderEmail
            }

            await transporter.sendMail(mailOptions)
        } catch (error) {
            throw new Error(`发送测试邮件失败: ${error}`)
        }
    }

    // 验证邮件配置
    async verifyEmailConfiguration(setting?: IEmailSetting): Promise<boolean> {
        try {
            const transporter = await this.createTransporter(setting)
            await transporter.verify()
            return true
        } catch (error) {
            throw new Error(`邮件配置验证失败: ${error}`)
        }
    }

    // 发送系统邮件（通用方法）
    async sendEmail(to: string, subject: string, content: string, isHtml: boolean = false, attachments?: any[]): Promise<void> {
        try {
            const emailSetting = await this.getEmailSetting()
            if (!emailSetting || !emailSetting.enableEmail) {
                console.warn('邮件服务未启用，跳过邮件发送')
                return
            }

            const transporter = await this.createTransporter(emailSetting)

            const mailOptions: any = {
                from: `"${emailSetting.senderName}" <${emailSetting.senderEmail}>`,
                to: to,
                subject: subject,
                replyTo: emailSetting.replyEmail || emailSetting.senderEmail
            }

            if (isHtml) {
                mailOptions.html = content
            } else {
                mailOptions.text = content
            }

            // 添加附件支持
            if (attachments && attachments.length > 0) {
                mailOptions.attachments = attachments
                console.log(`📎 邮件包含 ${attachments.length} 个附件`)
            }

            await transporter.sendMail(mailOptions)
        } catch (error) {
            console.error('发送邮件失败:', error)
            throw new Error(`发送邮件失败: ${error}`)
        }
    }
}

export default new EmailSettingService()
