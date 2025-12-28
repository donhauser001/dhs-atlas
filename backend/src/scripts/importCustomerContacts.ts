import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
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

// 定义用户数据接口
interface UserData {
    username: string;
    password: string;
    email?: string;
    phone: string;
    realName: string;
    role: '客户';
    department: string;
    status: 'active';
    company?: string;
    contactPerson: string;
    address?: string;
    shippingMethod?: string;
    description?: string;
    createTime: string;
}

// 数据清理和转换函数
const cleanData = (rawData: any[]): UserData[] => {
    const cleanedData: UserData[] = [];
    const processedEmails = new Set<string>(); // 用于去重邮箱
    const processedPhones = new Set<string>(); // 用于去重电话

    for (const contact of rawData) {
        // 跳过黑名单用户
        if (contact.blacklist === "1") {
            continue;
        }

        // 清理电话号码
        let phone = contact.contact_phone;
        if (phone) {
            // 移除 .0 后缀
            phone = phone.replace(/\.0$/, '');
            // 只保留数字
            phone = phone.replace(/\D/g, '');
            // 如果长度小于11位，跳过
            if (phone.length < 11) {
                console.log(`跳过无效电话号码: ${contact.contact_name} - ${contact.contact_phone}`);
                continue;
            }
        } else {
            console.log(`跳过无电话号码用户: ${contact.contact_name}`);
            continue;
        }

        // 检查电话重复
        if (processedPhones.has(phone)) {
            console.log(`跳过重复电话: ${contact.contact_name} - ${phone}`);
            continue;
        }

        // 清理邮箱
        let email = contact.contact_email;
        if (email && email !== "NULL") {
            // 移除邮箱中的特殊字符
            email = email.replace(/[^\w@.-]/g, '');
            // 检查邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                email = ''; // 无效邮箱设为空
            }
        } else {
            email = '';
        }

        // 如果邮箱为空，生成一个唯一的邮箱
        if (!email) {
            const timestamp = Date.now();
            const randomSuffix = Math.floor(Math.random() * 1000);
            email = `customer_${timestamp}_${randomSuffix}@placeholder.com`;
        }

        // 检查邮箱重复
        if (processedEmails.has(email)) {
            console.log(`跳过重复邮箱: ${contact.contact_name} - ${email}`);
            continue;
        }

        // 清理姓名
        let realName = contact.contact_name?.trim();
        if (!realName || realName === "NULL") {
            console.log(`跳过无姓名用户: ${contact.contact_name}`);
            continue;
        }

        // 生成用户名（使用姓名拼音或英文名）
        let username = realName.toLowerCase().replace(/\s+/g, '');
        // 如果用户名已存在，添加数字后缀
        let counter = 1;
        let finalUsername = username;
        while (cleanedData.some(item => item.username === finalUsername)) {
            finalUsername = `${username}${counter}`;
            counter++;
        }

        // 公司信息设为空值，供后续手动匹配
        let company = undefined;
        let address = '';

        if (contact.shipping_method && contact.shipping_method !== "Unknown Address" && contact.shipping_method !== "NULL") {
            address = contact.shipping_method;
        }

        // 创建用户数据对象
        const userData = {
            username: finalUsername,
            password: '123456', // 默认密码
            email: email || undefined, // 如果为空字符串，设为undefined
            phone: phone,
            realName: realName,
            role: '客户' as const,
            department: '客户部',
            status: 'active' as const,
            // 客户信息
            company: company || undefined,
            contactPerson: realName,
            address: address || undefined,
            shippingMethod: contact.shipping_method && contact.shipping_method !== "Unknown Address" ? contact.shipping_method : undefined,
            // 描述信息
            description: contact.notes && contact.notes !== "NULL" ? contact.notes : undefined,
            // 创建时间
            createTime: contact.created_at ? contact.created_at.split(' ')[0] : new Date().toISOString().split('T')[0]
        };

        cleanedData.push(userData);
        processedEmails.add(email);
        processedPhones.add(phone);
    }

    return cleanedData;
};

// 导入数据到数据库
const importData = async (cleanedData: UserData[]) => {
    try {
        console.log(`开始导入 ${cleanedData.length} 条客户数据...`);

        let successCount = 0;
        let errorCount = 0;

        for (const userData of cleanedData) {
            try {
                // 检查是否已存在相同用户名或邮箱的用户
                const existingUser = await User.findOne({
                    $or: [
                        { username: userData.username },
                        ...(userData.email ? [{ email: userData.email }] : [])
                    ]
                });

                if (existingUser) {
                    console.log(`跳过已存在用户: ${userData.realName} (${userData.username})`);
                    continue;
                }

                // 创建新用户
                const newUser = new User(userData);
                await newUser.save();
                successCount++;

                if (successCount % 10 === 0) {
                    console.log(`已成功导入 ${successCount} 条数据...`);
                }
            } catch (error) {
                errorCount++;
                console.error(`导入失败 ${userData.realName}:`, error);
            }
        }

        console.log(`\n导入完成！`);
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
        const filePath = path.join(__dirname, '../../../date/wp_dhs_customer_contacts.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);

        // 提取数据数组
        const rawData = jsonData[2].data; // 根据JSON结构，数据在第3个元素
        console.log(`原始数据条数: ${rawData.length}`);

        // 清理和转换数据
        const cleanedData = cleanData(rawData);
        console.log(`清理后数据条数: ${cleanedData.length}`);

        // 显示前几条数据作为示例
        console.log('\n数据示例:');
        cleanedData.slice(0, 3).forEach((item, index) => {
            console.log(`${index + 1}. ${item.realName} - ${item.phone} - ${item.email || '无邮箱'}`);
        });

        // 确认是否继续
        console.log('\n是否继续导入数据？(y/n)');
        // 这里可以添加用户确认逻辑，现在直接继续

        // 导入数据
        await importData(cleanedData);

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