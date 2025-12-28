import mongoose from 'mongoose'
import Quotation from '../models/Quotation'

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
        await Quotation.deleteMany({})
        console.log('✅ 清空现有报价单数据')
    } catch (error) {
        console.error('❌ 清空数据失败:', error)
    }
}

// 创建测试数据
const createTestData = async () => {
    const testQuotations = [
        {
            name: '标准网站建设套餐',
            status: 'active' as const,
            description: '包含企业官网设计、响应式布局、SEO优化等核心服务，适合中小型企业快速建立线上形象。',
            isDefault: true,
            selectedServices: ['1', '2', '3'], // 假设的服务ID
            validUntil: new Date('2025-12-31'),
            createTime: new Date('2024-08-01T10:00:00Z'),
            updateTime: new Date('2024-08-01T10:00:00Z')
        },
        {
            name: '电商平台开发套餐',
            status: 'active' as const,
            description: '完整的电商解决方案，包含商品管理、订单系统、支付集成、用户管理等功能。',
            isDefault: false,
            selectedServices: ['2', '4', '5'], // 假设的服务ID
            validUntil: new Date('2025-06-30'),
            createTime: new Date('2024-08-02T14:30:00Z'),
            updateTime: new Date('2024-08-02T14:30:00Z')
        },
        {
            name: '移动应用开发套餐',
            status: 'active' as const,
            description: 'iOS和Android双平台原生应用开发，包含UI设计、后端API、应用商店发布等服务。',
            isDefault: false,
            selectedServices: ['3', '6', '7'], // 假设的服务ID
            validUntil: undefined, // 永久有效
            createTime: new Date('2024-08-03T09:15:00Z'),
            updateTime: new Date('2024-08-03T09:15:00Z')
        },
        {
            name: '品牌设计服务套餐',
            status: 'active' as const,
            description: '专业的品牌设计服务，包含VI设计、品牌策划、营销物料设计等。',
            isDefault: false,
            selectedServices: ['8', '9', '10'], // 假设的服务ID
            validUntil: new Date('2025-03-31'),
            createTime: new Date('2024-08-04T16:45:00Z'),
            updateTime: new Date('2024-08-04T16:45:00Z')
        },
        {
            name: '数字营销推广套餐',
            status: 'active' as const,
            description: '全面的数字营销服务，包含SEO优化、社交媒体运营、内容营销、数据分析等。',
            isDefault: false,
            selectedServices: ['11', '12', '13'], // 假设的服务ID
            validUntil: new Date('2025-09-30'),
            createTime: new Date('2024-08-05T11:20:00Z'),
            updateTime: new Date('2024-08-05T11:20:00Z')
        },
        {
            name: '企业管理系统套餐',
            status: 'inactive' as const,
            description: '定制化企业管理系统开发，包含ERP、CRM、OA等模块，已暂停服务。',
            isDefault: false,
            selectedServices: ['14', '15', '16'], // 假设的服务ID
            validUntil: new Date('2024-12-31'),
            createTime: new Date('2024-07-15T13:00:00Z'),
            updateTime: new Date('2024-08-01T15:30:00Z')
        },
        {
            name: '小程序开发套餐',
            status: 'active' as const,
            description: '微信小程序开发服务，包含UI设计、功能开发、审核发布、运营维护等。',
            isDefault: false,
            selectedServices: ['17', '18', '19'], // 假设的服务ID
            validUntil: undefined, // 永久有效
            createTime: new Date('2024-08-06T08:45:00Z'),
            updateTime: new Date('2024-08-06T08:45:00Z')
        },
        {
            name: '高端定制开发套餐',
            status: 'active' as const,
            description: '高端定制化开发服务，适合大型企业复杂业务需求，包含需求分析、架构设计、开发实施等。',
            isDefault: false,
            selectedServices: ['20', '21', '22'], // 假设的服务ID
            validUntil: new Date('2025-12-31'),
            createTime: new Date('2024-08-07T10:30:00Z'),
            updateTime: new Date('2024-08-07T10:30:00Z')
        },
        {
            name: 'UI/UX设计服务套餐',
            status: 'active' as const,
            description: '专业的UI/UX设计服务，包含用户研究、交互设计、视觉设计、原型制作等。',
            isDefault: false,
            selectedServices: ['23', '24', '25'], // 假设的服务ID
            validUntil: new Date('2025-05-31'),
            createTime: new Date('2024-08-08T14:15:00Z'),
            updateTime: new Date('2024-08-08T14:15:00Z')
        },
        {
            name: '技术咨询服务套餐',
            status: 'active' as const,
            description: '专业的技术咨询服务，包含技术选型、架构咨询、代码审查、性能优化等。',
            isDefault: false,
            selectedServices: ['26', '27', '28'], // 假设的服务ID
            validUntil: undefined, // 永久有效
            createTime: new Date('2024-08-09T09:00:00Z'),
            updateTime: new Date('2024-08-09T09:00:00Z')
        }
    ]

    try {
        const result = await Quotation.insertMany(testQuotations)
        console.log(`✅ 成功创建 ${result.length} 条报价单测试数据`)
        
        // 显示创建的数据
        result.forEach((quotation, index) => {
            console.log(`${index + 1}. ${quotation.name} - ${quotation.status} - ${quotation.isDefault ? '默认' : '非默认'}`)
        })
    } catch (error) {
        console.error('❌ 创建测试数据失败:', error)
    }
}

// 主函数
const main = async () => {
    console.log('🚀 开始创建报价单测试数据...')
    
    await connectDB()
    await clearData()
    await createTestData()
    
    console.log('✅ 测试数据创建完成')
    process.exit(0)
}

// 运行脚本
main().catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
}) 