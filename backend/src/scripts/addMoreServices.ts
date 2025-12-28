import mongoose from 'mongoose'
import ServicePricing from '../models/ServicePricing'

// 连接数据库
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/donhauser')
        console.log('✅ MongoDB数据库连接成功')
    } catch (error) {
        console.error('❌ MongoDB数据库连接失败:', error)
        process.exit(1)
    }
}

// 新增的10个服务定价项目
const additionalServices = [
    {
        serviceName: 'UI/UX设计',
        alias: 'UI/UX Design',
        categoryId: 'ui_ux_design',
        categoryName: '界面设计',
        unitPrice: 6000,
        unit: '套',
        priceDescription: '用户界面和用户体验设计',
        link: 'https://example.com/ui-ux-design',
        pricingPolicyIds: ['policy_001', 'policy_002'],
        pricingPolicyNames: ['新客户优惠', '批量折扣'],
        status: 'active' as const
    },
    {
        serviceName: '小程序开发',
        alias: 'Mini Program',
        categoryId: 'mini_program',
        categoryName: '小程序开发',
        unitPrice: 8000,
        unit: '个',
        priceDescription: '微信小程序和支付宝小程序开发',
        link: 'https://example.com/mini-program',
        pricingPolicyIds: ['policy_001'],
        pricingPolicyNames: ['新客户优惠'],
        status: 'active' as const
    },
    {
        serviceName: 'API接口开发',
        alias: 'API Development',
        categoryId: 'api_dev',
        categoryName: '接口开发',
        unitPrice: 3500,
        unit: '个',
        priceDescription: 'RESTful API和GraphQL接口开发',
        link: 'https://example.com/api-development',
        pricingPolicyIds: ['policy_002'],
        pricingPolicyNames: ['批量折扣'],
        status: 'active' as const
    },
    {
        serviceName: '数据库设计',
        alias: 'Database Design',
        categoryId: 'database_design',
        categoryName: '数据库设计',
        unitPrice: 4500,
        unit: '套',
        priceDescription: '数据库架构设计和优化',
        link: 'https://example.com/database-design',
        pricingPolicyIds: ['policy_003'],
        pricingPolicyNames: ['长期合作优惠'],
        status: 'active' as const
    },
    {
        serviceName: '云服务器部署',
        alias: 'Cloud Deployment',
        categoryId: 'cloud_deployment',
        categoryName: '云服务部署',
        unitPrice: 2000,
        unit: '次',
        priceDescription: 'AWS、阿里云等云平台部署服务',
        link: 'https://example.com/cloud-deployment',
        pricingPolicyIds: ['policy_001', 'policy_003'],
        pricingPolicyNames: ['新客户优惠', '长期合作优惠'],
        status: 'active' as const
    },
    {
        serviceName: '性能优化',
        alias: 'Performance Optimization',
        categoryId: 'performance_opt',
        categoryName: '性能优化',
        unitPrice: 5000,
        unit: '次',
        priceDescription: '网站和应用性能优化服务',
        link: 'https://example.com/performance-optimization',
        pricingPolicyIds: ['policy_002'],
        pricingPolicyNames: ['批量折扣'],
        status: 'active' as const
    },
    {
        serviceName: '安全审计',
        alias: 'Security Audit',
        categoryId: 'security_audit',
        categoryName: '安全审计',
        unitPrice: 8000,
        unit: '次',
        priceDescription: '网络安全审计和漏洞检测',
        link: 'https://example.com/security-audit',
        pricingPolicyIds: ['policy_003'],
        pricingPolicyNames: ['长期合作优惠'],
        status: 'active' as const
    },
    {
        serviceName: '技术培训',
        alias: 'Technical Training',
        categoryId: 'tech_training',
        categoryName: '技术培训',
        unitPrice: 1500,
        unit: '小时',
        priceDescription: '技术团队培训和知识转移',
        link: 'https://example.com/technical-training',
        pricingPolicyIds: ['policy_001', 'policy_002'],
        pricingPolicyNames: ['新客户优惠', '批量折扣'],
        status: 'active' as const
    },
    {
        serviceName: '项目咨询',
        alias: 'Project Consulting',
        categoryId: 'project_consulting',
        categoryName: '项目咨询',
        unitPrice: 3000,
        unit: '天',
        priceDescription: '技术项目咨询和规划服务',
        link: 'https://example.com/project-consulting',
        pricingPolicyIds: ['policy_003'],
        pricingPolicyNames: ['长期合作优惠'],
        status: 'active' as const
    },
    {
        serviceName: '第三方集成',
        alias: 'Third-party Integration',
        categoryId: 'third_party_integration',
        categoryName: '第三方集成',
        unitPrice: 4000,
        unit: '个',
        priceDescription: '第三方API和系统集成服务',
        link: 'https://example.com/third-party-integration',
        pricingPolicyIds: ['policy_001', 'policy_002'],
        pricingPolicyNames: ['新客户优惠', '批量折扣'],
        status: 'active' as const
    }
]

// 插入新增数据
const insertData = async () => {
    try {
        for (const serviceData of additionalServices) {
            const service = new ServicePricing(serviceData)
            await service.save()
            console.log(`✅ 创建服务定价: ${serviceData.serviceName}`)
        }

        console.log('✅ 所有新增服务定价数据插入成功')
    } catch (error) {
        console.error('❌ 插入服务定价数据失败:', error)
    }
}

// 主函数
const main = async () => {
    await connectDB()
    await insertData()

    console.log('✅ 新增服务定价数据脚本执行完成')
    process.exit(0)
}

// 运行脚本
main().catch(console.error) 