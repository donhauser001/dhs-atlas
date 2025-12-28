export interface PlaceholderData {
    // 基本信息
    form_title?: string
    form_description?: string
    submission_id?: string
    submission_date?: string
    submission_time?: string

    // 提交者信息
    submitter_ip?: string
    submitter_email?: string
    submitter_name?: string
    submitter_username?: string
    submitter_company?: string
    submitter_enterprise?: string
    submitter_department?: string
    submitter_position?: string
    submitter_phone?: string
    submitter_role?: string

    // 系统信息
    admin_email?: string
    site_title?: string
    site_url?: string

    // 动态字段（表单组件数据）
    [key: string]: any
}

export interface EmailAttachment {
    filename: string
    path: string
    cid?: string
}

export interface FormattedContentOptions {
    includeEmptyValues?: boolean
    excludeTypes?: string[]
    formatAsHtml?: boolean
}
