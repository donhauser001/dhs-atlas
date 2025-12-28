import express from 'express'
import { ArticleCategoryController } from '../controllers/ArticleCategoryController'

const router = express.Router()

// 获取分类列表
router.get('/', ArticleCategoryController.getCategories)

// 获取分类统计
router.get('/stats', ArticleCategoryController.getCategoryStats)

// 获取可用的父分类
router.get('/available-parents', ArticleCategoryController.getAvailableParentCategories)

// 根据ID获取分类
router.get('/:id', ArticleCategoryController.getCategoryById)

// 创建分类
router.post('/', ArticleCategoryController.createCategory)

// 更新分类
router.put('/:id', ArticleCategoryController.updateCategory)

// 删除分类
router.delete('/:id', ArticleCategoryController.deleteCategory)

// 切换分类状态
router.put('/:id/toggle-status', ArticleCategoryController.toggleCategoryStatus)

export default router 