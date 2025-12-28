import { Router } from 'express';
import { FileCenterController } from '../controllers/FileCenterController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 所有文件中心路由都需要认证
router.use(authenticateToken);

/**
 * @route GET /api/file-center/files
 * @desc 获取文件列表
 * @access Private
 * @query {
 *   page?: number,
 *   limit?: number,
 *   category?: string,
 *   search?: string,
 *   tags?: string[],
 *   startDate?: string,
 *   endDate?: string,
 *   userId?: string (仅管理员可用)
 * }
 */
router.get('/files', FileCenterController.getFiles);

/**
 * @route GET /api/file-center/files/:id
 * @desc 获取文件详情
 * @access Private
 */
router.get('/files/:id', FileCenterController.getFileById);

/**
 * @route GET /api/file-center/download/:id
 * @desc 下载文件
 * @access Private
 */
router.get('/download/:id', FileCenterController.downloadFile);

/**
 * @route PUT /api/file-center/files/:id
 * @desc 更新文件信息
 * @access Private
 * @body {
 *   originalName?: string,
 *   description?: string,
 *   tags?: string[],
 *   isPublic?: boolean
 * }
 */
router.put('/files/:id', FileCenterController.updateFile);

/**
 * @route DELETE /api/file-center/files/:id
 * @desc 删除文件
 * @access Private
 */
router.delete('/files/:id', FileCenterController.deleteFile);

/**
 * @route GET /api/file-center/stats
 * @desc 获取文件统计信息
 * @access Private
 */
router.get('/stats', FileCenterController.getFileStats);

/**
 * @route POST /api/file-center/scan
 * @desc 扫描uploads目录并导入文件
 * @access Private (Admin only)
 */
router.post('/scan', FileCenterController.scanUploadsDirectory);

/**
 * @route GET /api/file-center/scan/status
 * @desc 获取文件扫描状态
 * @access Private (Admin only)
 */
router.get('/scan/status', FileCenterController.getScanStatus);

/**
 * @route GET /api/file-center/scan/progress/:scanId
 * @desc 获取指定扫描任务的进度
 * @access Private (Admin only)
 */
router.get('/scan/progress/:scanId', FileCenterController.getScanProgress);

/**
 * @route GET /api/file-center/:fileId
 * @desc 获取文件详情
 * @access Private
 */
router.get('/:fileId', FileCenterController.getFileById);

export default router;