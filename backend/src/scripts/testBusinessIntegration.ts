import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TaskService from '../services/TaskService';
import { ProjectService } from '../services/ProjectService';
import { BusinessMessageService } from '../services/BusinessMessageService';
import { TaskSchedulerService } from '../services/TaskSchedulerService';

// 加载环境变量
dotenv.config();

/**
 * 业务集成测试脚本
 * 测试任务和项目管理中的消息通知功能
 */
class BusinessIntegrationTest {
    private taskService = TaskService;
    private projectService = new ProjectService();
    private businessMessageService = new BusinessMessageService();
    private taskSchedulerService = new TaskSchedulerService();

    async run() {
        try {
            console.log('🚀 开始业务集成测试...');

            // 连接数据库
            await this.connectDB();

            // 测试任务相关消息通知
            await this.testTaskNotifications();

            // 测试项目相关消息通知
            await this.testProjectNotifications();

            // 测试任务调度服务
            await this.testTaskScheduler();

            console.log('✅ 业务集成测试完成！');

        } catch (error) {
            console.error('❌ 业务集成测试失败:', error);
        } finally {
            await mongoose.connection.close();
            console.log('📊 数据库连接已关闭');
        }
    }

    /**
     * 连接数据库
     */
    private async connectDB() {
        try {
            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser';
            await mongoose.connect(mongoUri);
            console.log('✅ 数据库连接成功');
        } catch (error) {
            console.error('❌ 数据库连接失败:', error);
            throw error;
        }
    }

    /**
     * 测试任务相关消息通知
     */
    private async testTaskNotifications() {
        console.log('\n📋 测试任务相关消息通知...');

        try {
            // 1. 创建测试任务（会触发任务分配通知）
            console.log('1. 创建测试任务...');
            const testTask = await this.taskService.createTask({
                taskName: '测试任务 - 消息集成',
                projectId: '507f1f77bcf86cd799439011', // 假设的项目ID
                serviceId: '507f1f77bcf86cd799439012', // 假设的服务ID
                mainDesigners: ['68aec283a4d484a399836f9b'], // 真实的用户ID
                assistantDesigners: ['68aec283a4d484a399836f9b'], // 真实的用户ID
                quantity: 1,
                unit: '个',
                subtotal: 1000,
                billingDescription: '测试任务计费说明',
                priority: 'high',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后到期
                status: 'pending'
            });

            console.log(`✅ 任务创建成功: ${testTask.taskName} (ID: ${testTask._id})`);

            // 2. 更新任务状态（会触发状态变更通知）
            console.log('2. 更新任务状态...');
            await this.taskService.updateTaskStatus(
                (testTask._id as any).toString(),
                'in-progress',
                '68937bd8da714e85786bc849',
                25
            );
            console.log('✅ 任务状态更新成功 (pending -> in-progress)');

            // 3. 完成任务（会触发完成通知）
            console.log('3. 完成任务...');
            await this.taskService.updateTaskStatus(
                (testTask._id as any).toString(),
                'completed',
                '68937bd8da714e85786bc849',
                100
            );
            console.log('✅ 任务完成通知发送成功');

            // 4. 测试逾期任务通知
            console.log('4. 测试逾期任务通知...');
            const overdueTask = await this.taskService.createTask({
                taskName: '逾期测试任务',
                projectId: '507f1f77bcf86cd799439011',
                serviceId: '507f1f77bcf86cd799439012',
                mainDesigners: ['68937bd8da714e85786bc849'],
                quantity: 1,
                unit: '个',
                subtotal: 500,
                billingDescription: '逾期测试任务',
                priority: 'medium',
                dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 昨天就到期了
                status: 'in-progress'
            });

            await this.businessMessageService.notifyTaskOverdue(overdueTask);
            console.log('✅ 逾期任务通知发送成功');

            // 5. 测试即将到期任务通知
            console.log('5. 测试即将到期任务通知...');
            const dueSoonTask = await this.taskService.createTask({
                taskName: '即将到期测试任务',
                projectId: '507f1f77bcf86cd799439011',
                serviceId: '507f1f77bcf86cd799439012',
                mainDesigners: ['68937bd8da714e85786bc849'],
                quantity: 1,
                unit: '个',
                subtotal: 800,
                billingDescription: '即将到期测试任务',
                priority: 'high',
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明天到期
                status: 'in-progress'
            });

            await this.businessMessageService.notifyTaskDueSoon(dueSoonTask, 1);
            console.log('✅ 即将到期任务通知发送成功');

        } catch (error) {
            console.error('❌ 任务通知测试失败:', error);
        }
    }

