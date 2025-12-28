import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { File, IFile } from '../models/File';
import User from '../models/User';
import { FileService } from '../services/FileService';
import ScanStatusManager from '../utils/scanStatusManager';

/**
 * 文件扫描脚本
 * 自动扫描uploads目录并将文件信息录入数据库
 */

// 修复中文文件名编码问题的函数
function fixChineseFilename(filename: string): string {
    try {
        // 检查是否包含中文字符的乱码模式
        if (/[éèêëàáâäòóôöùúûüç]/.test(filename)) {
            // 尝试从latin1解码到utf8
            return Buffer.from(filename, 'latin1').toString('utf8');
        }
        return filename;
    } catch (error) {
        // 如果解码失败，返回原始文件名
        return filename;
    }
}

// 数据库连接配置
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser';

// uploads目录路径
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// 系统用户ID（用于标记系统扫描的文件）
let SYSTEM_USER_ID: string;

// 文件分类映射
const CATEGORY_MAPPING: { [key: string]: string } = {
    'article-image': 'article-image',
    'articles': 'articles',
    'avatars': 'avatars',
    'clients': 'clients',
    'contracts': 'contracts',
    'departments': 'departments',
    'enterprises': 'enterprises',
    'forms': 'forms',
    'projects': 'projects',
    'users': 'users'
};

// 支持的文件扩展名
const SUPPORTED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
    '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.csv', '.zip', '.rar', '.7z', '.tar', '.gz',
    '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv',
    '.mp3', '.wav', '.flac', '.aac', '.ogg',
    '.json', '.xml', '.html', '.css', '.js', '.ts'
];

/**
 * 获取MIME类型
 */
function getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes: { [key: string]: string } = {
        // 图片
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml',

        // 文档
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.csv': 'text/csv',

        // 压缩文件
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.7z': 'application/x-7z-compressed',
        '.tar': 'application/x-tar',
        '.gz': 'application/gzip',

        // 视频
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv',
        '.flv': 'video/x-flv',
        '.mkv': 'video/x-matroska',

        // 音频
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.flac': 'audio/flac',
        '.aac': 'audio/aac',
        '.ogg': 'audio/ogg',

        // 代码/文本
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.ts': 'application/typescript'
    };

    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 检查文件是否已存在于数据库
 */
async function fileExistsInDB(filePath: string): Promise<boolean> {
    try {
        const existingFile = await File.findOne({
            filePath: filePath,
            status: 'active'
        });
        return !!existingFile;
    } catch (error) {
        console.error('检查文件是否存在失败:', error);
        return false;
    }
}

/**
 * 扫描单个文件并录入数据库
 */
