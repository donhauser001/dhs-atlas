import GeneratedContract from '../models/GeneratedContract';
import Client from '../models/Client';
import User from '../models/User';
import Project from '../models/Project';

export interface QueryOptions {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    templateId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface RelatedIdsQuery {
    projectId?: string;
    clientId?: string;
    contactId?: string;
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
}

export class ContractQueryService {
    /**
     * 获取合同列表
     */
    static async getContracts(options: QueryOptions) {
        const {
            page = 1,
            limit = 10,
            status,
            search,
            templateId,
            sortBy = 'generateTime',
            sortOrder = 'desc'
        } = options;

        // 构建查询条件
        const query: any = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (templateId) {
            query.templateId = templateId;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { contractNumber: { $regex: search, $options: 'i' } },
                { 'clientInfo.name': { $regex: search, $options: 'i' } },
                { 'projectInfo.name': { $regex: search, $options: 'i' } }
            ];
        }

        // 执行查询
        const skip = (Number(page) - 1) * Number(limit);
        const sort: any = {};
        sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

        const [contracts, total] = await Promise.all([
            GeneratedContract.find(query)
                .populate('templateId', 'name category')
                .populate('formDataId', 'formName submittedAt submitterName')
                .sort(sort)
                .skip(skip)
                .limit(Number(limit))
                .select('-content'), // 列表不返回内容字段
            GeneratedContract.countDocuments(query)
        ]);

        // 为每个合同添加关联名称信息
        const enrichedContracts = await this.enrichContractsWithRelatedNames(contracts);

        return {
            contracts: enrichedContracts,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        };
    }

    /**
     * 根据ID获取合同详情
     */
    static async getContractById(id: string) {
        const contract = await GeneratedContract.findById(id)
            .populate('templateId', 'name category content')
            .populate('formDataId');

        if (!contract) {
            throw new Error('合同不存在');
        }

        return contract;
    }

    /**
     * 根据关联ID获取合同列表
     */
    static async getContractsByRelatedIds(options: RelatedIdsQuery) {
        const { projectId, clientId, contactId } = options;
        const { page = 1, limit = 10, status, search } = options;

        console.log('🔍 查询相关合同，参数:', { projectId, clientId, contactId, status, search });

        // 构建查询条件
        const query: any = {};

        // 根据关联ID构建OR查询
        const orConditions: any[] = [];

        if (projectId) {
            orConditions.push({ 'relatedIds.projectId': projectId });
        }

        if (clientId) {
            orConditions.push({ 'relatedIds.clientIds': { $in: [clientId] } });
        }

        if (contactId) {
            orConditions.push({ 'relatedIds.contactIds': { $in: [contactId] } });
        }

        if (orConditions.length > 0) {
            query.$or = orConditions;
        }

        // 添加状态过滤
        if (status && status !== 'all') {
            query.status = status;
        }

        // 添加搜索过滤
        if (search) {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { contractNumber: { $regex: search, $options: 'i' } },
                    { 'clientInfo.name': { $regex: search, $options: 'i' } },
                    { 'projectInfo.name': { $regex: search, $options: 'i' } }
                ]
            });
        }

        console.log('📊 构建的查询条件:', JSON.stringify(query, null, 2));

        // 分页查询
        const skip = (Number(page) - 1) * Number(limit);
        const contracts = await GeneratedContract.find(query)
            .populate('templateId', 'name category')
            .sort({ generateTime: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await GeneratedContract.countDocuments(query);

        return {
            contracts,
            pagination: {
                current: Number(page),
                pageSize: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        };
    }

    /**
     * 获取合同统计信息
     */
    static async getContractStats() {
        const stats = await GeneratedContract.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    signed: { $sum: { $cond: [{ $eq: ['$status', 'signed'] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
                }
            }
        ]);

        const templateStats = await GeneratedContract.aggregate([
            {
                $group: {
                    _id: '$templateId',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'contracttemplates',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'template'
                }
            },
            {
                $unwind: '$template'
            },
            {
                $project: {
                    templateName: '$template.name',
                    count: 1
                }
            }
        ]);

        return {
            overview: stats[0] || {
                total: 0,
                draft: 0,
                pending: 0,
                signed: 0,
                completed: 0,
                cancelled: 0
            },
            templates: templateStats
        };
    }

    /**
     * 为合同列表添加关联名称信息
     */
    private static async enrichContractsWithRelatedNames(contracts: any[]): Promise<any[]> {
        console.log('🔄 开始为合同列表添加关联名称信息，合同数量:', contracts.length);

        return await Promise.all(contracts.map(async (contract) => {
            const contractObj = contract.toObject ? contract.toObject() : contract;
            console.log('📋 处理合同:', contractObj._id, '关联ID:', contractObj.relatedIds);

            if (contractObj.relatedIds) {
                // 获取客户名称
                if (contractObj.relatedIds.clientIds && contractObj.relatedIds.clientIds.length > 0) {
                    try {
                        const clients = await Client.find({ _id: { $in: contractObj.relatedIds.clientIds } }).select('name');
                        contractObj.relatedIds.clientNames = clients.map((client: any) => client.name);
                    } catch (error) {
                        console.error('获取客户名称失败:', error);
                        contractObj.relatedIds.clientNames = [];
                    }
                }

                // 获取联系人名称
                if (contractObj.relatedIds.contactIds && contractObj.relatedIds.contactIds.length > 0) {
                    try {
                        const contacts = await User.find({ _id: { $in: contractObj.relatedIds.contactIds } }).select('realName name');
                        contractObj.relatedIds.contactNames = contacts.map((contact: any) => contact.realName || contact.name);
                    } catch (error) {
                        console.error('获取联系人名称失败:', error);
                        contractObj.relatedIds.contactNames = [];
                    }
                }

                // 获取项目名称
                if (contractObj.relatedIds.projectId) {
                    console.log('📂 获取项目名称，项目ID:', contractObj.relatedIds.projectId);
                    try {
                        const project = await Project.findById(contractObj.relatedIds.projectId).select('projectName');
                        console.log('📂 查询到的项目:', project);
                        if (project) {
                            contractObj.relatedIds.projectName = project.projectName;
                            console.log('✅ 项目名称设置成功:', project.projectName);
                        } else {
                            console.log('⚠️ 未找到项目ID对应的项目');
                        }
                    } catch (error) {
                        console.error('获取项目名称失败:', error);
                    }
                }
            }

            return contractObj;
        }));
    }
}
