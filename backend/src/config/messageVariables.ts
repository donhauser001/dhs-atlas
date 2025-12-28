/**
 * 消息模板变量配置
 * 定义各个业务模块可用的变量
 */

export interface VariableDefinition {
    key: string;
    label: string;
    description: string;
    example: string;
    dataType: 'string' | 'number' | 'date' | 'boolean' | 'object';
    required?: boolean;
}

export interface VariableCategory {
    label: string;
    description: string;
    variables: VariableDefinition[];
}

export const MESSAGE_VARIABLES: Record<string, VariableCategory> = {
    // 项目相关变量
    project: {
        label: '项目相关',
        description: '项目创建、更新、删除等场景的可用变量',
        variables: [
            // 基本信息
            {
                key: 'projectId',
                label: '项目ID',
                description: '项目的唯一标识符',
                example: '507f1f77bcf86cd799439011',
                dataType: 'string',
                required: true
            },
            {
                key: 'projectName',
                label: '项目名称',
                description: '项目的完整名称',
                example: '某某公司网站设计项目',
                dataType: 'string',
                required: true
            },
            {
                key: 'clientId',
                label: '客户ID',
                description: '客户的唯一标识符',
                example: '507f1f77bcf86cd799439012',
                dataType: 'string',
                required: true
            },
            {
                key: 'clientName',
                label: '客户名称',
                description: '项目对应的客户名称',
                example: '某某科技有限公司',
                dataType: 'string',
                required: true
            },
            {
                key: 'contactNames',
                label: '联系人姓名',
                description: '客户方联系人姓名列表',
                example: '张总、李经理',
                dataType: 'string'
            },
            {
                key: 'contactPhones',
                label: '联系人电话',
                description: '客户方联系人电话列表',
                example: '13900139000、13800138000',
                dataType: 'string'
            },

            // 团队信息
            {
                key: 'undertakingTeam',
                label: '承接团队',
                description: '负责项目的团队名称',
                example: '设计一部',
                dataType: 'string',
                required: true
            },
            {
                key: 'mainDesigners',
                label: '主创设计师',
                description: '项目主创设计师列表',
                example: '张三、李四',
                dataType: 'string'
            },
            {
                key: 'assistantDesigners',
                label: '助理设计师',
                description: '项目助理设计师列表',
                example: '王五、赵六',
                dataType: 'string'
            },

            // 状态管理
            {
                key: 'progressStatus',
                label: '项目进度状态',
                description: '项目当前的进度状态',
                example: 'in-progress',
                dataType: 'string',
                required: true
            },
            {
                key: 'progressStatusText',
                label: '项目进度状态文本',
                description: '项目进度状态的中文描述',
                example: '进行中',
                dataType: 'string'
            },
            {
                key: 'settlementStatus',
                label: '结算状态',
                description: '项目的结算状态',
                example: 'partial-paid',
                dataType: 'string',
                required: true
            },
            {
                key: 'settlementStatusText',
                label: '结算状态文本',
                description: '结算状态的中文描述',
                example: '部分结算',
                dataType: 'string'
            },

            // 时间管理
            {
                key: 'createdAt',
                label: '创建时间',
                description: '项目创建的时间',
                example: '2024-01-01 10:30:00',
                dataType: 'date',
                required: true
            },
            {
                key: 'startedAt',
                label: '开始时间',
                description: '项目开始进行的时间',
                example: '2024-01-02 09:00:00',
                dataType: 'date'
            },
            {
                key: 'deliveredAt',
                label: '交付时间',
                description: '项目完全交付的时间',
                example: '2024-03-01 18:00:00',
                dataType: 'date'
            },
            {
                key: 'settledAt',
                label: '结算时间',
                description: '项目完全结算的时间',
                example: '2024-03-15 14:30:00',
                dataType: 'date'
            },

            // 业务信息
            {
                key: 'clientRequirements',
                label: '客户需求',
                description: '客户的具体需求和嘱托',
                example: '需要现代简约风格，突出科技感',
                dataType: 'string'
            },
            {
                key: 'quotationId',
                label: '报价单ID',
                description: '关联的报价单标识符',
                example: '507f1f77bcf86cd799439013',
                dataType: 'string'
            },
            {
                key: 'remark',
                label: '项目备注',
                description: '项目的备注信息',
                example: '客户要求加急处理',
                dataType: 'string'
            },

            // 关联任务信息
            {
                key: 'taskIds',
                label: '任务ID列表',
                description: '项目关联的所有任务ID',
                example: '507f1f77bcf86cd799439015,507f1f77bcf86cd799439016',
                dataType: 'string'
            },
            {
                key: 'taskNames',
                label: '任务名称列表',
                description: '项目关联的所有任务名称',
                example: 'UI界面设计,数据库设计,前端开发',
                dataType: 'string'
            },
            {
                key: 'taskCount',
                label: '任务数量',
                description: '项目关联的任务总数',
                example: '8',
                dataType: 'number'
            },
            // 关联文件信息
            {
                key: 'fileIds',
                label: '文件ID列表',
                description: '项目关联的所有文件ID',
                example: '507f1f77bcf86cd799439017,507f1f77bcf86cd799439018',
                dataType: 'string'
            },
            {
                key: 'fileNames',
                label: '文件名称列表',
                description: '项目关联的所有文件名称',
                example: '设计稿v1.0.psd,需求文档.docx,原型图.sketch',
                dataType: 'string'
            },
            {
                key: 'fileCount',
                label: '文件数量',
                description: '项目关联的文件总数',
                example: '25',
                dataType: 'number'
            },

            // 关联合同信息
            {
                key: 'contractIds',
                label: '合同ID列表',
                description: '项目关联的所有合同ID',
                example: '507f1f77bcf86cd799439019,507f1f77bcf86cd799439020',
                dataType: 'string'
            },
            {
                key: 'contractNumbers',
                label: '合同编号列表',
                description: '项目关联的所有合同编号',
                example: 'HT2024001,HT2024002',
                dataType: 'string'
            },
            {
                key: 'contractCount',
                label: '合同数量',
                description: '项目关联的合同总数',
                example: '2',
                dataType: 'number'
            },

            // 关联发票信息
            {
                key: 'invoiceIds',
                label: '发票ID列表',
                description: '项目关联的所有发票ID',
                example: '507f1f77bcf86cd799439021,507f1f77bcf86cd799439022',
                dataType: 'string'
            },
            {
                key: 'invoiceNumbers',
                label: '发票编号列表',
                description: '项目关联的所有发票编号',
                example: 'INV2024001,INV2024002,INV2024003',
                dataType: 'string'
            },
            {
                key: 'invoiceCount',
                label: '发票数量',
                description: '项目关联的发票总数',
                example: '3',
                dataType: 'number'
            },

            // 关联方案信息
            {
                key: 'proposalIds',
                label: '方案ID列表',
                description: '项目关联的所有方案/提案ID',
                example: '507f1f77bcf86cd799439023,507f1f77bcf86cd799439024',
                dataType: 'string'
            },
            {
                key: 'proposalTitles',
                label: '方案标题列表',
                description: '项目关联的所有方案/提案标题',
                example: '初步设计方案,优化设计方案,最终设计方案',
                dataType: 'string'
            },
            {
                key: 'proposalCount',
                label: '方案数量',
                description: '项目关联的方案/提案总数',
                example: '4',
                dataType: 'number'
            },
            {
                key: 'logCount',
                label: '日志数量',
                description: '项目关联的日志总数',
                example: '15',
                dataType: 'number'
            },

            // 兼容旧版本字段
            {
                key: 'creatorName',
                label: '创建者姓名',
                description: '项目创建者的姓名',
                example: '张三',
                dataType: 'string'
            }
        ]
    },

    // 任务相关变量
    task: {
        label: '任务相关',
        description: '任务分配、状态更新等场景的可用变量',
        variables: [
            {
                key: 'taskName',
                label: '任务名称',
                description: '任务的完整名称',
                example: 'UI界面设计',
                dataType: 'string',
                required: true
            },
            {
                key: 'taskId',
                label: '任务ID',
                description: '任务的唯一标识符',
                example: '507f1f77bcf86cd799439013',
                dataType: 'string',
                required: true
            },
            {
                key: 'taskDescription',
                label: '任务描述',
                description: '任务的详细描述',
                example: '设计产品主页的UI界面，包括导航栏、轮播图等',
                dataType: 'string'
            },
            {
                key: 'taskStatus',
                label: '任务状态',
                description: '任务当前的状态',
                example: '进行中',
                dataType: 'string'
            },
            {
                key: 'taskPriority',
                label: '任务优先级',
                description: '任务的优先级别',
                example: '高',
                dataType: 'string'
            },
            {
                key: 'assignerName',
                label: '分配者姓名',
                description: '分配任务的人员姓名',
                example: '项目经理李四',
                dataType: 'string'
            },
            {
                key: 'assigneeName',
                label: '执行者姓名',
                description: '被分配任务的人员姓名',
                example: '设计师张三',
                dataType: 'string'
            },
            {
                key: 'dueDate',
                label: '截止日期',
                description: '任务的截止日期',
                example: '2024-01-15',
                dataType: 'date'
            },
            {
                key: 'estimatedHours',
                label: '预计工时',
                description: '任务预计需要的工作时间',
                example: '8',
                dataType: 'number'
            },
            {
                key: 'projectName',
                label: '所属项目',
                description: '任务所属的项目名称',
                example: '某某公司网站设计项目',
                dataType: 'string'
            },
            {
                key: 'projectId',
                label: '项目ID',
                description: '任务所属项目的ID',
                example: '507f1f77bcf86cd799439011',
                dataType: 'string'
            }
        ]
    },

    // 用户相关变量
    user: {
        label: '用户相关',
        description: '用户注册、权限变更等场景的可用变量',
        variables: [
            {
                key: 'username',
                label: '用户名',
                description: '用户的登录名或显示名',
                example: 'zhangsan',
                dataType: 'string',
                required: true
            },
            {
                key: 'userId',
                label: '用户ID',
                description: '用户的唯一标识符',
                example: '507f1f77bcf86cd799439014',
                dataType: 'string',
                required: true
            },
            {
                key: 'realName',
                label: '真实姓名',
                description: '用户的真实姓名',
                example: '张三',
                dataType: 'string'
            },
            {
                key: 'email',
                label: '邮箱地址',
                description: '用户的邮箱地址',
                example: 'zhangsan@example.com',
                dataType: 'string'
            },
            {
                key: 'phone',
                label: '手机号码',
                description: '用户的手机号码',
                example: '13800138000',
                dataType: 'string'
            },
            {
                key: 'role',
                label: '用户角色',
                description: '用户在系统中的角色',
                example: '设计师',
                dataType: 'string'
            },
            {
                key: 'department',
                label: '所属部门',
                description: '用户所属的部门',
                example: '设计部',
                dataType: 'string'
            },
            {
                key: 'joinDate',
                label: '入职日期',
                description: '用户的入职日期',
                example: '2024-01-01',
                dataType: 'date'
            }
        ]
    },

    // 客户相关变量
    client: {
        label: '客户相关',
        description: '客户管理、合同签署等场景的可用变量',
        variables: [
            {
                key: 'clientName',
                label: '客户名称',
                description: '客户的公司或个人名称',
                example: '某某科技有限公司',
                dataType: 'string',
                required: true
            },
            {
                key: 'clientId',
                label: '客户ID',
                description: '客户的唯一标识符',
                example: '507f1f77bcf86cd799439015',
                dataType: 'string',
                required: true
            },
            {
                key: 'contactPerson',
                label: '联系人',
                description: '客户方的主要联系人',
                example: '王总',
                dataType: 'string'
            },
            {
                key: 'contactPhone',
                label: '联系电话',
                description: '客户的联系电话',
                example: '13900139000',
                dataType: 'string'
            },
            {
                key: 'contactEmail',
                label: '联系邮箱',
                description: '客户的联系邮箱',
                example: 'contact@client.com',
                dataType: 'string'
            },
            {
                key: 'clientType',
                label: '客户类型',
                description: '客户的分类类型',
                example: '企业客户',
                dataType: 'string'
            },
            {
                key: 'industry',
                label: '所属行业',
                description: '客户所在的行业',
                example: '互联网科技',
                dataType: 'string'
            }
        ]
    },

    // 合同相关变量
    contract: {
        label: '合同相关',
        description: '合同签署、审批等场景的可用变量',
        variables: [
            {
                key: 'contractNumber',
                label: '合同编号',
                description: '合同的唯一编号',
                example: 'HT2024010001',
                dataType: 'string',
                required: true
            },
            {
                key: 'contractTitle',
                label: '合同标题',
                description: '合同的标题或名称',
                example: '网站设计服务合同',
                dataType: 'string'
            },
            {
                key: 'contractAmount',
                label: '合同金额',
                description: '合同的总金额',
                example: '50000',
                dataType: 'number'
            },
            {
                key: 'signDate',
                label: '签署日期',
                description: '合同签署的日期',
                example: '2024-01-01',
                dataType: 'date'
            },
            {
                key: 'effectiveDate',
                label: '生效日期',
                description: '合同生效的日期',
                example: '2024-01-01',
                dataType: 'date'
            },
            {
                key: 'expiryDate',
                label: '到期日期',
                description: '合同到期的日期',
                example: '2024-12-31',
                dataType: 'date'
            }
        ]
    },

    // 系统相关变量
    // 财务相关变量
    finance: {
        label: '财务相关',
        description: '收款、付款、发票等财务场景的可用变量',
        variables: [
            {
                key: 'invoiceNumber',
                label: '发票编号',
                description: '发票的唯一编号',
                example: 'INV2024010001',
                dataType: 'string',
                required: true
            },
            {
                key: 'amount',
                label: '金额',
                description: '交易或发票金额',
                example: '50000',
                dataType: 'number'
            },
            {
                key: 'currency',
                label: '币种',
                description: '金额的币种',
                example: 'CNY',
                dataType: 'string'
            },
            {
                key: 'paymentMethod',
                label: '支付方式',
                description: '付款的方式',
                example: '银行转账',
                dataType: 'string'
            },
            {
                key: 'dueDate',
                label: '到期日期',
                description: '付款到期日期',
                example: '2024-02-01',
                dataType: 'date'
            },
            {
                key: 'paidDate',
                label: '付款日期',
                description: '实际付款日期',
                example: '2024-01-25',
                dataType: 'date'
            }
        ]
    },

    // 价格相关变量
    pricing: {
        label: '价格相关',
        description: '报价单、价格策略等场景的可用变量',
        variables: [
            {
                key: 'quotationNumber',
                label: '报价单号',
                description: '报价单的唯一编号',
                example: 'QUO2024010001',
                dataType: 'string',
                required: true
            },
            {
                key: 'totalAmount',
                label: '总金额',
                description: '报价单总金额',
                example: '80000',
                dataType: 'number'
            },
            {
                key: 'validUntil',
                label: '有效期至',
                description: '报价单有效期',
                example: '2024-02-01',
                dataType: 'date'
            },
            {
                key: 'discountRate',
                label: '折扣率',
                description: '应用的折扣率',
                example: '10%',
                dataType: 'string'
            },
            {
                key: 'serviceItems',
                label: '服务项目',
                description: '报价包含的服务项目',
                example: '网站设计, UI设计, 前端开发',
                dataType: 'string'
            }
        ]
    },

    // 表单相关变量
    form: {
        label: '表单相关',
        description: '表单提交、审核等场景的可用变量',
        variables: [
            {
                key: 'formName',
                label: '表单名称',
                description: '表单的名称',
                example: '客户需求调研表',
                dataType: 'string',
                required: true
            },
            {
                key: 'formId',
                label: '表单ID',
                description: '表单的唯一标识符',
                example: '507f1f77bcf86cd799439015',
                dataType: 'string',
                required: true
            },
            {
                key: 'submitterName',
                label: '提交者姓名',
                description: '提交表单的用户姓名',
                example: '张三',
                dataType: 'string'
            },
            {
                key: 'submitTime',
                label: '提交时间',
                description: '表单提交的时间',
                example: '2024-01-01 14:30:00',
                dataType: 'date'
            },
            {
                key: 'reviewStatus',
                label: '审核状态',
                description: '表单的审核状态',
                example: '待审核',
                dataType: 'string'
            }
        ]
    },

    // 内容相关变量
    content: {
        label: '内容相关',
        description: '文章、内容管理等场景的可用变量',
        variables: [
            {
                key: 'articleTitle',
                label: '文章标题',
                description: '文章的标题',
                example: '设计趋势分析报告',
                dataType: 'string',
                required: true
            },
            {
                key: 'articleId',
                label: '文章ID',
                description: '文章的唯一标识符',
                example: '507f1f77bcf86cd799439016',
                dataType: 'string',
                required: true
            },
            {
                key: 'authorName',
                label: '作者姓名',
                description: '文章作者的姓名',
                example: '李编辑',
                dataType: 'string'
            },
            {
                key: 'publishDate',
                label: '发布日期',
                description: '文章发布的日期',
                example: '2024-01-01',
                dataType: 'date'
            },
            {
                key: 'category',
                label: '文章分类',
                description: '文章所属的分类',
                example: '设计资讯',
                dataType: 'string'
            }
        ]
    },

    // 文件相关变量
    file: {
        label: '文件相关',
        description: '文件上传、共享等场景的可用变量',
        variables: [
            {
                key: 'fileName',
                label: '文件名称',
                description: '文件的名称',
                example: '设计方案.psd',
                dataType: 'string',
                required: true
            },
            {
                key: 'fileSize',
                label: '文件大小',
                description: '文件的大小',
                example: '25.6MB',
                dataType: 'string'
            },
            {
                key: 'fileType',
                label: '文件类型',
                description: '文件的类型',
                example: 'PSD文件',
                dataType: 'string'
            },
            {
                key: 'uploadTime',
                label: '上传时间',
                description: '文件上传的时间',
                example: '2024-01-01 16:30:00',
                dataType: 'date'
            },
            {
                key: 'uploaderName',
                label: '上传者',
                description: '上传文件的用户姓名',
                example: '设计师王五',
                dataType: 'string'
            }
        ]
    },

    // 组织相关变量
    organization: {
        label: '组织相关',
        description: '部门、企业等组织管理场景的可用变量',
        variables: [
            {
                key: 'departmentName',
                label: '部门名称',
                description: '部门的名称',
                example: '设计部',
                dataType: 'string',
                required: true
            },
            {
                key: 'departmentId',
                label: '部门ID',
                description: '部门的唯一标识符',
                example: '507f1f77bcf86cd799439017',
                dataType: 'string',
                required: true
            },
            {
                key: 'managerName',
                label: '部门经理',
                description: '部门经理的姓名',
                example: '张经理',
                dataType: 'string'
            },
            {
                key: 'employeeCount',
                label: '员工数量',
                description: '部门的员工数量',
                example: '15',
                dataType: 'number'
            },
            {
                key: 'enterpriseName',
                label: '企业名称',
                description: '企业的名称',
                example: '某某设计有限公司',
                dataType: 'string'
            }
        ]
    },

    system: {
        label: '系统相关',
        description: '系统通知、维护公告等场景的可用变量',
        variables: [
            {
                key: 'systemName',
                label: '系统名称',
                description: '系统的名称',
                example: '设计业务管理系统',
                dataType: 'string'
            },
            {
                key: 'currentDate',
                label: '当前日期',
                description: '系统当前日期',
                example: '2024-01-01',
                dataType: 'date'
            },
            {
                key: 'currentTime',
                label: '当前时间',
                description: '系统当前时间',
                example: '10:30:00',
                dataType: 'string'
            },
            {
                key: 'currentDateTime',
                label: '当前日期时间',
                description: '系统当前的完整日期时间',
                example: '2024-01-01 10:30:00',
                dataType: 'date'
            },
            {
                key: 'companyName',
                label: '公司名称',
                description: '使用系统的公司名称',
                example: '某某设计有限公司',
                dataType: 'string'
            },
            {
                key: 'supportEmail',
                label: '技术支持邮箱',
                description: '系统技术支持的邮箱地址',
                example: 'support@company.com',
                dataType: 'string'
            },
            {
                key: 'supportPhone',
                label: '技术支持电话',
                description: '系统技术支持的电话号码',
                example: '400-123-4567',
                dataType: 'string'
            }
        ]
    }
};

