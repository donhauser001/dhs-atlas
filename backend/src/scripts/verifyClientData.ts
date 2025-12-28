import mongoose from 'mongoose';
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

// 验证Client表数据
const verifyClientData = async () => {
    try {
        console.log('开始验证Client表数据...');

        // 获取所有客户数据
        const clients = await Client.find({}).sort({ createTime: 1 });

        console.log(`\n=== Client表数据统计 ===`);
        console.log(`总客户数量: ${clients.length} 个`);

        // 按类别统计
        const categoryStats: { [key: string]: number } = {};
        const invoiceTypeStats: { [key: string]: number } = {};

        clients.forEach(client => {
            // 统计类别
            categoryStats[client.category] = (categoryStats[client.category] || 0) + 1;
            // 统计发票类型
            invoiceTypeStats[client.invoiceType] = (invoiceTypeStats[client.invoiceType] || 0) + 1;
        });

        console.log('\n=== 按类别统计 ===');
        Object.entries(categoryStats).forEach(([category, count]) => {
            console.log(`${category}: ${count} 个`);
        });

        console.log('\n=== 按发票类型统计 ===');
        Object.entries(invoiceTypeStats).forEach(([type, count]) => {
            console.log(`${type}: ${count} 个`);
        });

        // 显示前10个客户示例
        console.log('\n=== 客户数据示例（前10个）===');
        clients.slice(0, 10).forEach((client, index) => {
            console.log(`${index + 1}. ${client.name}`);
            console.log(`   地址: ${client.address}`);
            console.log(`   类别: ${client.category}`);
            console.log(`   发票类型: ${client.invoiceType}`);
            console.log(`   评分: ${client.rating}`);
            console.log(`   状态: ${client.status}`);
            console.log(`   创建时间: ${client.createTime}`);
            if (client.invoiceInfo) {
                console.log(`   发票信息: ${client.invoiceInfo.substring(0, 50)}...`);
            }
            console.log('');
        });

        // 检查数据完整性
        const incompleteClients = clients.filter(client => 
            !client.name || !client.address || !client.category || !client.invoiceType
        );

        if (incompleteClients.length > 0) {
            console.log(`\n⚠️  发现 ${incompleteClients.length} 个数据不完整的客户:`);
            incompleteClients.forEach(client => {
                console.log(`   - ${client.name || '无名称'}`);
            });
        } else {
            console.log('\n✅ 所有客户数据都完整');
        }

    } catch (error) {
        console.error('验证过程中发生错误:', error);
    }
};

// 主函数
const main = async () => {
    try {
        // 连接数据库
        await connectDB();

        // 验证Client表数据
        await verifyClientData();

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