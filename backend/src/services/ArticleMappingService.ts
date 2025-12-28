import { IForm } from '../models/Form';
import { IUser } from '../models/User';

export interface FormSubmissionData {
    [key: string]: any;
}

export interface ArticleCreationData {
    title: string;
    content: string;
    author: string;
    authorId: string;
    summary?: string;
    category: string; // ArticleCategory的ObjectId字符串
    tags?: string[];
    publishTime?: Date;
    coverImage?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    status?: 'draft' | 'published' | 'archived';
    isTop?: boolean;
    isRecommend?: boolean;
    submittedBy?: string;
}

export class ArticleMappingService {
    /**
     * 根据表单配置和提交数据创建文章数据
     */
    static async mapFormDataToArticle(
        form: IForm,
        submissionData: FormSubmissionData,
        submitter?: any
    ): Promise<ArticleCreationData | null> {
        const articleConfig = form.settings?.article;

        // 检查是否启用文章创建
        if (!articleConfig?.enableArticleCreation || !articleConfig.fieldMappings) {
            return null;
        }

        const { fieldMappings } = articleConfig;
        const articleData: Partial<ArticleCreationData> = {};

        try {
            console.log('🔍 文章映射开始，配置信息:', JSON.stringify(fieldMappings, null, 2));
            console.log('🔍 提交数据:', JSON.stringify(submissionData, null, 2));
            console.log('🔍 提交用户:', submitter ? { id: submitter._id, name: submitter.realName || submitter.username } : 'null');

            // 1. 映射文章标题（必填）
            if (fieldMappings.title) {
                articleData.title = this.extractFieldValue(submissionData, fieldMappings.title);
                console.log('🔍 文章标题映射结果:', articleData.title);
                if (!articleData.title) {
                    throw new Error('文章标题不能为空');
                }
            } else {
                throw new Error('未配置文章标题字段');
            }

            // 2. 映射文章内容（必填）
            if (fieldMappings.content) {
                articleData.content = this.extractFieldValue(submissionData, fieldMappings.content);
                console.log('🔍 文章内容映射结果:', articleData.content ? '已获取内容' : '内容为空');
                if (!articleData.content) {
                    throw new Error('文章内容不能为空');
                }
            } else {
                throw new Error('未配置文章内容字段');
            }

            // 3. 映射文章作者
            if (fieldMappings.author) {
                const authorData = await this.mapAuthorData(fieldMappings.author, submissionData, submitter);
                if (authorData) {
                    articleData.author = authorData.authorName;
                    articleData.authorId = authorData.authorId;
                }
            } else if (submitter) {
                // 默认使用提交用户作为作者
                articleData.author = submitter.realName || submitter.username;
                articleData.authorId = submitter._id?.toString();
            }

            // 4. 映射文章摘要（可选）
            if (fieldMappings.summary) {
                articleData.summary = this.extractFieldValue(submissionData, fieldMappings.summary);
            }

            // 5. 映射文章分类（必填）
            if (fieldMappings.category) {
                const categoryData = this.extractFieldValue(submissionData, fieldMappings.category);
                console.log('🔍 文章分类原始数据:', categoryData);

                if (categoryData) {
                    if (typeof categoryData === 'string') {
                        // 直接是分类ID字符串
                        articleData.category = categoryData;
                    } else if (typeof categoryData === 'object') {
                        // 从分类组件对象中提取分类ID
                        articleData.category = categoryData._id || categoryData.id || categoryData.value;
                    }
                }

                console.log('🔍 文章分类映射结果:', articleData.category);

                if (!articleData.category) {
                    throw new Error('文章分类不能为空');
                }
            } else {
                throw new Error('未配置文章分类字段');
            }

            // 6. 映射文章标签（可选）
            if (fieldMappings.tags) {
                const tagsData = this.extractFieldValue(submissionData, fieldMappings.tags);
                if (tagsData) {
                    if (Array.isArray(tagsData)) {
                        articleData.tags = tagsData;
                    } else if (typeof tagsData === 'string') {
                        // 支持逗号分隔的标签字符串
                        articleData.tags = tagsData.split(',').map(tag => tag.trim()).filter(tag => tag);
                    }
                }
            }

            // 7. 映射发布时间（可选）
            if (fieldMappings.publishTime) {
                const publishTimeData = this.extractFieldValue(submissionData, fieldMappings.publishTime);
                if (publishTimeData) {
                    articleData.publishTime = new Date(publishTimeData);
                }
            }

            // 8. 映射封面图片（可选）
            if (fieldMappings.coverImage) {
                const coverImageData = this.extractFieldValue(submissionData, fieldMappings.coverImage);
                if (coverImageData) {
                    if (typeof coverImageData === 'object' && coverImageData.url) {
                        articleData.coverImage = coverImageData.url;
                    } else if (typeof coverImageData === 'string') {
                        articleData.coverImage = coverImageData;
                    } else if (Array.isArray(coverImageData) && coverImageData.length > 0) {
                        // 处理文件上传组件返回的文件数组
                        const firstFile = coverImageData[0];
                        if (firstFile && firstFile.url) {
                            articleData.coverImage = firstFile.url;
                        }
                    }
                }
            }

            // 9. 映射SEO信息（可选）
            if (fieldMappings.seo) {
                const seoData = this.extractFieldValue(submissionData, fieldMappings.seo);
                if (seoData && typeof seoData === 'object') {
                    articleData.seoTitle = seoData.title || seoData.seoTitle;
                    articleData.seoDescription = seoData.description || seoData.seoDescription;
                    articleData.seoKeywords = seoData.keywords || seoData.seoKeywords;
                }
            }

            // 10. 设置文章状态
            articleData.status = articleConfig.autoPublish ? 'published' : 'draft';

            // 11. 记录提交者
            if (submitter) {
                articleData.submittedBy = submitter._id?.toString() || submitter.userId || 'unknown';
            }

            return articleData as ArticleCreationData;

        } catch (error) {
            console.error('文章数据映射失败:', error);
            throw error;
        }
    }

