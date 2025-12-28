/**
 * 合同相关的辅助工具函数
 */
export class ContractHelpers {
    /**
     * 提取关联ID信息的方法
     */
    static extractRelatedIds(formData: any, originalFormData?: any): any {
        const relatedIds: any = {
            clientIds: [],
            contactIds: []
        };

        console.log('🔍 开始提取关联ID信息，表单数据:', formData);
        console.log('🔍 原始表单配置数据:', originalFormData);

        Object.keys(formData).forEach(key => {
            const value = formData[key];

            // 提取项目ID - 支持中英文字段名
            if (key.includes('projectId') || key.includes('project_id') ||
                (key.includes('project') && key.includes('Id')) ||
                key.includes('项目ID') || key.includes('项目id')) {
                if (value && typeof value === 'string') {
                    relatedIds.projectId = value;
                    console.log('📂 找到项目ID:', value);
                }
            }

            // 提取项目选择器组件的数据
            if ((key.includes('projectSelector') || key.includes('项目选择')) && value && typeof value === 'object') {
                if (value.projectId) {
                    relatedIds.projectId = value.projectId;
                    console.log('📂 从项目选择器中找到项目ID:', value.projectId);
                }
            }

            // 从项目名称中尝试匹配项目信息（这需要后续根据名称查找项目ID）
            if (key === '项目名称' || key === 'projectName') {
                // 这里先记录项目名称，后续可以根据名称查找项目ID
                relatedIds.projectName = value;
                console.log('📂 找到项目名称:', value);
            }

            // 提取合同方信息中的客户ID和联系人ID
            if ((key.includes('contractParty') || key === '合同方') && value) {
                console.log('👥 处理合同方数据:', value);

                if (typeof value === 'object') {
                    // 处理对象格式的合同方数据
                    Object.keys(value).forEach(partyKey => {
                        const partyData = value[partyKey];

                        // 跳过我方相关的数据
                        if (partyKey.includes('我方') || partyKey.includes('ourParty') || partyKey.includes('party0')) {
                            return;
                        }

                        if (partyData && typeof partyData === 'object') {
                            // 提取客户ID
                            if (partyData.clientId) {
                                if (!relatedIds.clientIds.includes(partyData.clientId)) {
                                    relatedIds.clientIds.push(partyData.clientId);
                                    console.log('🏢 找到客户ID:', partyData.clientId);
                                }
                            }

                            // 提取联系人ID
                            if (partyData.contactId) {
                                if (!relatedIds.contactIds.includes(partyData.contactId)) {
                                    relatedIds.contactIds.push(partyData.contactId);
                                    console.log('👤 找到联系人ID:', partyData.contactId);
                                }
                            }
                        }
                    });
                } else if (typeof value === 'string') {
                    // 处理HTML格式的合同方数据，提取公司名称用于后续查找
                    console.log('👥 解析HTML格式的合同方数据');

                    // 使用正则表达式提取甲方、乙方等公司名称
                    const partyRegex = /<strong>(甲方|乙方|丙方|丁方)：([^<]+)<\/strong>/g;
                    let match;

                    while ((match = partyRegex.exec(value)) !== null) {
                        const partyType = match[1];
                        const companyName = match[2].trim();

                        // 跳过乙方（通常是我方）
                        if (partyType !== '乙方') {
                            console.log(`🏢 找到${partyType}公司名称:`, companyName);
                            // 记录公司名称，后续可以根据名称查找客户ID
                            if (!relatedIds.clientNames) relatedIds.clientNames = [];
                            if (!relatedIds.clientNames.includes(companyName)) {
                                relatedIds.clientNames.push(companyName);
                            }
                        }
                    }

                    // 提取联系人信息
                    const contactRegex = /联系人：([^<\n]+)/g;
                    let contactMatch;
                    let contactIndex = 0;

                    while ((contactMatch = contactRegex.exec(value)) !== null) {
                        const contactName = contactMatch[1].trim();
                        contactIndex++;

                        // 跳过第二个联系人（通常是我方联系人）
                        if (contactIndex !== 2) {
                            console.log(`👤 找到联系人姓名:`, contactName);
                            // 记录联系人姓名，后续可以根据姓名查找联系人ID
                            if (!relatedIds.contactNames) relatedIds.contactNames = [];
                            if (!relatedIds.contactNames.includes(contactName)) {
                                relatedIds.contactNames.push(contactName);
                            }
                        }
                    }
                }
            }

            // 处理单独的客户和联系人字段（兼容旧格式）
            if (key.includes('Client') && key.includes('Id') && !key.includes('我方') && !key.includes('ourParty')) {
                if (value && typeof value === 'string' && !relatedIds.clientIds.includes(value)) {
                    relatedIds.clientIds.push(value);
                    console.log('🏢 找到单独的客户ID:', value);
                }
            }

            if (key.includes('Contact') && key.includes('Id') && !key.includes('我方') && !key.includes('ourParty')) {
                if (value && typeof value === 'string' && !relatedIds.contactIds.includes(value)) {
                    relatedIds.contactIds.push(value);
                    console.log('👤 找到单独的联系人ID:', value);
                }
            }

            // 从合同方组件的party字段中提取（处理party1ClientData等字段）
            if (key.startsWith('party') && key !== 'party0' && !key.includes('我方')) {
                if (key.includes('ClientData') && value && typeof value === 'object' && value._id) {
                    if (!relatedIds.clientIds.includes(value._id)) {
                        relatedIds.clientIds.push(value._id);
                        console.log('🏢 从party字段找到客户ID:', value._id);
                    }
                }

                if (key.includes('ContactData') && value && typeof value === 'object' && value._id) {
                    if (!relatedIds.contactIds.includes(value._id)) {
                        relatedIds.contactIds.push(value._id);
                        console.log('👤 从party字段找到联系人ID:', value._id);
                    }
                }

                if (key.includes('ContactId') && value && typeof value === 'string') {
                    if (!relatedIds.contactIds.includes(value)) {
                        relatedIds.contactIds.push(value);
                        console.log('👤 从party字段找到联系人ID:', value);
                    }
                }
            }
        });

        // 清理空值
        if (relatedIds.clientIds.length === 0) delete relatedIds.clientIds;
        if (relatedIds.contactIds.length === 0) delete relatedIds.contactIds;
        if (!relatedIds.projectId) delete relatedIds.projectId;

        console.log('✅ 提取到的关联ID信息:', relatedIds);

        return Object.keys(relatedIds).length > 0 ? relatedIds : undefined;
    }

