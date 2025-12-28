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

// 删除测试客户数据
const deleteTestClients = async () => {
    try {
        console.log('开始删除测试客户数据...');

        // 定义测试客户名称列表
        const testClientNames = [
            'YZ建筑公司',
            'DEF制造公司',
            'MNO餐饮连锁',
            'XYZ设计工作室',
            'JKL教育集团',
            'VWX医疗设备',
            'ABC科技有限公司',
            'STU房地产',
            'GHI贸易有限公司'
        ];

        // 查找测试客户
        const testClients = await Client.find({
            name: { $in: testClientNames }
        });

        console.log(`找到 ${testClients.length} 个测试客户需要删除`);

        if (testClients.length === 0) {
            console.log('没有找到需要删除的测试客户');
            return;
        }

        // 显示将要删除的测试客户
        console.log('\n将要删除的测试客户:');
        testClients.forEach((client, index) => {
            console.log(`${index + 1}. ${client.name} - ${client.category} - ${client.address}`);
        });

        // 删除测试客户
        const deleteResult = await Client.deleteMany({
            name: { $in: testClientNames }
        });

        console.log(`\n=== 删除完成 ===`);
        console.log(`成功删除: ${deleteResult.deletedCount} 个测试客户`);

        // 显示剩余的客户数量
        const remainingClients = await Client.countDocuments();
        console.log(`剩余客户数量: ${remainingClients} 个`);

        // 显示剩余客户的分类统计
        const remainingClientsData = await Client.find({});
        const categoryStats: { [key: string]: number } = {};

        remainingClientsData.forEach(client => {
            categoryStats[client.category] = (categoryStats[client.category] || 0) + 1;
        });

        console.log('\n=== 剩余客户分类统计 ===');
        Object.entries(categoryStats).forEach(([category, count]) => {
            console.log(`${category}: ${count} 个`);
        });

    } catch (error) {
        console.error('删除过程中发生错误:', error);
    }
};

// 主函数
const main = async () => {
    try {
        // 连接数据库
        await connectDB();

        // 删除测试客户数据
        await deleteTestClients();

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