    /**
     * 映射作者数据
     */
    private static async mapAuthorData(
        authorConfig: { type: 'component' | 'submitter'; value?: string },
        submissionData: FormSubmissionData,
        submitter?: any
    ): Promise<{ authorId: string; authorName: string } | null> {

        if (authorConfig.type === 'submitter' && submitter) {
            // 使用提交用户作为作者
            return {
                authorId: submitter._id?.toString() || submitter.userId || 'unknown',
                authorName: submitter.realName || submitter.username || '未知作者'
            };

        } else if (authorConfig.type === 'component' && authorConfig.value) {
            // 从表单组件中获取作者信息
            const authorData = this.extractFieldValue(submissionData, authorConfig.value);
            if (authorData) {
                if (typeof authorData === 'object') {
                    // 处理作者对象
                    return {
                        authorId: authorData.authorId || authorData.id || 'unknown',
                        authorName: authorData.authorName || authorData.name || '未知作者'
                    };
                } else if (typeof authorData === 'string') {
                    // 处理简单的作者名称字符串
                    return {
                        authorId: 'author_' + authorData.replace(/\s+/g, '_'),
                        authorName: authorData
                    };
                }
            }
        }

        return null;
    }



    /**
     * 从提交数据中提取字段值
     */
    private static extractFieldValue(submissionData: FormSubmissionData, fieldId: string): any {
        // 直接通过字段ID获取值
        if (submissionData.hasOwnProperty(fieldId)) {
            const componentData = submissionData[fieldId];
            // 如果是组件对象，提取其value字段
            if (componentData && typeof componentData === 'object' && componentData.value !== undefined) {
                return componentData.value;
            }
            return componentData;
        }

        // 尝试在嵌套对象中查找
        for (const key in submissionData) {
            const value = submissionData[key];
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                if (value.hasOwnProperty(fieldId)) {
                    const componentData = value[fieldId];
                    // 如果是组件对象，提取其value字段
                    if (componentData && typeof componentData === 'object' && componentData.value !== undefined) {
                        return componentData.value;
                    }
                    return componentData;
                }
            }
        }

        return null;
    }

    /**
     * 验证文章创建所需的必填字段
     */
    static validateArticleData(articleData: Partial<ArticleCreationData>): string[] {
        const errors: string[] = [];

        if (!articleData.title) {
            errors.push('文章标题不能为空');
        }

        if (!articleData.content) {
            errors.push('文章内容不能为空');
        }

        if (!articleData.author) {
            errors.push('文章作者不能为空');
        }

        if (!articleData.authorId) {
            errors.push('文章作者ID不能为空');
        }

        if (!articleData.category) {
            errors.push('文章分类不能为空');
        }

        return errors;
    }
}
