import mongoose from 'mongoose'
import QuotationService from '../services/QuotationService'

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

// 显示所有报价单的默认状态
const showDefaultStatus = async () => {
    try {
        const quotations = await QuotationService.getAllQuotations()
        console.log('\n📊 当前所有报价单的默认状态:')
        quotations.forEach((quotation, index) => {
            console.log(`${index + 1}. ${quotation.name} - 默认: ${quotation.isDefault ? '是' : '否'}`)
        })
    } catch (error) {
        console.error('❌ 获取报价单失败:', error)
    }
}

// 测试创建新的默认报价单
const testCreateDefaultQuotation = async () => {
    try {
        console.log('\n🔄 测试创建新的默认报价单...')

        // 创建新的默认报价单
        const newQuotation = await QuotationService.createQuotation({
            name: '测试默认报价单',
            description: '这是一个测试用的默认报价单，用于验证默认状态逻辑。',
            isDefault: true, // 设置为默认
            selectedServices: ['688db2bda9985c9252040c1b', '688db2b9a9985c9252040b61'], // 使用真实的服务ID
            validUntil: new Date('2025-12-31')
        })

        if (newQuotation) {
            console.log(`✅ 成功创建默认报价单: "${newQuotation.name}"`)
        } else {
            console.log('❌ 创建默认报价单失败')
        }

        // 显示更新后的状态
        await showDefaultStatus()
    } catch (error) {
        console.error('❌ 测试失败:', error)
    }
}

// 主函数
const main = async () => {
    console.log('🚀 开始测试创建默认报价单逻辑...')
    
    await connectDB()
    
    // 显示初始状态
    await showDefaultStatus()
    
    // 测试创建新的默认报价单
    await testCreateDefaultQuotation()
    
    console.log('\n✅ 测试完成')
    process.exit(0)
}

// 运行脚本
main().catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
}) 