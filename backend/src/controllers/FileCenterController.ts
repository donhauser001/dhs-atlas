import { Request, Response } from 'express';
import { File, IFile, FileQuery } from '../models/File';
import { FilePermissionChecker, UserInfo } from '../utils/filePermissions';
import path from 'path';
import fs from 'fs';
import { scanUploadsDirectory } from '../scripts/scanUploadsDirectory';
import ScanStatusManager from '../utils/scanStatusManager';

export class FileCenterController {
    /**
     * 获取文件列表
     * @param req 请求对象
     * @param res 响应对象
     */
    static async getFiles(req: Request, res: Response) {
        try {
            const currentUser = (req as any).user as UserInfo;
            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: '用户未认证'
                });
            }

            const {
                page = 1,
                limit = 20,
                search,
                category,
                sortBy = 'uploadTime',
                sortOrder = 'desc'
            } = req.query as FileQuery;

            // 使用权限检查器获取查询条件
            let query = FilePermissionChecker.getFileQueryConditions(currentUser, category as string);

            // 搜索条件
            if (search) {
                const searchConditions = [
                    { originalName: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search as string, 'i')] } }
                ];

                // 如果已有$or条件（权限相关），需要合并
                if (query.$or) {
                    query = {
                        $and: [
                            { $or: query.$or },
                            { $or: searchConditions }
                        ],
                        ...Object.fromEntries(Object.entries(query).filter(([key]) => key !== '$or'))
                    };
                } else {
                    query.$or = searchConditions;
                }
            }

            // 排序条件
            const sortOptions: any = {};
            sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

            // 分页计算
            const skip = (Number(page) - 1) * Number(limit);

            // 执行查询
            const [files, total] = await Promise.all([
                File.find(query)
                    .populate('uploadedBy', 'username realName')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(Number(limit)),
                File.countDocuments(query)
            ]);

            // 为每个文件添加权限信息
            const filesWithPermissions = files.map(file => {
                const permissions = FilePermissionChecker.getFilePermissionSummary(currentUser, file);
                return {
                    ...file.toObject(),
                    permissions
                };
            });

            return res.json({
                success: true,
                data: {
                    files: filesWithPermissions,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit))
                    }
                }
            });
        } catch (error) {
            console.error('获取文件列表失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取文件列表失败',
                error: (error as Error).message
            });
        }
    }



    /**
     * 下载文件
     * @param req 请求对象
     * @param res 响应对象
     */
    static async downloadFile(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const currentUser = (req as any).user as UserInfo;

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: '用户未认证'
                });
            }

            const file = await File.findOne({ _id: id, status: 'active' });

            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在'
                });
            }

            // 使用权限检查器验证下载权限
            if (!FilePermissionChecker.canDownloadFile(currentUser, file)) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足'
                });
            }

            // 检查文件是否存在
            const filePath = path.resolve(file.filePath);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在于服务器'
                });
            }

            // 检查是否为预览请求
            const isPreview = req.query.preview === 'true';

            // 如果不是预览请求，更新下载次数
            if (!isPreview) {
                await File.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } });
            }

            // 设置响应头 - 同时支持传统格式和RFC 6266格式以确保中文文件名正确显示
            const encodedFilename = encodeURIComponent(file.originalName);

            // 如果是预览请求，使用 inline 而不是 attachment
            if (isPreview) {
                res.setHeader('Content-Disposition', `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
            } else {
                res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
            }

            res.setHeader('Content-Type', file.mimeType);
            res.setHeader('Content-Length', file.fileSize);

            // 发送文件
            return res.sendFile(filePath);
        } catch (error) {
            console.error('下载文件失败:', error);
            res.status(500).json({
                success: false,
                message: '下载文件失败',
                error: (error as Error).message
            });
        }
    }

    /**
     * 更新文件信息
     * @param req 请求对象
     * @param res 响应对象
     */
    static async updateFile(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { originalName, description, tags, isPublic } = req.body;
            const currentUser = (req as any).user as UserInfo;

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: '用户未认证'
                });
            }

            const file = await File.findOne({ _id: id, status: 'active' });

            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在'
                });
            }

            // 使用权限检查器验证编辑权限
            if (!FilePermissionChecker.canEditFile(currentUser, file)) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足'
                });
            }

            // 更新文件信息
            const updateData: any = {};
            if (originalName) updateData.originalName = originalName;
            if (description !== undefined) updateData.description = description;
            if (tags) updateData.tags = tags;
            if (isPublic !== undefined) updateData.isPublic = isPublic;

            const updatedFile = await File.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('uploadedBy', 'username realName');

            return res.json({
                success: true,
                message: '文件信息更新成功',
                data: updatedFile
            });
        } catch (error) {
            console.error('更新文件失败:', error);
            return res.status(500).json({
                success: false,
                message: '更新文件失败',
                error: (error as Error).message
            });
        }
    }

    /**
     * 删除文件
     * @param req 请求对象
     * @param res 响应对象
     */
    static async deleteFile(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const currentUser = (req as any).user as UserInfo;

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: '用户未认证'
                });
            }

            const file = await File.findOne({ _id: id, status: 'active' });

            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在'
                });
            }

            // 使用权限检查器验证删除权限
            if (!FilePermissionChecker.canDeleteFile(currentUser, file)) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足'
                });
            }

            // 软删除：标记为已删除状态
            await File.findByIdAndUpdate(id, { status: 'deleted' });

            return res.json({
                success: true,
                message: '文件删除成功'
            });
        } catch (error) {
            console.error('删除文件失败:', error);
            return res.status(500).json({
                success: false,
                message: '删除文件失败',
                error: (error as Error).message
            });
        }
    }

    /**
     * 获取文件统计信息
     * @param req 请求对象
     * @param res 响应对象
     */
    static async getFileStats(req: Request, res: Response) {
        try {
            const currentUser = (req as any).user as UserInfo;

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: '用户未认证'
                });
            }

            // 使用权限检查器获取查询条件
            const baseQuery = FilePermissionChecker.getFileQueryConditions(currentUser);

            // 统计总文件数量
            const totalFiles = await File.countDocuments(baseQuery);

            // 统计各分类文件数量
            const categoryStats = await File.aggregate([
                { $match: baseQuery },
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 },
                        totalSize: { $sum: '$fileSize' }
                    }
                }
            ]);

            // 统计用户上传的文件（仅管理员可见）
            let userStats = [];
            if (FilePermissionChecker.isAdmin(currentUser)) {
                userStats = await File.aggregate([
                    { $match: { status: 'active' } },
                    {
                        $group: {
                            _id: '$uploadedBy',
                            uploaderName: { $first: '$uploaderName' },
                            count: { $sum: 1 },
                            totalSize: { $sum: '$fileSize' }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ]);
            }

            return res.json({
                success: true,
                data: {
                    totalFiles,
                    categoryStats,
                    userStats
                }
            });
        } catch (error) {
            console.error('获取文件统计失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取文件统计失败',
                error: (error as Error).message
            });
        }
    }

    /**
     * 扫描uploads目录并导入文件
     * @param req 请求对象
     * @param res 响应对象
     */
    static async scanUploadsDirectory(req: Request, res: Response) {
        try {
            const currentUser = (req as any).user as UserInfo;

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: '用户未认证'
                });
            }

            // 只有超级管理员才能执行扫描操作
            if (!FilePermissionChecker.isAdmin(currentUser)) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足，只有管理员才能执行文件扫描'
                });
            }

            const statusManager = ScanStatusManager.getInstance();

            // 检查是否已有进行中的扫描
            const activeScan = statusManager.getUserActiveScan(currentUser.userId);
            if (activeScan) {
                return res.json({
                    success: true,
                    message: '已有扫描任务在进行中',
                    data: {
                        scanId: activeScan.id,
                        progress: activeScan
                    }
                });
            }

            // 创建新的扫描任务
            const scanId = statusManager.createScan(currentUser.userId);

            // 执行异步扫描，不阻塞响应
            scanUploadsDirectory(scanId)
                .then(() => {
                    console.log('文件扫描完成');
                })
                .catch((error) => {
                    console.error('文件扫描失败:', error);
                    statusManager.errorScan(scanId, error.message);
                });

            return res.json({
                success: true,
                message: '文件扫描已启动',
                data: {
                    scanId,
                    progress: statusManager.getProgress(scanId)
                }
            });

        } catch (error) {
            console.error('启动文件扫描失败:', error);
            return res.status(500).json({
                success: false,
                message: '启动文件扫描失败',
                error: (error as Error).message
            });
        }
    }

    /**
 * 获取文件扫描状态
 * @param req 请求对象
 * @param res 响应对象
 */
    static async getScanStatus(req: Request, res: Response) {
        try {
            const currentUser = (req as any).user as UserInfo;

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: '用户未认证'
                });
            }

            // 只有管理员才能查看扫描状态
            if (!FilePermissionChecker.isAdmin(currentUser)) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足'
                });
            }

            const statusManager = ScanStatusManager.getInstance();

            // 获取当前用户的扫描状态
            const activeScan = statusManager.getUserActiveScan(currentUser.userId);
            const recentScan = statusManager.getUserRecentScan(currentUser.userId);

            // 统计系统扫描的文件数量
            const systemScanFiles = await File.countDocuments({
                tags: { $in: ['system-scan'] },
                status: 'active'
            });

            // 获取最近扫描的文件
            const recentScanFiles = await File.find({
                tags: { $in: ['system-scan'] },
                status: 'active'
            })
                .sort({ uploadTime: -1 })
                .limit(5)
                .select('originalName category uploadTime fileSize');

            return res.json({
                success: true,
                data: {
                    activeScan,
                    recentScan,
                    totalScannedFiles: systemScanFiles,
                    recentScanFiles
                }
            });

        } catch (error) {
            console.error('获取扫描状态失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取扫描状态失败',
                error: (error as Error).message
            });
        }
    }

    /**
     * 获取文件详情
     * @param req 请求对象
     * @param res 响应对象
     */
    static async getFileById(req: Request, res: Response) {
        try {
            const currentUser = (req as any).user as UserInfo;
            const { fileId } = req.params;

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: '用户未认证'
                });
            }

            // 获取文件信息
            const file = await File.findById(fileId);

            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在'
                });
            }

            // 检查文件访问权限
            if (!FilePermissionChecker.canViewFile(currentUser, file)) {
                return res.status(403).json({
                    success: false,
                    message: '无权限访问此文件'
                });
            }

            // 构建下载URL和预览URL
            // 在Docker环境中，使用localhost而不是内部容器名
            const host = req.get('host')?.includes('backend') ? 'localhost:3001' : req.get('host');
            const baseUrl = `${req.protocol}://${host}/api/file-center/download/${file._id}`;
            const downloadUrl = baseUrl;
            let previewUrl;

            // 根据文件类型确定是否提供预览URL
            if (file.mimeType.startsWith('image/') ||
                file.mimeType === 'application/pdf' ||
                file.mimeType.startsWith('text/')) {
                previewUrl = downloadUrl;
            }

            return res.json({
                success: true,
                data: {
                    id: file._id,
                    originalName: file.originalName,
                    mimeType: file.mimeType,
                    fileSize: file.fileSize,
                    uploadTime: file.uploadTime,
                    downloadUrl,
                    previewUrl
                }
            });

        } catch (error) {
            console.error('获取文件详情失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取文件详情失败',
                error: (error as Error).message
            });
        }
    }

    /**
     * 获取指定扫描任务的进度
     * @param req 请求对象
     * @param res 响应对象
     */
    static async getScanProgress(req: Request, res: Response) {
        try {
            const currentUser = (req as any).user as UserInfo;
            const { scanId } = req.params;

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: '用户未认证'
                });
            }

            // 只有管理员才能查看扫描进度
            if (!FilePermissionChecker.isAdmin(currentUser)) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足'
                });
            }

            const statusManager = ScanStatusManager.getInstance();
            const progress = statusManager.getProgress(scanId);

            if (!progress) {
                return res.status(404).json({
                    success: false,
                    message: '扫描任务不存在'
                });
            }

            // 检查扫描任务是否属于当前用户
            if (!scanId.includes(`scan_${currentUser.userId}_`)) {
                return res.status(403).json({
                    success: false,
                    message: '无权查看此扫描任务'
                });
            }

            return res.json({
                success: true,
                data: progress
            });

        } catch (error) {
            console.error('获取扫描进度失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取扫描进度失败',
                error: (error as Error).message
            });
        }
    }
}