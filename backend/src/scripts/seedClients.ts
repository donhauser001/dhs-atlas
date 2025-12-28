import mongoose from 'mongoose'
import Client from '../models/Client'
import ClientCategory from '../models/ClientCategory'

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

// 客户分类数据
const clientCategories = [
    {
        name: '重要客户',
        description: '高价值客户，享受优先服务',
        status: 'active' as const,
        clientCount: 0,
        createTime: '2024-01-01'
    },
    {
        name: '普通客户',
        description: '常规客户，标准服务流程',
        status: 'active' as const,
        clientCount: 0,
        createTime: '2024-01-01'
    },
    {
        name: '新客户',
        description: '新建立的客户关系',
        status: 'active' as const,
        clientCount: 0,
        createTime: '2024-01-01'
    },
    {
        name: '历史客户',
        description: '已停止合作的客户',
        status: 'inactive' as const,
        clientCount: 0,
        createTime: '2024-01-01'
    }
]

// 客户测试数据
const clients = [
    {
        name: 'ABC科技有限公司',
        address: '北京市朝阳区建国路88号',
        invoiceInfo: 'ABC科技有限公司\n税号：91110105MA00123456\n开户行：中国银行北京分行\n账号：1234567890123456789',
        invoiceType: '增值税专用发票' as const,
        category: '重要客户',
        rating: 5,
        files: [
            '/uploads/clients/1/company-intro.pdf',
            '/uploads/clients/1/product-manual.docx'
        ],
        summary: '专注于软件开发和技术咨询的科技公司，合作项目包括企业管理系统、移动应用开发等。',
        status: 'active' as const,
        createTime: '2024-01-15',
        updateTime: '2024-01-20'
    },
    {
        name: 'XYZ设计工作室',
        address: '上海市浦东新区陆家嘴金融中心',
        invoiceInfo: 'XYZ设计工作室\n税号：91310115MA00234567\n开户行：工商银行上海分行\n账号：9876543210987654321',
        invoiceType: '增值税普通发票' as const,
        category: '普通客户',
        rating: 4,
        files: [
            '/uploads/clients/2/portfolio.jpg'
        ],
        summary: '专业的设计工作室，提供UI/UX设计、品牌设计、包装设计等服务。',
        status: 'active' as const,
        createTime: '2024-01-10',
        updateTime: '2024-01-18'
    },
    {
        name: 'DEF制造公司',
        address: '深圳市南山区科技园',
        invoiceInfo: 'DEF制造公司\n税号：91440300MA00345678\n开户行：建设银行深圳分行\n账号：1111222233334444',
        invoiceType: '增值税专用发票' as const,
        category: '普通客户',
        rating: 3,
        files: [],
        summary: '大型制造企业，主要生产电子产品，需要技术支持和系统集成服务。',
        status: 'active' as const,
        createTime: '2024-01-05',
        updateTime: '2024-01-15'
    },
    {
        name: 'GHI贸易有限公司',
        address: '广州市天河区珠江新城',
        invoiceInfo: 'GHI贸易有限公司\n税号：91440101MA00456789\n开户行：农业银行广州分行\n账号：5555666677778888',
        invoiceType: '增值税普通发票' as const,
        category: '新客户',
        rating: 4,
        files: [
            '/uploads/clients/4/business-license.jpg'
        ],
        summary: '国际贸易公司，主要从事进出口业务，需要网站建设和品牌推广服务。',
        status: 'active' as const,
        createTime: '2024-01-20',
        updateTime: '2024-01-25'
    },
    {
        name: 'JKL教育集团',
        address: '杭州市西湖区文三路',
        invoiceInfo: 'JKL教育集团\n税号：91330106MA00567890\n开户行：招商银行杭州分行\n账号：9999000011112222',
        invoiceType: '增值税专用发票' as const,
        category: '重要客户',
        rating: 5,
        files: [
            '/uploads/clients/5/education-plan.pdf',
            '/uploads/clients/5/student-data.xlsx'
        ],
        summary: '大型教育集团，拥有多个校区，需要教育管理系统和在线学习平台开发。',
        status: 'active' as const,
        createTime: '2024-01-12',
        updateTime: '2024-01-22'
    },
    {
        name: 'MNO餐饮连锁',
        address: '成都市锦江区春熙路',
        invoiceInfo: 'MNO餐饮连锁\n税号：91510104MA00678901\n开户行：交通银行成都分行\n账号：3333444455556666',
        invoiceType: '增值税普通发票' as const,
        category: '普通客户',
        rating: 3,
        files: [
            '/uploads/clients/6/menu-design.psd'
        ],
        summary: '连锁餐饮企业，需要品牌设计、菜单设计和营销推广服务。',
        status: 'active' as const,
        createTime: '2024-01-08',
        updateTime: '2024-01-16'
    },
    {
        name: 'PQR物流公司',
        address: '武汉市江汉区解放大道',
        invoiceInfo: 'PQR物流公司\n税号：91420103MA00789012\n开户行：民生银行武汉分行\n账号：7777888899990000',
        invoiceType: '增值税专用发票' as const,
        category: '新客户',
        rating: 4,
        files: [],
        summary: '物流运输公司，需要物流管理系统和移动应用开发。',
        status: 'active' as const,
        createTime: '2024-01-25',
        updateTime: '2024-01-30'
    },
    {
        name: 'STU房地产',
        address: '南京市鼓楼区中山路',
        invoiceInfo: 'STU房地产\n税号：91320102MA00890123\n开户行：浦发银行南京分行\n账号：1111222233334444',
        invoiceType: '增值税专用发票' as const,
        category: '重要客户',
        rating: 5,
        files: [
            '/uploads/clients/8/property-list.pdf',
            '/uploads/clients/8/floor-plan.dwg'
        ],
        summary: '房地产开发公司，需要售楼系统、物业管理平台和营销网站建设。',
        status: 'active' as const,
        createTime: '2024-01-18',
        updateTime: '2024-01-28'
    },
    {
        name: 'VWX医疗设备',
        address: '西安市雁塔区高新路',
        invoiceInfo: 'VWX医疗设备\n税号：91610113MA00901234\n开户行：兴业银行西安分行\n账号：5555666677778888',
        invoiceType: '增值税专用发票' as const,
        category: '普通客户',
        rating: 4,
        files: [
            '/uploads/clients/9/medical-certificate.jpg'
        ],
        summary: '医疗设备制造商，需要产品展示网站和客户管理系统。',
        status: 'active' as const,
        createTime: '2024-01-14',
        updateTime: '2024-01-24'
    },
    {
        name: 'YZ建筑公司',
        address: '重庆市渝中区解放碑',
        invoiceInfo: 'YZ建筑公司\n税号：91500103MA01012345\n开户行：华夏银行重庆分行\n账号：9999000011112222',
        invoiceType: '增值税普通发票' as const,
        category: '历史客户',
        rating: 2,
        files: [
            '/uploads/clients/10/old-contract.pdf'
        ],
        summary: '建筑公司，之前有合作项目，目前暂无新项目需求。',
        status: 'inactive' as const,
        createTime: '2023-12-01',
        updateTime: '2024-01-10'
    }
]

