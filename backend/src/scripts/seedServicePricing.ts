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

// 清空现有数据
const clearData = async () => {
    try {
        await ServicePricing.deleteMany({})
        console.log('✅ 清空服务定价数据成功')
    } catch (error) {
        console.error('❌ 清空服务定价数据失败:', error)
    }
}

// 服务定价测试数据
const testServicePricing = [
    {
        serviceName: '网站设计',
        alias: 'Web Design',
        categoryId: 'web_design',
        categoryName: '网站设计',
        unitPrice: 5000,
        unit: '个',
        priceDescription: '企业官网设计，包含响应式布局',
        link: 'https://example.com/web-design',
        pricingPolicyIds: ['policy_001', 'policy_002'],
        pricingPolicyNames: ['新客户优惠', '批量折扣'],
        status: 'active' as const
    },
    {
        serviceName: '移动应用开发',
        alias: 'Mobile App',
        categoryId: 'mobile_dev',
        categoryName: '移动开发',
        unitPrice: 15000,
        unit: '个',
        priceDescription: 'iOS和Android双平台应用开发',
        link: 'https://example.com/mobile-app',
        pricingPolicyIds: ['policy_001'],
        pricingPolicyNames: ['新客户优惠'],
        status: 'active' as const
    },
    {
        serviceName: '电商平台开发',
        alias: 'E-commerce',
        categoryId: 'ecommerce',
        categoryName: '电商开发',
        unitPrice: 25000,
        unit: '个',
        priceDescription: '完整的电商解决方案',
        link: 'https://example.com/ecommerce',
        pricingPolicyIds: ['policy_002', 'policy_003'],
        pricingPolicyNames: ['批量折扣', '长期合作优惠'],
        status: 'active' as const
    },
    {
        serviceName: 'SEO优化',
        alias: 'SEO',
        categoryId: 'seo',
        categoryName: '搜索引擎优化',
        unitPrice: 3000,
        unit: '月',
        priceDescription: '搜索引擎优化服务',
        link: 'https://example.com/seo',
        pricingPolicyIds: ['policy_001'],
        pricingPolicyNames: ['新客户优惠'],
        status: 'active' as const
    },
    {
        serviceName: '品牌设计',
        alias: 'Brand Design',
        categoryId: 'brand_design',
        categoryName: '品牌设计',
        unitPrice: 8000,
        unit: '套',
        priceDescription: 'VI设计、品牌策划',
        link: 'https://example.com/brand-design',
        pricingPolicyIds: ['policy_002'],
        pricingPolicyNames: ['批量折扣'],
        status: 'active' as const
    },
    {
        serviceName: '内容营销',
        alias: 'Content Marketing',
        categoryId: 'content_marketing',
        categoryName: '内容营销',
        unitPrice: 2000,
        unit: '篇',
        priceDescription: '专业内容创作和营销',
        link: 'https://example.com/content-marketing',
        pricingPolicyIds: ['policy_001', 'policy_002'],
        pricingPolicyNames: ['新客户优惠', '批量折扣'],
        status: 'active' as const
    },
    {
        serviceName: '数据分析',
        alias: 'Data Analytics',
        categoryId: 'data_analytics',
        categoryName: '数据分析',
        unitPrice: 4000,
        unit: '月',
        priceDescription: '数据分析和报告服务',
        link: 'https://example.com/data-analytics',
        pricingPolicyIds: ['policy_003'],
        pricingPolicyNames: ['长期合作优惠'],
        status: 'active' as const
    },
    {
        serviceName: '系统维护',
        alias: 'System Maintenance',
        categoryId: 'maintenance',
        categoryName: '系统维护',
        unitPrice: 1000,
        unit: '月',
        priceDescription: '系统维护和技术支持',
        link: 'https://example.com/maintenance',
        pricingPolicyIds: ['policy_003'],
        pricingPolicyNames: ['长期合作优惠'],
        status: 'active' as const
    }
]

// 插入测试数据
const insertData = async () => {
    try {
        for (const serviceData of testServicePricing) {
            const service = new ServicePricing(serviceData)
            await service.save()
            console.log(`✅ 创建服务定价: ${serviceData.serviceName}`)
        }

        console.log('✅ 所有服务定价数据插入成功')
    } catch (error) {
        console.error('❌ 插入服务定价数据失败:', error)
    }
}

// 主函数
const main = async () => {
    await connectDB()
    await clearData()
    await insertData()

    console.log('✅ 服务定价数据种子脚本执行完成')
    process.exit(0)
}

// 运行脚本
main().catch(console.error) 