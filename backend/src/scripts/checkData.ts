import mongoose from 'mongoose'
import Quotation from '../models/Quotation'
import ServicePricing from '../models/ServicePricing'
import Client from '../models/Client'

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

// 检查数据
const checkData = async () => {
    try {
        console.log('\n=== 检查服务定价数据 ===')
        const services = await ServicePricing.find({})
        console.log(`服务定价总数: ${services.length}`)
        if (services.length > 0) {
            console.log('前3个服务定价:')
            services.slice(0, 3).forEach((service, index) => {
                console.log(`${index + 1}. ID: ${service._id}, 名称: ${service.serviceName}, 价格: ¥${service.unitPrice}`)
            })
        }

        console.log('\n=== 检查报价单数据 ===')
        const quotations = await Quotation.find({})
        console.log(`报价单总数: ${quotations.length}`)
        if (quotations.length > 0) {
            console.log('所有报价单:')
            quotations.forEach((quotation, index) => {
                console.log(`${index + 1}. ID: ${quotation._id}, 名称: ${quotation.name}, 服务数量: ${quotation.selectedServices?.length || 0}`)
                if (quotation.selectedServices && quotation.selectedServices.length > 0) {
                    console.log(`   服务ID: ${quotation.selectedServices.join(', ')}`)
                }
            })
        }

        console.log('\n=== 检查客户数据 ===')
        const clients = await Client.find({})
        console.log(`客户总数: ${clients.length}`)
        if (clients.length > 0) {
            console.log('有报价单关联的客户:')
            clients.filter(client => client.quotationId).forEach((client, index) => {
                console.log(`${index + 1}. 客户: ${client.name}, 报价单ID: ${client.quotationId}`)
            })
        }

        // 测试API调用
        console.log('\n=== 测试API调用 ===')
        if (quotations.length > 0 && quotations[0].selectedServices && quotations[0].selectedServices.length > 0) {
            const testQuotation = quotations[0]
            console.log(`测试报价单: ${testQuotation.name}`)
            console.log(`服务ID: ${testQuotation.selectedServices.join(', ')}`)

            const foundServices = await ServicePricing.find({ _id: { $in: testQuotation.selectedServices } })
            console.log(`找到的服务: ${foundServices.length}`)
            foundServices.forEach(service => {
                console.log(`- ${service.serviceName}: ¥${service.unitPrice}`)
            })
        }

    } catch (error) {
        console.error('检查数据失败:', error)
    }
}

// 主函数
const main = async () => {
    await connectDB()
    await checkData()

    console.log('\n✅ 数据检查完成')
    process.exit(0)
}

// 运行脚本
main().catch(console.error) 