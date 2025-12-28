import { Router } from 'express';
import { EnterpriseController } from '../controllers/EnterpriseController';

const router = Router();
const enterpriseController = new EnterpriseController();

// 获取企业列表
router.get('/', enterpriseController.getEnterprises.bind(enterpriseController));

// 根据ID获取企业
router.get('/:id', enterpriseController.getEnterpriseById.bind(enterpriseController));

// 创建企业
router.post('/', enterpriseController.createEnterprise.bind(enterpriseController));

// 更新企业
router.put('/:id', enterpriseController.updateEnterprise.bind(enterpriseController));

// 删除企业
router.delete('/:id', enterpriseController.deleteEnterprise.bind(enterpriseController));

// 切换企业状态
router.put('/:id/toggle-status', enterpriseController.toggleEnterpriseStatus.bind(enterpriseController));

export default router; 