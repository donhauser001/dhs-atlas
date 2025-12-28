import { Router } from 'express'
import { SpecificationController } from '../controllers/SpecificationController'

const router = Router()
const specificationController = new SpecificationController()

// 获取规格列表
router.get('/', specificationController.getSpecifications)

// 获取默认规格列表
router.get('/defaults', specificationController.getDefaultSpecifications)

// 获取规格详情
router.get('/:id', specificationController.getSpecificationById)

// 创建规格
router.post('/', specificationController.createSpecification)

// 更新规格
router.put('/:id', specificationController.updateSpecification)

// 删除规格
router.delete('/:id', specificationController.deleteSpecification)

// 设置默认规格
router.patch('/:id/default', specificationController.setDefaultSpecification)

export default router 