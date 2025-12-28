import mongoose from 'mongoose';
import User from '../models/User';

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

// 清理公司用户数据
const cleanupCompanyUsers = async () => {
    try {
        console.log('开始清理错误导入的公司用户数据...');

        // 查找所有公司用户（邮箱包含 @donhauser.com 的用户）
        const companyUsers = await User.find({
            email: { $regex: /@donhauser\.com$/ }
        });

        console.log(`找到 ${companyUsers.length} 个公司用户需要删除`);

        if (companyUsers.length === 0) {
            console.log('没有找到需要清理的公司用户数据');
            return;
        }

        // 显示将要删除的公司用户
        console.log('\n将要删除的公司用户:');
        companyUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.realName} - ${user.email}`);
        });

        // 删除公司用户
        const deleteResult = await User.deleteMany({
            email: { $regex: /@donhauser\.com$/ }
        });

        console.log(`\n=== 清理完成 ===`);
        console.log(`成功删除: ${deleteResult.deletedCount} 个公司用户`);

        // 显示剩余的真正用户数量
        const remainingUsers = await User.countDocuments();
        console.log(`剩余用户数量: ${remainingUsers} 个`);

    } catch (error) {
        console.error('清理过程中发生错误:', error);
    }
};

// 主函数
const main = async () => {
    try {
        // 连接数据库
        await connectDB();

        // 清理公司用户数据
        await cleanupCompanyUsers();

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