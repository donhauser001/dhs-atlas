/**
 * 提案路由（内部管理接口）
 *
 * 适用对象：内部员工（设计师、项目经理、管理员）
 * 路由前缀：/api/proposals
 *
 * 权限要求：requireInternalUser + requireRole(['designer', 'pm', 'admin', 'owner'])
 *
 * ⚠️ 注意：客户门户的提案接口在 clientPortal.ts 中，路径为 /api/client-portal/proposals
 */

import { Router, Request, Response } from 'express';
import { authMiddleware, requireInternalUser, requireRole } from '../middleware/auth';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════════

/** 提案状态枚举 */
type ProposalStatus =
    | 'draft'            // 草稿
    | 'pending_review'   // 待审核（等待客户反馈）
    | 'in_revision'      // 修改中
    | 'approved'         // 已通过
    | 'rejected'         // 已退回
    | 'archived';        // 已归档

/** 方案状态枚举 */
type SchemeStatus =
    | 'draft'
    | 'submitted'
    | 'approved_by_client'
    | 'rejected_by_client';

/** 反馈来源 */
type FeedbackFrom = 'internal' | 'client_portal';

/** 反馈动作 */
type FeedbackAction = 'approve' | 'reject' | 'comment' | 'revise';

// ═══════════════════════════════════════════════════════════════════════════
// 提案列表（内部视图）
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 获取提案列表
 *
 * 支持过滤：
 * - status: 提案状态
 * - projectId: 关联项目
 * - clientId: 关联客户
 * - assignee: 负责人
 *
 * 支持分页：
 * - page: 页码（默认 1）
 * - pageSize: 每页条数（默认 20，最大 100）
 *
 * 支持排序：
 * - sortBy: 排序字段（createdAt, updatedAt, name）
 * - sortOrder: 排序方向（asc, desc）
 */
router.get('/',
    authMiddleware,
    requireInternalUser,
    requireRole('designer', 'pm', 'admin', 'owner'),
    async (req: Request, res: Response) => {
        try {
            const {
                status,
                projectId,
                clientId,
                assignee,
                page = 1,
                pageSize = 20,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // TODO: 提案模块开发后实现
            // const filter: any = {};
            // if (status) filter.status = status;
            // if (projectId) filter.projectId = projectId;
            // if (clientId) filter.clientId = clientId;
            // if (assignee) filter.assignee = assignee;
            //
            // const skip = (Number(page) - 1) * Math.min(Number(pageSize), 100);
            // const limit = Math.min(Number(pageSize), 100);
            //
            // const [proposals, total] = await Promise.all([
            //     Proposal.find(filter)
            //         .sort({ [sortBy as string]: sortOrder === 'asc' ? 1 : -1 })
            //         .skip(skip)
            //         .limit(limit)
            //         .populate('projectId', 'name')
            //         .populate('clientId', 'name')
            //         .lean(),
            //     Proposal.countDocuments(filter)
            // ]);

            res.json({
                success: true,
                data: [],
                total: 0,
                page: Number(page),
                pageSize: Math.min(Number(pageSize), 100),
                _devNote: '提案模块开发中，此接口为预留骨架'
            });
        } catch (error) {
            console.error('获取提案列表失败:', error);
            res.status(500).json({ success: false, message: '获取提案列表失败' });
        }
    }
);

// ═══════════════════════════════════════════════════════════════════════════
// 提案详情
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 获取提案详情
 *
 * 返回字段包括：
 * - 基础信息（name, description, status）
 * - 关联信息（project, client）
 * - 方案列表（schemes）
 * - 迭代历史（iterations）
 * - 反馈记录（feedbacks）
 * - 内部备注（internalNotes）- 仅内部接口返回
 */
router.get('/:id',
    authMiddleware,
    requireInternalUser,
    requireRole('designer', 'pm', 'admin', 'owner'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // TODO: 提案模块开发后实现
            // const proposal = await Proposal.findById(id)
            //     .populate('projectId')
            //     .populate('clientId')
            //     .populate('schemes')
            //     .populate('iterations')
            //     .populate('feedbacks')
            //     .lean();
            //
            // if (!proposal) {
            //     return res.status(404).json({ success: false, message: '提案不存在' });
            // }

            res.json({
                success: true,
                data: null,
                _devNote: '提案模块开发中，此接口为预留骨架'
            });
        } catch (error) {
            console.error('获取提案详情失败:', error);
            res.status(500).json({ success: false, message: '获取提案详情失败' });
        }
    }
);

// ═══════════════════════════════════════════════════════════════════════════
// 创建提案
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 创建新提案
 *
 * 请求体：
 * - name: 提案名称
 * - description: 提案描述
 * - projectId: 关联项目ID
 * - clientId: 关联客户ID（可从项目自动获取）
 * - assignee: 负责人
 */
router.post('/',
    authMiddleware,
    requireInternalUser,
    requireRole('designer', 'pm', 'admin', 'owner'),
    async (req: Request, res: Response) => {
        try {
            const { name, description, projectId, clientId, assignee } = req.body;

            if (!name || !projectId) {
                return res.status(400).json({
                    success: false,
                    message: '提案名称和关联项目为必填项'
                });
            }

            // TODO: 提案模块开发后实现
            // 1. 验证项目存在
            // 2. 从项目获取 clientId（如未提供）
            // 3. 创建提案
            // 4. 返回创建结果

            res.status(201).json({
                success: true,
                data: null,
                message: '提案创建成功',
                _devNote: '提案模块开发中，此接口为预留骨架'
            });
        } catch (error) {
            console.error('创建提案失败:', error);
            res.status(500).json({ success: false, message: '创建提案失败' });
        }
    }
);