/**
 * 根据业务类型获取相关变量
 */
export function getVariablesByBusinessType(businessType: string): VariableCategory[] {
    const typeMapping: Record<string, string[]> = {
        'project_creation': ['project', 'user', 'client', 'system'],
        'project_update': ['project', 'user', 'system'],
        'project_deletion': ['project', 'user', 'system'],
        'task_assignment': ['task', 'project', 'user', 'system'],
        'task_status_change': ['task', 'project', 'user', 'system'],
        'user_registration': ['user', 'system'],
        'user_role_change': ['user', 'system'],
        'contract_signing': ['contract', 'client', 'project', 'user', 'system'],
        'contract_approval': ['contract', 'client', 'user', 'system'],
        'system_maintenance': ['system'],
        'system_notification': ['system', 'user']
    };

    const categoryKeys = typeMapping[businessType] || ['system'];
    return categoryKeys.map(key => MESSAGE_VARIABLES[key]).filter(Boolean);
}

/**
 * 获取所有可用变量
 */
export function getAllVariables(): VariableCategory[] {
    return Object.values(MESSAGE_VARIABLES);
}

/**
 * 根据分类获取变量
 */
export function getVariablesByCategory(categoryKey: string): VariableCategory | null {
    return MESSAGE_VARIABLES[categoryKey] || null;
}

// 兼容导出
export const AVAILABLE_VARIABLES = MESSAGE_VARIABLES;
