import express from 'express'
import { ArticleTagController } from '../controllers/ArticleTagController'

const router = express.Router()

// 获取标签列表
router.get('/', ArticleTagController.getTags)

// 获取标签统计
router.get('/stats', ArticleTagController.getTagStats)

// 获取所有启用的标签
router.get('/active', ArticleTagController.getActiveTags)

// 批量获取标签
router.get('/batch', ArticleTagController.getTagsByIds)

// 根据ID获取标签
router.get('/:id', ArticleTagController.getTagById)

// 创建标签
router.post('/', ArticleTagController.createTag)

// 更新标签
router.put('/:id', ArticleTagController.updateTag)

// 删除标签
router.delete('/:id', ArticleTagController.deleteTag)

// 切换标签状态
router.put('/:id/toggle-status', ArticleTagController.toggleTagStatus)

export default router 