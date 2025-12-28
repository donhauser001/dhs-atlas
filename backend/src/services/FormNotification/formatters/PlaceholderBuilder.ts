import { IForm } from '../../../models/Form';
import { IFormData } from '../../../models/FormData';
import { PlaceholderData } from '../types';
import { isEmpty, labelToPlaceholder } from '../utils';
import { DataFormatter } from './DataFormatter';
import { HtmlGenerator } from '../generators/HtmlGenerator';

/**
 * 占位符构建器 - 负责构建邮件模板的占位符数据
 */
export class PlaceholderBuilder {
    /**
     * 构建占位符数据
     */
    static buildPlaceholderData(
        formData: IFormData,
        form: IForm,
        submitterInfo?: any,
        requestInfo?: any
    ): PlaceholderData {
        const now = new Date()

        const data: PlaceholderData = {
            // 基本信息
            form_title: form.name,
            form_description: form.description || '',
            submission_id: formData._id?.toString() || 'unknown',
            submission_date: now.toLocaleDateString('zh-CN'),
            submission_time: now.toLocaleTimeString('zh-CN'),

            // 提交者信息
            submitter_name: formData.submitterName || '匿名用户',
            submitter_ip: requestInfo?.ip || '',

            // 系统信息
            admin_email: process.env.ADMIN_EMAIL || '',
            site_title: process.env.SITE_TITLE || '表单系统',
            site_url: process.env.SITE_URL || 'http://localhost:3000'
        }

        // 添加提交者详细信息（如果是登录用户）
        if (submitterInfo) {
            data.submitter_email = submitterInfo.email || ''
            data.submitter_username = submitterInfo.username || ''
            data.submitter_company = submitterInfo.company || ''
            data.submitter_enterprise = submitterInfo.enterprise || ''
            data.submitter_department = submitterInfo.department || ''
            data.submitter_position = submitterInfo.position || ''
            data.submitter_phone = submitterInfo.phone || ''
            data.submitter_role = submitterInfo.role || ''
        }

        // 调试日志：打印表单数据和结构
        console.log('🔍 邮件通知调试 - 表单基本信息:', {
            formName: form.name,
            formId: formData.formId,
            submissionDataExists: !!formData.submissionData,
            submissionDataType: typeof formData.submissionData,
            formContentExists: !!form.content,
            formContentType: typeof form.content
        })

        console.log('🔍 邮件通知调试 - 提交数据详情:', {
            submissionData: formData.submissionData,
            submissionDataKeys: formData.submissionData ? Object.keys(formData.submissionData) : [],
        })

        console.log('🔍 邮件通知调试 - 表单内容结构:', {
            formContent: form.content,
            hasComponents: !!(form.content && form.content.components),
            componentsCount: form.content?.components?.length || 0
        })

        // 直接使用前端的渲染逻辑生成邮件内容
        if (formData.submissionData && typeof formData.submissionData === 'object') {
            console.log('🔍 邮件通知调试 - 开始生成表单数据展示内容')

            // 直接处理前端格式的提交数据，生成可读的内容
            const formattedContent = DataFormatter.generateFormattedContent(formData.submissionData)
            console.log('🔍 生成的格式化内容:', formattedContent)

            // 将格式化内容作为一个整体占位符添加
            data['form_data'] = formattedContent

            // 同时为每个组件标签生成单独的占位符（兼容旧邮件模板）
            this.processComponentPlaceholders(data, formData.submissionData)

            console.log('🔍 邮件通知调试 - 完成添加表单数据内容，最终占位符数据:', data)
        } else {
            console.log('⚠️ 邮件通知调试 - 跳过表单数据：submissionData不存在或不是对象')
        }

        return data
    }

    /**
 * 生成订单项目列表（用顿号分隔的项目名称）
 */
    private static generateOrderItemsList(orderItems: any[]): string {
        if (!Array.isArray(orderItems) || orderItems.length === 0) {
            return '暂无订单项目';
        }

        const itemNames = orderItems
            .filter(item => item && typeof item === 'object')
            .map(item => {
                // 尝试多种可能的项目名称字段（包括中文和英文字段名）
                return item.serviceName || item['服务名称'] || item.name || item.title || item.itemName || '未知项目';
            })
            .filter(name => name && name !== '未知项目');

        if (itemNames.length === 0) {
            return '暂无订单项目';
        }

        // 使用顿号分隔项目名称
        return itemNames.join('、');
    }

