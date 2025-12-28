import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Client from '../models/Client';
import User from '../models/User';
import bcrypt from 'bcryptjs';

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
    customer_address: string;
    invoice_info: string;
    invoice_type: string;
    category_id: string;
    pricelist_id: string;
    customer_rating: string;
    customer_summary: string;
    blacklist: string;
    created_at: string;
}

// 定义联系人数据接口
interface ContactData {
    id: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    customer_id: string;
    contact_position: string;
    shipping_method: string;
    blacklist: string;
    notes: string;
    created_at: string;
}

// 导入客户数据
const importCustomers = async (): Promise<CustomerData[]> => {
    try {
        console.log('开始导入客户数据...');

        // 读取客户数据文件
        const customersPath = path.join(process.cwd(), 'date/wp_dhs_customers.json');
        const customersData = JSON.parse(fs.readFileSync(customersPath, 'utf8'));

        // 提取实际的客户数据
        const customers: CustomerData[] = customersData.find((item: any) => item.type === 'table')?.data || [];
        console.log('找到客户数据:', customers.length, '条');

        let successCount = 0;
        let errorCount = 0;

        for (const customer of customers) {
            try {
                // 检查客户是否已存在
                const existingClient = await Client.findOne({
                    name: customer.customer_name
                });

                if (existingClient) {
                    console.log(`客户已存在，跳过: ${customer.customer_name}`);
                    continue;
                }

                // 创建新客户
                const newClient = new Client({
                    name: customer.customer_name,
                    address: customer.customer_address === 'NULL' ? '' : customer.customer_address,
                    invoiceInfo: customer.invoice_info === 'NULL' ? '' : customer.invoice_info,
                    invoiceType: customer.invoice_type === '电子专票' ? '增值税专用发票' :
                        customer.invoice_type === '电子普票' ? '增值税普通发票' : '不开票',
                    category: `分类${customer.category_id}`,
                    rating: parseInt(customer.customer_rating) || 3,
                    summary: customer.customer_summary === 'NULL' ? '' : customer.customer_summary,
                    status: customer.blacklist === '1' ? 'inactive' : 'active',
                    files: [],
                    createTime: customer.created_at,
                    updateTime: customer.created_at
                });

                await newClient.save();
                successCount++;
                console.log(`✅ 成功导入客户: ${customer.customer_name}`);

            } catch (error) {
                errorCount++;
                console.error(`❌ 导入客户失败: ${customer.customer_name}`, error);
            }
        }

        console.log(`客户数据导入完成: 成功 ${successCount} 条, 失败 ${errorCount} 条`);

        return customers; // 返回客户数据供后续使用

    } catch (error) {
        console.error('导入客户数据失败:', error);
        throw error;
    }
};

// 导入联系人数据（作为用户）
const importContacts = async (customers: CustomerData[]) => {
    try {
        console.log('开始导入联系人数据为用户...');

        // 读取联系人数据文件
        const contactsPath = path.join(process.cwd(), 'date/wp_dhs_customer_contacts.json');
        const contactsData = JSON.parse(fs.readFileSync(contactsPath, 'utf8'));

        // 提取实际的联系人数据
        const contacts: ContactData[] = contactsData.find((item: any) => item.type === 'table')?.data || [];
        console.log('找到联系人数据:', contacts.length, '条');

        let successCount = 0;
        let errorCount = 0;

        for (const contact of contacts) {
            try {
                // 检查用户是否已存在
                const existingUser = await User.findOne({
                    $or: [
                        { email: contact.contact_email },
                        { username: contact.contact_name }
                    ]
                });

                if (existingUser) {
                    console.log(`用户已存在，跳过: ${contact.contact_name}`);
                    continue;
                }

                // 生成默认密码
                const defaultPassword = '123456';
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);

                // 查找关联的客户
                const relatedClient = await Client.findOne({ name: customers.find(c => c.id === contact.customer_id)?.customer_name });

                // 创建新用户
                const newUser = new User({
                    username: contact.contact_name,
                    email: contact.contact_email,
                    password: hashedPassword,
                    phone: contact.contact_phone?.replace('.0', '') || '',
                    realName: contact.contact_name,
                    role: '客户', // 设置角色为客户
                    department: '客户部门',
                    status: contact.blacklist === '1' ? 'inactive' : 'active',
                    position: contact.contact_position === '未知' ? '' : contact.contact_position,
                    company: relatedClient?.name || '',
                    contactPerson: contact.contact_name,
                    address: contact.shipping_method === 'Unknown Address' ? '' : contact.shipping_method,
                    description: contact.notes === 'NULL' ? '' : contact.notes,
                    createTime: contact.created_at
                });

                await newUser.save();
                successCount++;
                console.log(`✅ 成功导入用户: ${contact.contact_name} (${contact.contact_email})`);

            } catch (error) {
                errorCount++;
                console.error(`❌ 导入用户失败: ${contact.contact_name}`, error);
            }
        }

        console.log(`用户数据导入完成: 成功 ${successCount} 条, 失败 ${errorCount} 条`);

    } catch (error) {
        console.error('导入用户数据失败:', error);
        throw error;
    }
};

// 主函数
const main = async () => {
    try {
        await connectDB();

        // 先导入客户，再导入用户（联系人）
        const customers = await importCustomers();
        await importContacts(customers);

        console.log('🎉 所有数据导入完成！');

    } catch (error) {
        console.error('导入过程中发生错误:', error);
    } finally {
        await mongoose.disconnect();
        console.log('数据库连接已关闭');
    }
};

main();
