import { Router } from 'express'
import { ClientCategoryController } from '../controllers/ClientCategoryController'

const router = Router()

router.get('/', ClientCategoryController.getCategories)
router.post('/', ClientCategoryController.createCategory)
router.put('/:id', ClientCategoryController.updateCategory)
router.delete('/:id', ClientCategoryController.deleteCategory)

export default router