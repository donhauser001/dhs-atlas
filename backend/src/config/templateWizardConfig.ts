/**
 * 消息模板向导配置
 * 定义业务模块、触发条件、接收对象等配置
 */

// 业务模块定义
export interface BusinessModule {
    key: string;
    label: string;
    description: string;
    icon: string;
    variables: string[]; // 关联的变量分类
    triggers: string[]; // 支持的触发条件
}

// 触发条件定义
export interface TriggerCondition {
    key: string;
    label: string;
    description: string;
    eventType: string;
    modules: string[]; // 适用的业务模块
}

// 接收对象规则
export interface RecipientRule {
    key: string;
    label: string;
    description: string;
    type: 'specific_user' | 'user_variable' | 'role_based' | 'department' | 'admin_only';
    config?: any;
}

// 业务模块配置
export const BUSINESS_MODULES: Record<string, BusinessModule> = {
    client: {
        key: 'client',
        label: '客户管理',
        description: '客户信息、联系人、合作状态等相关业务',
        icon: 'UserOutlined',
        variables: ['client', 'user', 'system'],
        triggers: ['create', 'update', 'delete', 'status_change', 'contact_add']
    },
    project: {
        key: 'project',
        label: '项目管理',
        description: '项目创建、进度更新、状态变更等',
        icon: 'ProjectOutlined',
        variables: ['project', 'client', 'user', 'system'],
        triggers: ['create', 'update', 'delete', 'status_change', 'milestone', 'team_change']
    },
    finance: {
        key: 'finance',
        label: '财务管理',
        description: '收款、付款、发票、财务审批等',
        icon: 'DollarOutlined',
        variables: ['finance', 'project', 'client', 'user', 'system'],
        triggers: ['payment_received', 'payment_due', 'invoice_generated', 'approval_required']
    },
    pricing: {
        key: 'pricing',
        label: '价格管理',
        description: '报价单、价格策略、成本核算等',
        icon: 'TagOutlined',
        variables: ['pricing', 'project', 'client', 'system'],
        triggers: ['quote_created', 'price_updated', 'quote_approved', 'quote_expired']
    },
    contract: {
        key: 'contract',
        label: '合同管理',
        description: '合同签署、审批、到期提醒等',
        icon: 'FileTextOutlined',
        variables: ['contract', 'client', 'project', 'user', 'system'],
        triggers: ['create', 'sign', 'approve', 'reject', 'expire_soon', 'expired']
    },
    form: {
        key: 'form',
        label: '表单管理',
        description: '表单提交、审核、数据处理等',
        icon: 'FormOutlined',
        variables: ['form', 'user', 'system'],
        triggers: ['submit', 'approve', 'reject', 'data_export']
    },
    content: {
        key: 'content',
        label: '内容管理',
        description: '文章发布、内容审核、SEO优化等',
        icon: 'BookOutlined',
        variables: ['content', 'user', 'system'],
        triggers: ['publish', 'update', 'delete', 'review_required', 'seo_alert']
    },
    file: {
        key: 'file',
        label: '文件管理',
        description: '文件上传、共享、版本控制等',
        icon: 'FolderOutlined',
        variables: ['file', 'user', 'project', 'system'],
        triggers: ['upload', 'share', 'version_update', 'access_granted', 'storage_alert']
    },
    user: {
        key: 'user',
        label: '用户管理',
        description: '用户注册、权限变更、账户状态等',
        icon: 'TeamOutlined',
        variables: ['user', 'system'],
        triggers: ['register', 'login', 'logout', 'role_change', 'permission_change', 'account_locked']
    },
    organization: {
        key: 'organization',
        label: '组织管理',
        description: '部门调整、企业信息、组织架构等',
        icon: 'ApartmentOutlined',
        variables: ['organization', 'user', 'system'],
        triggers: ['department_create', 'department_update', 'staff_transfer', 'org_restructure']
    },
    system: {
        key: 'system',
        label: '系统管理',
        description: '系统维护、安全告警、性能监控等',
        icon: 'SettingOutlined',
        variables: ['system', 'user'],
        triggers: ['maintenance', 'security_alert', 'performance_alert', 'backup_complete', 'update_available']
    }
};

