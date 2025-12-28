import { File, IFile, CreateFileRequest } from '../models/File';
import User from '../models/User';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

export class FileService {
    /**
     * 创建文件记录
     * @param fileData 文件数据
     * @returns 创建的文件记录
     */
    static async createFile(fileData: CreateFileRequest): Promise<IFile> {
        try {
            // 确保 uploadedBy 是 ObjectId 类型
            const uploadedById = typeof fileData.uploadedBy === 'string'
                ? new mongoose.Types.ObjectId(fileData.uploadedBy)
                : fileData.uploadedBy;

            // 验证上传者是否存在
            const uploader = await User.findById(uploadedById);
            if (!uploader) {
                throw new Error(`上传者不存在: ${fileData.uploadedBy}`);
            }

            // 将绝对路径转换为相对路径（相对于 uploads 目录）
            let relativeFilePath = fileData.filePath;
            if (path.isAbsolute(fileData.filePath)) {
                // 提取 uploads 目录之后的部分
                const uploadsIndex = fileData.filePath.indexOf('uploads');
                if (uploadsIndex !== -1) {
                    relativeFilePath = fileData.filePath.substring(uploadsIndex);
                }
            }

            // 转换缩略图路径为相对路径
            let relativeThumbnailPath = fileData.thumbnailPath;
            if (fileData.thumbnailPath && path.isAbsolute(fileData.thumbnailPath)) {
                const thumbUploadsIndex = fileData.thumbnailPath.indexOf('uploads');
                if (thumbUploadsIndex !== -1) {
                    relativeThumbnailPath = fileData.thumbnailPath.substring(thumbUploadsIndex);
                }
            }

            // 创建文件记录
            const file = new File({
                ...fileData,
                uploadedBy: uploadedById,
                filePath: relativeFilePath,
                thumbnailPath: relativeThumbnailPath,
                uploaderName: uploader.realName || uploader.username
            });

            await file.save();
            console.log('✅ 文件记录保存成功:', file._id, file.filePath);
            return file;
        } catch (error: any) {
            console.error('❌ 创建文件记录失败:', {
                error: error.message,
                stack: error.stack,
                fileData: {
                    originalName: fileData.originalName,
                    uploadedBy: fileData.uploadedBy,
                    category: fileData.category
                }
            });
            throw error;
        }
    }

    /**
     * 根据文件路径和上传者信息创建文件记录
     * @param filePath 文件路径
     * @param originalName 原始文件名
     * @param uploadedBy 上传者ID
     * @param category 文件分类
     * @param subDirectory 子目录
     * @param isPublic 是否公开
     * @param description 文件描述
     * @param tags 文件标签
     * @param thumbnailPath 缩略图路径
     * @returns 创建的文件记录
     */
    static async createFileFromUpload(
        filePath: string,
        originalName: string,
        uploadedBy: string,
        category: string,
        subDirectory?: string,
        isPublic: boolean = false,
        description?: string,
        tags?: string[],
        thumbnailPath?: string
    ): Promise<IFile> {
        try {
            // 获取文件信息
            const stats = fs.statSync(filePath);
            const fileName = path.basename(filePath);

            // 获取MIME类型
            const ext = path.extname(originalName).toLowerCase();
            let mimeType = 'application/octet-stream';

            const mimeTypes: { [key: string]: string } = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.pdf': 'application/pdf',
                '.txt': 'text/plain',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.xls': 'application/vnd.ms-excel',
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '.ppt': 'application/vnd.ms-powerpoint',
                '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                '.csv': 'text/csv',
                '.zip': 'application/zip',
                '.rar': 'application/x-rar-compressed'
            };

            if (mimeTypes[ext]) {
                mimeType = mimeTypes[ext];
            }

            const fileData: CreateFileRequest = {
                originalName,
                fileName,
                filePath,
                thumbnailPath,
                fileSize: stats.size,
                mimeType,
                category,
                subDirectory,
                uploadedBy,
                uploaderName: '', // 将在createFile中设置
                isPublic,
                description,
                tags
            };

            return await this.createFile(fileData);
        } catch (error) {
            console.error('从上传创建文件记录失败:', error);
            throw error;
        }
    }

    /**
     * 获取文件记录
     * @param fileId 文件ID
     * @returns 文件记录
     */
    static async getFile(fileId: string): Promise<IFile | null> {
        try {
            return await File.findOne({ _id: fileId, status: 'active' })
                .populate('uploadedBy', 'username realName');
        } catch (error) {
            console.error('获取文件记录失败:', error);
            throw error;
        }
    }

    /**
     * 更新文件记录
     * @param fileId 文件ID
     * @param updateData 更新数据
     * @returns 更新后的文件记录
     */
    static async updateFile(fileId: string, updateData: any): Promise<IFile | null> {
        try {
            return await File.findByIdAndUpdate(
                fileId,
                updateData,
                { new: true, runValidators: true }
            ).populate('uploadedBy', 'username realName');
        } catch (error) {
            console.error('更新文件记录失败:', error);
            throw error;
        }
    }

    /**
     * 删除文件记录（软删除）
     * @param fileId 文件ID
     * @returns 是否删除成功
     */
    static async deleteFile(fileId: string): Promise<boolean> {
        try {
            const result = await File.findByIdAndUpdate(
                fileId,
                { status: 'deleted' },
                { new: true }
            );
            return !!result;
        } catch (error) {
            console.error('删除文件记录失败:', error);
            throw error;
        }
    }

    /**
     * 根据条件查询文件
     * @param query 查询条件
     * @returns 文件列表
     */
    static async findFiles(query: any): Promise<IFile[]> {
        try {
            return await File.find({ ...query, status: 'active' })
                .populate('uploadedBy', 'username realName')
                .sort({ uploadTime: -1 });
        } catch (error) {
            console.error('查询文件失败:', error);
            throw error;
        }
    }

    /**
     * 检查文件是否存在于文件系统
     * @param filePath 文件路径
     * @returns 文件是否存在
     */
    static fileExists(filePath: string): boolean {
        try {
            return fs.existsSync(filePath);
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取文件统计信息
     * @param userId 用户ID（可选，用于获取特定用户的统计）
     * @returns 统计信息
     */
    static async getFileStatistics(userId?: string) {
        try {
            const baseQuery = userId ? { uploadedBy: userId, status: 'active' } : { status: 'active' };

            const [totalFiles, totalSize, categoryStats] = await Promise.all([
                File.countDocuments(baseQuery),
                File.aggregate([
                    { $match: baseQuery },
                    { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
                ]),
                File.aggregate([
                    { $match: baseQuery },
                    {
                        $group: {
                            _id: '$category',
                            count: { $sum: 1 },
                            totalSize: { $sum: '$fileSize' }
                        }
                    }
                ])
            ]);

            return {
                totalFiles,
                totalSize: totalSize[0]?.totalSize || 0,
                categoryStats
            };
        } catch (error) {
            console.error('获取文件统计失败:', error);
            throw error;
        }
    }

    /**
     * 清理已删除的文件记录
     * @param daysOld 删除多少天前的记录
     * @returns 清理的记录数
     */
    static async cleanupDeletedFiles(daysOld: number = 30): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await File.deleteMany({
                status: 'deleted',
                lastModified: { $lt: cutoffDate }
            });

            return result.deletedCount || 0;
        } catch (error) {
            console.error('清理已删除文件失败:', error);
            throw error;
        }
    }
}