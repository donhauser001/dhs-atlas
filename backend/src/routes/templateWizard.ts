import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 简化的业务模块数据
const BUSINESS_MODULES = [
    { key: 'client', label: '客户管理', description: '客户信息、联系人、合作状态等相关业务', icon: 'UserOutlined' },
    { key: 'project', label: '项目管理', description: '项目创建、进度更新、状态变更等', icon: 'ProjectOutlined' },
    { key: 'finance', label: '财务管理', description: '收款、付款、发票、财务审批等', icon: 'DollarOutlined' },
    { key: 'pricing', label: '价格管理', description: '报价单、价格策略、成本核算等', icon: 'TagOutlined' },
    { key: 'contract', label: '合同管理', description: '合同签署、审批、到期提醒等', icon: 'FileTextOutlined' },
    { key: 'form', label: '表单管理', description: '表单提交、审核、数据处理等', icon: 'FormOutlined' },
    { key: 'content', label: '内容管理', description: '文章发布、内容审核、SEO优化等', icon: 'BookOutlined' },
    { key: 'file', label: '文件管理', description: '文件上传、共享、版本控制等', icon: 'FolderOutlined' },
    { key: 'user', label: '用户管理', description: '用户注册、权限变更、账户状态等', icon: 'TeamOutlined' },
    { key: 'organization', label: '组织管理', description: '部门调整、企业信息、组织架构等', icon: 'ApartmentOutlined' },
    { key: 'system', label: '系统管理', description: '系统维护、安全告警、性能监控等', icon: 'SettingOutlined' }
];

const TRIGGER_CONDITIONS = {
    'client': [
        { key: 'create', label: '新建', description: '当创建新客户时触发' },
        { key: 'update', label: '更新', description: '当客户信息更新时触发' },
        { key: 'status_change', label: '状态变更', description: '当客户状态发生变化时触发' }
    ],
    'project': [
        { key: 'create', label: '新建', description: '当创建新项目时触发' },
        { key: 'update', label: '更新', description: '当项目信息更新时触发' },
        { key: 'status_change', label: '状态变更', description: '当项目状态发生变化时触发' },
        { key: 'milestone', label: '里程碑达成', description: '当项目达到重要里程碑时触发' },
        { key: 'team_change', label: '团队变更', description: '当项目团队成员发生变化时触发' }
    ],
    'finance': [
        { key: 'payment_received', label: '收款确认', description: '当收到客户付款时触发' },
        { key: 'payment_due', label: '付款到期', description: '当付款即将到期时触发' },
        { key: 'invoice_generated', label: '发票生成', description: '当系统生成发票时触发' }
    ]
};

const SEND_TARGETS = [
    { key: 'message', label: '站内消息', description: '发送到系统消息中心', icon: 'MessageOutlined', enabled: true },
    { key: 'email', label: '邮件通知', description: '发送到用户邮箱', icon: 'MailOutlined', enabled: true },
    { key: 'push', label: '推送通知', description: '发送浏览器推送通知', icon: 'BellOutlined', enabled: true }
];

const PRIORITY_LEVELS = [
    { key: 'URGENT', label: '紧急', description: '需要立即处理的重要消息', color: '#ff4d4f', level: 4 },
    { key: 'HIGH', label: '高', description: '重要消息，需要优先处理', color: '#fa8c16', level: 3 },
    { key: 'MEDIUM', label: '中', description: '普通消息', color: '#1890ff', level: 2 },
    { key: 'LOW', label: '低', description: '一般性通知消息', color: '#52c41a', level: 1 }
];

const RECIPIENT_RULES = [
    { key: 'specific_user', label: '指定用户', description: '发送给特定的用户', type: 'user' },
    { key: 'user_variable', label: '用户变量', description: '根据业务数据中的用户字段动态确定接收者', type: 'variable' },
    { key: 'role_based', label: '角色用户', description: '发送给特定角色的所有用户', type: 'role' },
    { key: 'admin_only', label: '仅管理员', description: '只发送给系统管理员', type: 'admin' }
];

// 获取所有业务模块
router.get('/business-modules', authenticateToken, (req: any, res: any) => {
    try {
        res.json({
            success: true,
            data: BUSINESS_MODULES
        });
    } catch (error) {
        console.error('获取业务模块失败:', error);
        res.status(500).json({
            success: false,
            message: '获取业务模块失败'
        });
    }
});

// 根据业务模块获取触发条件
router.get('/business-modules/:moduleKey/triggers', authenticateToken, (req: any, res: any) => {
    try {
        const { moduleKey } = req.params;
        const triggers = (TRIGGER_CONDITIONS as any)[moduleKey] || [];

        res.json({
            success: true,
            data: triggers
        });
    } catch (error) {
        console.error('获取触发条件失败:', error);
        res.status(500).json({
            success: false,
            message: '获取触发条件失败'
        });
    }
});

