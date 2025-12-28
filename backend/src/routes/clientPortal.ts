/**
 * 客户门户 API 路由
 * 
 * 所有路由都需要客户门户权限验证
 * 数据访问范围限制在当前用户的 clientId 内
 */

import { Router, Request, Response } from 'express';
import { authMiddleware, requireClientPortal } from '../middleware/auth';
import { UserService } from '../services/UserService';
import Project from '../models/Project';
import { GeneratedContract } from '../models/GeneratedContract';
import Quotation from '../models/Quotation';
import Invoice from '../models/Invoice';
import Income from '../models/Income';
import Client from '../models/Client';

const router = Router();
const userService = new UserService();

// ========== 扩展 Request 类型 ==========
interface PortalRequest extends Request {
    user?: {
        id: string;
        username: string;
        roles?: string[];
        clientContactProfile?: {
            clientId?: string;
            portalRole?: string;
        };
    };
}

// ========== 辅助函数：获取当前用户的 clientId ==========
function getClientId(req: PortalRequest): string | null {
    return req.user?.clientContactProfile?.clientId || null;
}

// ========== 辅助函数：获取门户角色 ==========
function getPortalRole(req: PortalRequest): string {
    return req.user?.clientContactProfile?.portalRole || 'member';
}

// ========== 获取当前用户资料 ==========
router.get('/profile', authMiddleware, requireClientPortal, async (req: PortalRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: '未授权' });
        }

        const profile = await userService.getPortalUserProfile(userId);
        if (!profile) {
            return res.status(404).json({ success: false, message: '用户资料不存在' });
        }

        // 获取客户公司信息
        let clientInfo = null;
        if (profile.clientId) {
            const client = await Client.findById(profile.clientId).lean();
            if (client) {
                clientInfo = {
                    id: client._id.toString(),
                    name: client.name,
                    category: client.category
                };
            }
        }

        res.json({
            success: true,
            data: {
                ...profile,
                client: clientInfo
            }
        });
    } catch (error) {
        console.error('获取门户用户资料失败:', error);
        res.status(500).json({ success: false, message: '获取用户资料失败' });
    }
});

