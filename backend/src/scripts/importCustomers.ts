import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import User from '../models/User';

// 连接数据库
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://donhauser-mongodb:27017/donhauser');
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
            address = undefined;
        }

        // 清理发票信息
        let invoiceInfo = customer.invoice_info;
        if (invoiceInfo === "NULL" || !invoiceInfo) {
            invoiceInfo = undefined;
        }

        // 清理客户摘要
        let summary = customer.customer_summary;
        if (summary === "NULL" || !summary) {
            summary = undefined;
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

// 导入客户数据到数据库
const importCustomerData = async (cleanedData: CustomerData[]) => {
    try {
        console.log(`开始导入 ${cleanedData.length} 条客户数据...`);

        // 这里我们可以将客户数据存储到一个临时集合或者直接存储到User表中作为客户类型
        // 为了简单起见，我们先打印出来，然后你可以决定如何处理

        console.log('\n客户数据示例:');
        cleanedData.slice(0, 5).forEach((item, index) => {
            console.log(`${index + 1}. ${item.customer_name} - ${item.customer_address || '无地址'}`);
        });

        // 将客户数据保存到文件，供后续使用
        const outputPath = path.join(__dirname, '../../../customer_data_cleaned.json');
        fs.writeFileSync(outputPath, JSON.stringify(cleanedData, null, 2), 'utf-8');
        console.log(`\n客户数据已保存到: ${outputPath}`);

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
        const filePath = path.join(__dirname, '../../../date/wp_dhs_customers.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);

        // 提取数据数组
        const rawData = jsonData[2].data; // 根据JSON结构，数据在第3个元素
        console.log(`原始客户数据条数: ${rawData.length}`);

        // 清理和转换数据
        const cleanedData = cleanCustomerData(rawData);
        console.log(`清理后客户数据条数: ${cleanedData.length}`);

        // 导入数据
        await importCustomerData(cleanedData);

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