    /**
     * 处理组件占位符
     */
    private static processComponentPlaceholders(data: PlaceholderData, submissionData: any): void {
        for (const [componentId, componentData] of Object.entries(submissionData)) {
            if (componentData && typeof componentData === 'object' && 'value' in componentData) {
                const { value, label, type } = componentData as any

                // 跳过空值
                if (isEmpty(value)) {
                    continue
                }

                // 排除图片展示字段和倒计时字段
                if (type === 'image' || type === 'countdown') {
                    console.log(`🚫 跳过组件占位符: ${type} - ${label}`)
                    continue
                }

                // 特殊处理组件：直接生成HTML
                let formattedValue;
                if (type === 'order' && Array.isArray(value)) {
                    console.log(`🔍 处理订单组件占位符 ${label}:`, { type, valueType: typeof value, isArray: Array.isArray(value), firstItem: value[0] });

                    // 🔥 为订单生成两种占位符
                    // 1. 订单内容占位符（HTML表格）
                    const contentKey = labelToPlaceholder(label + '内容');
                    const contentValue = HtmlGenerator.generateOrderTable(value);
                    data[contentKey] = contentValue;
                    console.log(`✅ 添加订单内容占位符: {${contentKey}} = HTML表格`);

                    // 2. 订单项目占位符（项目名称列表）
                    const itemsKey = labelToPlaceholder(label + '项目');
                    const itemsValue = this.generateOrderItemsList(value);
                    data[itemsKey] = itemsValue;
                    console.log(`✅ 添加订单项目占位符: {${itemsKey}} = "${itemsValue}"`);

                    // 🔥 订单组件不生成默认占位符，跳过
                    continue;
                } else if (type === 'upload' && Array.isArray(value)) {
                    console.log(`🔍 处理文件上传组件占位符 ${label}:`, { type, valueType: typeof value, isArray: Array.isArray(value), firstItem: value[0] });
                    formattedValue = HtmlGenerator.generateFileList(value);
                    console.log(`✅ 文件上传组件占位符 ${label} 生成HTML列表成功`);
                } else if (type === 'quotation' && value && typeof value === 'object') {
                    console.log(`🔍 处理报价单组件占位符 ${label}:`, { type, valueType: typeof value, hasServices: !!(value.services) });

                    // 为报价单生成两种专用占位符
                    // 1. 报价单名称占位符
                    const nameKey = labelToPlaceholder(label + '名称');
                    const nameValue = value.name || '未知报价单';
                    data[nameKey] = nameValue;
                    console.log(`✅ 添加报价单名称占位符: {${nameKey}} = "${nameValue}"`);

                    // 2. 报价单内容占位符
                    const contentKey = labelToPlaceholder(label + '内容');
                    const contentValue = HtmlGenerator.generateQuotationTable(value);
                    data[contentKey] = contentValue;
                    console.log(`✅ 添加报价单内容占位符: {${contentKey}} = HTML表格`);

                    // 报价单组件不生成默认占位符，跳过
                    continue;
                } else {
                    formattedValue = DataFormatter.formatValueForEmail(value, type);
                }

                if (formattedValue !== undefined) {
                    const placeholderKey = labelToPlaceholder(label)
                    data[placeholderKey] = formattedValue

                    console.log(`🔍 添加组件占位符: {${placeholderKey}} = "${formattedValue.substring(0, 100)}..."`)
                }
            }
        }
    }

    /**
     * 添加表单字段占位符（保留原方法以防需要）
     */
    static addFormFieldPlaceholders(
        data: PlaceholderData,
        submissionData: any,
        formContent: any,
        componentLabels?: any
    ): void {
        try {
            // 从表单内容的正确路径提取组件配置
            // 表单配置结构: { config: { components: [...] } }
            const components = formContent?.config?.components || formContent?.components || []
            console.log(`🔍 表单组件分析 - 总组件数: ${components.length}`)
            console.log(`🔍 表单组件配置路径检查:`, {
                hasFormContent: !!formContent,
                hasConfig: !!formContent?.config,
                hasConfigComponents: !!formContent?.config?.components,
                hasDirectComponents: !!formContent?.components,
                configComponentsLength: formContent?.config?.components?.length || 0,
                directComponentsLength: formContent?.components?.length || 0
            })

            for (let i = 0; i < components.length; i++) {
                const component = components[i]
                const componentId = component.id

                // 优先使用从前端提交数据中提取的标签，其次使用表单配置中的标签
                const componentLabel = (componentLabels && componentLabels[componentId]) ||
                    component.label ||
                    component.placeholder || ''

                console.log(`🔍 组件[${i}] - ID: ${componentId}, 类型: ${component.type}, 标签: "${componentLabel}"`)
                console.log(`🔍 组件[${i}] - 标签来源: ${componentLabels && componentLabels[componentId] ? '前端数据' : '表单配置'}`)

                // 跳过不需要生成占位符的组件类型
                const excludeTypes = ['divider', 'html', 'steps', 'group', 'columnContainer', 'pagination']
                if (excludeTypes.includes(component.type)) {
                    console.log(`⏭️ 组件[${i}] - 跳过，类型 ${component.type} 不需要占位符`)
                    continue
                }

                // 获取该组件的提交数据
                const fieldValue = submissionData[componentId]
                console.log(`🔍 组件[${i}] - 提交数据值:`, fieldValue, `(类型: ${typeof fieldValue})`)

                if (fieldValue !== undefined && fieldValue !== null) {
                    // 生成占位符键名（基于标签）
                    const placeholderKey = labelToPlaceholder(componentLabel)
                    console.log(`🔍 组件[${i}] - 生成占位符键名: "${placeholderKey}" (从标签: "${componentLabel}")`)

                    // 格式化字段值
                    const formattedValue = DataFormatter.formatFieldValue(fieldValue, component.type)
                    data[placeholderKey] = formattedValue
                    console.log(`✅ 组件[${i}] - 添加占位符: {${placeholderKey}} = "${formattedValue}"`)
                } else {
                    console.log(`⚠️ 组件[${i}] - 跳过，提交数据为空或未定义`)
                }
            }

            console.log('🔍 最终生成的所有占位符键名:', Object.keys(data).filter(key =>
                !['form_title', 'form_description', 'submission_id', 'submission_date', 'submission_time',
                    'submitter_name', 'submitter_ip', 'submitter_email', 'submitter_username', 'submitter_company',
                    'submitter_enterprise', 'submitter_department', 'submitter_position', 'submitter_phone',
                    'submitter_role', 'admin_email', 'site_title', 'site_url'].includes(key)
            ))
        } catch (error) {
            console.error('❌ 添加表单字段占位符失败:', error)
        }
    }
}