// ========== 获取项目列表 ==========
router.get('/projects', authMiddleware, requireClientPortal, async (req: PortalRequest, res: Response) => {
    try {
        const clientId = getClientId(req);
        if (!clientId) {
            return res.status(403).json({ success: false, message: '无法确定客户身份' });
        }

        const { page = 1, limit = 10, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // 构建查询条件
        const filter: any = { clientId };
        if (status && status !== 'all') {
            filter.status = status;
        }

        const total = await Project.countDocuments(filter);
        const projects = await Project.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .select('-internalNotes -costBreakdown -profit') // 排除敏感字段
            .lean();

        const projectsWithId = projects.map(p => ({
            ...p,
            id: p._id.toString()
        }));

        res.json({
            success: true,
            data: projectsWithId,
            total,
            page: Number(page),
            limit: Number(limit)
        });
    } catch (error) {
        console.error('获取门户项目列表失败:', error);
        res.status(500).json({ success: false, message: '获取项目列表失败' });
    }
});

// ========== 获取项目详情 ==========
router.get('/projects/:id', authMiddleware, requireClientPortal, async (req: PortalRequest, res: Response) => {
    try {
        const clientId = getClientId(req);
        if (!clientId) {
            return res.status(403).json({ success: false, message: '无法确定客户身份' });
        }

        const project = await Project.findOne({
            _id: req.params.id,
            clientId
        })
            .select('-internalNotes -costBreakdown -profit')
            .lean();

        if (!project) {
            return res.status(404).json({ success: false, message: '项目不存在或无权访问' });
        }

        res.json({
            success: true,
            data: {
                ...project,
                id: project._id.toString()
            }
        });
    } catch (error) {
        console.error('获取门户项目详情失败:', error);
        res.status(500).json({ success: false, message: '获取项目详情失败' });
    }
});

// ========== 获取合同列表 ==========
router.get('/contracts', authMiddleware, requireClientPortal, async (req: PortalRequest, res: Response) => {
    try {
        const clientId = getClientId(req);
        if (!clientId) {
            return res.status(403).json({ success: false, message: '无法确定客户身份' });
        }

        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const filter = { 'relatedIds.clientId': clientId };

        const total = await GeneratedContract.countDocuments(filter);
        const contracts = await GeneratedContract.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const contractsWithId = contracts.map(c => ({
            ...c,
            id: c._id.toString()
        }));

        res.json({
            success: true,
            data: contractsWithId,
            total,
            page: Number(page),
            limit: Number(limit)
        });
    } catch (error) {
        console.error('获取门户合同列表失败:', error);
        res.status(500).json({ success: false, message: '获取合同列表失败' });
    }
});

// ========== 获取报价单列表 ==========
router.get('/quotations', authMiddleware, requireClientPortal, async (req: PortalRequest, res: Response) => {
    try {
        const clientId = getClientId(req);
        if (!clientId) {
            return res.status(403).json({ success: false, message: '无法确定客户身份' });
        }

        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const filter = { clientId };

        const total = await Quotation.countDocuments(filter);
        const quotations = await Quotation.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .select('-internalCost -margin') // 排除敏感字段
            .lean();

        const quotationsWithId = quotations.map(q => ({
            ...q,
            id: q._id.toString()
        }));

        res.json({
            success: true,
            data: quotationsWithId,
            total,
            page: Number(page),
            limit: Number(limit)
        });
    } catch (error) {
        console.error('获取门户报价单列表失败:', error);
        res.status(500).json({ success: false, message: '获取报价单列表失败' });
    }
});

// ========== 获取发票列表 ==========
router.get('/invoices', authMiddleware, requireClientPortal, async (req: PortalRequest, res: Response) => {
    try {
        const clientId = getClientId(req);
        if (!clientId) {
            return res.status(403).json({ success: false, message: '无法确定客户身份' });
        }

        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const filter = { clientId };

        const total = await Invoice.countDocuments(filter);
        const invoices = await Invoice.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const invoicesWithId = invoices.map(i => ({
            ...i,
            id: i._id.toString()
        }));

        res.json({
            success: true,
            data: invoicesWithId,
            total,
            page: Number(page),
            limit: Number(limit)
        });
    } catch (error) {
        console.error('获取门户发票列表失败:', error);
        res.status(500).json({ success: false, message: '获取发票列表失败' });
    }
});

// ========== 获取付款记录（回款） ==========
router.get('/payments', authMiddleware, requireClientPortal, async (req: PortalRequest, res: Response) => {
    try {
        const clientId = getClientId(req);
        if (!clientId) {
            return res.status(403).json({ success: false, message: '无法确定客户身份' });
        }

        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const filter = { clientId };

        const total = await Income.countDocuments(filter);
        const payments = await Income.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const paymentsWithId = payments.map(p => ({
            ...p,
            id: p._id.toString()
        }));

        res.json({
            success: true,
            data: paymentsWithId,
            total,
            page: Number(page),
            limit: Number(limit)
        });
    } catch (error) {
        console.error('获取门户付款记录失败:', error);
        res.status(500).json({ success: false, message: '获取付款记录失败' });
    }
});

// ========== 获取门户首页统计数据 ==========
router.get('/dashboard', authMiddleware, requireClientPortal, async (req: PortalRequest, res: Response) => {
    try {
        const clientId = getClientId(req);
        if (!clientId) {
            return res.status(403).json({ success: false, message: '无法确定客户身份' });
        }

        // 并行获取各类统计数据
        const [
            totalProjects,
            activeProjects,
            totalContracts,
            pendingInvoices
        ] = await Promise.all([
            Project.countDocuments({ clientId }),
            Project.countDocuments({ clientId, status: { $in: ['进行中', 'in_progress'] } }),
            GeneratedContract.countDocuments({ 'relatedIds.clientId': clientId }),
            Invoice.countDocuments({ clientId, status: { $ne: '已付款' } })
        ]);

        // 获取最近项目
        const recentProjects = await Project.find({ clientId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name status createdAt')
            .lean();

        res.json({
            success: true,
            data: {
                statistics: {
                    totalProjects,
                    activeProjects,
                    totalContracts,
                    pendingInvoices
                },
                recentProjects: recentProjects.map(p => ({
                    ...p,
                    id: p._id.toString()
                }))
            }
        });
    } catch (error) {
        console.error('获取门户首页数据失败:', error);
        res.status(500).json({ success: false, message: '获取首页数据失败' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// 提案模块接口骨架（预留）
// 说明：提案模块开发后，在此实现具体逻辑
// 安全要求：所有查询必须基于 clientId 过滤，防止数据越权
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 获取提案列表
 *
 * 数据过滤规则：
 * - portalRole === 'owner': 可看该客户下所有项目的提案
 * - portalRole === 'member': 仅看参与者列表中包含自己的项目的提案
 *
 * TODO: 提案模块开发后实现
 */
router.get('/proposals', authMiddleware, requireClientPortal, async (req: PortalRequest, res: Response) => {
    try {
        const clientId = getClientId(req);
        const portalRole = getPortalRole(req);

        if (!clientId) {
            return res.status(403).json({ success: false, message: '无法确定客户身份' });
        }

        const { page = 1, limit = 10, status, projectId } = req.query;

        // TODO: 提案模块开发后实现实际查询
        // const filter: any = {};
        //
        // if (portalRole === 'owner') {
        //     // 客户负责人：可看该客户所有提案
        //     filter.$or = [
        //         { clientId },
        //         { 'project.clientId': clientId }
        //     ];
        // } else {
        //     // 普通成员：仅看参与的项目的提案
        //     filter.participants = req.user?.id;
        // }
        //
        // if (status) filter.status = status;
        // if (projectId) filter.projectId = projectId;
        //
        // const proposals = await Proposal.find(filter)...

        res.json({
            success: true,
            data: [],
            total: 0,
            page: Number(page),
            limit: Number(limit),
            _devNote: '提案模块开发中，此接口为预留骨架'
        });
    } catch (error) {
        console.error('获取门户提案列表失败:', error);
        res.status(500).json({ success: false, message: '获取提案列表失败' });
    }
});

/**
 * 获取提案详情
 *
 * 安全校验：
 * 1. 提案必须属于当前客户（通过 clientId 或 project.clientId 关联）
 * 2. 如果是 member 角色，还需检查是否在参与者列表中
 *
 * TODO: 提案模块开发后实现
 */
router.get('/proposals/:id', authMiddleware, requireClientPortal, async (req: PortalRequest, res: Response) => {
    try {
        const clientId = getClientId(req);
        const proposalId = req.params.id;

        if (!clientId) {
            return res.status(403).json({ success: false, message: '无法确定客户身份' });
        }

        // TODO: 提案模块开发后实现实际查询
        // const proposal = await Proposal.findOne({
        //     _id: proposalId,
        //     $or: [
        //         { clientId },
        //         { 'project.clientId': clientId }
        //     ]
        // }).populate('schemes').populate('iterations');
        //
        // if (!proposal) {
        //     return res.status(404).json({ success: false, message: '提案不存在或无权访问' });
        // }

        res.json({
            success: true,
            data: null,
            _devNote: '提案模块开发中，此接口为预留骨架'
        });
    } catch (error) {
        console.error('获取门户提案详情失败:', error);
        res.status(500).json({ success: false, message: '获取提案详情失败' });
    }
});

/**
 * 提交提案反馈
 *
 * 操作类型：
 * - approve: 通过某方案
 * - reject: 退回/要求整体重做
 * - comment: 对某个方案发表评论
 *
 * 记录要求：
 * - feedback_from: 'client_portal' （区分于内部反馈）
 * - feedback_by: 当前用户ID
 * - feedback_at: 时间戳
 *
 * TODO: 提案模块开发后实现
 */
router.post('/proposals/:id/feedback', authMiddleware, requireClientPortal, async (req: PortalRequest, res: Response) => {
    try {
        const clientId = getClientId(req);
        const userId = req.user?.id;
        const proposalId = req.params.id;
        const { action, schemeId, content } = req.body;

        if (!clientId) {
            return res.status(403).json({ success: false, message: '无法确定客户身份' });
        }

        if (!action || !['approve', 'reject', 'comment'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: '无效的操作类型，支持: approve, reject, comment'
            });
        }

        // TODO: 提案模块开发后实现实际逻辑
        // 1. 验证提案归属
        // const proposal = await Proposal.findOne({
        //     _id: proposalId,
        //     $or: [{ clientId }, { 'project.clientId': clientId }]
        // });
        // if (!proposal) return res.status(404)...
        //
        // 2. 根据 action 执行操作
        // if (action === 'approve') {
        //     await proposal.approveScheme(schemeId, {
        //         approved_by: userId,
        //         approved_at: new Date(),
        //         from: 'client_portal'
        //     });
        // } else if (action === 'reject') {
        //     await proposal.createNewIteration({
        //         reason: content,
        //         requested_by: userId,
        //         from: 'client_portal'
        //     });
        // } else if (action === 'comment') {
        //     await proposal.addComment({
        //         scheme_id: schemeId,
        //         content,
        //         author_id: userId,
        //         from: 'client_portal'
        //     });
        // }

        res.json({
            success: true,
            message: '反馈已收到',
            _devNote: '提案模块开发中，此接口为预留骨架',
            _received: { action, schemeId, content }
        });
    } catch (error) {
        console.error('提交门户提案反馈失败:', error);
        res.status(500).json({ success: false, message: '提交反馈失败' });
    }
});

/**
 * 获取提案方案列表
 *
 * TODO: 提案模块开发后实现
 */
router.get('/proposals/:id/schemes', authMiddleware, requireClientPortal, async (req: PortalRequest, res: Response) => {
    try {
        const clientId = getClientId(req);
        const proposalId = req.params.id;

        if (!clientId) {
            return res.status(403).json({ success: false, message: '无法确定客户身份' });
        }

        res.json({
            success: true,
            data: [],
            _devNote: '提案模块开发中，此接口为预留骨架'
        });
    } catch (error) {
        console.error('获取门户提案方案列表失败:', error);
        res.status(500).json({ success: false, message: '获取方案列表失败' });
    }
});

export default router;
