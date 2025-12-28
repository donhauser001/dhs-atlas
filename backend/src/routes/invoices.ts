import express from 'express';
import { InvoiceController } from '../controllers/InvoiceController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 获取发票列表
router.get('/', InvoiceController.getInvoices);

// 获取发票统计
router.get('/stats', InvoiceController.getInvoiceStats);

// 创建发票
router.post('/', authenticateToken, InvoiceController.createInvoice);

// 根据ID获取发票详情
router.get('/:id', InvoiceController.getInvoiceById);

// 更新发票
router.put('/:id', authenticateToken, InvoiceController.updateInvoice);

// 删除发票
router.delete('/:id', authenticateToken, InvoiceController.deleteInvoice);

export default router;

