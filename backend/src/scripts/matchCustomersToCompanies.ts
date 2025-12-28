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

// 获取所有客户用户
const getCustomerUsers = async () => {
    try {
        const users = await User.find({ role: '客户' }).select('_id realName company email phone address');
        return users;
    } catch (error) {
        console.error('获取客户用户失败:', error);
        return [];
    }
};

// 生成匹配建议
const generateMatchSuggestions = (users: any[], companies: any[]) => {
    const suggestions: any[] = [];

    users.forEach(user => {
        const userSuggestions: any[] = [];

        // 基于地址匹配
        if (user.address) {
            companies.forEach(company => {
                if (company.customer_address &&
                    (user.address.includes(company.customer_address) ||
                        company.customer_address.includes(user.address))) {
                    userSuggestions.push({
                        company,
                        reason: '地址匹配',
                        score: 0.8
                    });
                }
            });
        }

        // 基于邮箱域名匹配
        if (user.email && !user.email.includes('@placeholder.com')) {
            const emailDomain = user.email.split('@')[1];
            companies.forEach(company => {
                if (company.customer_name &&
                    company.customer_name.toLowerCase().includes(emailDomain?.split('.')[0])) {
                    userSuggestions.push({
                        company,
                        reason: '邮箱域名匹配',
                        score: 0.6
                    });
                }
            });
        }

        // 基于姓名匹配（如果公司名称包含联系人姓名）
        companies.forEach(company => {
            if (company.customer_name &&
                company.customer_name.includes(user.realName)) {
                userSuggestions.push({
                    company,
                    reason: '姓名匹配',
                    score: 0.7
                });
            }
        });

        if (userSuggestions.length > 0) {
            // 去重并按分数排序
            const uniqueSuggestions = userSuggestions.filter((suggestion, index, self) =>
                index === self.findIndex(s => s.company.id === suggestion.company.id)
            ).sort((a, b) => b.score - a.score);

            suggestions.push({
                user,
                suggestions: uniqueSuggestions.slice(0, 3) // 只保留前3个建议
            });
        }
    });

    return suggestions;
};

// 显示匹配建议
const displayMatchSuggestions = (suggestions: any[]) => {
    console.log('\n=== 客户公司匹配建议 ===\n');

    suggestions.forEach((item, index) => {
        console.log(`${index + 1}. 客户: ${item.user.realName} (${item.user.phone})`);
        console.log(`   当前公司: ${item.user.company || '未设置'}`);
        console.log(`   建议匹配:`);

        item.suggestions.forEach((suggestion: any, sIndex: number) => {
            console.log(`     ${sIndex + 1}. ${suggestion.company.customer_name} (${suggestion.reason}, 匹配度: ${suggestion.score})`);
            console.log(`        地址: ${suggestion.company.customer_address || '无地址'}`);
        });
        console.log('');
    });

    console.log(`\n总计 ${suggestions.length} 个客户有匹配建议`);
};

// 显示所有客户公司列表
const displayAllCompanies = (companies: any[]) => {
    console.log('\n=== 所有客户公司列表 ===\n');

    companies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.customer_name}`);
        console.log(`   ID: ${company.id}`);
        console.log(`   地址: ${company.customer_address || '无地址'}`);
        console.log(`   发票类型: ${company.invoice_type}`);
        console.log(`   评级: ${company.customer_rating}`);
        console.log('');
    });
};

// 显示所有客户用户列表
const displayAllCustomers = (users: any[]) => {
    console.log('\n=== 所有客户用户列表 ===\n');

    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.realName}`);
        console.log(`   ID: ${user._id}`);
        console.log(`   电话: ${user.phone}`);
        console.log(`   邮箱: ${user.email}`);
        console.log(`   地址: ${user.address || '无地址'}`);
        console.log(`   当前公司: ${user.company || '未设置'}`);
        console.log('');
    });
};

// 主函数
const main = async () => {
    try {
        // 连接数据库
        await connectDB();

        // 加载数据
        const companies = loadCustomerCompanies();
        const users = await getCustomerUsers();

        console.log(`加载了 ${companies.length} 个客户公司`);
        console.log(`加载了 ${users.length} 个客户用户`);

        // 生成匹配建议
        const suggestions = generateMatchSuggestions(users, companies);

        // 显示匹配建议
        displayMatchSuggestions(suggestions);

        // 显示所有公司列表
        displayAllCompanies(companies);

        // 显示所有客户列表
        displayAllCustomers(users);

        console.log('\n=== 使用说明 ===');
        console.log('1. 查看上面的匹配建议，找到合适的客户-公司对应关系');
        console.log('2. 使用以下命令更新客户的公司信息:');
        console.log('   npm run update-customer-company');
        console.log('3. 或者手动在数据库中更新用户的 company 字段');

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