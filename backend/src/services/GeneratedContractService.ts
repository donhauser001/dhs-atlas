import GeneratedContract from '../models/GeneratedContract';
import ContractTemplate from '../models/ContractTemplate';
import FormData from '../models/FormData';
import { replacePlaceholders, extractContractDataFromForm } from '../utils/contractUtils';

export interface ContractGenerationData {
    formData?: any; // 从表单数据生成时需要，从表单提交记录生成时可选
    name?: string;
    description?: string;
    relatedIds?: any;
}

export class GeneratedContractService {
    /**
     * 从模板生成合同
     */
    static async generateFromTemplate(
        templateId: string,
        contractData: ContractGenerationData,
        generatedBy: string
    ) {
        // 获取模板信息
        const template = await ContractTemplate.findById(templateId);
        if (!template) {
            throw new Error('合同模板不存在');
        }

        if (template.status !== 'active') {
            throw new Error('合同模板未启用');
        }

        // 提取合同数据
        const extractedData = extractContractDataFromForm(contractData.formData);

        // 替换占位符生成合同内容
        const generatedContent = replacePlaceholders(template.content, extractedData);

        // 提取客户和项目信息
        const clientInfo = this.extractClientInfo(contractData.formData);
        const projectInfo = this.extractProjectInfo(contractData.formData);

        // 创建生成的合同（先用临时名称）
        const tempName = contractData.name || `基于${template.name}生成的合同`;
        const generatedContract = new GeneratedContract({
            name: tempName,
            description: contractData.description || `由模板"${template.name}"自动生成`,
            templateId,
            content: generatedContent,
            originalPlaceholders: template.placeholders,
            replacedData: extractedData,
            clientInfo,
            projectInfo,
            relatedIds: contractData.relatedIds,
            generatedBy
        });

        await generatedContract.save();

        // 如果没有指定名称，则重新构建合同名称
        if (!contractData.name) {
            const finalContractName = this.buildContractName(contractData.formData, template.name);
            generatedContract.name = finalContractName;
            await generatedContract.save();
        }

        // 返回生成的合同信息（包含内容）
        return await GeneratedContract.findById(generatedContract._id)
            .populate('templateId', 'name category');
    }

    /**
     * 从表单提交记录生成合同
     */
    static async generateFromFormData(
        templateId: string,
        formDataId: string,
        contractData: ContractGenerationData,
        generatedBy: string
    ) {
        // 获取模板信息
        const template = await ContractTemplate.findById(templateId);
        if (!template) {
            throw new Error('合同模板不存在');
        }

        // 获取表单提交记录
        const formSubmission = await FormData.findById(formDataId);
        if (!formSubmission) {
            throw new Error('表单提交记录不存在');
        }

        // 提取合同数据
        const extractedData = extractContractDataFromForm(formSubmission.submissionData);

        // 替换占位符生成合同内容
        const generatedContent = replacePlaceholders(template.content, extractedData);

        // 提取客户和项目信息
        const clientInfo = this.extractClientInfo(formSubmission.submissionData);
        const projectInfo = this.extractProjectInfo(formSubmission.submissionData);

        // 创建生成的合同（先用临时名称）
        const tempName = contractData.name || `基于${template.name}生成的合同`;
        const generatedContract = new GeneratedContract({
            name: tempName,
            description: contractData.description || `由表单提交记录自动生成`,
            templateId,
            formDataId: formDataId,
            content: generatedContent,
            originalPlaceholders: template.placeholders,
            replacedData: extractedData,
            clientInfo,
            projectInfo,
            relatedIds: contractData.relatedIds,
            generatedBy
        });

        await generatedContract.save();

        // 如果没有指定名称，则重新构建合同名称
        if (!contractData.name) {
            const finalContractName = this.buildContractName(formSubmission.submissionData, template.name);
            generatedContract.name = finalContractName;
            await generatedContract.save();
        }

        return await GeneratedContract.findById(generatedContract._id)
            .populate('templateId', 'name category')
            .populate('formDataId', 'formName submittedAt submitterName');
    }

    /**
     * 更新合同信息
     */
    static async updateContract(id: string, updateData: any) {
        // 不允许直接修改的字段
        const restrictedFields = ['templateId', 'formDataId', 'originalPlaceholders', 'generatedBy', 'generateTime'];
        restrictedFields.forEach(field => {
            delete updateData[field];
        });

        updateData.updateTime = new Date();

        const contract = await GeneratedContract.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('templateId', 'name category');

        if (!contract) {
            throw new Error('合同不存在');
        }

        return contract;
    }

    /**
     * 更新合同内容（包括名称、描述、状态和正文）
     */
    static async updateContractContent(id: string, data: {
        name?: string;
        description?: string;
        status?: string;
        content?: string;
    }) {
        const updateData: any = { updateTime: new Date() };

        if (data.name !== undefined) {
            updateData.name = data.name;
        }
        if (data.description !== undefined) {
            updateData.description = data.description;
        }
        if (data.status !== undefined) {
            const validStatuses = ['draft', 'pending', 'signed', 'completed', 'cancelled'];
            if (!validStatuses.includes(data.status)) {
                throw new Error('无效的状态值');
            }
            updateData.status = data.status;

            // 根据状态更新相应的时间字段
            if (data.status === 'signed') {
                updateData.signedTime = new Date();
            } else if (data.status === 'completed') {
                updateData.completedTime = new Date();
            }
        }
        if (data.content !== undefined) {
            updateData.content = data.content;
        }

        const contract = await GeneratedContract.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('templateId', 'name category');

        if (!contract) {
            throw new Error('合同不存在');
        }

        return contract;
    }

