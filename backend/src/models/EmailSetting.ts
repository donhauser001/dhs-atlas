import mongoose, { Document, Schema } from 'mongoose'

export interface IEmailSetting extends Document {
    // SMTP配置
    enableEmail: boolean
    smtpHost: string
    smtpPort: number
    securityType: 'none' | 'tls' | 'ssl'

    // 身份验证
    requireAuth: boolean
    username: string
    password: string

    // 发件人信息
    senderName: string
    senderEmail: string
    replyEmail?: string

    // 发送限制
    enableRateLimit: boolean
    maxEmailsPerHour: number
    sendInterval: number

    // 元数据
    createdAt: Date
    updatedAt: Date
    createdBy?: mongoose.Types.ObjectId
    updatedBy?: mongoose.Types.ObjectId
}

const EmailSettingSchema = new Schema<IEmailSetting>({
    // SMTP配置
    enableEmail: {
        type: Boolean,
        default: false
    },
    smtpHost: {
        type: String,
        required: true,
        trim: true
    },
    smtpPort: {
        type: Number,
        required: true,
        min: 1,
        max: 65535
    },
    securityType: {
        type: String,
        enum: ['none', 'tls', 'ssl'],
        required: true,
        default: 'tls'
    },

    // 身份验证
    requireAuth: {
        type: Boolean,
        default: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },

    // 发件人信息
    senderName: {
        type: String,
        required: true,
        trim: true
    },
    senderEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    replyEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },

    // 发送限制
    enableRateLimit: {
        type: Boolean,
        default: true
    },
    maxEmailsPerHour: {
        type: Number,
        default: 100,
        min: 1,
        max: 10000
    },
    sendInterval: {
        type: Number,
        default: 2,
        min: 0,
        max: 3600
    },

    // 元数据
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    collection: 'email_settings'
})

// 索引
EmailSettingSchema.index({ createdAt: -1 })
EmailSettingSchema.index({ senderEmail: 1 })

// 只允许一个邮件设置记录
EmailSettingSchema.index({}, { unique: true })

const EmailSetting = mongoose.model<IEmailSetting>('EmailSetting', EmailSettingSchema)

export default EmailSetting