async function scanFile(
    filePath: string,
    category: string,
    subDirectory?: string
): Promise<IFile | null> {
    try {
        // 检查文件是否已存在于数据库
        if (await fileExistsInDB(filePath)) {
            console.log(`文件已存在于数据库: ${filePath}`);
            return null;
        }

        // 获取文件信息
        const stats = fs.statSync(filePath);
        const fileName = path.basename(filePath);
        const originalName = fixChineseFilename(fileName); // 修复中文文件名编码
        const fileExt = path.extname(originalName).toLowerCase();

        // 检查是否为支持的文件类型
        if (!SUPPORTED_EXTENSIONS.includes(fileExt)) {
            console.log(`跳过不支持的文件类型: ${filePath}`);
            return null;
        }

        // 检查文件大小（跳过超大文件，比如超过500MB）
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (stats.size > maxSize) {
            console.log(`跳过超大文件: ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
            return null;
        }

        const mimeType = getMimeType(filePath);

        // 创建文件记录
        const fileData = {
            originalName,
            fileName,
            filePath,
            fileSize: stats.size,
            mimeType,
            category,
            subDirectory,
            uploadedBy: SYSTEM_USER_ID,
            uploaderName: 'System Scanner',
            uploadTime: stats.birthtime, // 使用文件创建时间
            lastModified: stats.mtime,   // 使用文件修改时间
            isPublic: false,
            description: `系统扫描录入的${category}文件`,
            tags: ['system-scan', category],
            status: 'active'
        };

        const newFile = new File(fileData);
        await newFile.save();

        console.log(`✓ 成功录入文件: ${filePath}`);
        return newFile;
    } catch (error) {
        console.error(`✗ 录入文件失败: ${filePath}`, error);
        return null;
    }
}

/**
 * 递归扫描目录（带进度更新）
 */
async function scanDirectoryWithProgress(
    dirPath: string,
    category: string,
    scanId?: string,
    basePath: string = dirPath
): Promise<{ scanned: number; imported: number; errors: number }> {
    const statusManager = ScanStatusManager.getInstance();
    let stats = { scanned: 0, imported: 0, errors: 0 };

    try {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const itemStats = fs.statSync(itemPath);

            if (itemStats.isDirectory()) {
                // 递归扫描子目录
                const subStats = await scanDirectoryWithProgress(itemPath, category, scanId, basePath);
                stats.scanned += subStats.scanned;
                stats.imported += subStats.imported;
                stats.errors += subStats.errors;
            } else if (itemStats.isFile()) {
                stats.scanned++;

                // 更新当前正在处理的文件
                if (scanId) {
                    statusManager.updateProgress(scanId, {
                        currentFile: item,
                        message: `正在处理: ${item}`
                    });
                }

                // 确定子目录路径
                const relativeDir = path.relative(basePath, dirPath);
                const subDirectory = relativeDir || undefined;

                try {
                    const result = await scanFile(itemPath, category, subDirectory);
                    if (result) {
                        stats.imported++;
                    }
                } catch (error) {
                    console.error(`处理文件出错: ${itemPath}`, error);
                    stats.errors++;
                }
            }
        }
    } catch (error) {
        console.error(`扫描目录失败: ${dirPath}`, error);
        stats.errors++;
    }

    return stats;
}

/**
 * 递归扫描目录（原函数保留）
 */
async function scanDirectory(
    dirPath: string,
    category: string,
    basePath: string = dirPath
): Promise<{ scanned: number; imported: number; errors: number }> {
    let stats = { scanned: 0, imported: 0, errors: 0 };

    try {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const itemStats = fs.statSync(itemPath);

            if (itemStats.isDirectory()) {
                // 递归扫描子目录
                const subDirectory = path.relative(basePath, itemPath);
                const subStats = await scanDirectory(itemPath, category, basePath);
                stats.scanned += subStats.scanned;
                stats.imported += subStats.imported;
                stats.errors += subStats.errors;
            } else if (itemStats.isFile()) {
                stats.scanned++;

                // 确定子目录路径
                const relativeDir = path.relative(basePath, dirPath);
                const subDirectory = relativeDir || undefined;

                try {
                    const result = await scanFile(itemPath, category, subDirectory);
                    if (result) {
                        stats.imported++;
                    }
                } catch (error) {
                    console.error(`处理文件出错: ${itemPath}`, error);
                    stats.errors++;
                }
            }
        }
    } catch (error) {
        console.error(`扫描目录失败: ${dirPath}`, error);
        stats.errors++;
    }

    return stats;
}

/**
 * 获取或创建系统用户
 */
async function getOrCreateSystemUser(): Promise<string> {
    try {
        let systemUser = await User.findOne({ username: 'system-scanner' });

        if (!systemUser) {
            systemUser = new User({
                username: 'system-scanner',
                password: 'system-generated', // 系统用户不需要真实密码
                realName: '系统文件扫描器',
                role: '员工',
                department: '系统',
                email: 'system-scanner@system.local',
                phone: '00000000000',
                status: 'active'
            });

            await systemUser.save();
            console.log('创建系统用户: system-scanner');
        }

        return (systemUser._id as any).toString();
    } catch (error) {
        console.error('获取系统用户失败:', error);
        throw error;
    }
}

/**
 * 主扫描函数
 */
async function scanUploadsDirectory(scanId?: string): Promise<void> {
    const statusManager = ScanStatusManager.getInstance();

    try {
        console.log('🚀 开始扫描uploads目录...');
        console.log(`📁 扫描路径: ${UPLOADS_DIR}`);

        if (scanId) {
            statusManager.startScan(scanId);
            statusManager.updateProgress(scanId, {
                message: '正在检查uploads目录...',
                currentDirectory: UPLOADS_DIR
            });
        }

        // 检查uploads目录是否存在
        if (!fs.existsSync(UPLOADS_DIR)) {
            const errorMsg = `uploads目录不存在: ${UPLOADS_DIR}`;
            console.error(`❌ ${errorMsg}`);
            if (scanId) {
                statusManager.errorScan(scanId, errorMsg);
            }
            return;
        }

        // 获取系统用户ID
        if (scanId) {
            statusManager.updateProgress(scanId, { message: '正在获取系统用户...' });
        }
        SYSTEM_USER_ID = await getOrCreateSystemUser();

        // 获取uploads目录下的所有子目录
        const categories = fs.readdirSync(UPLOADS_DIR).filter(item => {
            const itemPath = path.join(UPLOADS_DIR, item);
            return fs.statSync(itemPath).isDirectory();
        });

        console.log(`📂 发现分类目录: ${categories.join(', ')}`);

        if (scanId) {
            statusManager.updateProgress(scanId, {
                message: `发现 ${categories.length} 个分类目录`,
                currentDirectory: `发现分类: ${categories.join(', ')}`
            });
        }

        let totalStats = { scanned: 0, imported: 0, errors: 0 };

        // 逐个扫描每个分类目录
        for (let i = 0; i < categories.length; i++) {
            const categoryDir = categories[i];
            const categoryPath = path.join(UPLOADS_DIR, categoryDir);
            const category = CATEGORY_MAPPING[categoryDir] || categoryDir;

            console.log(`\n📁 扫描分类: ${categoryDir} -> ${category}`);

            if (scanId) {
                statusManager.updateProgress(scanId, {
                    message: `正在扫描分类: ${categoryDir} (${i + 1}/${categories.length})`,
                    currentDirectory: categoryDir
                });
            }

            const categoryStats = await scanDirectoryWithProgress(categoryPath, category, scanId);

            console.log(`   扫描: ${categoryStats.scanned} 个文件`);
            console.log(`   导入: ${categoryStats.imported} 个文件`);
            console.log(`   错误: ${categoryStats.errors} 个文件`);

            totalStats.scanned += categoryStats.scanned;
            totalStats.imported += categoryStats.imported;
            totalStats.errors += categoryStats.errors;

            if (scanId) {
                statusManager.updateProgress(scanId, {
                    scannedCount: totalStats.scanned,
                    importedCount: totalStats.imported,
                    errorCount: totalStats.errors,
                    message: `已完成 ${categoryDir} 分类扫描`
                });
            }
        }

        console.log('\n🎉 扫描完成!');
        console.log(`📊 总计扫描: ${totalStats.scanned} 个文件`);
        console.log(`✅ 成功导入: ${totalStats.imported} 个文件`);
        console.log(`❌ 处理错误: ${totalStats.errors} 个文件`);

        if (scanId) {
            statusManager.completeScan(scanId, {
                scannedCount: totalStats.scanned,
                importedCount: totalStats.imported,
                errorCount: totalStats.errors
            });
        }

    } catch (error) {
        console.error('❌ 扫描过程中出现错误:', error);
        if (scanId) {
            statusManager.errorScan(scanId, (error as Error).message);
        }
        throw error;
    }
}

/**
 * 连接数据库并执行扫描
 */
async function main(): Promise<void> {
    try {
        console.log('🔌 连接数据库...');
        await mongoose.connect(DB_URI);
        console.log('✅ 数据库连接成功');

        await scanUploadsDirectory();

    } catch (error) {
        console.error('❌ 执行失败:', error);
        process.exit(1);
    } finally {
        console.log('🔌 断开数据库连接...');
        await mongoose.disconnect();
        console.log('✅ 程序执行完成');
        process.exit(0);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

export { scanUploadsDirectory, scanFile, scanDirectory };
