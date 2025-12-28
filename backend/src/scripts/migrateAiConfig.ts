/**
 * AI 配置迁移脚本
 *
 * 功能：将旧的 aiconfigs 集合数据迁移到 aimodels 集合
 * - 读取 aiconfigs 中的配置
 * - 转换字段格式
 * - 写入 aimodels 集合
 *
 * 字段映射：
 * aiconfigs              →    aimodels
 * ─────────────────────────────────────
 * llmProvider            →    provider
 * llmBaseURL             →    baseUrl
 * llmModel               →    model
 * llmApiKey              →    apiKey
 * temperature            →    temperature
 * maxTokens              →    maxTokens
 * topP                   →    topP
 * enableAI               →    isEnabled
 * (新增)                 →    name: "默认模型"
 * (新增)                 →    isDefault: true
 *
 * 使用方法：
 * npx ts-node src/scripts/migrateAiConfig.ts
 * npx ts-node src/scripts/migrateAiConfig.ts --dry-run
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AiModel from '../models/AiModel';

// 加载环境变量
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser';

// 旧配置的字段结构
interface OldAiConfig {
    _id: mongoose.Types.ObjectId;
    enableAI: boolean;
    llmProvider: string;
    llmBaseURL: string;
    llmModel: string;
    llmApiKey?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    requestTimeout?: number;
    enableChat?: boolean;
    enableContractGeneration?: boolean;
    enableSmartQuotation?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// 迁移统计
interface MigrationStats {
    found: number;
    migrated: number;
    skipped: number;
    errors: number;
}

async function main() {
    const isDryRun = process.argv.includes('--dry-run');

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           AI 配置迁移脚本 (aiconfigs → aimodels)             ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log();

    if (isDryRun) {
        console.log('🔍 模拟运行模式 (--dry-run)，不会实际写入数据库\n');
    }

    // 连接数据库
    console.log('📡 正在连接数据库...');
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ 数据库连接成功\n');
    } catch (error) {
        console.error('❌ 数据库连接失败:', error);
        process.exit(1);
    }

    const stats: MigrationStats = {
        found: 0,
        migrated: 0,
        skipped: 0,
        errors: 0,
    };

    try {
        // 读取旧配置
        console.log('📖 正在读取 aiconfigs 集合...');
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('数据库连接未就绪');
        }

        const oldConfigs = await db.collection('aiconfigs').find({}).toArray() as unknown as OldAiConfig[];
        stats.found = oldConfigs.length;

        console.log(`   找到 ${stats.found} 条旧配置\n`);

        if (stats.found === 0) {
            console.log('⚠️  aiconfigs 集合为空，无需迁移');
            await mongoose.disconnect();
            return;
        }

        // 检查 aimodels 是否已有数据
        const existingModels = await AiModel.countDocuments();
        if (existingModels > 0) {
            console.log(`⚠️  aimodels 集合已有 ${existingModels} 条记录`);
            console.log('   如需重新迁移，请先清空 aimodels 集合\n');
        }

        // AI 设置是全局配置，不需要 enterpriseId
        console.log('📋 AI 设置是全局配置，不需要企业关联\n');

        // 迁移每条配置
        console.log('🔄 开始迁移...\n');

        for (const oldConfig of oldConfigs) {
            console.log('────────────────────────────────────────');
            console.log(`处理配置: ${oldConfig._id}`);
            console.log(`  提供商: ${oldConfig.llmProvider}`);
            console.log(`  模型: ${oldConfig.llmModel}`);
            console.log(`  基础URL: ${oldConfig.llmBaseURL}`);

            // 检查是否已迁移（全局查找）
            const existing = await AiModel.findOne({
                provider: oldConfig.llmProvider,
                model: oldConfig.llmModel,
            });

            if (existing) {
                console.log(`  ⏭️  已存在相同配置，跳过`);
                stats.skipped++;
                continue;
            }

            // 构建新配置（全局配置，不需要 enterpriseId）
            const newConfig = {
                name: `${getProviderName(oldConfig.llmProvider)} - ${oldConfig.llmModel}`,
                provider: oldConfig.llmProvider,
                model: oldConfig.llmModel,
                apiKey: oldConfig.llmApiKey || undefined,
                baseUrl: oldConfig.llmBaseURL,
                temperature: oldConfig.temperature ?? 0.7,
                maxTokens: oldConfig.maxTokens ?? 4096,
                topP: oldConfig.topP ?? 0.9,
                isDefault: true, // 设为默认
                isEnabled: oldConfig.enableAI !== false,
                // 不再需要 enterpriseId，AI 设置是全局的
            };

            console.log(`  新配置名称: ${newConfig.name}`);
            console.log(`  isDefault: ${newConfig.isDefault}`);
            console.log(`  isEnabled: ${newConfig.isEnabled}`);

            if (isDryRun) {
                console.log('  🔍 [模拟] 将创建此配置');
                stats.migrated++;
            } else {
                try {
                    // 先取消所有默认（全局）
                    await AiModel.updateMany({}, { isDefault: false });

                    // 创建新配置
                    const model = new AiModel(newConfig);
                    await model.save();
                    console.log(`  ✅ 迁移成功，ID: ${model._id}`);
                    stats.migrated++;
                } catch (error) {
                    console.error(`  ❌ 迁移失败:`, error);
                    stats.errors++;
                }
            }
        }

        // 输出统计
        console.log('\n════════════════════════════════════════');
        console.log('迁移完成！统计信息：');
        console.log(`  📊 找到旧配置: ${stats.found}`);
        console.log(`  ✅ 成功迁移: ${stats.migrated}`);
        console.log(`  ⏭️  跳过: ${stats.skipped}`);
        console.log(`  ❌ 错误: ${stats.errors}`);
        console.log('════════════════════════════════════════\n');

        // 验证迁移结果
        if (!isDryRun) {
            console.log('🔍 验证迁移结果...');
            const defaultModel = await AiModel.findOne({ isDefault: true, isEnabled: true });
            if (defaultModel) {
                console.log(`✅ 找到默认模型: ${defaultModel.name}`);
                console.log(`   提供商: ${defaultModel.provider}`);
                console.log(`   模型: ${defaultModel.model}`);
                console.log(`   基础URL: ${defaultModel.baseUrl}`);
            } else {
                console.log('⚠️  未找到默认模型，请检查迁移结果');
            }
        }

    } catch (error) {
        console.error('❌ 迁移过程出错:', error);
        stats.errors++;
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 数据库连接已关闭');
    }
}

/**
 * 获取提供商显示名称
 */
function getProviderName(provider: string): string {
    const names: Record<string, string> = {
        openai: 'OpenAI',
        anthropic: 'Anthropic',
        google: 'Google',
        deepseek: 'DeepSeek',
        zhipu: '智谱AI',
        moonshot: 'Moonshot',
        qwen: '通义千问',
        ollama: 'Ollama',
        lmstudio: 'LMStudio',
        custom: '自定义',
    };
    return names[provider] || provider;
}

// 运行迁移
main().catch(console.error);

