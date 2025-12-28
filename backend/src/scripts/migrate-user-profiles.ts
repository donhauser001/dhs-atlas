/**
 * 用户数据迁移脚本 v1.2
 *
 * 功能：将旧的 User 数据结构迁移到新的 Profile 模式
 * - 根据旧 role 字段判断用户类型
 * - 填充 userTypes 数组
 * - 填充 employeeProfile 或 clientContactProfile
 * - 映射旧 role 到新 roles 数组
 *
 * 幂等性保证：
 * - 再次运行不会重复迁移已处理的用户
 * - 不会覆盖已存在的 profile 数据
 * - 不会删除旧字段（保留兼容性）
 *
 * 命令行参数：
 * --dry-run    模拟运行，不实际写入数据库
 * --force      跳过备份确认
 * --verbose    详细输出每个用户的迁移过程
 *
 * 使用方法：
 * npx ts-node src/scripts/migrate-user-profiles.ts
 * npx ts-node src/scripts/migrate-user-profiles.ts --dry-run
 * npx ts-node src/scripts/migrate-user-profiles.ts --force
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';
import User, {
    IUser,
    mapLegacyRoleToNewRoles,
    isEmployeeRole,
    isClientRole,
    LegacyRole
} from '../models/User';
import Client from '../models/Client';

// 加载环境变量
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser';

// ═══════════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════════

interface MigrationStats {
    total: number;
    employees: number;
    clients: number;
    dualIdentity: number;
    skipped: number;
    errors: number;
    noClientMatch: number;
}

interface MigrationMeta {
    _id: string;
    version: string;
    appliedAt: Date;
    stats: MigrationStats;
    dryRun: boolean;
}

interface CommandLineArgs {
    dryRun: boolean;
    force: boolean;
    verbose: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// 命令行参数解析
// ═══════════════════════════════════════════════════════════════════════════

function parseArgs(): CommandLineArgs {
    const args = process.argv.slice(2);
    return {
        dryRun: args.includes('--dry-run'),
        force: args.includes('--force'),
        verbose: args.includes('--verbose'),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// 迁移版本管理
// ═══════════════════════════════════════════════════════════════════════════

const MIGRATION_VERSION = 'user_profile_migration_v1_2';

/**
 * 检查迁移是否已应用
 */
async function checkMigrationApplied(): Promise<MigrationMeta | null> {
    const db = mongoose.connection.db;
    if (!db) return null;

    const metaCollection = db.collection('migration_meta');
    const existing = await metaCollection.findOne({ _id: MIGRATION_VERSION });
    return existing as MigrationMeta | null;
}

/**
 * 记录迁移版本
 */
