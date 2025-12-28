import { Router } from 'express';
import { IncomeController } from '../controllers/IncomeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 获取回款列表
router.get('/', IncomeController.getIncomes);

// 获取回款统计
router.get('/stats', IncomeController.getIncomeStats);

// 根据ID获取回款详情
router.get('/:id', IncomeController.getIncomeById);

// 创建回款
router.post('/', authenticateToken, IncomeController.createIncome);

// 更新回款
router.put('/:id', authenticateToken, IncomeController.updateIncome);

// 更新回款备注
router.patch('/:id/remark', authenticateToken, IncomeController.updateIncomeRemark);

// 删除回款
router.delete('/:id', authenticateToken, IncomeController.deleteIncome);

export default router;

