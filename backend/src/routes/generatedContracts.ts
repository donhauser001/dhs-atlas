import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import GeneratedContractController from '../controllers/GeneratedContractController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 配置multer用于签署文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/contracts');
        // 确保目录存在
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // 生成唯一文件名：signed-合同ID-时间戳.pdf
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `signed-${req.params.id}-${uniqueSuffix}${ext}`);
    }
});

// 文件过滤器 - 只允许PDF文件
const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('只允许上传PDF格式的签署文件'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    }
});

// 应用认证中间件
router.use(authenticateToken);

// 获取生成的合同列表
router.get('/', GeneratedContractController.getContracts);

// 根据关联ID获取合同列表
router.get('/related', GeneratedContractController.getContractsByRelatedIds);

// 获取合同统计
router.get('/stats', GeneratedContractController.getContractStats);



// 根据ID获取合同详情
router.get('/:id', GeneratedContractController.getContractById);

// 从模板和表单数据生成合同
router.post('/generate/template/:templateId', GeneratedContractController.generateFromTemplate);

// 从表单提交记录生成合同
router.post('/generate/form-data/:templateId/:formDataId', GeneratedContractController.generateFromFormData);

// 更新合同信息
router.put('/:id', GeneratedContractController.updateContract);

// 上传签署文件
router.post('/:id/upload-signed-file', upload.single('file'), GeneratedContractController.uploadSignedFile);

// 下载签署文件
router.get('/:id/download-signed-file', GeneratedContractController.downloadSignedFile);

// 删除签署文件
router.delete('/:id/signed-file', GeneratedContractController.deleteSignedFile);

// 更新合同内容（包括名称、描述、状态和正文）
router.put('/:id/content', GeneratedContractController.updateContractContent);

// 更新合同状态
router.put('/:id/status', GeneratedContractController.updateStatus);

// 删除合同
router.delete('/:id', GeneratedContractController.deleteContract);

// 导出合同为PDF
router.get('/:id/export/pdf', GeneratedContractController.exportToPDF);

// 导出合同为Word
router.get('/:id/export/word', GeneratedContractController.exportToWord);

export default router;
