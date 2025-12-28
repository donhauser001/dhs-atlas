import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

// 创建超级管理员账号
const createSuperAdmin = async () => {
    try {
        console.log('开始创建超级管理员账号...');

        const adminData = {
            username: 'anyfree',
            password: '633234001',
            email: 'admin@donhauser.com',
            phone: '18888888888',
            realName: '系统管理员',
            role: '超级管理员',
            department: '管理部门',
            status: 'active'
        };

        // 检查是否已存在该用户
        const existingUser = await User.findOne({
            $or: [
                { username: adminData.username },
                { email: adminData.email }
            ]
        });

        if (existingUser) {
            console.log('用户已存在，更新密码和权限...');

            // 加密新密码
            const hashedPassword = await bcrypt.hash(adminData.password, 10);

            // 更新用户信息
            existingUser.password = hashedPassword;
            existingUser.phone = adminData.phone;
            existingUser.role = '超级管理员' as const;
            existingUser.realName = adminData.realName;
            existingUser.department = adminData.department;
            existingUser.status = 'active' as const;

            await existingUser.save();
            console.log('✅ 超级管理员账号更新成功！');
            console.log('用户名:', existingUser.username);
            console.log('角色:', existingUser.role);
            console.log('状态:', existingUser.status);
        } else {
            // 加密密码
            const hashedPassword = await bcrypt.hash(adminData.password, 10);

            // 创建新用户
            const newAdmin = new User({
                username: adminData.username,
                password: hashedPassword,
                email: adminData.email,
                phone: adminData.phone,
                realName: adminData.realName,
                role: '超级管理员' as const,
                department: adminData.department,
                status: 'active' as const,
                createTime: new Date().toISOString()
            });

            await newAdmin.save();
            console.log('✅ 超级管理员账号创建成功！');
            console.log('用户名:', newAdmin.username);
            console.log('角色:', newAdmin.role);
            console.log('邮箱:', newAdmin.email);
            console.log('状态:', newAdmin.status);
        }

        console.log('');
        console.log('🎉 超级管理员账号设置完成！');
        console.log('登录信息:');
        console.log('用户名:', adminData.username);
        console.log('密码:', adminData.password);
        console.log('');
        console.log('请妥善保管登录信息！');

    } catch (error) {
        console.error('创建超级管理员失败:', error);
        throw error;
    }
};

// 主函数
const main = async () => {
    try {
        await connectDB();
        await createSuperAdmin();
        console.log('操作完成，断开数据库连接...');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('操作失败:', error);
        process.exit(1);
    }
};

// 运行脚本
main();
