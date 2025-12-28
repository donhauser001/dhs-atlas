import { isEmpty } from '../utils';
import { HtmlGenerator } from '../generators/HtmlGenerator';

/**
 * 数据格式化器 - 负责格式化各种类型的数据
 */
export class DataFormatter {
    /**
     * 格式化值用于邮件显示（类似前端的 formatValue 函数）
     */
    static formatValueForEmail(val: any, type: string): string {
        // 检查空值
        if (isEmpty(val)) {
            return '(空)'
        }

        // 处理数组
        if (Array.isArray(val)) {
            if (val.length === 0) {
                return '(空列表)'
            }

            // 特殊处理：检查是否是文件上传数组数据
            if (val.length > 0 && val[0] && typeof val[0] === 'object') {
                const firstItem = val[0];

                // 检查是否是文件对象（包含 name, size, type 等文件属性）
                if (firstItem.name && (firstItem.size !== undefined || firstItem.type)) {
                    console.log('✅ 检测到文件上传数据，生成文件列表');
                    return HtmlGenerator.generateFileList(val);
                }

                // 检查是否是订单数组数据
                console.log('🔍 检查订单数组数据:', {
                    hasServiceName: !!(firstItem.serviceName || firstItem['服务名称']),
                    hasUnitPrice: !!(firstItem.unitPrice || firstItem['单价']),
                    hasQuantity: !!(firstItem.quantity || firstItem['数量']),
                    firstItem: firstItem
                });

                if ((firstItem.serviceName || firstItem['服务名称']) &&
                    (firstItem.unitPrice || firstItem['单价']) &&
                    (firstItem.quantity || firstItem['数量'])) {
                    console.log('✅ 检测到订单数据，生成HTML表格');
                    return HtmlGenerator.generateOrderTable(val);
                }
            }

            // 如果数组包含对象，格式化显示
            if (typeof val[0] === 'object') {
                return val.map(item => {
                    if (item && typeof item === 'object') {
                        return Object.entries(item)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')
                    }
                    return String(item)
                }).join('; ')
            }

            // 普通数组（如选择按钮的值）
            return val.join(', ')
        }

        // 处理复杂对象
        if (typeof val === 'object' && val !== null) {
            // 检查是否是特殊对象格式
            if (val.name || val.title) {
                return val.name || val.title
            }

            // 特殊处理：如果是订单数组数据，生成HTML表格
            if (Array.isArray(val) && val.length > 0 && val[0] && typeof val[0] === 'object') {
                // 检查是否包含订单项的典型字段
                const firstItem = val[0];
                if ((firstItem.serviceName || firstItem['服务名称']) &&
                    (firstItem.unitPrice || firstItem['单价']) &&
                    (firstItem.quantity || firstItem['数量'])) {
                    return HtmlGenerator.generateOrderTable(val);
                }
            }

            // 通用对象格式化
            return Object.entries(val)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ')
        }

        // 根据类型特殊处理
        switch (type) {
            case 'date':
                return new Date(val).toLocaleDateString('zh-CN')

            case 'textarea':
            case 'presetText':
            case 'instruction':
            case 'articleContent':
                // 保持换行格式
                return String(val).replace(/\n/g, '\n')

            case 'checkbox':
                return val ? '是' : '否'

            case 'slider':
                return `${val} 分`

            default:
                return String(val)
        }
    }

    /**
     * 生成格式化的表单内容（类似前端的渲染逻辑）
     */
    static generateFormattedContent(submissionData: any): string {
        const lines: string[] = []

        for (const [componentId, componentData] of Object.entries(submissionData)) {
            if (componentData && typeof componentData === 'object' && 'value' in componentData) {
                const { value, label, type } = componentData as any

                // 跳过空值
                if (isEmpty(value)) {
                    continue
                }

                // 排除图片展示字段和倒计时字段
                if (type === 'image' || type === 'countdown') {
                    continue
                }

                // 特殊处理组件：直接处理原始数组数据
                if (type === 'order' && Array.isArray(value)) {
                    console.log(`🔍 格式化订单字段 ${label}:`, { type, valueType: typeof value, isArray: Array.isArray(value), firstItem: value[0] });
                    // 🔥 订单在整体内容中只显示项目名称，详细内容通过专用占位符获取
                    const itemNames = value
                        .filter(item => item && typeof item === 'object')
                        .map(item => item.serviceName || item['服务名称'] || item.name || item.title || item.itemName || '未知项目')
                        .filter(name => name && name !== '未知项目');

                    const orderSummary = itemNames.length > 0 ? itemNames.join('、') : '暂无订单项目';
                    console.log(`✅ 订单字段 ${label} 显示项目名称: ${orderSummary}`);
                    lines.push(`${label}: ${orderSummary}`);
                } else if (type === 'upload' && Array.isArray(value)) {
                    console.log(`🔍 格式化文件上传字段 ${label}:`, { type, valueType: typeof value, isArray: Array.isArray(value), firstItem: value[0] });
                    const fileListHtml = HtmlGenerator.generateFileList(value);
                    console.log(`✅ 文件上传字段 ${label} 生成HTML列表成功`);
                    lines.push(`${label}: ${fileListHtml}`);
                } else if (type === 'quotation' && value && typeof value === 'object') {
                    console.log(`🔍 格式化报价单字段 ${label}:`, { type, valueType: typeof value, hasServices: !!(value.services) });
                    // 报价单在整体内容中只显示名称，详细内容通过专用占位符获取
                    const quotationName = value.name || '未知报价单';
                    console.log(`✅ 报价单字段 ${label} 显示名称: ${quotationName}`);
                    lines.push(`${label}: ${quotationName}`);
                } else {
                    const formattedValue = this.formatValueForEmail(value, type)
                    console.log(`🔍 格式化字段 ${label} (${type}):`, { value, formattedValue: formattedValue.substring(0, 100) + '...' });
                    lines.push(`${label}: ${formattedValue}`);
                }
            } else {
                // 处理简单格式的数据
                const formattedValue = this.formatValueForEmail(componentData, 'text')
                lines.push(`${componentId}: ${formattedValue}`)
            }
        }

        return lines.join('\n')
    }

