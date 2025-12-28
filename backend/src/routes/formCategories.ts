import express from 'express'
import FormCategoryController from '../controllers/FormCategoryController'

const router = express.Router()

// 获取表单分类列表
router.get('/', FormCategoryController.getCategories)

// 获取所有启用的分类
router.get('/active', FormCategoryController.getActiveCategories)

// 获取分类统计信息
router.get('/stats', FormCategoryController.getCategoryStats)

// 根据ID获取表单分类
router.get('/:id', FormCategoryController.getCategoryById)

// 创建表单分类
router.post('/', FormCategoryController.createCategory)

// 更新表单分类
router.put('/:id', FormCategoryController.updateCategory)

// 删除表单分类
router.delete('/:id', FormCategoryController.deleteCategory)

// 切换分类状态
router.patch('/:id/toggle-status', FormCategoryController.toggleCategoryStatus)

export default router 