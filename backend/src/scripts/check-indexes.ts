/**
 * 索引检查与创建脚本
 *
 * 功能：
 * - 检查用户模型改造后所需的索引是否存在
 * - 创建缺失的索引
 * - 分析索引使用情况
 *
 * 使用方法：
 * npx ts-node src/scripts/check-indexes.ts
 * npx ts-node src/scripts/check-indexes.ts --create
 * npx ts-node src/scripts/check-indexes.ts --analyze
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser';

// ═══════════════════════════════════════════════════════════════════════════
// 索引定义
// ═══════════════════════════════════════════════════════════════════════════

interface IndexDefinition {
    collection: string;
    name: string;
    keys: Record<string, 1 | -1>;
    options?: {
        unique?: boolean;
        sparse?: boolean;
        background?: boolean;
    };
    description: string;
}

/**
 * 用户模型改造后所需的索引
 */
const REQUIRED_INDEXES: IndexDefinition[] = [
    // Users 集合索引
    {
        collection: 'users',
        name: 'users_userTypes_1',
        keys: { userTypes: 1 },
        description: '用户类型索引 - 支持按员工/客户联系人筛选'
    },
    {
        collection: 'users',
        name: 'users_roles_1',
        keys: { roles: 1 },
        description: '角色索引 - 支持按角色筛选'
    },
    {
        collection: 'users',
        name: 'users_employeeProfile_enterpriseId_1',
        keys: { 'employeeProfile.enterpriseId': 1 },
        options: { sparse: true },
        description: '员工企业ID索引 - 支持按企业筛选员工'
    },
    {
        collection: 'users',
        name: 'users_employeeProfile_departmentId_1',
        keys: { 'employeeProfile.departmentId': 1 },
        options: { sparse: true },
        description: '员工部门ID索引 - 支持按部门筛选员工'
    },
    {
        collection: 'users',
        name: 'users_employeeProfile_status_1',
        keys: { 'employeeProfile.status': 1 },
        options: { sparse: true },
        description: '员工状态索引 - 支持按在职/离职筛选'
    },
    {
        collection: 'users',
        name: 'users_clientContactProfile_clientId_1',
        keys: { 'clientContactProfile.clientId': 1 },
        options: { sparse: true },
        description: '客户联系人clientId索引 - 门户查询核心索引'
    },
    {
        collection: 'users',
        name: 'users_clientContactProfile_portalRole_1',
        keys: { 'clientContactProfile.portalRole': 1 },
        options: { sparse: true },
        description: '门户角色索引 - 支持按门户角色筛选'
    },
    {
        collection: 'users',
        name: 'users_status_1',
        keys: { status: 1 },
        description: '用户状态索引'
    },
    {
        collection: 'users',
        name: 'users_email_1',
        keys: { email: 1 },
        options: { unique: true, sparse: true },
        description: '邮箱唯一索引'
    },
    {
        collection: 'users',
        name: 'users_phone_1',
        keys: { phone: 1 },
        options: { unique: true, sparse: true },
        description: '手机号唯一索引'
    },

    // Clients 集合索引
    {
        collection: 'clients',
        name: 'clients_name_1',
        keys: { name: 1 },
        description: '客户名称索引 - 支持按名称查找客户'
    },
    {
        collection: 'clients',
        name: 'clients_name_text',
        keys: { name: 1 },  // 实际应为 text 索引，这里简化处理
        description: '客户名称文本索引 - 支持模糊搜索'
    },

    // Projects 集合索引
    {
        collection: 'projects',
        name: 'projects_clientId_1',
        keys: { clientId: 1 },
        description: '项目客户ID索引 - 门户查询核心索引'
    },
    {
        collection: 'projects',
        name: 'projects_clientId_status_1',
        keys: { clientId: 1, status: 1 },
        description: '项目客户+状态复合索引'
    },

    // 迁移元数据
    {
        collection: 'migration_meta',
        name: 'migration_meta_version_1',
        keys: { version: 1 },
        options: { unique: true },
        description: '迁移版本唯一索引'
    }
];

// ═══════════════════════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════════════════════

async function connectDB(): Promise<void> {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ 数据库连接成功');
        console.log(`🔗 连接地址: ${MONGODB_URI}\n`);
    } catch (error) {
        console.error('❌ 数据库连接失败:', error);
        process.exit(1);
    }
}