    /**
     * 测试项目相关消息通知
     */
    private async testProjectNotifications() {
        console.log('\n🏗️ 测试项目相关消息通知...');

        try {
            // 1. 创建测试项目
            console.log('1. 创建测试项目...');
            const testProject = await this.projectService.createProject({
                projectName: '测试项目 - 消息集成',
                clientId: '507f1f77bcf86cd799439013',
                clientName: '测试客户',
                contactIds: ['507f1f77bcf86cd799439014'],
                contactNames: ['测试联系人'],
                contactPhones: ['13800138000'],
                undertakingTeam: '507f1f77bcf86cd799439015',
                mainDesigners: ['68937bd8da714e85786bc849'],
                assistantDesigners: ['68937bd8da714e85786bc850'],
                clientRequirements: '测试项目需求',
                createdBy: '68937bd8da714e85786bc849'
            });

            console.log(`✅ 项目创建成功: ${testProject.projectName} (ID: ${testProject._id})`);

            // 2. 更新项目状态（会触发状态变更通知）
            console.log('2. 更新项目状态...');
            await this.projectService.updateProject((testProject._id as any).toString(), {
                progressStatus: 'in-progress',
                startedAt: new Date(),
                updatedBy: '68937bd8da714e85786bc849'
            });
            console.log('✅ 项目状态更新成功 (consulting -> in-progress)');

            // 3. 更新项目团队（会触发团队变更通知）
            console.log('3. 更新项目团队...');
            await this.projectService.updateProject((testProject._id as any).toString(), {
                mainDesigners: ['68937bd8da714e85786bc849', '68937bd8da714e85786bc851'], // 新增一个主创设计师
                assistantDesigners: ['68937bd8da714e85786bc850'], // 移除一个助理设计师
                updatedBy: '68937bd8da714e85786bc849'
            });
            console.log('✅ 项目团队变更通知发送成功');

            // 4. 完成项目（会触发里程碑通知）
            console.log('4. 完成项目...');
            await this.projectService.updateProject((testProject._id as any).toString(), {
                progressStatus: 'completed',
                deliveredAt: new Date(),
                updatedBy: '68937bd8da714e85786bc849'
            });
            console.log('✅ 项目完成里程碑通知发送成功');

            // 5. 完成结算（会触发结算里程碑通知）
            console.log('5. 完成项目结算...');
            await this.projectService.updateProject((testProject._id as any).toString(), {
                settlementStatus: 'fully-paid',
                settledAt: new Date(),
                updatedBy: '68937bd8da714e85786bc849'
            });
            console.log('✅ 项目结算完成里程碑通知发送成功');

        } catch (error) {
            console.error('❌ 项目通知测试失败:', error);
        }
    }

    /**
     * 测试任务调度服务
     */
    private async testTaskScheduler() {
        console.log('\n⏰ 测试任务调度服务...');

        try {
            // 获取调度服务状态
            const status = this.taskSchedulerService.getStatus();
            console.log(`📊 调度服务状态: ${status.isRunning ? '运行中' : '已停止'}`);
            console.log(`📊 活跃任务数: ${status.activeTasks}`);

            // 手动触发任务检查
            console.log('🔧 手动触发任务检查...');
            await this.taskSchedulerService.triggerTaskCheck();
            console.log('✅ 任务检查完成');

        } catch (error) {
            console.error('❌ 任务调度服务测试失败:', error);
        }
    }
}

// 运行测试
const test = new BusinessIntegrationTest();
test.run().catch(console.error);