    /**
     * 格式化字段值（保留原方法以防需要）
     */
    static formatFieldValue(value: any, componentType: string): string {
        if (value === null || value === undefined) {
            return ''
        }

        switch (componentType) {
            case 'checkbox':
                // 复选框返回选中的选项
                if (Array.isArray(value)) {
                    return value.join(', ')
                }
                return String(value)

            case 'upload':
                // 文件上传返回文件名列表
                if (Array.isArray(value)) {
                    return value.map(file => {
                        if (file && typeof file === 'object') {
                            const fileName = file.name || file.originalname || '未知文件'
                            const fileSize = file.size ? ` (${(file.size / 1024 / 1024).toFixed(2)}MB)` : ''
                            return `${fileName}${fileSize}`
                        }
                        return String(file)
                    }).join('、')
                }
                return String(value)

            case 'date':
                // 日期格式化
                if (value instanceof Date) {
                    return value.toLocaleDateString('zh-CN')
                }
                return String(value)

            case 'amount':
                // 金额格式化
                if (typeof value === 'number') {
                    return `¥${value.toFixed(2)}`
                }
                return String(value)

            case 'order':
                // 订单格式化 - 生成HTML表格
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        return '暂无订单项';
                    }

                    // 生成HTML表格
                    let tableHtml = `
<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <thead>
        <tr style="background-color: #f5f5f5; border-bottom: 2px solid #e0e0e0;">
            <th style="padding: 12px 8px; text-align: left; border: 1px solid #e0e0e0; font-weight: 500; color: #333;">序号</th>
            <th style="padding: 12px 8px; text-align: left; border: 1px solid #e0e0e0; font-weight: 500; color: #333;">服务名称</th>
            <th style="padding: 12px 8px; text-align: left; border: 1px solid #e0e0e0; font-weight: 500; color: #333;">分类</th>
            <th style="padding: 12px 8px; text-align: right; border: 1px solid #e0e0e0; font-weight: 500; color: #333;">单价</th>
            <th style="padding: 12px 8px; text-align: center; border: 1px solid #e0e0e0; font-weight: 500; color: #333;">数量</th>
            <th style="padding: 12px 8px; text-align: right; border: 1px solid #e0e0e0; font-weight: 500; color: #333;">小计</th>
        </tr>
    </thead>
    <tbody>`;

                    let totalAmount = 0;

                    value.forEach((item, index) => {
                        if (item && typeof item === 'object') {
                            const serviceName = item.服务名称 || item.serviceName || '未知服务';
                            const category = item.分类 || item.categoryName || '未分类';
                            const unitPrice = item.单价 || item.unitPrice || 0;
                            const quantity = item.数量 || item.quantity || 0;
                            const unit = item.单位 || item.unit || '项';
                            const subtotal = item.小计 || item.subtotal || 0;

                            totalAmount += parseFloat(subtotal) || 0;

                            // 行样式 - 交替背景色
                            const rowBg = index % 2 === 0 ? '#ffffff' : '#fafafa';

                            tableHtml += `
        <tr style="background-color: ${rowBg};">
            <td style="padding: 10px 8px; border: 1px solid #e0e0e0; text-align: center; color: #666;">${index + 1}</td>
            <td style="padding: 10px 8px; border: 1px solid #e0e0e0; color: #333; font-weight: 500;">${serviceName}</td>
            <td style="padding: 10px 8px; border: 1px solid #e0e0e0; color: #666;">${category}</td>
            <td style="padding: 10px 8px; border: 1px solid #e0e0e0; text-align: right; color: #333;">¥${parseFloat(unitPrice).toFixed(2)}</td>
            <td style="padding: 10px 8px; border: 1px solid #e0e0e0; text-align: center; color: #333;">${quantity}${unit}</td>
            <td style="padding: 10px 8px; border: 1px solid #e0e0e0; text-align: right; color: #333; font-weight: 500;">¥${parseFloat(subtotal).toFixed(2)}</td>
        </tr>`;
                        }
                    });

                    // 添加总计行
                    tableHtml += `
        <tr style="background-color: #f0f8ff; border-top: 2px solid #1890ff;">
            <td colspan="5" style="padding: 12px 8px; border: 1px solid #e0e0e0; text-align: right; font-weight: 500; color: #333; font-size: 14px;">总计：</td>
            <td style="padding: 12px 8px; border: 1px solid #e0e0e0; text-align: right; font-weight: 500; color: #1890ff; font-size: 14px;">¥${totalAmount.toFixed(2)}</td>
        </tr>
    </tbody>
</table>`;

                    return tableHtml;
                }
                return String(value)

            default:
                // 其他类型直接转字符串
                if (typeof value === 'object') {
                    return JSON.stringify(value)
                }
                return String(value)
        }
    }
}
