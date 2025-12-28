import mongoose from 'mongoose';
import { ProjectService } from '../services/ProjectService';
import { BusinessMessageService } from '../services/BusinessMessageService';
import { MessageService } from '../services/MessageService';
import User from '../models/User';
import Client from '../models/Client';

// 连接数据库
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser';
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB数据库连接成功');
        console.log(`🔗 连接地址: ${mongoUri}`);
    } catch (error) {
        console.error('❌ MongoDB数据库连接失败:', error);
        process.exit(1);
    }
};

// 测试项目创建消息
const testProjectCreationMessage = async () => {
    try {
        console.log('\n=== 开始测试项目创建消息 ===');

        // 1. 查找一个测试用户
        const testUser = await User.findOne().limit(1);
        if (!testUser) {
            console.error('❌ 未找到测试用户');
            return;
        }
        console.log(`👤 找到测试用户: ${testUser.username} (${testUser._id})`);

        // 2. 查找一个测试客户
        const testClient = await Client.findOne().limit(1);
        if (!testClient) {
            console.error('❌ 未找到测试客户');
            return;
        }
        console.log(`🏢 找到测试客户: ${testClient.name} (${testClient._id})`);

        // 3. 创建测试项目数据
        const testProjectData = {
            projectName: `测试项目-${Date.now()}`,
            clientId: (testClient._id as mongoose.Types.ObjectId).toString(),
            clientName: testClient.name,
            contactNames: ['测试联系人'],
            contactPhones: ['13800138000'],
            clientRequirements: '这是一个测试项目的需求描述',
            undertakingTeam: '设计团队',
            mainDesigners: [testUser._id?.toString() || ''],
            assistantDesigners: [],
            progressStatus: 'planning',
            settlementStatus: 'pending',
            remark: '测试项目备注'
        };

        console.log('📋 测试项目数据:', JSON.stringify(testProjectData, null, 2));

        // 4. 直接测试 BusinessMessageService
        console.log('\n--- 测试 BusinessMessageService.notifyProjectCreation ---');
        const businessMessageService = new BusinessMessageService();
        
        // 创建一个模拟的项目对象
        const mockProject = {
            _id: new mongoose.Types.ObjectId(),
            ...testProjectData,
            createdAt: new Date(),
            updatedAt: new Date()
        } as any;

        console.log('🔔 调用 notifyProjectCreation...');
        await businessMessageService.notifyProjectCreation(mockProject, testUser._id?.toString() || '');

        // 5. 检查是否创建了消息
        console.log('\n--- 检查创建的消息 ---');
        const messageService = new MessageService();
        const recentMessages = await messageService.getUserMessages(
            testUser._id?.toString() || '',
            {},
            1,
            5
        );

        console.log(`📨 找到 ${recentMessages.data.length} 条最近消息:`);
        recentMessages.data.forEach((msg: any, index: number) => {
            console.log(`  ${index + 1}. ${msg.title} (${msg.status}) - ${msg.createdAt}`);
            console.log(`     内容: ${msg.content.substring(0, 100)}...`);
        });

        console.log('\n✅ 测试完成');
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
};

// 主函数
const main = async () => {
    await connectDB();
    await testProjectCreationMessage();
    await mongoose.disconnect();
    console.log('\n🔚 数据库连接已关闭');
};

// 运行测试
if (require.main === module) {
    main().catch(console.error);
}

export { testProjectCreationMessage };