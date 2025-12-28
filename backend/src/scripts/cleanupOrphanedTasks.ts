/**
 * 清理孤立任务脚本
 * 用于清理那些 projectId 对应的项目不存在的任务
 * 
 * 使用方法:
 *   ts-node src/scripts/cleanupOrphanedTasks.ts
 * 或
 *   npm run script:cleanup-orphaned-tasks
 */

import mongoose from 'mongoose';
import Task from '../models/Task';
import Project from '../models/Project';

// 从环境变量或默认值获取 MongoDB 连接字符串
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/donhauser';

async function cleanupOrphanedTasks() {
    try {
        console.log('🔍 开始连接数据库...');
        
        // 连接数据库
        await mongoose.connect(mongoUri);
        console.log('✅ 数据库连接成功');

        console.log('🧹 开始清理孤立任务...');
        
        // 获取所有任务
        const allTasks = await Task.find({}).select('_id projectId taskName').lean();
        const totalTasks = allTasks.length;
        console.log(`   总任务数: ${totalTasks}`);

        // 获取所有存在的项目ID
        const existingProjects = await Project.find({}).select('_id').lean();
        const existingProjectIds = new Set(
            existingProjects.map(p => p._id.toString())
        );
        console.log(`   存在的项目数: ${existingProjectIds.size}`);

        // 找出孤立任务（projectId 对应的项目不存在）
        const orphanedTasks: Array<{ _id: string; projectId: string; taskName: string }> = [];
        const orphanedTaskIds: string[] = [];

        for (const task of allTasks) {
            const taskId = task._id.toString();
            const projectId = task.projectId;

            // 检查项目是否存在
            if (!existingProjectIds.has(projectId)) {
                orphanedTasks.push({
                    _id: taskId,
                    projectId,
                    taskName: task.taskName
                });
                orphanedTaskIds.push(taskId);
            }
        }

        // 删除孤立任务
        let deletedTasks = 0;
        if (orphanedTaskIds.length > 0) {
            const result = await Task.deleteMany({
                _id: { $in: orphanedTaskIds }
            });
            deletedTasks = result.deletedCount || 0;
        }

        const result = {
            totalTasks,
            orphanedTasks: orphanedTasks.length,
            deletedTasks,
            orphanedTaskIds
        };

        console.log('\n📊 清理结果:');
        console.log(`   总任务数: ${result.totalTasks}`);
        console.log(`   孤立任务数: ${result.orphanedTasks}`);
        console.log(`   已删除任务数: ${result.deletedTasks}`);

        if (result.orphanedTaskIds.length > 0) {
            console.log(`\n🗑️  已删除的任务ID (前10个):`);
            result.orphanedTaskIds.slice(0, 10).forEach((id, index) => {
                console.log(`   ${index + 1}. ${id}`);
            });
            if (result.orphanedTaskIds.length > 10) {
                console.log(`   ... 还有 ${result.orphanedTaskIds.length - 10} 个任务`);
            }
        }

        console.log('\n✅ 清理完成！');

        // 关闭数据库连接
        await mongoose.connection.close();
        console.log('✅ 数据库连接已关闭');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ 清理失败:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// 运行清理
cleanupOrphanedTasks();