async function recordMigration(stats: MigrationStats, dryRun: boolean): Promise<void> {
    const db = mongoose.connection.db;
    if (!db || dryRun) return;

    const metaCollection = db.collection('migration_meta');
    const meta: MigrationMeta = {
        _id: MIGRATION_VERSION,
        version: MIGRATION_VERSION,
        appliedAt: new Date(),
        stats,
        dryRun,
    };

    await metaCollection.updateOne(
        { _id: MIGRATION_VERSION },
        { $set: meta },
        { upsert: true }
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 数据库连接
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

// ═══════════════════════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════════════════════

async function findClientIdByCompanyName(companyName: string): Promise<string | null> {
    if (!companyName) return null;

    try {
        // 精确匹配优先
        let client = await Client.findOne({ name: companyName });
        if (client) return client._id.toString();

        // 模糊匹配
        client = await Client.findOne({
            name: { $regex: companyName, $options: 'i' }
        });
        return client ? client._id.toString() : null;
    } catch {
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 单用户迁移逻辑
// ═══════════════════════════════════════════════════════════════════════════

async function migrateUser(
    user: IUser,
    stats: MigrationStats,
    args: CommandLineArgs
): Promise<void> {
    try {
        const legacyRole = user.role as LegacyRole;

        // 幂等性检查：如果已经迁移过，跳过
        if (user.userTypes && user.userTypes.length > 0) {
            if (args.verbose) {
                console.log(`⏭️  跳过已迁移用户: ${user.username} (userTypes: ${user.userTypes.join(', ')})`);
            }
            stats.skipped++;
            return;
        }

        // 初始化新字段
        const updateData: Partial<IUser> = {
            userTypes: [],
            roles: mapLegacyRoleToNewRoles(legacyRole)
        };

        let isEmployeeMigrated = false;
        let isClientMigrated = false;

        // 根据角色判断用户类型
        if (isEmployeeRole(legacyRole)) {
            updateData.userTypes = ['employee'];

            // 只有当 employeeProfile 不存在或为空时才填充
            if (!user.employeeProfile || Object.keys(user.employeeProfile).length === 0) {
                updateData.employeeProfile = {
                    enterpriseId: user.enterpriseId || undefined,
                    departmentId: user.departmentId || undefined,
                    position: user.position || undefined,
                    status: 'active'
                };
            }

            isEmployeeMigrated = true;
            stats.employees++;

            if (args.verbose) {
                console.log(`👤 员工迁移: ${user.username}`);
                console.log(`   角色: ${legacyRole} → roles: [${updateData.roles?.join(', ')}]`);
                if (user.departmentId) {
                    console.log(`   部门ID: ${user.departmentId}`);
                }
            }
        }

        if (isClientRole(legacyRole)) {
            updateData.userTypes = ['client_contact'];

            // 只有当 clientContactProfile 不存在或为空时才填充
            if (!user.clientContactProfile || Object.keys(user.clientContactProfile).length === 0) {
                // 尝试根据 company 字段查找对应的 Client
                const clientId = await findClientIdByCompanyName(user.company || '');

                updateData.clientContactProfile = {
                    clientId: clientId || undefined,
                    clientDepartmentName: user.department || undefined,
                    title: user.position || undefined,
                    isPrimary: false,
                    portalRole: 'member'
                };

                if (!clientId && user.company) {
                    stats.noClientMatch++;
                    if (args.verbose) {
                        console.log(`🏢 客户联系人迁移: ${user.username}`);
                        console.log(`   ⚠️ 公司「${user.company}」未匹配到 Client 记录，clientId 为空`);
                    }
                } else if (clientId) {
                    if (args.verbose) {
                        console.log(`🏢 客户联系人迁移: ${user.username}`);
                        console.log(`   公司: ${user.company} → clientId: ${clientId}`);
                    }
                } else {
                    if (args.verbose) {
                        console.log(`🏢 客户联系人迁移: ${user.username} (无公司信息)`);
                    }
                }
            }

            isClientMigrated = true;
            stats.clients++;
        }

        // 统计双重身份
        if (isEmployeeMigrated && isClientMigrated) {
            stats.dualIdentity++;
            if (args.verbose) {
                console.log(`   ⚠️ 双重身份: 该用户同时被识别为员工和客户联系人`);
            }
        }

        // 执行更新（dry-run 模式下不实际写入）
        if (!args.dryRun) {
            await User.updateOne(
                { _id: user._id },
                { $set: updateData }
            );
        }

    } catch (error) {
        console.error(`❌ 迁移用户 ${user.username} 失败:`, error);
        stats.errors++;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 主迁移流程
// ═══════════════════════════════════════════════════════════════════════════

async function runMigration(args: CommandLineArgs): Promise<void> {
    const modeLabel = args.dryRun ? '🔍 DRY-RUN 模式（不会写入数据）' : '🚀 正式迁移模式';

    console.log('═══════════════════════════════════════════════════════════');
    console.log('              用户数据迁移脚本 v1.2');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n${modeLabel}\n`);

    // 检查是否已应用过迁移
    const existingMeta = await checkMigrationApplied();
    if (existingMeta && !args.dryRun) {
        console.log('⚠️  检测到此迁移已于以下时间应用:');
        console.log(`   应用时间: ${existingMeta.appliedAt}`);
        console.log(`   员工迁移: ${existingMeta.stats.employees}`);
        console.log(`   客户联系人迁移: ${existingMeta.stats.clients}`);
        console.log('\n如需重新迁移，请先删除 migration_meta 中的记录。');
        console.log('或使用 --dry-run 模式查看当前状态。\n');

        if (!args.force) {
            return;
        }
        console.log('--force 参数已指定，继续执行...\n');
    }

    const stats: MigrationStats = {
        total: 0,
        employees: 0,
        clients: 0,
        dualIdentity: 0,
        skipped: 0,
        errors: 0,
        noClientMatch: 0
    };

    try {
        // 获取所有用户
        const users = await User.find({});
        stats.total = users.length;

        console.log(`📊 数据库中共有 ${stats.total} 个用户\n`);
        console.log('───────────────────────────────────────────────────────────\n');

        // 逐个迁移
        for (const user of users) {
            await migrateUser(user, stats, args);
        }

        // 输出统计报告
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log(args.dryRun ? '              DRY-RUN 模拟结果' : '              迁移完成报告');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`📊 用户总数:           ${stats.total}`);
        console.log(`👤 ${args.dryRun ? '将' : '已'}迁移为员工:     ${stats.employees}`);
        console.log(`🏢 ${args.dryRun ? '将' : '已'}迁移为客户联系人: ${stats.clients}`);
        console.log(`👥 双重身份:           ${stats.dualIdentity}`);
        console.log(`⏭️  跳过(已迁移):       ${stats.skipped}`);
        console.log(`⚠️  未匹配客户公司:     ${stats.noClientMatch}`);
        console.log(`❌ 错误:               ${stats.errors}`);
        console.log('═══════════════════════════════════════════════════════════\n');

        // 验证摘要
        const actualMigrated = stats.employees + stats.clients - stats.dualIdentity;
        console.log(`✅ ${args.dryRun ? '预计' : '实际'}迁移: ${actualMigrated} 个用户`);

        if (stats.noClientMatch > 0) {
            console.log(`\n💡 提示: 有 ${stats.noClientMatch} 个客户联系人未能匹配到客户公司。`);
            console.log('   请在管理后台手动为这些联系人关联正确的客户公司。');
        }

        if (stats.errors > 0) {
            console.log(`\n⚠️ 警告: 有 ${stats.errors} 个用户迁移失败，请检查上方错误日志。`);
        }

        // 记录迁移版本（非 dry-run 模式）
        if (!args.dryRun) {
            await recordMigration(stats, args.dryRun);
            console.log(`\n📝 迁移版本已记录: ${MIGRATION_VERSION}`);
        }

    } catch (error) {
        console.error('❌ 迁移过程出错:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 备份确认
// ═══════════════════════════════════════════════════════════════════════════

async function confirmBackup(args: CommandLineArgs): Promise<boolean> {
    // dry-run 模式不需要确认
    if (args.dryRun) {
        return true;
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('⚠️  重要提示: 运行迁移前请确保已备份数据库！');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('\n备份命令示例:');
        console.log('mongodump --uri="mongodb://localhost:27017/donhauser" --out=./backup_$(date +%Y%m%d_%H%M%S)\n');
        console.log('或使用 --dry-run 模式先查看迁移预览。\n');

        rl.question('是否已完成数据库备份？(yes/no): ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// 入口
// ═══════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
    const args = parseArgs();

    // 显示模式
    if (args.dryRun) {
        console.log('\n🔍 DRY-RUN 模式：仅模拟迁移，不会修改任何数据\n');
    }

    // 备份确认
    if (!args.force && !args.dryRun) {
        const confirmed = await confirmBackup(args);
        if (!confirmed) {
            console.log('\n❌ 操作已取消。请先备份数据库后再运行迁移脚本。\n');
            process.exit(0);
        }
    }

    await connectDB();
    await runMigration(args);
    await mongoose.disconnect();
    console.log('👋 数据库连接已关闭\n');
    process.exit(0);
}

// 运行迁移
main().catch(console.error);