// 清空并插入数据
const seedData = async () => {
    try {
        console.log('🗑️ 清空现有数据...')

        // 清空现有数据
        await Client.deleteMany({})
        await ClientCategory.deleteMany({})

        console.log('📝 插入客户分类数据...')

        // 插入客户分类
        const insertedCategories = await ClientCategory.insertMany(clientCategories)
        console.log(`✅ 成功插入 ${insertedCategories.length} 个客户分类`)

        console.log('👥 插入客户数据...')

        // 插入客户
        const insertedClients = await Client.insertMany(clients)
        console.log(`✅ 成功插入 ${insertedClients.length} 个客户`)

        // 更新客户分类的客户数量
        for (const category of insertedCategories) {
            const count = await Client.countDocuments({ category: category.name })
            await ClientCategory.findByIdAndUpdate(category._id, { clientCount: count })
        }

        console.log('✅ 数据库种子数据插入完成！')
        console.log(`📊 统计信息:`)
        console.log(`   - 客户分类: ${insertedCategories.length} 个`)
        console.log(`   - 客户: ${insertedClients.length} 个`)

    } catch (error) {
        console.error('❌ 插入数据失败:', error)
    } finally {
        await mongoose.disconnect()
        console.log('🔌 数据库连接已关闭')
    }
}

// 运行种子脚本
connectDB().then(() => {
    seedData()
}) 