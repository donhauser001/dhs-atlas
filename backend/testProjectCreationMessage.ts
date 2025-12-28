import { BusinessMessageService } from './src/services/BusinessMessageService';
import { MessageService } from './src/services/MessageService';
import User from './src/models/User';
import Client from './src/models/Client';
import { Message } from './src/models/Message';
import { IProject } from './src/models/Project';
import mongoose from 'mongoose';

// 连接数据库
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser';
        await mongoose.connect(mongoUri);
        console.log('✅ 数据库连接成功');
    } catch (error) {
        console.error('❌ 数据库连接失败:', error);
        process.exit(1);
    }
};

// 测试项目创建消息
const testProjectCreationMessage = async () => {
    try {
        console.log('🧪 开始测试项目创建消息...');
        
        // 查找测试用户
        const testUser = await User.findOne({ email: { $regex: /test|admin/i } });
        if (!testUser) {
            console.error('❌ 未找到测试用户');
            return;
        }
        console.log('👤 找到测试用户:', testUser.email);
        
        // 查找测试客户
        const testClient = await Client.findOne();
        if (!testClient) {
            console.error('❌ 未找到测试客户');
            return;
        }
        console.log('🏢 找到测试客户:', testClient.name);
        
        // 模拟项目创建数据
        const projectData: Partial<IProject> = {
            _id: new mongoose.Types.ObjectId(),
            projectName: '测试项目 - 消息验证',
            clientId: (testClient._id as mongoose.Types.ObjectId).toString(),
            clientName: testClient.name,
            contactIds: [(testUser._id as mongoose.Types.ObjectId).toString()],
            contactNames: [testUser.realName],
            contactPhones: [testUser.phone],
            undertakingTeam: 'default-team',
            mainDesigners: [(testUser._id as mongoose.Types.ObjectId).toString()],
            assistantDesigners: [],
            progressStatus: 'consulting' as const,
            settlementStatus: 'unpaid' as const,
            taskIds: [],
            fileIds: [],
            contractIds: [],
            invoiceIds: [],
            proposalIds: [],
            logIds: [],
            createdAt: new Date()
        };
        
        console.log('📋 项目数据:', {
            projectName: projectData.projectName,
            clientId: projectData.clientId,
            mainDesigners: projectData.mainDesigners
        });
        
        // 创建业务消息服务实例
        const businessMessageService = new BusinessMessageService();
        
        // 调用项目创建通知
        console.log('📤 调用项目创建通知...');
        await businessMessageService.notifyProjectCreation(projectData as IProject, (testUser._id as mongoose.Types.ObjectId).toString());
        
        // 等待一下让消息创建完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 检查是否创建了消息
        const messages = await Message.find({
            recipientId: (testUser._id as mongoose.Types.ObjectId).toString(),
            'metadata.businessModule': 'project',
            'metadata.triggerCondition': 'create'
        }).sort({ createdAt: -1 }).limit(5);
        
        console.log('📨 查询到的消息数量:', messages.length);
        if (messages.length > 0) {
            console.log('✅ 消息创建成功!');
            messages.forEach((msg, index) => {
                console.log(`  消息 ${index + 1}:`, {
                    title: msg.title,
                    summary: msg.summary,
                    status: msg.status,
                    createdAt: msg.createdAt
                });
            });
        } else {
            console.log('❌ 未找到相关消息');
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
};

// 主函数
const main = async () => {
    await connectDB();
    await testProjectCreationMessage();
    await mongoose.disconnect();
    console.log('🔚 测试完成');
};

// 运行测试
main().catch(console.error);