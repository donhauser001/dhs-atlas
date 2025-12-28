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

// 模拟前端的getServicesByCategory函数
const getServicesByCategory = (servicePricings: any[], showDisabled: boolean) => {
    const grouped: { [key: string]: any[] } = {}

    console.log('显示禁用项目:', showDisabled)

    // 首先获取所有分类，确保顺序固定
    const allCategories = new Set<string>()
    servicePricings.forEach(service => {
        const categoryName = service.categoryName || service.categoryId
        allCategories.add(categoryName)
    })

    console.log('所有分类:', Array.from(allCategories))

    // 初始化所有分类的空数组
    allCategories.forEach(categoryName => {
        grouped[categoryName] = []
    })

    // 然后根据开关状态填充服务项目
    servicePricings.forEach(service => {
        // 根据开关状态决定是否显示禁用的服务项目
        if (showDisabled || service.status === 'active') {
            const categoryName = service.categoryName || service.categoryId
            grouped[categoryName].push(service)
        }
    })

    console.log('按分类分组结果:', Object.keys(grouped))
    return grouped
}

// 测试分类顺序
const testCategoryOrder = async () => {
    try {
        const servicePricings = await ServicePricing.find()
        console.log(`\n📊 总共有 ${servicePricings.length} 个服务项目`)

        // 测试隐藏禁用项目时的分类顺序
        console.log('\n🔄 测试隐藏禁用项目时的分类顺序:')
        const result1 = getServicesByCategory(servicePricings, false)

        // 测试显示所有项目时的分类顺序
        console.log('\n🔄 测试显示所有项目时的分类顺序:')
        const result2 = getServicesByCategory(servicePricings, true)

        // 比较两次结果的分类顺序
        const keys1 = Object.keys(result1)
        const keys2 = Object.keys(result2)

        console.log('\n📋 分类顺序比较:')
        console.log('隐藏禁用项目时:', keys1)
        console.log('显示所有项目时:', keys2)
        console.log('顺序是否一致:', JSON.stringify(keys1) === JSON.stringify(keys2))

        // 显示每个分类的服务数量
        console.log('\n📊 各分类服务数量:')
        keys1.forEach(category => {
            const count1 = result1[category].length
            const count2 = result2[category].length
            console.log(`${category}: ${count1} -> ${count2} 项`)
        })

    } catch (error) {
        console.error('❌ 测试失败:', error)
    }
}

// 主函数
const main = async () => {
    console.log('🚀 开始测试分类顺序固定性...')
    
    await connectDB()
    
    // 测试分类顺序
    await testCategoryOrder()
    
    console.log('\n✅ 测试完成')
    process.exit(0)
}

// 运行脚本
main().catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
}) 