    /**
     * 更新合同状态
     */
    static async updateStatus(id: string, status: string) {
        const validStatuses = ['draft', 'pending', 'signed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new Error('无效的状态值');
        }

        const updateData: any = { status, updateTime: new Date() };

        // 根据状态更新相应的时间字段
        if (status === 'signed') {
            updateData.signedTime = new Date();
        } else if (status === 'completed') {
            updateData.completedTime = new Date();
        }

        const contract = await GeneratedContract.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('templateId', 'name category');

        if (!contract) {
            throw new Error('合同不存在');
        }

        return contract;
    }

    /**
     * 删除合同
     */
    static async deleteContract(id: string) {
        const contract = await GeneratedContract.findById(id);
        if (!contract) {
            throw new Error('合同不存在');
        }

        await GeneratedContract.findByIdAndDelete(id);
        return { success: true, message: '合同删除成功' };
    }

    /**
     * 提取客户信息的辅助方法
     */
    private static extractClientInfo(formData: any): any {
        const clientInfo: any = {};

        Object.keys(formData).forEach(key => {
            const value = formData[key];

            // 客户名称
            if (key.includes('clientName') || key.includes('client_name') || key.includes('customerName') || key.includes('customer_name')) {
                clientInfo.name = value;
            }

            // 联系人信息
            if (key.includes('contactName') || key.includes('contact_name')) {
                clientInfo.contactName = value;
            }

            if (key.includes('contactPhone') || key.includes('contact_phone') || key.includes('phone')) {
                clientInfo.phone = value;
            }

            if (key.includes('contactEmail') || key.includes('contact_email') || key.includes('email')) {
                clientInfo.email = value;
            }

            // 公司信息
            if (key.includes('companyName') || key.includes('company_name')) {
                clientInfo.companyName = value;
            }

            if (key.includes('address')) {
                clientInfo.address = value;
            }
        });

        return Object.keys(clientInfo).length > 0 ? clientInfo : undefined;
    }

    /**
     * 提取项目信息的辅助方法
     */
    private static extractProjectInfo(formData: any): any {
        const projectInfo: any = {};

        Object.keys(formData).forEach(key => {
            const value = formData[key];

            if (key.includes('projectName') || key.includes('project_name')) {
                projectInfo.name = value;
            }

            if (key.includes('instruction') || key.includes('requirements') || key.includes('description')) {
                projectInfo.description = value;
            }

            if (key.includes('amount') || key.includes('total')) {
                if (typeof value === 'number') {
                    projectInfo.amount = value;
                }
            }

            if (key.includes('startDate') || key.includes('start_date')) {
                projectInfo.startDate = new Date(value);
            }

            if (key.includes('endDate') || key.includes('end_date')) {
                projectInfo.endDate = new Date(value);
            }
        });

        return Object.keys(projectInfo).length > 0 ? projectInfo : undefined;
    }

    /**
     * 构建合同名称的辅助方法
     */
    private static buildContractName(formData: any, templateName: string): string {
        const parts: string[] = [];

        console.log('🏗️ 构建合同名称，接收到的表单数据:', formData);

        // 2. 客户名称（甲方名称）
        let customerName = '';
        Object.keys(formData).forEach(key => {
            const value = formData[key];

            // 前端发送的是格式化后的数据，key是label，value是格式化后的文本
            // 检查是否包含甲方信息的字段
            if (key.includes('合同方') || key.includes('甲方') || key.includes('客户') ||
                key.includes('contractParty') || key.includes('client')) {

                // 如果value是格式化后的HTML文本，需要从中提取公司名称
                if (typeof value === 'string' && value.includes('甲方')) {
                    // 匹配HTML格式：<strong>甲方：公司名称</strong> 或 甲方：公司名称
                    let match = value.match(/<strong>甲方[：:]\s*([^<]+)<\/strong>/);
                    if (!match) {
                        // 尝试普通文本格式：甲方：公司名称
                        match = value.match(/甲方[：:]\s*([^\s\n<br/>]+)/);
                    }
                    if (match) {
                        customerName = match[1].trim();
                        console.log('🏢 从合同方字段提取甲方名称:', customerName);
                    }
                }
            }

            // 直接的客户名称字段
            if (key.includes('客户名称') || key.includes('甲方名称') ||
                key.includes('customerName') || key.includes('clientName')) {
                customerName = value;
                console.log('🏢 找到客户名称:', customerName);
            }
        });
        if (customerName) {
            parts.push(customerName);
        }

        // 3. 项目名称
        let projectName = '';
        Object.keys(formData).forEach(key => {
            const value = formData[key];
            if (key.includes('项目名称') || key.includes('项目') ||
                key.includes('projectName') || key.includes('project_name')) {
                projectName = value;
                console.log('🎯 找到项目名称:', projectName);
            }
        });
        if (projectName) {
            parts.push(projectName);
        }

        // 4. 合同名称
        let contractName = '';
        Object.keys(formData).forEach(key => {
            const value = formData[key];
            if (key.includes('合同名称') || key.includes('合同标题') ||
                key.includes('contractName') || key.includes('contract_name')) {
                contractName = value;
                console.log('📄 找到合同名称:', contractName);
            }
        });
        if (contractName) {
            parts.push(contractName);
        }

        // 如果没有找到任何字段，使用模板名称作为后备
        if (parts.length === 0) {
            parts.push(`基于${templateName}生成的合同`);
        }

        const finalName = parts.join('-');
        console.log('✅ 最终生成的合同名称:', finalName);
        console.log('📝 命名格式: 甲方名称-项目名称-合同名称 (已移除编号)');

        return finalName;
    }
}
