import express from 'express';
import ContractTemplateCategoryController from '../controllers/ContractTemplateCategoryController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 应用认证中间件
router.use(authenticateToken);

// 获取分类统计 - 必须在/:id路由之前
router.get('/stats/overview', ContractTemplateCategoryController.getCategoryStats);

// 获取分类列表
router.get('/', ContractTemplateCategoryController.getCategories);

// 根据ID获取分类
router.get('/:id', ContractTemplateCategoryController.getCategoryById);

// 创建分类
router.post('/', ContractTemplateCategoryController.createCategory);

// 更新分类
router.put('/:id', ContractTemplateCategoryController.updateCategory);

// 删除分类
router.delete('/:id', ContractTemplateCategoryController.deleteCategory);

export default router;
