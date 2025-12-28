import express from 'express'
import { PricingPolicyController } from '../controllers/PricingPolicyController'

const router = express.Router()

// 获取所有价格政策
router.get('/', PricingPolicyController.getAllPolicies)

// 搜索价格政策
router.get('/search', PricingPolicyController.searchPolicies)

// 根据ID获取价格政策
router.get('/:id', PricingPolicyController.getPolicyById)

// 创建价格政策
router.post('/', PricingPolicyController.createPolicy)

// 更新价格政策
router.put('/:id', PricingPolicyController.updatePolicy)

// 切换价格政策状态
router.patch('/:id/toggle-status', PricingPolicyController.togglePolicyStatus)

// 删除价格政策
router.delete('/:id', PricingPolicyController.deletePolicy)

export default router 