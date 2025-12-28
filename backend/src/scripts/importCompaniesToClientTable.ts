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

// 数据清理和转换函数
const cleanCustomerData = (rawData: any[]): CustomerData[] => {
    const cleanedData: CustomerData[] = [];

    for (const customer of rawData) {
        // 跳过黑名单客户
        if (customer.blacklist === "1") {
            continue;
        }

        // 清理客户名称
        let customerName = customer.customer_name?.trim();
        if (!customerName || customerName === "NULL") {
            console.log(`跳过无名称客户: ${customer.id}`);
            continue;
        }

        // 清理地址信息
        let address = customer.customer_address;
        if (address === "NULL" || !address) {
            address = "无地址";
        }

        // 清理发票信息
        let invoiceInfo = customer.invoice_info;
        if (invoiceInfo === "NULL" || !invoiceInfo) {
            invoiceInfo = "";
        }

        // 清理客户摘要
        let summary = customer.customer_summary;
        if (summary === "NULL" || !summary) {
            summary = "";
        }

        // 创建客户数据对象
        const customerData: CustomerData = {
            id: customer.id,
            customer_name: customerName,
            customer_address: address,
            invoice_info: invoiceInfo,
            invoice_type: customer.invoice_type,
            category_id: customer.category_id,
            pricelist_id: customer.pricelist_id,
            customer_rating: customer.customer_rating,
            customer_summary: summary,
            blacklist: customer.blacklist,
            created_at: customer.created_at
        };

        cleanedData.push(customerData);
    }

    return cleanedData;
};

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

// 导入客户数据到Client表
const importCustomerDataToClientTable = async (cleanedData: CustomerData[]) => {
    try {
        console.log(`开始导入 ${cleanedData.length} 条客户数据到Client表...`);

        let successCount = 0;
        let skipCount = 0;

        for (const customer of cleanedData) {
            try {
                // 检查是否已存在同名客户
                const existingClient = await Client.findOne({ name: customer.customer_name });
                if (existingClient) {
                    console.log(`跳过已存在客户: ${customer.customer_name}`);
                    skipCount++;
                    continue;
                }

                // 创建新的Client记录
                const clientData = {
                    name: customer.customer_name,
                    address: customer.customer_address || "无地址",
                    invoiceType: convertInvoiceType(customer.invoice_type),
                    invoiceInfo: customer.invoice_info || "",
                    category: convertCategory(customer.category_id),
                    rating: parseInt(customer.customer_rating) || 3,
                    summary: customer.customer_summary || "",
                    status: 'active' as const,
                    createTime: customer.created_at.split(' ')[0], // 只取日期部分
                    updateTime: customer.created_at.split(' ')[0]
                };

                const newClient = new Client(clientData);
                await newClient.save();
                successCount++;

                console.log(`✓ 成功导入: ${customer.customer_name}`);

            } catch (error) {
                console.error(`✗ 导入失败 ${customer.customer_name}:`, error);
            }
        }

        console.log(`\n=== 导入完成 ===`);
        console.log(`成功: ${successCount} 条`);
        console.log(`跳过: ${skipCount} 条`);
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

        // 导入数据到Client表
        await importCustomerDataToClientTable(cleanedData);

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