// ═══════════════════════════════════════════════════════════════════════════
// 更新提案
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 更新提案信息
 */
router.put('/:id',
    authMiddleware,
    requireInternalUser,
    requireRole('designer', 'pm', 'admin', 'owner'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // TODO: 提案模块开发后实现

            res.json({
                success: true,
                data: null,
                message: '提案更新成功',
                _devNote: '提案模块开发中，此接口为预留骨架'
            });
        } catch (error) {
            console.error('更新提案失败:', error);
            res.status(500).json({ success: false, message: '更新提案失败' });
        }
    }
);

// ═══════════════════════════════════════════════════════════════════════════
// 方案管理
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 获取提案下的方案列表
 */
router.get('/:id/schemes',
    authMiddleware,
    requireInternalUser,
    requireRole('designer', 'pm', 'admin', 'owner'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            res.json({
                success: true,
                data: [],
                _devNote: '提案模块开发中，此接口为预留骨架'
            });
        } catch (error) {
            console.error('获取方案列表失败:', error);
            res.status(500).json({ success: false, message: '获取方案列表失败' });
        }
    }
);

/**
 * 添加方案
 *
 * 请求体：
 * - name: 方案名称
 * - description: 方案描述
 * - attachments: 附件列表
 */
router.post('/:id/schemes',
    authMiddleware,
    requireInternalUser,
    requireRole('designer', 'pm', 'admin', 'owner'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, description, attachments } = req.body;

            res.status(201).json({
                success: true,
                data: null,
                message: '方案添加成功',
                _devNote: '提案模块开发中，此接口为预留骨架'
            });
        } catch (error) {
            console.error('添加方案失败:', error);
            res.status(500).json({ success: false, message: '添加方案失败' });
        }
    }
);

// ═══════════════════════════════════════════════════════════════════════════
// 内部反馈/决策
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 提交内部反馈/决策
 *
 * 请求体：
 * - action: 'approve' | 'reject' | 'comment' | 'revise'
 * - schemeId: 方案ID（approve 时必填）
 * - content: 反馈内容
 *
 * 自动填充：
 * - feedback_from: 'internal'
 * - feedback_by: 当前用户ID
 */
router.post('/:id/feedback',
    authMiddleware,
    requireInternalUser,
    requireRole('designer', 'pm', 'admin', 'owner'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { action, schemeId, content } = req.body;
            const userId = req.user?.id;

            if (!action || !['approve', 'reject', 'comment', 'revise'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: '无效的操作类型，支持: approve, reject, comment, revise'
                });
            }

            if (action === 'approve' && !schemeId) {
                return res.status(400).json({
                    success: false,
                    message: '通过操作必须指定方案ID'
                });
            }

            // TODO: 提案模块开发后实现
            // const feedback = {
            //     proposalId: id,
            //     schemeId,
            //     action,
            //     content,
            //     feedback_from: 'internal' as FeedbackFrom,
            //     feedback_by: userId,
            //     feedback_at: new Date()
            // };

            res.json({
                success: true,
                message: '反馈已提交',
                _devNote: '提案模块开发中，此接口为预留骨架',
                _received: { action, schemeId, content, from: 'internal' }
            });
        } catch (error) {
            console.error('提交反馈失败:', error);
            res.status(500).json({ success: false, message: '提交反馈失败' });
        }
    }
);

// ═══════════════════════════════════════════════════════════════════════════
// 迭代管理
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 获取迭代历史
 */
router.get('/:id/iterations',
    authMiddleware,
    requireInternalUser,
    requireRole('designer', 'pm', 'admin', 'owner'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            res.json({
                success: true,
                data: [],
                _devNote: '提案模块开发中，此接口为预留骨架'
            });
        } catch (error) {
            console.error('获取迭代历史失败:', error);
            res.status(500).json({ success: false, message: '获取迭代历史失败' });
        }
    }
);

/**
 * 创建新迭代（整体重做）
 */
router.post('/:id/iterations',
    authMiddleware,
    requireInternalUser,
    requireRole('designer', 'pm', 'admin', 'owner'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { reason, basedOnSchemeId } = req.body;

            res.status(201).json({
                success: true,
                data: null,
                message: '新迭代已创建',
                _devNote: '提案模块开发中，此接口为预留骨架'
            });
        } catch (error) {
            console.error('创建迭代失败:', error);
            res.status(500).json({ success: false, message: '创建迭代失败' });
        }
    }
);

// ═══════════════════════════════════════════════════════════════════════════
// 提交给客户
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 提交提案给客户审核
 *
 * 操作：
 * - 将状态改为 pending_review
 * - 发送通知给客户联系人
 */
router.post('/:id/submit-to-client',
    authMiddleware,
    requireInternalUser,
    requireRole('designer', 'pm', 'admin', 'owner'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { notifyContacts } = req.body;

            // TODO: 提案模块开发后实现
            // 1. 更新状态为 pending_review
            // 2. 如果 notifyContacts 为 true，发送通知

            res.json({
                success: true,
                message: '提案已提交给客户',
                _devNote: '提案模块开发中，此接口为预留骨架'
            });
        } catch (error) {
            console.error('提交给客户失败:', error);
            res.status(500).json({ success: false, message: '提交给客户失败' });
        }
    }
);

export default router;
