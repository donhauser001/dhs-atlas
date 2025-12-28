import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';
import { FileService } from '../services/FileService';
import { ThumbnailService } from '../services/ThumbnailService';

const router = Router();

// 配置 multer 存储 - 支持按业务板块分类
const createStorage = (subDir: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads', subDir);
      // 确保上传目录存在
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // 生成唯一文件名
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const originalName = fixChineseFilename(file.originalname);
      const ext = path.extname(originalName);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });
};

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 允许的文件类型
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff', // .tiff
    'application/pdf',
    'text/plain',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
    // 设计类文件
    'image/vnd.adobe.photoshop', // .psd
    'application/vnd.adobe.photoshop', // .psd (备用)
    'application/postscript', // .ai, .eps
    'application/illustrator', // .ai (备用)
    'application/eps', // .eps (备用)
    'application/x-indesign' // .indd
  ];

  // 对于设计类文件，也检查文件扩展名（因为浏览器可能无法正确识别MIME类型）
  const fileExtension = file.originalname.toLowerCase().split('.').pop();
  const designFileExtensions = ['psd', 'ai', 'tiff', 'tif', 'eps', 'indd'];

  if (allowedTypes.includes(file.mimetype) || (designFileExtensions.includes(fileExtension || '') && file.mimetype === 'application/octet-stream')) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'));
  }
};

// 创建不同业务板块的上传中间件
const createUpload = (subDir: string) => {
  return multer({
    storage: createStorage(subDir),
    fileFilter: fileFilter,
    limits: {
      fileSize: 1024 * 1024 * 1024 // 1GB
    }
  });
};

