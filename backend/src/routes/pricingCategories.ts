import { Router } from 'express'
import { PricingCategoryController } from '../controllers/PricingCategoryController'

const router = Router()
const controller = new PricingCategoryController()

// 获取所有分类
router.get('/', controller.getCategories)

// 搜索分类
router.get('/search', controller.searchCategories)

// 根据ID获取分类
router.get('/:id', controller.getCategoryById)

// 创建分类
router.post('/', controller.createCategory)

// 更新分类
router.put('/:id', controller.updateCategory)

// 切换分类状态
router.patch('/:id/toggle-status', controller.toggleCategoryStatus)

// 删除分类
router.delete('/:id', controller.deleteCategory)

export default router 