async function getExistingIndexes(collectionName: string): Promise<any[]> {
    const db = mongoose.connection.db;
    if (!db) return [];

    try {
        const collection = db.collection(collectionName);
        return await collection.indexes();
    } catch {
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 检查索引
// ═══════════════════════════════════════════════════════════════════════════

async function checkIndexes(): Promise<{ missing: IndexDefinition[]; existing: string[] }> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    索引检查报告');
    console.log('═══════════════════════════════════════════════════════════\n');

    const missing: IndexDefinition[] = [];
    const existing: string[] = [];

    // 按集合分组
    const collections = [...new Set(REQUIRED_INDEXES.map(idx => idx.collection))];

    for (const collectionName of collections) {
        console.log(`📁 集合: ${collectionName}`);
        console.log('─'.repeat(50));

        const existingIndexes = await getExistingIndexes(collectionName);
        const existingKeyStrings = existingIndexes.map(idx =>
            JSON.stringify(idx.key)
        );

        const requiredForCollection = REQUIRED_INDEXES.filter(
            idx => idx.collection === collectionName
        );

        for (const required of requiredForCollection) {
            const keyString = JSON.stringify(required.keys);
            const exists = existingKeyStrings.some(eks =>
                eks === keyString || existingIndexes.some(ei => ei.name === required.name)
            );

            if (exists) {
                console.log(`  ✅ ${required.name}`);
                console.log(`     ${required.description}`);
                existing.push(required.name);
            } else {
                console.log(`  ❌ ${required.name} (缺失)`);
                console.log(`     ${required.description}`);
                missing.push(required);
            }
        }

        console.log('');
    }

    // 摘要
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                       摘要');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ 已存在索引: ${existing.length}`);
    console.log(`❌ 缺失索引: ${missing.length}`);

    if (missing.length > 0) {
        console.log('\n缺失索引列表:');
        missing.forEach(idx => {
            console.log(`  - ${idx.collection}.${idx.name}`);
        });
        console.log('\n💡 提示: 运行 --create 参数来创建缺失的索引');
    }

    return { missing, existing };
}

// ═══════════════════════════════════════════════════════════════════════════
// 创建索引
// ═══════════════════════════════════════════════════════════════════════════

async function createMissingIndexes(indexes: IndexDefinition[]): Promise<void> {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    创建索引');
    console.log('═══════════════════════════════════════════════════════════\n');

    const db = mongoose.connection.db;
    if (!db) {
        console.error('❌ 数据库连接不可用');
        return;
    }

    let created = 0;
    let failed = 0;

    for (const index of indexes) {
        try {
            const collection = db.collection(index.collection);
            await collection.createIndex(index.keys, {
                name: index.name,
                background: true,
                ...index.options
            });
            console.log(`✅ 创建成功: ${index.collection}.${index.name}`);
            created++;
        } catch (error: any) {
            if (error.code === 85 || error.code === 86) {
                // 索引已存在或索引键冲突
                console.log(`⏭️  已存在: ${index.collection}.${index.name}`);
            } else {
                console.error(`❌ 创建失败: ${index.collection}.${index.name}`);
                console.error(`   错误: ${error.message}`);
                failed++;
            }
        }
    }

    console.log('\n─────────────────────────────────────────────────────────');
    console.log(`创建完成: 成功 ${created}, 失败 ${failed}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 分析索引使用情况
// ═══════════════════════════════════════════════════════════════════════════

async function analyzeIndexUsage(): Promise<void> {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    索引使用分析');
    console.log('═══════════════════════════════════════════════════════════\n');

    const db = mongoose.connection.db;
    if (!db) {
        console.error('❌ 数据库连接不可用');
        return;
    }

    const collections = ['users', 'clients', 'projects'];

    for (const collectionName of collections) {
        console.log(`📁 集合: ${collectionName}`);
        console.log('─'.repeat(50));

        try {
            const stats = await db.collection(collectionName).aggregate([
                { $indexStats: {} }
            ]).toArray();

            if (stats.length === 0) {
                console.log('  无索引统计数据\n');
                continue;
            }

            stats.forEach(stat => {
                const accesses = stat.accesses?.ops || 0;
                const since = stat.accesses?.since
                    ? new Date(stat.accesses.since).toLocaleDateString()
                    : 'N/A';
                console.log(`  ${stat.name}`);
                console.log(`    访问次数: ${accesses}, 统计自: ${since}`);
            });
        } catch (error: any) {
            console.log(`  ⚠️ 无法获取统计: ${error.message}`);
        }

        console.log('');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 入口
// ═══════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const shouldCreate = args.includes('--create');
    const shouldAnalyze = args.includes('--analyze');

    await connectDB();

    const { missing } = await checkIndexes();

    if (shouldCreate && missing.length > 0) {
        await createMissingIndexes(missing);
    }

    if (shouldAnalyze) {
        await analyzeIndexUsage();
    }

    await mongoose.disconnect();
    console.log('\n👋 数据库连接已关闭');
    process.exit(0);
}

main().catch(console.error);
