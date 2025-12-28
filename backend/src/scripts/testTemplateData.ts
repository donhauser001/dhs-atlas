import mongoose from 'mongoose';
import { MessageTemplate } from '../models/MessageTemplate';

// 导入defaultMessageTemplates
const defaultMessageTemplates = [
    {
        name: '项目创建通知',
        code: 'PROJECT_CREATED',
        description: '当新项目创建时发送的通知消息',
        businessModule: 'project',
        triggerCondition: 'create',
        titleTemplate: '新项目创建：{{projectName}}',
        contentTemplate: '项目 "{{projectName}}" 已创建成功。\n\n项目描述：{{projectDescription}}\n创建时间：{{createdAt}}\n负责人：{{managerName}}\n\n请及时关注项目进展。',
        summaryTemplate: '项目 "{{projectName}}" 已创建，负责人：{{managerName}}',
        sendTargets: ['message', 'push'],
        recipientRules: [
            {
                type: 'role_based',
                value: 'manager',
                description: '通知所有管理员'
            },
            {
                type: 'user_variable',
                value: '{{managerId}}',
                description: '通知项目负责人'
            }
        ],
        priority: 'HIGH',
        expiresIn: 168, // 7天
        enabled: true,
        version: 1,
        usageCount: 0,
        createdBy: 'system'
    }
];

async function testTemplateData() {
    try {
        console.log('测试模板数据...');
        console.log('defaultMessageTemplates数组长度:', defaultMessageTemplates.length);
        
        if (defaultMessageTemplates.length > 0) {
            const firstTemplate = defaultMessageTemplates[0];
            console.log('第一个模板的详细信息:');
            console.log('name:', firstTemplate.name);
            console.log('code:', firstTemplate.code);
            console.log('businessModule:', firstTemplate.businessModule);
            console.log('triggerCondition:', firstTemplate.triggerCondition);
            console.log('priority:', firstTemplate.priority);
            console.log('recipientRules:', JSON.stringify(firstTemplate.recipientRules, null, 2));
        }
        
        // 连接数据库
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser');
        console.log('数据库连接成功');
        
        // 尝试创建一个模板实例（不保存）
        const template = new MessageTemplate(defaultMessageTemplates[0]);
        console.log('模板实例创建成功');
        console.log('实例数据:', {
            name: template.name,
            code: template.code,
            businessModule: template.businessModule,
            triggerCondition: template.triggerCondition,
            priority: template.priority,
            recipientRules: template.recipientRules
        });
        
        await mongoose.disconnect();
        console.log('测试完成');
        
    } catch (error) {
        console.error('测试失败:', error);
        process.exit(1);
    }
}

testTemplateData();