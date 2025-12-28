import { Router } from 'express';
import { SettlementController } from '../controllers/SettlementController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 获取结算单列表
router.get('/', SettlementController.getSettlements);

// 根据ID获取结算单详情
router.get('/:id', SettlementController.getSettlementById);

// 创建结算单
router.post('/', authenticateToken, SettlementController.createSettlement);

// 更新结算单
router.put('/:id', authenticateToken, SettlementController.updateSettlement);

// 删除结算单
router.delete('/:id', authenticateToken, SettlementController.deleteSettlement);

export default router;

