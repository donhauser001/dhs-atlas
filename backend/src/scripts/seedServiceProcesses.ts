import mongoose from 'mongoose'
import ServiceProcess from '../models/ServiceProcess'

// 连接数据库
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/donhauser')
        console.log('数据库连接成功')
    } catch (error) {
        console.error('数据库连接失败:', error)
        process.exit(1)
    }
}

// 测试数据
const testProcesses = [
    {
        name: '网站设计流程',
        description: '完整的网站设计服务流程，从需求分析到最终交付',
        steps: [
            {
                id: 'step-1-1',
                name: '需求分析',
                description: '深入了解客户需求，确定项目目标和功能要求',
                order: 1,
                progressRatio: 20,
                lossBillingRatio: 0,
                cycle: 2
            },
            {
                id: 'step-1-2',
                name: '原型设计',
                description: '制作网站原型图，确定页面布局和交互流程',
                order: 2,
                progressRatio: 40,
                lossBillingRatio: 30,
                cycle: 3
            },
            {
                id: 'step-1-3',
                name: '视觉设计',
                description: '完成视觉设计稿，包括色彩、字体、图标等',
                order: 3,
                progressRatio: 60,
                lossBillingRatio: 50,
                cycle: 5
            },
            {
                id: 'step-1-4',
                name: '前端开发',
                description: '实现前端页面，包括HTML、CSS、JavaScript开发',
                order: 4,
                progressRatio: 80,
                lossBillingRatio: 70,
                cycle: 8
            },
            {
                id: 'step-1-5',
                name: '测试验收',
                description: '功能测试和客户验收，确保质量达标',
                order: 5,
                progressRatio: 100,
                lossBillingRatio: 100,
                cycle: 2
            }
        ],
        status: 'active',
        createTime: new Date('2024-01-01'),
        updateTime: new Date('2024-01-01')
    },
    {
        name: '品牌设计流程',
        description: '品牌形象设计服务流程，打造完整的品牌视觉体系',
        steps: [
            {
                id: 'step-2-1',
                name: '品牌调研',
                description: '市场调研和竞品分析，了解行业趋势',
                order: 1,
                progressRatio: 25,
                lossBillingRatio: 0,
                cycle: 3
            },
            {
                id: 'step-2-2',
                name: '概念设计',
                description: '品牌概念和方向确定，制定设计策略',
                order: 2,
                progressRatio: 50,
                lossBillingRatio: 40,
                cycle: 4
            },
            {
                id: 'step-2-3',
                name: '视觉设计',
                description: 'Logo和视觉元素设计，建立品牌识别',
                order: 3,
                progressRatio: 75,
                lossBillingRatio: 60,
                cycle: 6
            },
            {
                id: 'step-2-4',
                name: '应用设计',
                description: '品牌应用规范设计，确保一致性',
                order: 4,
                progressRatio: 100,
                lossBillingRatio: 100,
                cycle: 4
            }
        ],
        status: 'active',
        createTime: new Date('2024-01-15'),
        updateTime: new Date('2024-01-15')
    },
    {
        name: '小程序开发流程',
        description: '微信小程序开发服务流程，快速构建移动应用',
        steps: [
            {
                id: 'step-3-1',
                name: '需求分析',
                description: '功能需求和技术方案，确定开发范围',
                order: 1,
                progressRatio: 20,
                lossBillingRatio: 0,
                cycle: 2
            },
            {
                id: 'step-3-2',
                name: '原型设计',
                description: '小程序原型设计，规划用户界面',
                order: 2,
                progressRatio: 40,
                lossBillingRatio: 30,
                cycle: 3
            },
            {
                id: 'step-3-3',
                name: '前端开发',
                description: '小程序前端开发，实现页面功能',
                order: 3,
                progressRatio: 70,
                lossBillingRatio: 60,
                cycle: 8
            },
            {
                id: 'step-3-4',
                name: '后端开发',
                description: '接口和数据库开发，提供数据支持',
                order: 4,
                progressRatio: 90,
                lossBillingRatio: 80,
                cycle: 6
            },
            {
                id: 'step-3-5',
                name: '测试上线',
                description: '测试和微信审核上线，确保稳定运行',
                order: 5,
                progressRatio: 100,
                lossBillingRatio: 100,
                cycle: 3
            }
        ],
        status: 'inactive',
        createTime: new Date('2024-02-01'),
        updateTime: new Date('2024-02-01')
    },
    {
        name: 'APP开发流程',
        description: '移动应用开发服务流程，打造原生移动体验',
        steps: [
            {
                id: 'step-4-1',
                name: '产品规划',
                description: '产品功能规划和用户需求分析',
                order: 1,
                progressRatio: 15,
                lossBillingRatio: 0,
                cycle: 3
            },
            {
                id: 'step-4-2',
                name: 'UI设计',
                description: '用户界面设计，创建视觉原型',
                order: 2,
                progressRatio: 35,
                lossBillingRatio: 25,
                cycle: 5
            },
            {
                id: 'step-4-3',
                name: '前端开发',
                description: '移动端前端开发，实现用户界面',
                order: 3,
                progressRatio: 60,
                lossBillingRatio: 50,
                cycle: 10
            },
            {
                id: 'step-4-4',
                name: '后端开发',
                description: '服务器端开发，提供API接口',
                order: 4,
                progressRatio: 80,
                lossBillingRatio: 70,
                cycle: 8
            },
            {
                id: 'step-4-5',
                name: '测试发布',
                description: '全面测试和应用商店发布',
                order: 5,
                progressRatio: 100,
                lossBillingRatio: 100,
                cycle: 4
            }
        ],
        status: 'active',
        createTime: new Date('2024-02-15'),
        updateTime: new Date('2024-02-15')
    }
]

// 插入测试数据
const seedData = async () => {
    try {
        // 清空现有数据
        await ServiceProcess.deleteMany({})
        console.log('已清空现有服务流程数据')

        // 插入测试数据
        const result = await ServiceProcess.insertMany(testProcesses)
        console.log(`成功插入 ${result.length} 条服务流程测试数据`)

        // 显示插入的数据
        result.forEach((process: any, index: number) => {
            console.log(`${index + 1}. ${process.name} - ${process.steps.length}个步骤`)
        })

        console.log('测试数据插入完成！')
        process.exit(0)
    } catch (error) {
        console.error('插入测试数据失败:', error)
        process.exit(1)
    }
}

// 运行脚本
const run = async () => {
    await connectDB()
    await seedData()
}

run() 