// 触发条件配置
export const TRIGGER_CONDITIONS: Record<string, TriggerCondition> = {
    // 通用触发条件
    create: {
        key: 'create',
        label: '新建',
        description: '当创建新记录时触发',
        eventType: 'create',
        modules: ['client', 'project', 'contract', 'form', 'content', 'file', 'user']
    },
    update: {
        key: 'update',
        label: '更新',
        description: '当记录信息更新时触发',
        eventType: 'update',
        modules: ['client', 'project', 'contract', 'content', 'file']
    },
    delete: {
        key: 'delete',
        label: '删除',
        description: '当删除记录时触发',
        eventType: 'delete',
        modules: ['client', 'project', 'contract', 'content', 'file']
    },
    status_change: {
        key: 'status_change',
        label: '状态变更',
        description: '当状态发生变化时触发',
        eventType: 'status_change',
        modules: ['client', 'project', 'contract', 'user']
    },

    // 项目相关
    milestone: {
        key: 'milestone',
        label: '里程碑达成',
        description: '当项目达到重要里程碑时触发',
        eventType: 'milestone',
        modules: ['project']
    },
    team_change: {
        key: 'team_change',
        label: '团队变更',
        description: '当项目团队成员发生变化时触发',
        eventType: 'team_change',
        modules: ['project']
    },

    // 财务相关
    payment_received: {
        key: 'payment_received',
        label: '收款确认',
        description: '当收到客户付款时触发',
        eventType: 'payment_received',
        modules: ['finance']
    },
    payment_due: {
        key: 'payment_due',
        label: '付款到期',
        description: '当付款即将到期时触发',
        eventType: 'payment_due',
        modules: ['finance']
    },
    invoice_generated: {
        key: 'invoice_generated',
        label: '发票生成',
        description: '当系统生成发票时触发',
        eventType: 'invoice_generated',
        modules: ['finance']
    },

    // 合同相关
    sign: {
        key: 'sign',
        label: '合同签署',
        description: '当合同被签署时触发',
        eventType: 'sign',
        modules: ['contract']
    },
    approve: {
        key: 'approve',
        label: '审批通过',
        description: '当审批通过时触发',
        eventType: 'approve',
        modules: ['contract', 'form', 'finance']
    },
    reject: {
        key: 'reject',
        label: '审批拒绝',
        description: '当审批被拒绝时触发',
        eventType: 'reject',
        modules: ['contract', 'form', 'finance']
    },
    expire_soon: {
        key: 'expire_soon',
        label: '即将到期',
        description: '当合同即将到期时触发',
        eventType: 'expire_soon',
        modules: ['contract']
    },

    // 系统相关
    maintenance: {
        key: 'maintenance',
        label: '系统维护',
        description: '当系统进行维护时触发',
        eventType: 'maintenance',
        modules: ['system']
    },
    security_alert: {
        key: 'security_alert',
        label: '安全告警',
        description: '当检测到安全威胁时触发',
        eventType: 'security_alert',
        modules: ['system']
    }
};

// 接收对象规则配置
export const RECIPIENT_RULES: Record<string, RecipientRule> = {
    specific_user: {
        key: 'specific_user',
        label: '指定用户',
        description: '发送给特定的用户',
        type: 'specific_user',
        config: {
            selector: 'user_picker',
            multiple: true
        }
    },
    user_variable: {
        key: 'user_variable',
        label: '用户变量',
        description: '根据业务数据中的用户字段动态确定接收者',
        type: 'user_variable',
        config: {
            variables: ['createdBy', 'assignedTo', 'projectManager', 'clientContact']
        }
    },
    role_based: {
        key: 'role_based',
        label: '角色用户',
        description: '发送给特定角色的所有用户',
        type: 'role_based',
        config: {
            roles: ['超级管理员', '项目经理', '设计师', '财务专员', '客服专员']
        }
    },
    department_based: {
        key: 'department_based',
        label: '部门用户',
        description: '发送给特定部门的所有用户',
        type: 'department',
        config: {
            selector: 'department_picker'
        }
    },
    admin_only: {
        key: 'admin_only',
        label: '仅管理员',
        description: '只发送给系统管理员',
        type: 'admin_only',
        config: {
            roles: ['超级管理员']
        }
    },
    project_team: {
        key: 'project_team',
        label: '项目团队',
        description: '发送给项目相关的所有成员',
        type: 'user_variable',
        config: {
            variables: ['mainDesigners', 'assistantDesigners', 'projectManager']
        }
    }
};

// 发送目标配置
export const SEND_TARGETS = {
    message: {
        key: 'message',
        label: '站内消息',
        description: '发送到系统消息中心',
        icon: 'MessageOutlined',
        enabled: true
    },
    email: {
        key: 'email',
        label: '邮件通知',
        description: '发送到用户邮箱',
        icon: 'MailOutlined',
        enabled: true
    },
    sms: {
        key: 'sms',
        label: '短信通知',
        description: '发送短信到用户手机',
        icon: 'PhoneOutlined',
        enabled: false // 暂未实现
    },
    push: {
        key: 'push',
        label: '推送通知',
        description: '发送浏览器推送通知',
        icon: 'BellOutlined',
        enabled: true
    }
};

// 优先级配置
export const PRIORITY_LEVELS = {
    URGENT: {
        key: 'URGENT',
        label: '紧急',
        description: '需要立即处理的重要消息',
        color: '#ff4d4f',
        level: 4
    },
    HIGH: {
        key: 'HIGH',
        label: '高',
        description: '重要消息，需要优先处理',
        color: '#fa8c16',
        level: 3
    },
    MEDIUM: {
        key: 'MEDIUM',
        label: '中',
        description: '普通消息',
        color: '#1890ff',
        level: 2
    },
    LOW: {
        key: 'LOW',
        label: '低',
        description: '一般性通知消息',
        color: '#52c41a',
        level: 1
    }
};

/**
 * 根据业务模块获取可用的触发条件
 */
export function getTriggersByModule(moduleKey: string): TriggerCondition[] {
    return Object.values(TRIGGER_CONDITIONS).filter(trigger =>
        trigger.modules.includes(moduleKey)
    );
}

/**
 * 根据业务模块获取相关变量
 */
export function getVariablesByModule(moduleKey: string): string[] {
    const module = BUSINESS_MODULES[moduleKey];
    return module ? module.variables : [];
}

/**
 * 获取所有业务模块
 */
export function getAllBusinessModules(): BusinessModule[] {
    return Object.values(BUSINESS_MODULES);
}

/**
 * 获取所有接收对象规则
 */
export function getAllRecipientRules(): RecipientRule[] {
    return Object.values(RECIPIENT_RULES);
}
