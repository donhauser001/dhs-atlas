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

// 测试编辑报价单设置为默认
const testEditQuotationToDefault = async () => {
    try {
        const quotations = await QuotationService.getAllQuotations()
        
        // 找到第一个非默认的报价单
        const nonDefaultQuotation = quotations.find(q => !q.isDefault)
        if (!nonDefaultQuotation) {
            console.log('⚠️ 没有找到非默认的报价单')
            return
        }

        console.log(`\n🔄 测试编辑 "${nonDefaultQuotation.name}" 设置为默认报价单...`)

        // 模拟前端编辑操作，设置为默认
        const updatedQuotation = await QuotationService.updateQuotation(
            nonDefaultQuotation._id?.toString() || '',
            {
                name: nonDefaultQuotation.name,
                description: nonDefaultQuotation.description,
                isDefault: true, // 设置为默认
                selectedServices: nonDefaultQuotation.selectedServices,
                validUntil: nonDefaultQuotation.validUntil
            }
        )

        if (updatedQuotation) {
            console.log(`✅ 成功编辑报价单 "${updatedQuotation.name}" 为默认`)
            console.log(`   默认状态: ${updatedQuotation.isDefault ? '是' : '否'}`)
        } else {
            console.log('❌ 编辑报价单失败')
        }

        // 显示更新后的状态
        await showDefaultStatus()
    } catch (error) {
        console.error('❌ 测试失败:', error)
    }
}

// 主函数
const main = async () => {
    console.log('🚀 开始测试编辑默认报价单逻辑...')
    
    await connectDB()
    
    // 显示初始状态
    await showDefaultStatus()
    
    // 测试设置为默认
    await testEditQuotationToDefault()
    
    console.log('\n✅ 测试完成')
    process.exit(0)
}

// 运行脚本
main().catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
}) 