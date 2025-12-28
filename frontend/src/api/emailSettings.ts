import axios from 'axios'

export interface EmailSetting {
    _id?: string
    // SMTP配置
    enableEmail: boolean
    smtpHost: string
    smtpPort: number
    securityType: 'none' | 'tls' | 'ssl'
    // 身份验证
    requireAuth: boolean
    username: string
    password?: string // 响应中不包含密码
    // 发件人信息
    senderName: string
    senderEmail: string
    replyEmail?: string
    // 发送限制
    enableRateLimit: boolean
    maxEmailsPerHour: number
    sendInterval: number
    // 元数据
    createdAt?: string
    updatedAt?: string
    createdBy?: {
        _id: string
        username: string
        realName: string
    }
    updatedBy?: {
        _id: string
        username: string
        realName: string
    }
}

export interface CreateEmailSettingRequest {
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

export interface TestEmailRequest {
    // SMTP配置
    smtpHost: string
    smtpPort: number
    securityType: 'none' | 'tls' | 'ssl'
    requireAuth: boolean
    username: string
    password: string
    // 发件人信息
    senderName: string
    senderEmail: string
    replyEmail?: string
    // 测试邮件信息
    testEmail: string
    testSubject?: string
    testContent?: string
}

// 获取邮件设置
export const getEmailSetting = async (): Promise<EmailSetting | null> => {
    const response = await axios.get('/api/email-settings')
    return response.data.data
}

// 保存邮件设置
export const saveEmailSetting = async (data: CreateEmailSettingRequest): Promise<EmailSetting> => {
    const response = await axios.post('/api/email-settings', data)
    return response.data.data
}

// 更新邮件设置
export const updateEmailSetting = async (data: Partial<CreateEmailSettingRequest>): Promise<EmailSetting> => {
    const response = await axios.put('/api/email-settings', data)
    return response.data.data
}

// 发送测试邮件
export const sendTestEmail = async (data: TestEmailRequest): Promise<void> => {
    const response = await axios.post('/api/email-settings/test', data)
    return response.data
}

// 验证邮件配置
export const verifyEmailConfiguration = async (): Promise<{ valid: boolean }> => {
    const response = await axios.post('/api/email-settings/verify')
    return response.data.data
}

// 检查邮件设置状态
export const checkEmailStatus = async (): Promise<{ enabled: boolean; configured: boolean }> => {
    const response = await axios.get('/api/email-settings/status')
    return response.data.data
}
