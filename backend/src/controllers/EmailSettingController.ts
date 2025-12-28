import { Request, Response } from 'express'
import EmailSettingService, { CreateEmailSettingData, TestEmailData } from '../services/EmailSettingService'

class EmailSettingController {
    // 获取邮件设置
    async getEmailSetting(req: Request, res: Response) {
        try {
            const setting = await EmailSettingService.getEmailSetting()

            if (!setting) {
                return res.json({
                    success: true,
                    data: null,
                    message: '邮件设置不存在'
                })
            }

            // 不返回敏感信息
            const safeSettings = {
                ...setting.toObject(),
                password: undefined // 不返回密码
            }

            return res.json({
                success: true,
                data: safeSettings
            })
        } catch (error) {
            console.error('获取邮件设置失败:', error)
            return res.status(500).json({
                success: false,
                message: '获取邮件设置失败'
            })
        }
    }

    // 保存邮件设置
    async saveEmailSetting(req: Request, res: Response) {
        try {
            const {
                enableEmail,
                smtpHost,
                smtpPort,
                securityType,
                requireAuth,
                username,
                password,
                senderName,
                senderEmail,
                replyEmail,
                enableRateLimit,
                maxEmailsPerHour,
                sendInterval
            } = req.body

            // 验证必填字段
            if (!smtpHost || !smtpPort || !securityType || !username || !password || !senderName || !senderEmail) {
                return res.status(400).json({
                    success: false,
                    message: '请填写所有必填字段'
                })
            }

            // 验证邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(senderEmail)) {
                return res.status(400).json({
                    success: false,
                    message: '发件人邮箱格式不正确'
                })
            }

            if (replyEmail && !emailRegex.test(replyEmail)) {
                return res.status(400).json({
                    success: false,
                    message: '回复邮箱格式不正确'
                })
            }

            const settingData: CreateEmailSettingData = {
                enableEmail: enableEmail !== undefined ? enableEmail : false,
                smtpHost,
                smtpPort: parseInt(smtpPort),
                securityType,
                requireAuth: requireAuth !== undefined ? requireAuth : true,
                username,
                password,
                senderName,
                senderEmail,
                replyEmail,
                enableRateLimit: enableRateLimit !== undefined ? enableRateLimit : true,
                maxEmailsPerHour: maxEmailsPerHour ? parseInt(maxEmailsPerHour) : 100,
                sendInterval: sendInterval !== undefined ? parseInt(sendInterval) : 2
            }

            const userId = (req as any).user?.id
            const setting = await EmailSettingService.saveEmailSetting(settingData, userId)

            // 不返回敏感信息
            const safeSettings = {
                ...setting.toObject(),
                password: undefined
            }

            return res.json({
                success: true,
                data: safeSettings,
                message: '邮件设置保存成功'
            })
        } catch (error) {
            console.error('保存邮件设置失败:', error)
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '保存邮件设置失败'
            })
        }
    }

    // 发送测试邮件
    async sendTestEmail(req: Request, res: Response) {
        try {
            const {
                // SMTP配置
                smtpHost,
                smtpPort,
                securityType,
                requireAuth,
                username,
                password,
                // 发件人信息
                senderName,
                senderEmail,
                replyEmail,
                // 测试邮件信息
                testEmail,
                testSubject,
                testContent
            } = req.body

            // 验证必填字段
            if (!smtpHost || !smtpPort || !senderName || !senderEmail || !testEmail) {
                return res.status(400).json({
                    success: false,
                    message: '请填写所有必填字段'
                })
            }

            // 如果需要身份验证，验证用户名和密码
            if (requireAuth && (!username || !password)) {
                // 如果密码为空，尝试使用已保存的设置
                const savedSetting = await EmailSettingService.getEmailSetting()
                if (!savedSetting || !savedSetting.password) {
                    return res.status(400).json({
                        success: false,
                        message: '启用身份验证时，用户名和密码为必填项'
                    })
                }

                // 使用保存的设置进行测试
                const testData: TestEmailData = {
                    testEmail,
                    testSubject,
                    testContent
                }

                await EmailSettingService.sendTestEmail(testData)
                return res.json({
                    success: true,
                    message: `测试邮件已发送到 ${testEmail}，请检查收件箱`
                })
            }

            // 验证邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(senderEmail) || !emailRegex.test(testEmail)) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱格式不正确'
                })
            }

            // 创建临时配置对象
            const tempSetting = {
                enableEmail: true,
                smtpHost,
                smtpPort: parseInt(smtpPort),
                securityType,
                requireAuth: requireAuth !== undefined ? requireAuth : true,
                username,
                password,
                senderName,
                senderEmail,
                replyEmail
            } as any

            const testData: TestEmailData = {
                testEmail,
                testSubject: testSubject || '邮件配置测试',
                testContent: testContent || '这是一封测试邮件，用于验证SMTP配置是否正确。如果您收到此邮件，说明邮件服务配置成功。'
            }

            await EmailSettingService.sendTestEmail(testData, tempSetting)

            return res.json({
                success: true,
                message: `测试邮件已发送到 ${testEmail}`
            })
        } catch (error) {
            console.error('发送测试邮件失败:', error)
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '发送测试邮件失败'
            })
        }
    }

    // 验证邮件配置
    async verifyEmailConfiguration(req: Request, res: Response) {
        try {
            const isValid = await EmailSettingService.verifyEmailConfiguration()

            return res.json({
                success: true,
                data: { valid: isValid },
                message: isValid ? '邮件配置验证成功' : '邮件配置验证失败'
            })
        } catch (error) {
            console.error('验证邮件配置失败:', error)
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '验证邮件配置失败'
            })
        }
    }

    // 检查邮件设置状态
    async checkEmailStatus(req: Request, res: Response) {
        try {
            const emailSetting = await EmailSettingService.getEmailSetting()

            const status = {
                enabled: emailSetting?.enableEmail || false,
                configured: !!emailSetting
            }

            return res.json({
                success: true,
                data: status
            })
        } catch (error: any) {
            console.error('检查邮件状态失败:', error)
            return res.status(500).json({
                success: false,
                message: error.message || '检查邮件状态失败'
            })
        }
    }
}

export default new EmailSettingController()
