/**
 * HTML生成器 - 负责生成各种HTML内容
 */
export class HtmlGenerator {
    /**
     * 生成文件列表HTML
     */
    static generateFileList(files: any[]): string {
        if (!Array.isArray(files) || files.length === 0) {
            return '暂无文件';
        }

        // 生成文件列表HTML - 适应邮件容器宽度
        let fileListHtml = `
<div style="width: 100%; margin: 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); overflow: hidden; border: 1px solid #e8e8e8;">
    <div style="padding: 28px 40px 24px; background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); border-bottom: 1px solid #e8e8e8;">
        <h3 style="margin: 0; font-size: 20px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px;">附件文件</h3>
        <p style="margin: 6px 0 0; font-size: 14px; color: #666; font-weight: 400; opacity: 0.8;">File Attachments · 共 ${files.length} 个文件 · 已作为邮件附件发送</p>
    </div>
    <div style="padding: 0;">`;

        files.forEach((file, index) => {
            if (file && typeof file === 'object') {
                const fileName = file.name || '未知文件';
                const fileSize = file.size ? (file.size / 1024 / 1024).toFixed(2) : '0';
                const fileType = file.type || '';

                // 根据文件类型获取线性SVG图标（内联SVG更兼容邮件客户端）
                const svgIcon = this.getFileTypeIcon(fileType);

                // 文件行样式
                const borderBottom = index < files.length - 1 ? 'border-bottom: 1px solid #f5f5f5;' : '';

                fileListHtml += `
        <div style="padding: 24px 40px; display: flex; align-items: center; ${borderBottom} transition: background-color 0.2s ease;">
            <div style="width: 24px; height: 24px; margin-right: 20px; display: flex; align-items: center; justify-content: center;">
                ${svgIcon}
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-size: 14px; font-weight: 500; color: #1a1a1a; line-height: 1.4; word-break: break-all; margin-bottom: 6px;">${fileName}</div>
                <div style="font-size: 14px; color: #888; font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; letter-spacing: 0.5px;">${fileSize} MB</div>
            </div>
        </div>`;
            }
        });

        fileListHtml += `
    </div>
</div>`;

        return fileListHtml;
    }

    /**
     * 生成报价单HTML表格
     */
    static generateQuotationTable(quotationData: any): string {
        if (!quotationData || typeof quotationData !== 'object') {
            return '暂无报价单数据';
        }

        const services = quotationData.services || [];
        const description = quotationData.description || '';

        if (!Array.isArray(services) || services.length === 0) {
            return `
<div style="width: 100%; margin: 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); overflow: hidden; border: 1px solid #e8e8e8;">
    <div style="padding: 28px 40px 24px; background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); border-bottom: 1px solid #e8e8e8;">
        <h3 style="margin: 0; font-size: 20px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px;">报价单</h3>
        <p style="margin: 6px 0 0; font-size: 14px; color: #666; font-weight: 400; opacity: 0.8;">Service Quotation · 暂无服务项目</p>
    </div>
    <div style="padding: 40px; text-align: center; color: #999;">
        <p style="margin: 0; font-size: 14px;">该报价单暂无服务项目</p>
    </div>
</div>`;
        }

        // 按分类分组服务项目
        const servicesByCategory = this.groupServicesByCategory(services);

        // 生成极简风格的HTML表格卡片 - 适应邮件容器宽度
        let tableHtml = `
<div style="width: 100%; margin: 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); overflow: hidden; border: 1px solid #e8e8e8;">
    <div style="padding: 28px 40px 24px; background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); border-bottom: 1px solid #e8e8e8;">
        <h3 style="margin: 0; font-size: 20px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px;">报价单</h3>
        <p style="margin: 6px 0 0; font-size: 14px; color: #666; font-weight: 400; opacity: 0.8;">Service Quotation${description ? ' · ' + description : ''}</p>
    </div>`;

        // 为每个分类生成一个表格区块
        Object.entries(servicesByCategory).forEach(([categoryName, categoryServices], categoryIndex) => {
            const isLastCategory = categoryIndex === Object.keys(servicesByCategory).length - 1;

            tableHtml += `
    <div style="margin-bottom: ${isLastCategory ? '0' : '24px'};">
        <div style="padding: 20px 40px 16px; background: #f8f9fa; border-bottom: 1px solid #e9ecef;">
            <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #495057; letter-spacing: 0.5px;">${categoryName}</h4>
        </div>
        <table style="width: 100%; border-collapse: collapse; background: #ffffff;">
            <thead>
                <tr style="background: #ffffff; border-bottom: 1px solid #f0f0f0;">
                    <th style="padding: 20px 32px; text-align: left; font-size: 14px; font-weight: 500; color: #555; text-transform: uppercase; letter-spacing: 1px; width: 25%;">服务项目</th>
                    <th style="padding: 20px 32px; text-align: right; font-size: 14px; font-weight: 500; color: #555; text-transform: uppercase; letter-spacing: 1px; width: 20%;">单价</th>
                    <th style="padding: 20px 32px; text-align: left; font-size: 14px; font-weight: 500; color: #555; text-transform: uppercase; letter-spacing: 1px; width: 55%;">价格说明</th>
                </tr>
            </thead>
            <tbody>`;

            categoryServices.forEach((service, index) => {
                if (service && typeof service === 'object') {
                    const serviceName = service.serviceName || service.name || '未知服务';
                    const rawPriceDescription = service.renderedPriceDescription || service.priceDescription || service.description || '—';
                    const unitPrice = parseFloat(service.unitPrice || service.price || 0);
                    const unit = service.unit || '项'; // 使用实际的单位字段，默认为"项"

                    // 格式化价格说明 - 处理换行和结构化显示
                    const formattedPriceDescription = this.formatPriceDescription(rawPriceDescription);

                    // 极简行样式
                    const isLast = index === categoryServices.length - 1;
                    const borderBottom = isLast ? 'none' : '1px solid #f5f5f5';

                    tableHtml += `
                <tr style="border-bottom: ${borderBottom}; transition: background-color 0.2s ease;">
                    <td style="padding: 24px 32px; font-size: 14px; color: #1a1a1a; font-weight: 500; line-height: 1.4;">${serviceName}</td>
                    <td style="padding: 24px 32px; text-align: right; font-size: 15px; color: #333; font-weight: 500; font-family: 'SF Mono', Monaco, monospace;">¥${unitPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/${unit}</td>
                    <td style="padding: 24px 32px; font-size: 13px; color: #666; font-weight: 400; line-height: 1.6; word-wrap: break-word;">${formattedPriceDescription}</td>
                </tr>`;
                }
            });

            tableHtml += `
            </tbody>
        </table>
    </div>`;
        });

        tableHtml += `
</div>`;

        return tableHtml;
    }

