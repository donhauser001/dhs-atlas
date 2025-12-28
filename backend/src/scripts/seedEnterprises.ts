import mongoose from 'mongoose';
import { Enterprise } from '../models/Enterprise';

// 连接数据库
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/donhauser');
        console.log('✅ MongoDB数据库连接成功');
    } catch (error) {
        console.error('❌ MongoDB数据库连接失败:', error);
        process.exit(1);
    }
};

// 初始化企业数据
const seedEnterprises = async () => {
    try {
        // 清空现有数据
        await Enterprise.deleteMany({});
        console.log('🗑️ 清空现有企业数据');

        // 创建初始企业数据
        const enterprises = [
            {
                enterpriseName: '北京智创科技有限公司',
                creditCode: '91110000123456789X',
                businessLicense: 'businessLicense-1754053738203-776983323.png',
                legalRepresentative: '陈志强',
                legalRepresentativeId: '110101198505151234',
                companyAddress: '北京市海淀区中关村大街1号',
                shippingAddress: '北京市海淀区中关村大街1号智创大厦15层',
                contactPerson: '张丽华',
                contactPhone: '13800138000',
                invoiceInfo: '公司名称：北京智创科技有限公司\n税号：91110000123456789X\n地址：北京市海淀区中关村大街1号\n开户行：中国银行北京中关村支行\n账号：1234567890123456789',
                bankName: '中国银行北京中关村支行',
                accountName: '北京智创科技有限公司',
                accountNumber: '1234567890123456789',
                status: 'active',
                createTime: '2024-01-15 09:30:00'
            },
            {
                enterpriseName: '上海未来数字科技有限公司',
                creditCode: '91310000123456789Y',
                businessLicense: 'businessLicense-1754053842144-271071487.png',
                legalRepresentative: '李明轩',
                legalRepresentativeId: '310101198812081234',
                companyAddress: '上海市浦东新区张江高科技园区',
                shippingAddress: '上海市浦东新区张江高科技园区未来大厦8层',
                contactPerson: '王美玲',
                contactPhone: '13800138001',
                invoiceInfo: '公司名称：上海未来数字科技有限公司\n税号：91310000123456789Y\n地址：上海市浦东新区张江高科技园区\n开户行：工商银行上海张江支行\n账号：9876543210987654321',
                bankName: '工商银行上海张江支行',
                accountName: '上海未来数字科技有限公司',
                accountNumber: '9876543210987654321',
                status: 'active',
                createTime: '2024-02-20 14:15:00'
            },
            {
                enterpriseName: '深圳创新设计有限公司',
                creditCode: '91440300123456789Z',
                businessLicense: '',
                legalRepresentative: '刘建华',
                legalRepresentativeId: '440301198203201234',
                companyAddress: '深圳市南山区科技园南区',
                shippingAddress: '深圳市南山区科技园南区创新大厦12层',
                contactPerson: '赵晓雯',
                contactPhone: '13800138002',
                invoiceInfo: '公司名称：深圳创新设计有限公司\n税号：91440300123456789Z\n地址：深圳市南山区科技园南区\n开户行：建设银行深圳科技园支行\n账号：1111222233334444',
                bankName: '建设银行深圳科技园支行',
                accountName: '深圳创新设计有限公司',
                accountNumber: '1111222233334444',
                status: 'active',
                createTime: '2024-03-10 11:45:00'
            },
            {
                enterpriseName: '杭州云智科技有限公司',
                creditCode: '91330000123456789A',
                businessLicense: '',
                legalRepresentative: '孙志远',
                legalRepresentativeId: '330101198907121234',
                companyAddress: '杭州市西湖区文三路',
                shippingAddress: '杭州市西湖区文三路云智大厦6层',
                contactPerson: '周雅琴',
                contactPhone: '13800138003',
                invoiceInfo: '公司名称：杭州云智科技有限公司\n税号：91330000123456789A\n地址：杭州市西湖区文三路\n开户行：招商银行杭州西湖支行\n账号：5555666677778888',
                bankName: '招商银行杭州西湖支行',
                accountName: '杭州云智科技有限公司',
                accountNumber: '5555666677778888',
                status: 'active',
                createTime: '2024-04-05 16:20:00'
            }
        ];

        // 插入数据
        const result = await Enterprise.insertMany(enterprises);
        console.log(`✅ 成功创建 ${result.length} 家企业`);

        // 显示创建的企业
        result.forEach((enterprise, index) => {
            console.log(`${index + 1}. ${enterprise.enterpriseName} (ID: ${enterprise._id})`);
        });

    } catch (error) {
        console.error('❌ 初始化企业数据失败:', error);
    }
};

// 主函数
const main = async () => {
    console.log('🚀 开始初始化企业数据...');

    await connectDB();
    await seedEnterprises();

    console.log('✅ 企业数据初始化完成');
    process.exit(0);
};

// 运行脚本
main().catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
}); 