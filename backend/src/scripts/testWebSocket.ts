import mongoose from 'mongoose';
import { MessageService } from '../services/MessageService';
import { MessageType, MessageCategory, MessagePriority } from '../models/Message';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function testWebSocketMessage() {
    try {
        // 连接数据库
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser';
        await mongoose.connect(mongoUri);
        console.log('✅ 数据库连接成功');

        // 获取一个测试用户
        const testUser = await mongoose.connection.db?.collection('users').findOne({});

        if (!testUser) {
            console.error('❌ 未找到测试用户');
            return;
        }

        console.log(`📤 准备发送测试消息给用户: ${testUser.username} (${testUser._id})`);

        // 创建消息服务实例
        const messageService = new MessageService();

        // 创建测试消息
        const testMessage = await messageService.createMessage({
            title: 'WebSocket测试消息',
            content: '这是一条用于测试WebSocket实时推送功能的消息。如果您收到这条消息，说明实时推送功能正常工作！',
            summary: 'WebSocket功能测试',
            type: MessageType.SYSTEM,
            category: MessageCategory.NOTIFICATION,
            priority: MessagePriority.HIGH,
            senderName: '系统测试',
            senderType: 'system',
            recipientId: testUser._id.toString(),
            recipientType: 'user',
            metadata: {
                testMessage: true,
                timestamp: new Date().toISOString()
            }
        });

        console.log('✅ 测试消息创建成功:', {
            id: testMessage._id,
            title: testMessage.title,
            recipientId: testMessage.recipientId,
            createdAt: testMessage.createdAt
        });

        console.log('🔔 如果WebSocket连接正常，用户应该会收到实时通知');

    } catch (error) {
        console.error('❌ 测试失败:', error);
    } finally {
        // 关闭数据库连接
        await mongoose.connection.close();
        console.log('🔌 数据库连接已关闭');
    }
}

// 运行测试
testWebSocketMessage();