    /**
     * 生成订单HTML表格
     */
    static generateOrderTable(orderItems: any[]): string {
        if (!Array.isArray(orderItems) || orderItems.length === 0) {
            return '暂无订单项';
        }

        // 生成极简风格的HTML表格卡片 - 适应邮件容器宽度
        let tableHtml = `
<div style="width: 100%; margin: 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); overflow: hidden; border: 1px solid #e8e8e8;">
    <div style="padding: 28px 40px 24px; background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); border-bottom: 1px solid #e8e8e8;">
        <h3 style="margin: 0; font-size: 20px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px;">订单明细</h3>
        <p style="margin: 6px 0 0; font-size: 14px; color: #666; font-weight: 400; opacity: 0.8;">Order Details</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; background: #ffffff;">
        <thead>
            <tr style="background: #ffffff; border-bottom: 1px solid #f0f0f0;">
                <th style="padding: 20px 32px; text-align: center; font-size: 14px; font-weight: 500; color: #555; text-transform: uppercase; letter-spacing: 1px; width: 50px;">No.</th>
                <th style="padding: 20px 32px; text-align: left; font-size: 14px; font-weight: 500; color: #555; text-transform: uppercase; letter-spacing: 1px;">服务项目</th>
                <th style="padding: 20px 32px; text-align: left; font-size: 14px; font-weight: 500; color: #555; text-transform: uppercase; letter-spacing: 1px; width: 90px;">分类</th>
                <th style="padding: 20px 32px; text-align: right; font-size: 14px; font-weight: 500; color: #555; text-transform: uppercase; letter-spacing: 1px; width: 100px;">单价</th>
                <th style="padding: 20px 32px; text-align: center; font-size: 14px; font-weight: 500; color: #555; text-transform: uppercase; letter-spacing: 1px; width: 60px;">数量</th>
                <th style="padding: 20px 32px; text-align: right; font-size: 14px; font-weight: 500; color: #555; text-transform: uppercase; letter-spacing: 1px; width: 120px;">小计</th>
            </tr>
        </thead>
        <tbody>`;

        let totalAmount = 0;

        orderItems.forEach((item, index) => {
            if (item && typeof item === 'object') {
                const serviceName = item.服务名称 || item.serviceName || '未知服务';
                const category = item.分类 || item.categoryName || '未分类';
                const unitPrice = parseFloat(item.单价 || item.unitPrice || 0);
                const quantity = item.数量 || item.quantity || 0;
                const unit = item.单位 || item.unit || '项';
                const subtotal = parseFloat(item.小计 || item.subtotal || 0);

                totalAmount += subtotal;

                // 极简行样式
                const isLast = index === orderItems.length - 1;
                const borderBottom = isLast ? 'none' : '1px solid #f5f5f5';

                tableHtml += `
            <tr style="border-bottom: ${borderBottom}; transition: background-color 0.2s ease;">
                <td style="padding: 24px 32px; text-align: center; font-size: 14px; color: #999; font-weight: 500;">${String(index + 1).padStart(2, '0')}</td>
                <td style="padding: 24px 32px; font-size: 14px; color: #1a1a1a; font-weight: 500; line-height: 1.4;">${serviceName}</td>
                <td style="padding: 24px 32px; font-size: 13px; color: #666; font-weight: 400;">${category}</td>
                <td style="padding: 24px 32px; text-align: right; font-size: 15px; color: #333; font-weight: 500; font-family: 'SF Mono', Monaco, monospace;">¥${unitPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="padding: 24px 32px; text-align: center; font-size: 14px; color: #666; font-weight: 500;">${quantity}<span style="font-size: 12px; color: #999; margin-left: 3px;">${unit}</span></td>
                <td style="padding: 24px 32px; text-align: right; font-size: 14px; color: #1a1a1a; font-weight: 700; font-family: 'SF Mono', Monaco, monospace;">¥${subtotal.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>`;
            }
        });

        // 添加总计行
        tableHtml += `
        </tbody>
    </table>
    <div style="padding: 32px 40px; background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); border-top: 1px solid #e8e8e8;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-size: 14px; color: #555; font-weight: 500; margin-bottom: 6px; letter-spacing: 0.5px;">订单总额</div>
                <div style="font-size: 14px; color: #888; opacity: 0.8;">Total Amount</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 28px; font-weight: 800; color: #1a1a1a; font-family: 'SF Mono', Monaco, monospace; letter-spacing: -1px;">¥${totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div style="font-size: 14px; color: #888; margin-top: 4px; opacity: 0.7;">含税价格</div>
            </div>
        </div>
    </div>
</div>`;

        return tableHtml;
    }

