/**
 * 记忆系统 API 路由
 */

import { Router } from 'express';
import MemoryController from '../controllers/MemoryController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticateJWT);

// =========================================================================
// 暂存记忆路由
// =========================================================================

// GET /api/memory/staging - 获取用户的暂存记忆
router.get('/staging', MemoryController.getStagingMemories);

// GET /api/memory/staging/stats - 获取暂存记忆统计
router.get('/staging/stats', MemoryController.getStagingStats);

// POST /api/memory/staging/promote-batch - 批量提升为关键记忆
router.post('/staging/promote-batch', MemoryController.promoteBatch);

// GET /api/memory/staging/:id - 获取单条暂存记忆
router.get('/staging/:id', MemoryController.getStagingMemoryById);

// POST /api/memory/staging/:id/promote - 提升为关键记忆
router.post('/staging/:id/promote', MemoryController.promoteMemory);

// POST /api/memory/staging/:id/reject - 拒绝暂存记忆
router.post('/staging/:id/reject', MemoryController.rejectMemory);

// DELETE /api/memory/staging/:id - 删除暂存记忆
router.delete('/staging/:id', MemoryController.deleteStagingMemory);

// =========================================================================
// 关键记忆路由
// =========================================================================

// GET /api/memory/key - 获取用户的关键记忆
router.get('/key', MemoryController.getKeyMemories);

// GET /api/memory/key/grouped - 获取分组的关键记忆
router.get('/key/grouped', MemoryController.getKeyMemoriesGrouped);

// GET /api/memory/key/stats - 获取关键记忆统计
router.get('/key/stats', MemoryController.getKeyStats);

// GET /api/memory/key/search - 搜索关键记忆
router.get('/key/search', MemoryController.searchKeyMemories);

// POST /api/memory/key - 添加关键记忆
router.post('/key', MemoryController.addKeyMemory);

// GET /api/memory/key/:id - 获取单条关键记忆
router.get('/key/:id', MemoryController.getKeyMemoryById);

// PUT /api/memory/key/:id - 更新关键记忆
router.put('/key/:id', MemoryController.updateKeyMemory);

// DELETE /api/memory/key/:id - 删除关键记忆
router.delete('/key/:id', MemoryController.deleteKeyMemory);

export default router;

