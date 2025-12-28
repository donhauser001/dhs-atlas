import { Router } from 'express'
import QuotationController from '../controllers/QuotationController'

const router = Router()

// 获取所有报价单
router.get('/', QuotationController.getAllQuotations)

// 搜索报价单
router.get('/search', QuotationController.searchQuotations)

// 获取默认报价单（必须在 /:id 之前）
router.get('/default', QuotationController.getDefaultQuotation)

// 根据客户ID获取关联的报价单（必须在 /:id 之前）
router.get('/client/:clientId', QuotationController.getQuotationsByClientId)

// 根据ID获取报价单（必须在最后，因为会匹配所有路径）
router.get('/:id', QuotationController.getQuotationById)

// 创建报价单
router.post('/', QuotationController.createQuotation)

// 更新报价单
router.put('/:id', QuotationController.updateQuotation)

// 删除报价单
router.delete('/:id', QuotationController.deleteQuotation)

// 切换报价单状态
router.patch('/:id/toggle-status', QuotationController.toggleQuotationStatus)

export default router 