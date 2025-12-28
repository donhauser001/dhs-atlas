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

// 读取客户公司数据
const loadCustomerCompanies = () => {
    try {
        const filePath = path.join(__dirname, '../../../customer_data_cleaned.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('读取客户公司数据失败:', error);
        return [];
    }
};

// 导入客户公司到数据库
const importCompaniesToDB = async (companies: any[]) => {
    try {
        console.log(`开始导入 ${companies.length} 个客户公司到数据库...`);

        let successCount = 0;
        let errorCount = 0;

        for (const company of companies) {
            try {
                // 检查是否已存在相同名称的公司
                const existingCompany = await User.findOne({
                    role: '客户',
                    company: company.customer_name
                });

                if (existingCompany) {
                    console.log(`跳过已存在公司: ${company.customer_name}`);
                    continue;
                }

                // 生成用户名（使用公司名称）
                let username = company.customer_name.toLowerCase()
                    .replace(/[^\w\u4e00-\u9fa5]/g, '') // 只保留字母、数字、中文
                    .substring(0, 20); // 限制长度

                // 如果用户名已存在，添加数字后缀
                let counter = 1;
                let finalUsername = username;
                while (await User.findOne({ username: finalUsername })) {
                    finalUsername = `${username}${counter}`;
                    counter++;
                }

                // 生成邮箱
                const timestamp = Date.now();
                const randomSuffix = Math.floor(Math.random() * 1000);
                const email = `company_${timestamp}_${randomSuffix}@donhauser.com`;

                // 创建公司用户数据
                const companyUserData = {
                    username: finalUsername,
                    password: '123456', // 默认密码
                    email: email,
                    phone: '00000000000', // 占位符电话
                    realName: company.customer_name,
                    role: '客户' as const,
                    department: '客户部',
                    status: 'active' as const,
                    // 公司信息
                    company: company.customer_name,
                    contactPerson: company.customer_name,
                    address: company.customer_address || undefined,
                    shippingMethod: company.customer_address || undefined,
                    // 描述信息（包含发票信息等）
                    description: company.invoice_info || company.customer_summary || undefined,
                    // 创建时间
                    createTime: company.created_at ? company.created_at.split(' ')[0] : new Date().toISOString().split('T')[0]
                };

                // 创建新用户
                const newCompanyUser = new User(companyUserData);
                await newCompanyUser.save();
                successCount++;

                if (successCount % 10 === 0) {
                    console.log(`已成功导入 ${successCount} 个公司...`);
                }
            } catch (error) {
                errorCount++;
                console.error(`导入失败 ${company.customer_name}:`, error);
            }
        }

        console.log(`\n公司导入完成！`);
        console.log(`成功: ${successCount} 个`);
        console.log(`失败: ${errorCount} 个`);
        console.log(`总计: ${companies.length} 个`);

    } catch (error) {
        console.error('导入过程中发生错误:', error);
    }
};

// 显示导入的公司信息
const displayImportedCompanies = async () => {
    try {
        const companies = await User.find({
            role: '客户',
            company: { $exists: true, $ne: null, $nin: ['', undefined] }
        }).select('realName company address description createTime');

        console.log('\n=== 已导入的客户公司 ===\n');

        companies.forEach((company, index) => {
            console.log(`${index + 1}. ${company.realName}`);
            console.log(`   公司名称: ${company.company}`);
            console.log(`   地址: ${company.address || '无地址'}`);
            console.log(`   创建时间: ${company.createTime}`);
            if (company.description) {
                console.log(`   描述: ${company.description.substring(0, 100)}${company.description.length > 100 ? '...' : ''}`);
            }
            console.log('');
        });

        console.log(`总计 ${companies.length} 个公司已导入到数据库`);

    } catch (error) {
        console.error('获取公司信息失败:', error);
    }
};

// 主函数
const main = async () => {
    try {
        // 连接数据库
        await connectDB();

        // 加载客户公司数据
        const companies = loadCustomerCompanies();
        console.log(`加载了 ${companies.length} 个客户公司数据`);

        // 导入公司到数据库
        await importCompaniesToDB(companies);

        // 显示已导入的公司
        await displayImportedCompanies();

        console.log('\n=== 导入完成 ===');
        console.log('现在你可以在系统中看到所有的客户公司信息了！');
        console.log('这些公司用户可以作为独立的客户实体，也可以与具体的联系人用户进行关联。');

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