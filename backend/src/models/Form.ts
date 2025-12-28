import mongoose, { Schema, Document } from 'mongoose'

export interface NotificationTemplate {
    id: string
    name: string
    subject: string
    content: string
    to: 'admin' | 'submitter' | 'custom'
    customEmails?: string
    triggers: ('submit' | 'update' | 'delete')[]
    enabled: boolean
    createdAt: string
}

export interface IForm extends Document {
    name: string
    description?: string
    categoryId: mongoose.Types.ObjectId
    content: any // 表单内容，可以是JSON格式
    status: 'draft' | 'published' | 'disabled'
    allowGuestView?: boolean // 允许游客查看
    allowGuestSubmit?: boolean // 允许游客提交
    showFormTitle?: boolean // 显示表单名称
    showFormDescription?: boolean // 显示表单描述
    submitButtonText?: string // 提交按钮文本
    submitButtonPosition?: 'left' | 'center' | 'right' // 按钮位置
    submitButtonIcon?: string // 按钮图标
    enableDraft?: boolean // 启用草稿保存
    requireConfirmation?: boolean // 提交前确认
    redirectAfterSubmit?: boolean // 提交后跳转
    redirectUrl?: string // 跳转地址
    successMessage?: string // 提交成功提示消息
    settings?: {
        security?: {
            autoSave?: boolean
            autoSaveInterval?: number
            enableFormAutoSave?: boolean
            formAutoSaveInterval?: number
            saveTrigger?: 'interval' | 'change' | 'both'
            saveLocation?: 'localStorage' | 'server' | 'both'
            autoSaveNotification?: boolean
        }
        submission?: {
            enableSubmissionLimit?: boolean
            maxSubmissions?: number
            limitType?: 'ip' | 'user'
            resetPeriod?: 'never' | 'daily' | 'weekly' | 'monthly'
            limitMessage?: string
        }
        expiry?: {
            enableExpiry?: boolean
            expiryType?: 'date' | 'duration' | 'submissions'
            expiryDate?: string | null
            expiryDuration?: number
            expirySubmissions?: number
            expiryMessage?: string
        }
        notification?: {
            templates?: NotificationTemplate[]
        }
        project?: {
            enableProjectCreation?: boolean
            fieldMappings?: {
                projectName?: string
                client?: {
                    type: 'component' | 'submitter_company'
                    value?: string
                }
                contacts?: {
                    type: 'component' | 'submitter'
                    value?: string[]
                }
                clientInstructions?: string
                taskList?: string
            }
        }
        article?: {
            enableArticleCreation?: boolean
            autoPublish?: boolean
            fieldMappings?: {
                title?: string
                content?: string
                author?: {
                    type: 'component' | 'submitter'
                    value?: string
                }
                summary?: string
                category?: string
                tags?: string
                publishTime?: string
                coverImage?: string
                seo?: string
            }
        }
        layout?: any
        theme?: any
    }
    createdBy: mongoose.Types.ObjectId
    submissions: number
    createTime: Date
    updateTime: Date
}

const FormSchema = new Schema<IForm>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'FormCategory',
        required: true
    },
    content: {
        type: Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'disabled'],
        default: 'draft'
    },
    // 游客权限设置
    allowGuestView: {
        type: Boolean,
        default: false
    },
    allowGuestSubmit: {
        type: Boolean,
        default: false
    },
    // 表单显示设置
    showFormTitle: {
        type: Boolean,
        default: true
    },
    showFormDescription: {
        type: Boolean,
        default: true
    },
    // 提交按钮设置
    submitButtonText: {
        type: String,
        trim: true,
        maxlength: 50,
        default: '提交'
    },
    submitButtonPosition: {
        type: String,
        enum: ['left', 'center', 'right'],
        default: 'center'
    },
    submitButtonIcon: {
        type: String,
        trim: true,
        maxlength: 50
    },
    // 表单功能设置
    enableDraft: {
        type: Boolean,
        default: false
    },
    requireConfirmation: {
        type: Boolean,
        default: false
    },
    redirectAfterSubmit: {
        type: Boolean,
        default: false
    },
    redirectUrl: {
        type: String,
        trim: true,
        maxlength: 500
    },
    successMessage: {
        type: String,
        trim: true,
        maxlength: 200
    },
    // 高级设置
    settings: {
        type: Schema.Types.Mixed,
        default: {}
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    submissions: {
        type: Number,
        default: 0,
        min: 0
    },
    createTime: {
        type: Date,
        default: Date.now
    },
    updateTime: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' }
})

// 添加索引
FormSchema.index({ name: 1 })
FormSchema.index({ categoryId: 1 })
FormSchema.index({ status: 1 })
FormSchema.index({ createdBy: 1 })

export default mongoose.model<IForm>('Form', FormSchema) 