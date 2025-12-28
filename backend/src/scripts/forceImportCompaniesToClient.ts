import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Client from '../models/Client';

// 连接数据库
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/donhauser');
        console.log('数据库连接成功');
    } catch (error) {
        console.error('数据库连接失败:', error);
        process.exit(1);
    }
};

// 定义客户数据接口
interface CustomerData {
    id: string;
    customer_name: string;
    customer_address?: string;
    invoice_info?: string;
    invoice_type: string;
    category_id: string;
    pricelist_id: string;
    customer_rating: string;
    customer_summary?: string;
    blacklist: string;
    created_at: string;
}

// 转换发票类型
const convertInvoiceType = (invoiceType: string): string => {
    switch (invoiceType) {
        case '电子专票':
        case '增值税专用发票':
            return '增值税专用发票';
        case '电子普票':
        case '增值税普通发票':
            return '增值税普通发票';
        default:
            return '增值税普通发票';
    }
};

// 转换客户类别
const convertCategory = (categoryId: string): string => {
    const categoryMap: { [key: string]: string } = {
        '1': '出版社',
        '2': '教育机构',
        '3': '文化传媒',
        '4': '科技公司',
        '5': '政府机构',
        '6': '其他'
    };
    return categoryMap[categoryId] || '其他';
};

// 强制重新导入客户数据到Client表
const forceImportCustomerDataToClientTable = async (cleanedData: CustomerData[]) => {
    try {
        console.log(`开始强制重新导入 ${cleanedData.length} 条客户数据到Client表...`);

        // 首先删除所有现有的公司客户（保留测试客户）
        const deleteResult = await Client.deleteMany({
            category: { $in: ['出版社', '文化传媒', '教育机构', '科技公司', '政府机构', '其他'] }
        });
        console.log(`删除了 ${deleteResult.deletedCount} 个现有公司客户`);

        let successCount = 0;
        let errorCount = 0;

        for (const customer of cleanedData) {
            try {
                // 跳过黑名单客户
                if (customer.blacklist === "1") {
                    continue;
                }

                // 清理客户名称
                let customerName = customer.customer_name?.trim();
                if (!customerName || customerName === "NULL") {
                    continue;
                }

                // 创建新的Client记录
                const clientData = {
                    name: customerName,
                    address: customer.customer_address === "NULL" || !customer.customer_address ? "无地址" : customer.customer_address,
                    invoiceType: convertInvoiceType(customer.invoice_type),
                    invoiceInfo: customer.invoice_info === "NULL" || !customer.invoice_info ? "" : customer.invoice_info,
                    category: convertCategory(customer.category_id),
                    rating: parseInt(customer.customer_rating) || 3,
                    summary: customer.customer_summary === "NULL" || !customer.customer_summary ? "" : customer.customer_summary,
                    status: 'active' as const,
                    createTime: customer.created_at.split(' ')[0], // 只取日期部分
                    updateTime: customer.created_at.split(' ')[0]
                };

                const newClient = new Client(clientData);
                await newClient.save();
                successCount++;

                console.log(`✓ 成功导入: ${customerName}`);

            } catch (error) {
                console.error(`✗ 导入失败 ${customer.customer_name}:`, error);
                errorCount++;
            }
        }

        console.log(`\n=== 强制重新导入完成 ===`);
        console.log(`成功: ${successCount} 条`);
        console.log(`失败: ${errorCount} 条`);
        console.log(`总计: ${cleanedData.length} 条`);

    } catch (error) {
        console.error('导入过程中发生错误:', error);
    }
};

// 主函数
const main = async () => {
    try {
        // 连接数据库
        await connectDB();

        // 读取JSON文件
        const filePath = path.join(__dirname, '../../../customer_data_cleaned.json');
        if (!fs.existsSync(filePath)) {
            console.error('找不到清理后的客户数据文件，请先运行 importCustomers.ts');
            process.exit(1);
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const cleanedData = JSON.parse(fileContent);

        console.log(`加载了 ${cleanedData.length} 个客户数据`);

        // 强制重新导入数据到Client表
        await forceImportCustomerDataToClientTable(cleanedData);

    } catch (error) {
        console.error('程序执行失败:', error);
    } finally {
        // 关闭数据库连接
        await mongoose.connection.close();
        console.log('数据库连接已关闭');
        process.exit(0);
    }
};

// 运行脚本
main(); 