    /**
     * 验证合同状态转换是否有效
     */
    static isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
        const validTransitions: { [key: string]: string[] } = {
            'draft': ['pending', 'cancelled'],
            'pending': ['signed', 'cancelled'],
            'signed': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': ['draft']
        };

        return validTransitions[currentStatus]?.includes(newStatus) || false;
    }

    /**
     * 格式化合同状态显示文本
     */
    static getStatusDisplayText(status: string): string {
        const statusMap: { [key: string]: string } = {
            'draft': '草稿',
            'pending': '待签署',
            'signed': '已签署',
            'completed': '已完成',
            'cancelled': '已取消'
        };

        return statusMap[status] || status;
    }

    /**
     * 生成合同编号
     */
    static generateContractNumber(prefix: string = 'CT'): string {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const timestamp = Date.now().toString().slice(-6);

        return `${prefix}${year}${month}${day}${timestamp}`;
    }

    /**
     * 验证文件类型是否为PDF
     */
    static isPDFFile(filename: string): boolean {
        return filename.toLowerCase().endsWith('.pdf');
    }

    /**
     * 获取文件扩展名
     */
    static getFileExtension(filename: string): string {
        return filename.split('.').pop()?.toLowerCase() || '';
    }

    /**
     * 清理文件名，移除特殊字符
     */
    static sanitizeFileName(filename: string): string {
        // 移除或替换特殊字符
        return filename.replace(/[<>:"/\\|?*]/g, '_').trim();
    }

    /**
     * 格式化文件大小
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 验证合同数据完整性
     */
    static validateContractData(contractData: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!contractData.name || contractData.name.trim() === '') {
            errors.push('合同名称不能为空');
        }

        if (!contractData.content || contractData.content.trim() === '') {
            errors.push('合同内容不能为空');
        }

        if (!contractData.templateId) {
            errors.push('合同模板ID不能为空');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 生成合同摘要
     */
    static generateContractSummary(contract: any): string {
        const parts: string[] = [];

        if (contract.clientInfo?.name) {
            parts.push(`客户：${contract.clientInfo.name}`);
        }

        if (contract.projectInfo?.name) {
            parts.push(`项目：${contract.projectInfo.name}`);
        }

        if (contract.projectInfo?.amount) {
            parts.push(`金额：${contract.projectInfo.amount}`);
        }

        return parts.join(' | ') || '无摘要信息';
    }
}
