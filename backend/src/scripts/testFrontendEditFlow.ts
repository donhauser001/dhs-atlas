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
            console.log(`${index + 1}. ${quotation.name} - 默认: ${quotation.isDefault ? '是' : '否'} - 状态: ${quotation.status}`)
        })
    } catch (error) {
        console.error('❌ 获取报价单失败:', error)
    }
}

// 模拟前端编辑流程
const testFrontendEditFlow = async () => {
    try {
        const quotations = await QuotationService.getAllQuotations()

        // 找到第一个非默认的报价单
        const nonDefaultQuotation = quotations.find(q => !q.isDefault && q.status === 'active')
        if (!nonDefaultQuotation) {
            console.log('⚠️ 没有找到非默认的活跃报价单')
            return
        }

        console.log(`\n🔄 模拟前端编辑流程: "${nonDefaultQuotation.name}"`)

        // 1. 模拟前端获取报价单详情（编辑模态窗打开时）
        console.log('1. 获取报价单详情...')
        const quotationDetail = await QuotationService.getQuotationById(nonDefaultQuotation._id?.toString() || '')
        if (quotationDetail) {
            console.log(`   当前默认状态: ${quotationDetail.isDefault ? '是' : '否'}`)
        }

        // 2. 模拟前端表单数据（用户勾选"设为默认报价"）
        console.log('2. 模拟用户勾选"设为默认报价"...')
        const formData = {
            name: quotationDetail?.name || '',
            description: quotationDetail?.description || '',
            isDefault: true, // 用户勾选了默认
            selectedServices: quotationDetail?.selectedServices || [],
            validUntil: quotationDetail?.validUntil
        }
        console.log('   表单数据:', formData)

        // 3. 模拟前端API调用
        console.log('3. 调用更新API...')
        const updatedQuotation = await QuotationService.updateQuotation(
            nonDefaultQuotation._id?.toString() || '',
            formData
        )

        if (updatedQuotation) {
            console.log(`✅ 更新成功: ${updatedQuotation.name}`)
            console.log(`   更新后默认状态: ${updatedQuotation.isDefault ? '是' : '否'}`)
        } else {
            console.log('❌ 更新失败')
        }

        // 4. 模拟前端重新加载数据
        console.log('4. 重新加载数据...')
        const allQuotations = await QuotationService.getAllQuotations()
        const defaultQuotation = allQuotations.find(q => q.isDefault)
        if (defaultQuotation) {
            console.log(`   当前默认报价单: ${defaultQuotation.name}`)
        }

        // 显示更新后的状态
        await showDefaultStatus()
    } catch (error) {
        console.error('❌ 测试失败:', error)
    }
}

// 主函数
const main = async () => {
    console.log('🚀 开始测试前端编辑流程...')

    await connectDB()

    // 显示初始状态
    await showDefaultStatus()

    // 测试前端编辑流程
    await testFrontendEditFlow()

    console.log('\n✅ 测试完成')
    process.exit(0)
}

// 运行脚本
main().catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
}) 