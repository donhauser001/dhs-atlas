import mongoose from 'mongoose';
import Project from '../models/Project';
import Task from '../models/Task';

/**
 * 修复项目中缺失的 taskIds
 * 根据任务的 projectId 反向更新项目的 taskIds
 */
async function fixProjectTaskIds() {
    try {
        // 连接数据库
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser';
        await mongoose.connect(mongoUri);
        console.log('✅ 数据库连接成功');

        // 获取所有项目
        const projects = await Project.find({}).lean();
        console.log(`📋 找到 ${projects.length} 个项目`);

        let fixedCount = 0;
        let skippedCount = 0;

        for (const project of projects) {
            const projectId = (project._id as any).toString();
            
            // 根据 projectId 查找所有关联的任务
            const tasks = await Task.find({ projectId }).select('_id').lean();
            
            if (tasks.length === 0) {
                console.log(`⏭️  项目 "${project.projectName}" 没有关联任务，跳过`);
                skippedCount++;
                continue;
            }

            // 获取任务ID列表
            const taskIds = tasks.map(task => (task._id as any).toString());
            
            // 检查是否需要更新
            const currentTaskIds = (project.taskIds || []).map((id: any) => String(id));
            const needsUpdate = 
                taskIds.length !== currentTaskIds.length ||
                taskIds.some(id => !currentTaskIds.includes(id));

            if (needsUpdate) {
                await Project.findByIdAndUpdate(projectId, { taskIds });
                console.log(`✅ 项目 "${project.projectName}" 已更新，关联 ${taskIds.length} 个任务`);
                fixedCount++;
            } else {
                console.log(`✓ 项目 "${project.projectName}" 的 taskIds 已是最新，跳过`);
                skippedCount++;
            }
        }

        console.log('\n📊 修复完成:');
        console.log(`   - 已修复: ${fixedCount} 个项目`);
        console.log(`   - 已跳过: ${skippedCount} 个项目`);

        await mongoose.disconnect();
        console.log('✅ 数据库连接已关闭');
    } catch (error) {
        console.error('❌ 修复失败:', error);
        process.exit(1);
    }
}

// 运行脚本
if (require.main === module) {
    fixProjectTaskIds()
        .then(() => {
            console.log('✅ 脚本执行完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 脚本执行失败:', error);
            process.exit(1);
        });
}

export default fixProjectTaskIds;

