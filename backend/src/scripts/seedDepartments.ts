import mongoose from 'mongoose';
import { Department } from '../models/Department';
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

// 初始化部门数据
const seedDepartments = async () => {
    try {
        // 清空现有数据
        await Department.deleteMany({});
        console.log('🗑️ 清空现有部门数据');

        // 获取企业数据
        const enterprises = await Enterprise.find().lean();
        if (enterprises.length === 0) {
            console.log('⚠️ 没有找到企业数据，请先运行企业数据初始化脚本');
            return;
        }

        console.log(`📋 找到 ${enterprises.length} 家企业`);

        // 创建部门数据
        const departments = [];

        // 为每家企业创建部门
        for (const enterprise of enterprises) {
            const enterpriseId = enterprise._id.toString();
            const enterpriseName = enterprise.enterpriseName;

            // 根据企业名称创建不同的部门结构
            if (enterpriseName.includes('北京智创')) {
                // 北京智创科技有限公司的部门
                const dept1 = new Department({
                    name: '技术研发部',
                    enterpriseId,
                    enterpriseName,
                    level: 1,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-01-15 10:00:00'
                });
                const savedDept1 = await dept1.save();
                departments.push(savedDept1);

                const dept2 = new Department({
                    name: '产品设计部',
                    enterpriseId,
                    enterpriseName,
                    level: 1,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-01-15 10:00:00'
                });
                const savedDept2 = await dept2.save();
                departments.push(savedDept2);

                // 子部门
                const dept6 = new Department({
                    name: '前端开发组',
                    parentId: (savedDept1._id as any).toString(),
                    enterpriseId,
                    enterpriseName,
                    level: 2,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-01-20 14:30:00'
                });
                departments.push(await dept6.save());

                const dept7 = new Department({
                    name: '后端开发组',
                    parentId: (savedDept1._id as any).toString(),
                    enterpriseId,
                    enterpriseName,
                    level: 2,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-01-20 14:30:00'
                });
                departments.push(await dept7.save());

                const dept8 = new Department({
                    name: 'UI设计组',
                    parentId: (savedDept2._id as any).toString(),
                    enterpriseId,
                    enterpriseName,
                    level: 2,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-01-20 14:30:00'
                });
                departments.push(await dept8.save());

            } else if (enterpriseName.includes('上海未来')) {
                // 上海未来数字科技有限公司的部门
                const dept10 = new Department({
                    name: '研发中心',
                    enterpriseId,
                    enterpriseName,
                    level: 1,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-02-20 15:00:00'
                });
                const savedDept10 = await dept10.save();
                departments.push(savedDept10);

                const dept11 = new Department({
                    name: '销售部',
                    enterpriseId,
                    enterpriseName,
                    level: 1,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-02-20 15:00:00'
                });
                departments.push(await dept11.save());

                // 子部门
                const dept13 = new Department({
                    name: '人工智能组',
                    parentId: (savedDept10._id as any).toString(),
                    enterpriseId,
                    enterpriseName,
                    level: 2,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-02-25 09:15:00'
                });
                departments.push(await dept13.save());

                const dept14 = new Department({
                    name: '大数据组',
                    parentId: (savedDept10._id as any).toString(),
                    enterpriseId,
                    enterpriseName,
                    level: 2,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-02-25 09:15:00'
                });
                departments.push(await dept14.save());

            } else if (enterpriseName.includes('深圳创新')) {
                // 深圳创新设计有限公司的部门
                const dept15 = new Department({
                    name: '设计部',
                    enterpriseId,
                    enterpriseName,
                    level: 1,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-03-10 12:00:00'
                });
                const savedDept15 = await dept15.save();
                departments.push(savedDept15);

                const dept16 = new Department({
                    name: '工程部',
                    enterpriseId,
                    enterpriseName,
                    level: 1,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-03-10 12:00:00'
                });
                departments.push(await dept16.save());

                // 子部门
                const dept18 = new Department({
                    name: '工业设计组',
                    parentId: (savedDept15._id as any).toString(),
                    enterpriseId,
                    enterpriseName,
                    level: 2,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-03-15 16:45:00'
                });
                departments.push(await dept18.save());

                const dept19 = new Department({
                    name: '平面设计组',
                    parentId: (savedDept15._id as any).toString(),
                    enterpriseId,
                    enterpriseName,
                    level: 2,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-03-15 16:45:00'
                });
                departments.push(await dept19.save());

            } else if (enterpriseName.includes('杭州云智')) {
                // 杭州云智科技有限公司的部门
                const dept20 = new Department({
                    name: '技术部',
                    enterpriseId,
                    enterpriseName,
                    level: 1,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-04-05 17:00:00'
                });
                const savedDept20 = await dept20.save();
                departments.push(savedDept20);

                const dept21 = new Department({
                    name: '商务部',
                    enterpriseId,
                    enterpriseName,
                    level: 1,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-04-05 17:00:00'
                });
                departments.push(await dept21.save());

                // 子部门
                const dept23 = new Department({
                    name: '云计算组',
                    parentId: (savedDept20._id as any).toString(),
                    enterpriseId,
                    enterpriseName,
                    level: 2,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-04-10 10:30:00'
                });
                departments.push(await dept23.save());

                const dept24 = new Department({
                    name: '移动开发组',
                    parentId: (savedDept20._id as any).toString(),
                    enterpriseId,
                    enterpriseName,
                    level: 2,
                    employeeCount: 0,
                    status: 'active',
                    createTime: '2024-04-10 10:30:00'
                });
                departments.push(await dept24.save());
            }
        }

        console.log(`✅ 成功创建 ${departments.length} 个部门`);

        // 显示创建的部门
        departments.forEach((dept, index) => {
            const prefix = dept.level === 1 ? '├─' : '│  └─';
            console.log(`${index + 1}. ${prefix} ${dept.name} (企业: ${dept.enterpriseName})`);
        });

    } catch (error) {
        console.error('❌ 初始化部门数据失败:', error);
    }
};

// 主函数
const main = async () => {
    console.log('🚀 开始初始化部门数据...');

    await connectDB();
    await seedDepartments();

    console.log('✅ 部门数据初始化完成');
    process.exit(0);
};

// 运行脚本
main().catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
}); 