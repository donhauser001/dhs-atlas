import express from 'express'
import { ServicePricingController } from '../controllers/ServicePricingController'

const router = express.Router()

// 获取所有服务定价
router.get('/', ServicePricingController.getAllServicePricing)

// 搜索服务定价
router.get('/search', ServicePricingController.searchServicePricing)

// 根据ID列表获取服务定价
router.get('/by-ids', ServicePricingController.getServicePricingByIds)

// 根据ID获取服务定价
router.get('/:id', ServicePricingController.getServicePricingById)

// 创建服务定价
router.post('/', ServicePricingController.createServicePricing)

// 复制服务定价
router.post('/:id/copy', ServicePricingController.copyServicePricing)

// 更新服务定价
router.put('/:id', ServicePricingController.updateServicePricing)

// 切换服务定价状态
router.patch('/:id/toggle-status', ServicePricingController.toggleServicePricingStatus)

// 删除服务定价
router.delete('/:id', ServicePricingController.deleteServicePricing)

export default router 