import path from 'path';
import fs from 'fs';
import { IForm } from '../../../models/Form';
import { IFormData } from '../../../models/FormData';
import { PlaceholderData, EmailAttachment } from '../types';

/**
 * 附件处理器 - 负责处理邮件附件
 */
export class AttachmentHandler {
    /**
     * 准备邮件附件
     */
    static async prepareEmailAttachments(
        data: PlaceholderData, 
        form?: IForm, 
        formData?: IFormData
    ): Promise<EmailAttachment[]> {
        const attachments: EmailAttachment[] = [];

        try {
            console.log('🔍 开始准备邮件附件，检查原始表单数据');

            // 如果有原始表单数据，直接从中提取文件信息
            if (formData && formData.submissionData) {
                console.log('🔍 从原始表单数据中查找文件组件');

                // 遍历原始提交数据
                for (const [componentId, componentData] of Object.entries(formData.submissionData)) {
                    if (componentData && typeof componentData === 'object' && 'type' in componentData) {
                        const { type, value } = componentData as any;

                        console.log(`🔍 检查组件 ${componentId} (${type}):`, {
                            type,
                            valueType: typeof value,
                            isArray: Array.isArray(value),
                            length: Array.isArray(value) ? value.length : 'N/A'
                        });

                        // 检查是否是文件上传组件
                        if (type === 'upload' && Array.isArray(value) && value.length > 0) {
                            console.log(`📎 发现文件上传组件: ${componentId}, 文件数量: ${value.length}`);
                            console.log(`📎 文件数据:`, value);

                            // 处理每个文件
                            for (const file of value) {
                                try {
                                    const attachment = await this.createEmailAttachment(file);
                                    if (attachment) {
                                        attachments.push(attachment);
                                    }
                                } catch (error) {
                                    console.error(`处理文件附件失败: ${file.name || 'unknown'}`, error);
                                    // 继续处理其他文件，不因为一个文件失败而停止
                                }
                            }
                        }
                    }
                }
            } else {
                console.log('🔍 原始表单数据不可用，回退到占位符数据检查');

                // 回退到原来的逻辑（检查占位符数据）
                for (const [key, value] of Object.entries(data)) {
                    if (Array.isArray(value) && value.length > 0) {
                        const firstItem = value[0];
                        if (firstItem && typeof firstItem === 'object' && firstItem.name && firstItem.size && firstItem.url) {
                            console.log(`📎 发现文件上传字段: ${key}, 文件数量: ${value.length}`);

                            for (const file of value) {
                                try {
                                    const attachment = await this.createEmailAttachment(file);
                                    if (attachment) {
                                        attachments.push(attachment);
                                    }
                                } catch (error) {
                                    console.error(`处理文件附件失败: ${file.name}`, error);
                                }
                            }
                        }
                    }
                }
            }

            if (attachments.length > 0) {
                console.log(`✅ 成功准备 ${attachments.length} 个邮件附件`);
            }

        } catch (error) {
            console.error('准备邮件附件时出错:', error);
            // 不抛出错误，允许邮件发送继续进行，即使没有附件
        }

        return attachments;
    }

    /**
     * 创建单个邮件附件
     */
    private static async createEmailAttachment(fileData: any): Promise<EmailAttachment | null> {
        try {
            const fileName = fileData.name || fileData.originalname;
            // 文件URL可能在不同的位置，优先检查response.data.url
            const fileUrl = fileData.url || (fileData.response && fileData.response.data && fileData.response.data.url);

            console.log('🔍 创建邮件附件 - 文件信息:', {
                fileName,
                fileUrl,
                hasResponse: !!fileData.response,
                responseData: fileData.response?.data
            });

            if (!fileName || !fileUrl) {
                console.warn('文件信息不完整，跳过:', {
                    fileName,
                    fileUrl,
                    fileData: JSON.stringify(fileData, null, 2)
                });
                return null;
            }

            // 从URL构建文件路径
            // URL格式通常是: /uploads/forms/general/filename 或 /uploads/forms/{formId}/filename
            const relativePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
            const filePath = path.join(__dirname, '../../../../', relativePath);

            // 检查文件是否存在
            if (!fs.existsSync(filePath)) {
                console.warn(`文件不存在，跳过: ${filePath}`);
                return null;
            }

            // 获取文件统计信息
            const stats = fs.statSync(filePath);
            if (!stats.isFile()) {
                console.warn(`路径不是文件，跳过: ${filePath}`);
                return null;
            }

            console.log(`📎 准备附件: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);

            // 创建nodemailer附件对象
            return {
                filename: fileName,
                path: filePath,
                cid: `attachment_${Date.now()}_${Math.random().toString(36).substring(7)}` // 可选的Content-ID
            };

        } catch (error) {
            console.error('创建邮件附件失败:', error);
            return null;
        }
    }
}
