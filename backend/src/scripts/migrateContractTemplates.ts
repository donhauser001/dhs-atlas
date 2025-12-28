import mongoose from 'mongoose';
import ContractTemplate from '../models/ContractTemplate';
import ContractTemplateCategory from '../models/ContractTemplateCategory';

// 连接数据库
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/donhauser';
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB连接成功');
    } catch (error) {
        console.error('❌ MongoDB连接失败:', error);
        process.exit(1);
    }
};

// 迁移合同模板category字段
const migrateContractTemplates = async () => {
    try {
        console.log('🔄 开始迁移合同模板category字段...');

        // 查找所有模板
        if (!mongoose.connection.db) {
            throw new Error('数据库连接未建立');
        }
        const templates = await mongoose.connection.db.collection('contracttemplates').find({}).toArray();
        console.log(`📊 找到 ${templates.length} 个模板需要检查`);

        // 确保有默认分类
        let defaultCategory = await ContractTemplateCategory.findOne({ isDefault: true });
        if (!defaultCategory) {
            // 创建默认分类
            defaultCategory = await ContractTemplateCategory.create({
                name: '通用合同',
                description: '默认合同分类',
                isDefault: true,
                color: 'blue',
                createdBy: 'system'
            });
            console.log('✨ 创建了默认分类:', defaultCategory.name);
        }

        let migratedCount = 0;
        let skippedCount = 0;

        for (const template of templates) {
            try {
                // 检查category字段是否为有效的ObjectId
                const isValidObjectId = mongoose.Types.ObjectId.isValid(template.category);

                if (!isValidObjectId) {
                    // 如果不是有效的ObjectId，更新为默认分类
                    if (mongoose.connection.db) {
                        await mongoose.connection.db.collection('contracttemplates').updateOne(
                            { _id: template._id },
                            {
                                $set: {
                                    category: defaultCategory._id,
                                    updateTime: new Date()
                                }
                            }
                        );
                    }
                    migratedCount++;
                    console.log(`✅ 迁移模板: ${template.name} (${template.category} -> ${defaultCategory.name})`);
                } else {
                    // 验证ObjectId是否指向有效的分类
                    const categoryExists = await ContractTemplateCategory.findById(template.category);
                    if (!categoryExists) {
                        // 如果分类不存在，更新为默认分类
                        if (mongoose.connection.db) {
                            await mongoose.connection.db.collection('contracttemplates').updateOne(
                                { _id: template._id },
                                {
                                    $set: {
                                        category: defaultCategory._id,
                                        updateTime: new Date()
                                    }
                                }
                            );
                        }
                        migratedCount++;
                        console.log(`✅ 修复模板: ${template.name} (无效分类 -> ${defaultCategory.name})`);
                    } else {
                        skippedCount++;
                        console.log(`⏭️  跳过模板: ${template.name} (分类有效)`);
                    }
                }
            } catch (error) {
                console.error(`❌ 迁移模板 ${template.name} 失败:`, error);
            }
        }

        console.log('\n📈 迁移统计:');
        console.log(`✅ 成功迁移: ${migratedCount} 个模板`);
        console.log(`⏭️  跳过: ${skippedCount} 个模板`);
        console.log(`📊 总计: ${templates.length} 个模板`);

    } catch (error) {
        console.error('❌ 迁移失败:', error);
        throw error;
    }
};

// 主函数
const main = async () => {
    try {
        await connectDB();
        await migrateContractTemplates();
        console.log('🎉 迁移完成!');
    } catch (error) {
        console.error('❌ 迁移过程中发生错误:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📤 数据库连接已关闭');
    }
};

// 运行迁移
if (require.main === module) {
    main();
}

export default migrateContractTemplates;