    /**
     * 包装邮件内容到1200px容器中
     */
    static wrapEmailContent(content: string): string {
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>表单通知</title>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            min-height: 100vh;
        }
        .email-container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            box-shadow: 0 16px 64px rgba(0, 0, 0, 0.1);
            border-radius: 16px;
            overflow: hidden;
            margin-top: 40px;
            margin-bottom: 40px;
        }
        .email-content { 
            padding: 60px 80px; 
            line-height: 1.7; 
            color: #333; 
            font-size: 14px;
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .email-container { 
                margin: 20px; 
                border-radius: 12px; 
            }
            .email-content { 
                padding: 40px 32px; 
                font-size: 15px;
            }
        }
        @media (max-width: 480px) {
            .email-container { 
                margin: 10px; 
                border-radius: 8px; 
            }
            .email-content { 
                padding: 24px 20px; 
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-content">
            ${content}
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * 格式化价格说明 - 将原有换行符转换为HTML换行
     */
    private static formatPriceDescription(description: string): string {
        if (!description || description === '—') {
            return '—';
        }

        // 直接将换行符转换为HTML换行标签，保持原有的分行结构
        return description
            .replace(/\r\n/g, '<br/>')  // Windows换行符
            .replace(/\n/g, '<br/>')    // Unix换行符
            .replace(/\r/g, '<br/>');   // Mac换行符
    }

    /**
     * 按分类分组服务项目
     */
    private static groupServicesByCategory(services: any[]): Record<string, any[]> {
        const grouped: Record<string, any[]> = {};

        services.forEach(service => {
            if (service && typeof service === 'object') {
                const category = service.categoryName || service.category || '其他服务';

                if (!grouped[category]) {
                    grouped[category] = [];
                }

                grouped[category].push(service);
            }
        });

        return grouped;
    }

    /**
     * 根据文件类型获取SVG图标
     */
    private static getFileTypeIcon(fileType: string): string {
        if (fileType.startsWith('image/')) {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>';
        } else if (fileType.includes('pdf')) {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>';
        } else if (fileType.includes('word') || fileType.includes('document')) {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1976d2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>';
        } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#388e3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><path d="M8,13h8"/><path d="M8,17h8"/><path d="M8,9h2"/></svg>';
        } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f57c00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><path d="M9,17v-4h3a2 2 0 0 0 0-4H9"/></svg>';
        } else if (fileType.includes('zip') || fileType.includes('archive')) {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#795548" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21,8 21,21 3,21 3,8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>';
        } else {
            // 默认文档图标
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>';
        }
    }
}