// 上传单个文件
router.post('/single', createUpload('general').single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const originalName = fixChineseFilename(req.file.originalname);

    return res.json({
      success: true,
      message: '文件上传成功',
      data: {
        filename: req.file.filename,
        originalname: originalName,
        size: req.file.size,
        url: `/uploads/general/${req.file.filename}?originalname=${encodeURIComponent(originalName)}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 修复中文文件名编码问题的函数
function fixChineseFilename(filename: string): string {
  try {
    // multer会将中文文件名编码为Latin-1，需要重新解码
    return Buffer.from(filename, 'latin1').toString('utf8');
  } catch (error) {
    // 如果解码失败，返回原始文件名
    return filename;
  }
}

// 上传用户文件（需要认证）
router.post('/user-file', authenticateToken, createUpload('users').single('file'), async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: '用户认证失败'
      });
    }

    // 获取请求参数
    const { description, tags, isPublic = false } = req.body;
    const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim())) : [];

    // 修复中文文件名编码问题
    const originalName = fixChineseFilename(req.file.originalname);

    // 创建文件记录到数据库
    const fileRecord = await FileService.createFileFromUpload(
      req.file.path,
      originalName, // 使用修复后的文件名
      req.user.userId,
      'users', // 用户文件分类
      undefined, // 子目录
      Boolean(isPublic),
      description,
      tagsArray
    );

    return res.json({
      success: true,
      message: '用户文件上传成功',
      data: {
        id: fileRecord._id,
        filename: req.file.filename,
        originalname: originalName, // 使用修复后的文件名
        size: req.file.size,
        category: 'users',
        description: fileRecord.description,
        tags: fileRecord.tags,
        isPublic: fileRecord.isPublic,
        uploadTime: fileRecord.uploadTime,
        url: `/uploads/users/${req.file.filename}?originalname=${encodeURIComponent(originalName)}`
      }
    });
  } catch (error) {
    console.error('用户文件上传失败:', error);
    return res.status(500).json({
      success: false,
      message: '用户文件上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 上传营业执照（企业板块）
router.post('/business-license', createUpload('enterprises').single('businessLicense'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传营业执照文件'
      });
    }

    return res.json({
      success: true,
      message: '营业执照上传成功',
      data: {
        filename: req.file.filename,
        originalname: fixChineseFilename(req.file.originalname),
        size: req.file.size,
        url: `/uploads/enterprises/${req.file.filename}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '营业执照上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 上传开户许可证（企业板块）
router.post('/bank-permit', createUpload('enterprises').single('bankPermit'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传开户许可证文件'
      });
    }

    return res.json({
      success: true,
      message: '开户许可证上传成功',
      data: {
        filename: req.file.filename,
        originalname: fixChineseFilename(req.file.originalname),
        size: req.file.size,
        url: `/uploads/enterprises/${req.file.filename}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '开户许可证上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 上传法人身份证（企业板块）
router.post('/legal-rep-idcard', createUpload('enterprises').single('legalRepIdCard'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传法人身份证文件'
      });
    }

    return res.json({
      success: true,
      message: '法人身份证上传成功',
      data: {
        filename: req.file.filename,
        originalname: fixChineseFilename(req.file.originalname),
        size: req.file.size,
        url: `/uploads/enterprises/${req.file.filename}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '法人身份证上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 上传头像（用户板块）
router.post('/avatar', createUpload('avatars').single('avatar'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传头像文件'
      });
    }

    return res.json({
      success: true,
      message: '头像上传成功',
      data: {
        filename: req.file.filename,
        originalname: fixChineseFilename(req.file.originalname),
        size: req.file.size,
        url: `/uploads/avatars/${req.file.filename}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '头像上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 上传项目文件到子目录（必须在通用路由之前，否则会被 /:businessType/:subDirectory 匹配）
router.post('/projects/:projectId', authenticateToken, createUpload('projects').array('file', 50), async (req: any, res: Response) => {
  console.log('📤 收到项目文件上传请求:', req.params.projectId, '文件数量:', req.files?.length || 0);
  try {
    if (!req.files || req.files.length === 0) {
      console.log('❌ 没有上传文件');
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    if (!req.user || !req.user.userId) {
      console.log('❌ 用户认证失败');
      return res.status(401).json({
        success: false,
        message: '用户认证失败'
      });
    }

    const { projectId } = req.params;
    const files = Array.isArray(req.files) ? req.files : [req.files];
    const results: any[] = [];
    const errors: any[] = [];

    // 创建项目子目录
    const projectDir = path.join(__dirname, '../../uploads/projects', projectId);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    // 处理每个文件
    for (const uploadedFile of files) {
      try {
        console.log('✅ 处理文件:', uploadedFile.filename, '用户ID:', req.user.userId);

        // 检查文件是否已经存在
        const newPath = path.join(projectDir, uploadedFile.filename);
        if (fs.existsSync(newPath)) {
          // 如果文件已存在，删除旧文件
          fs.unlinkSync(newPath);
        }

        // 移动文件到项目子目录
        const oldPath = uploadedFile.path;
        try {
          fs.renameSync(oldPath, newPath);
        } catch (moveError) {
          // 如果移动失败，尝试复制然后删除
          fs.copyFileSync(oldPath, newPath);
          fs.unlinkSync(oldPath);
        }

        // 修复中文文件名编码问题
        const originalName = fixChineseFilename(uploadedFile.originalname);

        // 为图片生成缩略图
        let thumbnailUrl: string | null = null;
        let thumbnailPathForDB: string | undefined = undefined;
        if (ThumbnailService.isImageFile(originalName)) {
          try {
            const generatedThumbnailPath = await ThumbnailService.generateThumbnail(newPath);
            if (generatedThumbnailPath) {
              const thumbnailFilename = path.basename(generatedThumbnailPath);
              thumbnailUrl = `/uploads/projects/${projectId}/${thumbnailFilename}`;
              thumbnailPathForDB = generatedThumbnailPath;
              console.log('✅ 缩略图生成成功:', thumbnailUrl);
            }
          } catch (thumbError) {
            console.error('生成缩略图失败:', thumbError);
          }
        }

        // 创建文件记录到数据库
        let fileRecord = null;
        try {
          process.stdout.write(`[UPLOAD] 开始创建项目文件记录: ${originalName}\n`);
          process.stdout.write(`[UPLOAD] newPath: ${newPath}\n`);
          process.stdout.write(`[UPLOAD] userId: ${req.user.userId}, type: ${typeof req.user.userId}\n`);
          process.stdout.write(`[UPLOAD] projectId: ${projectId}\n`);

          // 确保文件路径是绝对路径
          const absolutePath = path.isAbsolute(newPath) ? newPath : path.join(__dirname, '../../', newPath);
          process.stdout.write(`[UPLOAD] 绝对路径: ${absolutePath}\n`);
          process.stdout.write(`[UPLOAD] 文件存在: ${fs.existsSync(absolutePath)}\n`);

          fileRecord = await FileService.createFileFromUpload(
            absolutePath,
            originalName,
            req.user.userId,
            'projects',
            projectId, // 子目录为项目ID
            false,
            `项目文件: ${projectId}`,
            ['project', projectId],
            thumbnailPathForDB // 传递缩略图路径
          );
          process.stdout.write(`[UPLOAD] ✅ 文件记录创建成功: ${fileRecord._id}\n`);

          results.push({
            id: fileRecord._id.toString(),
            filename: uploadedFile.filename,
            originalname: originalName,
            size: uploadedFile.size,
            url: `/uploads/projects/${projectId}/${uploadedFile.filename}`,
            thumbnailUrl: thumbnailUrl
          });
        } catch (fileError: any) {
          process.stderr.write(`[UPLOAD] ❌ 创建文件记录失败: ${fileError.message}\n`);
          errors.push({
            filename: originalName,
            error: fileError.message
          });
          // 即使创建记录失败，文件已经上传，所以也添加到结果中
          results.push({
            filename: uploadedFile.filename,
            originalname: originalName,
            size: uploadedFile.size,
            url: `/uploads/projects/${projectId}/${uploadedFile.filename}`,
            thumbnailUrl: thumbnailUrl,
            warning: '文件记录创建失败'
          });
        }
      } catch (error: any) {
        console.error('处理文件失败:', uploadedFile.filename, error);
        errors.push({
          filename: uploadedFile.originalname || uploadedFile.filename,
          error: error.message || '未知错误'
        });
      }
    }

    return res.json({
      success: true,
      message: errors.length > 0
        ? `成功上传 ${results.length} 个文件，${errors.length} 个文件处理失败`
        : `成功上传 ${results.length} 个文件`,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('项目文件上传错误:', error);
    return res.status(500).json({
      success: false,
      message: '项目文件上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 通用业务类型上传路由
router.post('/:businessType', (req: Request, res: Response) => {
  const { businessType } = req.params;

  // 根据业务类型创建对应的上传中间件
  const upload = createUpload(businessType);

  return upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: '文件上传失败',
        error: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    return res.json({
      success: true,
      message: '文件上传成功',
      data: {
        filename: req.file.filename,
        originalname: fixChineseFilename(req.file.originalname),
        size: req.file.size,
        url: `/uploads/${businessType}/${req.file.filename}`
      }
    });
  });
});

// 带子目录的通用上传路由
router.post('/:businessType/:subDirectory', (req: Request, res: Response) => {
  const { businessType, subDirectory } = req.params;

  // 创建带子目录的存储
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads', businessType, subDirectory);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const originalName = fixChineseFilename(file.originalname);
      const ext = path.extname(originalName);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB for projects
    }
  });

  return upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: '文件上传失败',
        error: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const originalName = fixChineseFilename(req.file.originalname);

    return res.json({
      success: true,
      message: '文件上传成功',
      data: {
        filename: req.file.filename,
        originalname: originalName,
        size: req.file.size,
        url: `/uploads/${businessType}/${subDirectory}/${req.file.filename}`
      }
    });
  });
});

// 上传项目文件（项目板块）
router.post('/project', createUpload('projects').single('projectFile'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传项目文件'
      });
    }

    const originalName = fixChineseFilename(req.file.originalname);

    return res.json({
      success: true,
      message: '项目文件上传成功',
      data: {
        filename: req.file.filename,
        originalname: originalName,
        size: req.file.size,
        url: `/uploads/projects/${req.file.filename}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '项目文件上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 上传客户文件（客户板块）
router.post('/client', createUpload('clients').single('clientFile'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传客户文件'
      });
    }

    return res.json({
      success: true,
      message: '客户文件上传成功',
      data: {
        filename: req.file.filename,
        originalname: fixChineseFilename(req.file.originalname),
        size: req.file.size,
        url: `/uploads/clients/${req.file.filename}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '客户文件上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 上传客户文件到子目录
router.post('/clients/:clientId', createUpload('clients').single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const { clientId } = req.params;

    // 创建客户子目录
    const clientDir = path.join(__dirname, '../../uploads/clients', clientId);
    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true });
    }

    // 检查文件是否已经存在
    const newPath = path.join(clientDir, req.file.filename);
    if (fs.existsSync(newPath)) {
      // 如果文件已存在，删除旧文件
      fs.unlinkSync(newPath);
    }

    // 移动文件到客户子目录
    const oldPath = req.file.path;
    try {
      fs.renameSync(oldPath, newPath);
    } catch (moveError) {
      // 如果移动失败，尝试复制然后删除
      fs.copyFileSync(oldPath, newPath);
      fs.unlinkSync(oldPath);
    }

    return res.json({
      success: true,
      message: '客户文件上传成功',
      data: {
        filename: req.file.filename,
        originalname: fixChineseFilename(req.file.originalname),
        size: req.file.size,
        url: `/uploads/clients/${clientId}/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('客户文件上传错误:', error);
    return res.status(500).json({
      success: false,
      message: '客户文件上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 上传合同文件（合同板块）
router.post('/contract', createUpload('contracts').single('contractFile'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传合同文件'
      });
    }

    return res.json({
      success: true,
      message: '合同文件上传成功',
      data: {
        filename: req.file.filename,
        originalname: fixChineseFilename(req.file.originalname),
        size: req.file.size,
        url: `/uploads/contracts/${req.file.filename}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '合同文件上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 上传部门文件（部门板块）
router.post('/department', createUpload('departments').single('departmentFile'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传部门文件'
      });
    }

    return res.json({
      success: true,
      message: '部门文件上传成功',
      data: {
        filename: req.file.filename,
        originalname: fixChineseFilename(req.file.originalname),
        size: req.file.size,
        url: `/uploads/departments/${req.file.filename}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '部门文件上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 文章图片文件过滤器
const articleImageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、GIF、WebP 格式的图片'));
  }
};

// 创建文章图片上传中间件
const createArticleImageUpload = () => {
  return multer({
    storage: createStorage('article-image'),
    fileFilter: articleImageFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  });
};

// 上传文章图片（文章板块）
router.post('/article-image', createArticleImageUpload().single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传图片文件'
      });
    }

    return res.json({
      success: true,
      message: '文章图片上传成功',
      data: {
        filename: req.file.filename,
        originalname: fixChineseFilename(req.file.originalname),
        size: req.file.size,
        url: `/uploads/article-image/${req.file.filename}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '文章图片上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// Multer错误处理中间件
router.use((error: any, req: Request, res: Response, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制（最大10MB）'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超过限制'
      });
    }
    return res.status(400).json({
      success: false,
      message: '文件上传错误',
      error: error.message
    });
  }

  // 处理文件类型错误
  if (error.message && error.message.includes('只支持')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // 处理其他错误
  return res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: error.message || '未知错误'
  });
});

// 上传表单文件（按表单ID分目录）
router.post('/forms/:formId', (req: Request, res: Response) => {
  const { formId } = req.params;

  // 创建表单专用的存储配置
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads/forms', formId);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const originalName = fixChineseFilename(file.originalname);
      const ext = path.extname(originalName);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 20 * 1024 * 1024 // 20MB for form files
    }
  });

  return upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: '表单文件上传失败',
        error: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const originalName = fixChineseFilename(req.file.originalname);

    return res.json({
      success: true,
      message: '表单文件上传成功',
      data: {
        filename: req.file.filename,
        originalname: originalName,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: `/uploads/forms/${formId}/${req.file.filename}`
      }
    });
  });
});

// 通用上传接口（默认使用forms/general目录）
router.post('/', (req: Request, res: Response) => {
  // 默认存储在 forms/general 目录下
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads/forms/general');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const originalName = fixChineseFilename(file.originalname);
      const ext = path.extname(originalName);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 20 * 1024 * 1024 // 20MB
    }
  });

  return upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: '文件上传失败',
        error: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const originalName = fixChineseFilename(req.file.originalname);

    return res.json({
      success: true,
      message: '文件上传成功',
      data: {
        filename: req.file.filename,
        originalname: originalName,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: `/uploads/forms/general/${req.file.filename}`
      }
    });
  });
});

// 删除文件
router.delete('/:category/:filename', (req: Request, res: Response) => {
  try {
    const { category, filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', category, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({
        success: true,
        message: '文件删除成功'
      });
    } else {
      // 文件不存在时，返回成功状态，因为目标（文件不存在）已经达成
      return res.json({
        success: true,
        message: '文件已不存在'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '文件删除失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;