// 根据业务模块获取相关变量
router.get('/business-modules/:moduleKey/variables', authenticateToken, (req: any, res: any) => {
    try {
        const { moduleKey } = req.params;

        // 根据业务模块返回相关的变量分类
        const moduleVariableMapping: Record<string, any[]> = {
            'client': [
                {
                    label: '客户相关',
                    description: '客户信息、联系人等相关变量',
                    variables: [
                        { key: 'clientName', label: '客户名称', description: '客户的公司或个人名称', example: '某某科技有限公司', dataType: 'string', required: true },
                        { key: 'contactPerson', label: '联系人', description: '客户方的主要联系人', example: '王总', dataType: 'string' },
                        { key: 'contactPhone', label: '联系电话', description: '客户的联系电话', example: '13900139000', dataType: 'string' }
                    ]
                },
                {
                    label: '用户相关',
                    description: '操作用户相关变量',
                    variables: [
                        { key: 'username', label: '用户名', description: '用户的登录名或显示名', example: 'zhangsan', dataType: 'string', required: true },
                        { key: 'realName', label: '真实姓名', description: '用户的真实姓名', example: '张三', dataType: 'string' }
                    ]
                }
            ],
            'project': [
                {
                    label: '项目相关',
                    description: '项目创建、更新、删除等场景的可用变量',
                    variables: [
                        { key: 'projectName', label: '项目名称', description: '项目的完整名称', example: '某某公司网站设计项目', dataType: 'string', required: true },
                        { key: 'projectId', label: '项目ID', description: '项目的唯一标识符', example: '507f1f77bcf86cd799439011', dataType: 'string', required: true },
                        { key: 'clientName', label: '客户名称', description: '项目对应的客户名称', example: '某某科技有限公司', dataType: 'string' },
                        { key: 'creatorName', label: '创建者姓名', description: '项目创建者的姓名', example: '张三', dataType: 'string' },
                        { key: 'createdAt', label: '创建时间', description: '项目创建的时间', example: '2024-01-01 10:30:00', dataType: 'date' }
                    ]
                }
            ],
            'finance': [
                {
                    label: '财务相关',
                    description: '收款、付款、发票等财务场景的可用变量',
                    variables: [
                        { key: 'invoiceNumber', label: '发票编号', description: '发票的唯一编号', example: 'INV2024010001', dataType: 'string', required: true },
                        { key: 'amount', label: '金额', description: '交易或发票金额', example: '50000', dataType: 'number' },
                        { key: 'paymentMethod', label: '支付方式', description: '付款的方式', example: '银行转账', dataType: 'string' }
                    ]
                }
            ]
        };

        const variables = moduleVariableMapping[moduleKey] || [];

        res.json({
            success: true,
            data: variables
        });
    } catch (error) {
        console.error('获取模块变量失败:', error);
        res.status(500).json({
            success: false,
            message: '获取模块变量失败'
        });
    }
});

// 获取完整的向导配置
router.get('/config', authenticateToken, (req: any, res: any) => {
    try {
        const config = {
            businessModules: BUSINESS_MODULES,
            sendTargets: SEND_TARGETS,
            priorityLevels: PRIORITY_LEVELS,
            recipientRules: RECIPIENT_RULES
        };

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('获取向导配置失败:', error);
        res.status(500).json({
            success: false,
            message: '获取向导配置失败'
        });
    }
});

// 预览模板效果
router.post('/preview', authenticateToken, (req: any, res: any) => {
    try {
        const { messageContent, sampleData = {} } = req.body;

        if (!messageContent?.title || !messageContent?.content) {
            return res.status(400).json({
                success: false,
                message: '请提供消息标题和内容'
            });
        }

        // 简单的变量替换预览
        let previewTitle = messageContent.title;
        let previewContent = messageContent.content;
        let previewSummary = messageContent.summary || '';

        // 替换变量
        Object.entries(sampleData).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            previewTitle = previewTitle.replace(new RegExp(placeholder, 'g'), String(value));
            previewContent = previewContent.replace(new RegExp(placeholder, 'g'), String(value));
            previewSummary = previewSummary.replace(new RegExp(placeholder, 'g'), String(value));
        });

        res.json({
            success: true,
            data: {
                title: previewTitle,
                content: previewContent,
                summary: previewSummary,
                originalData: messageContent,
                sampleData
            }
        });
    } catch (error) {
        console.error('预览模板失败:', error);
        res.status(500).json({
            success: false,
            message: '预览模板失败'
        });
    }
});

export default router;
