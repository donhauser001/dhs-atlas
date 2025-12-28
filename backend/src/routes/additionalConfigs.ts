import express from 'express'
import { AdditionalConfigController } from '../controllers/AdditionalConfigController'

const router = express.Router()

// 获取所有附加配置
router.get('/', AdditionalConfigController.getAllConfigs)

// 搜索附加配置
router.get('/search', AdditionalConfigController.searchConfigs)

// 根据ID获取附加配置
router.get('/:id', AdditionalConfigController.getConfigById)

// 创建附加配置
router.post('/', AdditionalConfigController.createConfig)

// 复制附加配置
router.post('/:id/copy', AdditionalConfigController.copyConfig)

// 更新附加配置
router.put('/:id', AdditionalConfigController.updateConfig)

// 切换附加配置状态
router.patch('/:id/toggle-status', AdditionalConfigController.toggleConfigStatus)

// 删除附加配置
router.delete('/:id', AdditionalConfigController.deleteConfig)

export default router 