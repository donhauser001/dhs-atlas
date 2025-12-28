import { IForm } from '../models/Form';
import { IUser } from '../models/User';
import { IClient } from '../models/Client';
// 联系人使用用户表，角色为客户

export interface FormSubmissionData {
    [key: string]: any;
}

export interface ProjectCreationData {
    projectName: string;
    clientId: string;
    clientName: string;
    contactIds: string[];
    contactNames: string[];
    contactPhones: string[];
    clientRequirements?: string;
    taskList?: any[];
    submittedBy?: string;
}

export class ProjectMappingService {
    /**
     * 根据表单配置和提交数据创建项目数据
     */
    static async mapFormDataToProject(
        form: IForm,
        submissionData: FormSubmissionData,
        submitter?: IUser
    ): Promise<ProjectCreationData | null> {
        const projectConfig = form.settings?.project;

        // 检查是否启用项目创建
        if (!projectConfig?.enableProjectCreation || !projectConfig.fieldMappings) {
            return null;
        }

        const { fieldMappings } = projectConfig;
        const projectData: Partial<ProjectCreationData> = {};

        try {
            console.log('🔍 项目映射开始，配置信息:', JSON.stringify(fieldMappings, null, 2));
            console.log('🔍 提交数据:', JSON.stringify(submissionData, null, 2));
            console.log('🔍 提交用户:', submitter ? { id: submitter._id, name: submitter.realName || submitter.username, company: submitter.company } : 'null');

            // 1. 映射项目名称
            if (fieldMappings.projectName) {
                projectData.projectName = this.extractFieldValue(submissionData, fieldMappings.projectName);
                console.log('🔍 项目名称映射结果:', projectData.projectName);
                if (!projectData.projectName) {
                    throw new Error('项目名称不能为空');
                }
            } else {
                throw new Error('未配置项目名称字段');
            }

            // 2. 映射客户信息
            if (fieldMappings.client) {

                const clientData = await this.mapClientData(fieldMappings.client, submissionData, submitter);

                if (!clientData) {
                    throw new Error('无法获取客户信息');
                }
                projectData.clientId = clientData.clientId;
                projectData.clientName = clientData.clientName;
            } else {
                throw new Error('未配置客户信息字段');
            }

            // 3. 映射联系人信息
            if (fieldMappings.contacts) {
                const contactData = await this.mapContactData(fieldMappings.contacts, submissionData, submitter);
                if (!contactData || contactData.contactIds.length === 0) {
                    throw new Error('无法获取联系人信息');
                }
                projectData.contactIds = contactData.contactIds;
                projectData.contactNames = contactData.contactNames;
                projectData.contactPhones = contactData.contactPhones;
            } else {
                throw new Error('未配置联系人信息字段');
            }

            // 4. 映射客户嘱托（可选）
            if (fieldMappings.clientInstructions) {
                projectData.clientRequirements = this.extractFieldValue(submissionData, fieldMappings.clientInstructions);
            }

            // 5. 映射任务列表（可选）
            if (fieldMappings.taskList) {
                projectData.taskList = this.extractFieldValue(submissionData, fieldMappings.taskList);
            }

            // 6. 记录提交者
            if (submitter) {
                projectData.submittedBy = submitter._id?.toString() || 'unknown';
            }

            return projectData as ProjectCreationData;

        } catch (error) {
            console.error('项目数据映射失败:', error);
            throw error;
        }
    }

    /**
     * 映射客户数据
     */
    private static async mapClientData(
        clientConfig: { type: 'component' | 'submitter_company'; value?: string },
        submissionData: FormSubmissionData,
        submitter?: IUser
    ): Promise<{ clientId: string; clientName: string } | null> {

        if (clientConfig.type === 'submitter_company' && submitter) {
            // 使用提交用户的单位信息
            const company = submitter.company;
            if (!company) {
                throw new Error('提交用户没有单位信息');
            }

            // 这里可以根据单位名称查找或创建客户记录
            // 暂时使用单位名称作为客户信息
            return {
                clientId: 'company_' + (submitter._id as any)?.toString(),
                clientName: company
            };

        } else if (clientConfig.type === 'component' && clientConfig.value) {
            // 从表单组件中获取客户信息
            const clientData = this.extractFieldValue(submissionData, clientConfig.value);
            if (clientData) {
                if (typeof clientData === 'object') {
                    // 处理客户对象
                    return {
                        clientId: clientData.clientId || clientData.id || 'unknown',
                        clientName: clientData.clientName || clientData.name || clientData.companyName || '未知客户'
                    };
                } else if (typeof clientData === 'string') {
                    // 处理简单的客户名称字符串
                    return {
                        clientId: 'client_' + clientData.replace(/\s+/g, '_'),
                        clientName: clientData
                    };
                }
            }
        }

        return null;
    }

    /**
     * 映射联系人数据
     */
    private static async mapContactData(
        contactConfig: { type: 'component' | 'submitter'; value?: string[] },
        submissionData: FormSubmissionData,
        submitter?: IUser
    ): Promise<{ contactIds: string[]; contactNames: string[]; contactPhones: string[] } | null> {

        if (contactConfig.type === 'submitter' && submitter) {
            // 使用提交用户的个人信息
            return {
                contactIds: [(submitter._id as any)?.toString()],
                contactNames: [submitter.realName || submitter.username || '未知联系人'],
                contactPhones: [submitter.phone || '']
            };

        } else if (contactConfig.type === 'component' && contactConfig.value && contactConfig.value.length > 0) {
            // 从表单组件中获取联系人信息
            const contactIds: string[] = [];
            const contactNames: string[] = [];
            const contactPhones: string[] = [];

            for (const componentId of contactConfig.value) {
                const contactData = this.extractFieldValue(submissionData, componentId);
                if (contactData) {
                    if (Array.isArray(contactData)) {
                        // 处理多个联系人
                        contactData.forEach((contact: any) => {
                            if (contact && typeof contact === 'object') {
                                contactIds.push(contact.contactId || contact.id || 'unknown');
                                contactNames.push(contact.contactName || contact.name || '未知联系人');
                                contactPhones.push(contact.contactPhone || contact.phone || '');
                            }
                        });
                    } else if (typeof contactData === 'object') {
                        // 处理单个联系人对象
                        contactIds.push(contactData.contactId || contactData.id || 'unknown');
                        contactNames.push(contactData.contactName || contactData.name || '未知联系人');
                        contactPhones.push(contactData.contactPhone || contactData.phone || '');
                    } else if (typeof contactData === 'string') {
                        // 处理简单的联系人名称字符串
                        contactIds.push('unknown');
                        contactNames.push(contactData);
                        contactPhones.push(''); // 字符串类型的联系人没有电话信息
                    }
                }
            }

            return {
                contactIds,
                contactNames,
                contactPhones
            };
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
     * 验证项目创建所需的必填字段
     */
    static validateProjectData(projectData: Partial<ProjectCreationData>): string[] {
        const errors: string[] = [];

        if (!projectData.projectName) {
            errors.push('项目名称不能为空');
        }

        if (!projectData.clientId || !projectData.clientName) {
            errors.push('客户信息不完整');
        }

        if (!projectData.contactIds || projectData.contactIds.length === 0) {
            errors.push('联系人信息不能为空');
        }

        if (!projectData.contactNames || projectData.contactNames.length === 0) {
            errors.push('联系人姓名不能为空');
        }

        return errors;
    }
}
