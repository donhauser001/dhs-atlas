/**
 * 检查值是否为空
 */
export function isEmpty(val: any): boolean {
    return val === null ||
        val === undefined ||
        val === '' ||
        (Array.isArray(val) && val.length === 0) ||
        (typeof val === 'object' && val !== null && Object.keys(val).length === 0)
}

/**
 * 将标签转换为占位符格式
 */
export function labelToPlaceholder(label: string): string {
    // 保持中文的原始大小写，只对英文进行小写转换
    return label
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')  // 只保留中文、英文、数字
        .replace(/[a-zA-Z]/g, (match) => match.toLowerCase())  // 只对英文字母转小写，保持中文不变
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * 替换占位符
 */
export function replacePlaceholders(template: string, data: Record<string, any>): string {
    console.log('🔍 占位符替换开始 - 模板内容:', template)
    console.log('🔍 占位符替换 - 可用数据:', data)

    let result = template

    // 替换所有占位符 {key}
    for (const [key, value] of Object.entries(data)) {
        const placeholder = `{${key}}`
        const replacement = String(value || '')

        // 检查模板中是否包含这个占位符
        if (template.includes(placeholder)) {
            console.log(`✅ 占位符替换: "${placeholder}" -> "${replacement}"`)
            result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacement)
        }
    }

    console.log('🔍 占位符替换结果:', result)
    return result
}
