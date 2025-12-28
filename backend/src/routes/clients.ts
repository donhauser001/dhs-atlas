import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';

const router = Router();

// 获取客户列表
router.get('/', ClientController.getClients);

// 根据ID获取客户
router.get('/:id', ClientController.getClientById);

// 创建客户
router.post('/', ClientController.createClient);

// 更新客户
router.put('/:id', ClientController.updateClient);

// 删除客户
router.delete('/:id', ClientController.deleteClient);

// 添加客户文件
router.post('/:clientId/files', ClientController.addClientFile);

// 删除客户文件
router.delete('/:clientId/files', ClientController.removeClientFile);

export default router; 