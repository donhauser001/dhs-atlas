import express from 'express'
import ServiceProcessController from '../controllers/ServiceProcessController'

const router = express.Router()

// 获取所有服务流程
router.get('/', ServiceProcessController.getAllProcesses)

// 搜索服务流程
router.get('/search', ServiceProcessController.searchProcesses)

// 根据ID获取服务流程
router.get('/:id', ServiceProcessController.getProcessById)

// 创建服务流程
router.post('/', ServiceProcessController.createProcess)

// 复制服务流程
router.post('/:id/copy', ServiceProcessController.copyProcess)

// 更新服务流程
router.put('/:id', ServiceProcessController.updateProcess)

// 切换服务流程状态
router.patch('/:id/toggle-status', ServiceProcessController.toggleProcessStatus)

// 删除服务流程
router.delete('/:id', ServiceProcessController.deleteProcess)

export default router 