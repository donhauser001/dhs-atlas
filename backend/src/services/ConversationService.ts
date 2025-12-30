/**
 * 对话日志服务
 * 
 * 功能：
 * - 记录所有对话事件
 * - 获取会话历史
 * - 获取用户最近对话
 * - 对话统计分析
 * - 支持异步批量写入（高吞吐场景）
 */

import Conversation, {
    IConversation,
    CreateConversationInput,
    ConversationQuery,
    IToolCall,
} from '../models/Conversation';
import { Types } from 'mongoose';

// ============================================================================
// 异步写入缓冲区配置
// ============================================================================

interface BufferedEvent extends CreateConversationInput {
    _bufferedAt: number;
}

const BUFFER_FLUSH_INTERVAL = 5000; // 5 秒刷新一次
const BUFFER_MAX_SIZE = 100; // 缓冲区最大大小

/**
 * 对话摘要
 */
export interface ConversationSummary {
    sessionId: string;
    startTime: Date;
    endTime: Date;
    messageCount: number;
    toolCallCount: number;
    modules: string[];
}

/**
 * 对话统计
 */
export interface ConversationStats {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    totalToolCalls: number;
    successfulToolCalls: number;
    failedToolCalls: number;
    avgMessagesPerSession: number;
    topModules: Array<{ module: string; count: number }>;
}

/**
 * 对话日志服务
 */
class ConversationService {
    private buffer: BufferedEvent[] = [];
    private flushTimer: NodeJS.Timeout | null = null;
    private isBufferEnabled: boolean = false;

    /**
     * 启用异步缓冲写入
     */
    enableBuffering(): void {
        if (this.isBufferEnabled) return;
        
        this.isBufferEnabled = true;
        this.startFlushTimer();
        console.log('[ConversationService] 异步缓冲已启用');
    }

    /**
     * 禁用异步缓冲写入并刷新缓冲区
     */
    async disableBuffering(): Promise<void> {
        if (!this.isBufferEnabled) return;
        
        this.isBufferEnabled = false;
        this.stopFlushTimer();
        await this.flushBuffer();
        console.log('[ConversationService] 异步缓冲已禁用');
    }

    /**
     * 启动刷新定时器
     */
    private startFlushTimer(): void {
        if (this.flushTimer) return;
        
        this.flushTimer = setInterval(async () => {
            await this.flushBuffer();
        }, BUFFER_FLUSH_INTERVAL);
    }

    /**
     * 停止刷新定时器
     */
    private stopFlushTimer(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    /**
     * 刷新缓冲区
     */
    async flushBuffer(): Promise<number> {
        if (this.buffer.length === 0) return 0;
        
        const toFlush = [...this.buffer];
        this.buffer = [];
        
        try {
            const inputs = toFlush.map(({ _bufferedAt, ...input }) => input);
            await this.logEvents(inputs);
            console.log(`[ConversationService] 刷新缓冲区: ${toFlush.length} 条记录`);
            return toFlush.length;
        } catch (error) {
            // 刷新失败，将数据放回缓冲区
            this.buffer = [...toFlush, ...this.buffer];
            console.error('[ConversationService] 刷新缓冲区失败:', error);
            throw error;
        }
    }

    /**
     * 异步记录对话事件（使用缓冲区）
     * 适用于高吞吐场景
     */
    logEventAsync(input: CreateConversationInput): void {
        if (!this.isBufferEnabled) {
            // 如果缓冲未启用，直接同步写入（不等待）
            this.logEvent(input).catch(err => {
                console.error('[ConversationService] 异步记录失败:', err);
            });
            return;
        }

        this.buffer.push({
            ...input,
            _bufferedAt: Date.now(),
        });

        // 如果缓冲区满了，立即刷新
        if (this.buffer.length >= BUFFER_MAX_SIZE) {
            this.flushBuffer().catch(err => {
                console.error('[ConversationService] 缓冲区刷新失败:', err);
            });
        }
    }

    /**
     * 获取缓冲区状态
     */
    getBufferStatus(): { enabled: boolean; size: number } {
        return {
            enabled: this.isBufferEnabled,
            size: this.buffer.length,
        };
    }

    /**
     * 记录对话事件
     */
    async logEvent(input: CreateConversationInput): Promise<IConversation> {
        try {
            const conversation = new Conversation({
                userId: input.userId,
                sessionId: input.sessionId,
                timestamp: input.timestamp || new Date(),
                role: input.role,
                content: input.content,
                toolCalls: input.toolCalls,
                module: input.module,
                pathname: input.pathname,
                metadata: input.metadata,
            });

            await conversation.save();
            return conversation;
        } catch (error) {
            console.error('[ConversationService] 记录对话事件失败:', error);
            throw error;
        }
    }

    /**
     * 批量记录对话事件
     */
    async logEvents(inputs: CreateConversationInput[]): Promise<IConversation[]> {
        try {
            const docs = inputs.map(input => ({
                userId: input.userId,
                sessionId: input.sessionId,
                timestamp: input.timestamp || new Date(),
                role: input.role,
                content: input.content,
                toolCalls: input.toolCalls,
                module: input.module,
                pathname: input.pathname,
                metadata: input.metadata,
            }));

            const conversations = await Conversation.insertMany(docs);
            return conversations;
        } catch (error) {
            console.error('[ConversationService] 批量记录对话事件失败:', error);
            throw error;
        }
    }

    /**
     * 获取会话历史（按时间正序）
     */
    async getSessionHistory(
        sessionId: string,
        options?: { limit?: number; offset?: number }
    ): Promise<IConversation[]> {
        const query = Conversation.find({ sessionId })
            .sort({ timestamp: 1 });

        if (options?.offset) {
            query.skip(options.offset);
        }
        if (options?.limit) {
            query.limit(options.limit);
        }

        return await query.lean();
    }

    /**
     * 获取用户最近对话
     */
    async getUserRecentConversations(
        userId: string,
        limit: number = 50
    ): Promise<IConversation[]> {
        return await Conversation.find({ userId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
    }

    /**
     * 获取用户的会话列表
     */
    async getUserSessions(
        userId: string,
        options?: { page?: number; limit?: number }
    ): Promise<{ sessions: ConversationSummary[]; total: number }> {
        const page = options?.page || 1;
        const limit = options?.limit || 20;
        const skip = (page - 1) * limit;

        // 聚合查询获取会话摘要
        const pipeline = [
            { $match: { userId } },
            {
                $group: {
                    _id: '$sessionId',
                    startTime: { $min: '$timestamp' },
                    endTime: { $max: '$timestamp' },
                    messageCount: { $sum: 1 },
                    toolCallCount: {
                        $sum: {
                            $cond: [
                                { $isArray: '$toolCalls' },
                                { $size: '$toolCalls' },
                                0,
                            ],
                        },
                    },
                    modules: { $addToSet: '$module' },
                },
            },
            { $sort: { endTime: -1 as const } },
            { $skip: skip },
            { $limit: limit },
        ] as const;

        const sessions = await Conversation.aggregate([...pipeline]);

        // 获取总数
        const countPipeline = [
            { $match: { userId } },
            { $group: { _id: '$sessionId' } },
            { $count: 'total' },
        ];
        const countResult = await Conversation.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        return {
            sessions: sessions.map(s => ({
                sessionId: s._id,
                startTime: s.startTime,
                endTime: s.endTime,
                messageCount: s.messageCount,
                toolCallCount: s.toolCallCount,
                modules: s.modules.filter(Boolean),
            })),
            total,
        };
    }

    /**
     * 通用查询接口
     */
    async query(
        params: ConversationQuery
    ): Promise<{ conversations: IConversation[]; total: number; page: number; limit: number }> {
        const query: any = {};

        if (params.userId) query.userId = params.userId;
        if (params.sessionId) query.sessionId = params.sessionId;
        if (params.role) query.role = params.role;
        if (params.module) query.module = params.module;
        if (params.startDate || params.endDate) {
            query.timestamp = {};
            if (params.startDate) query.timestamp.$gte = params.startDate;
            if (params.endDate) query.timestamp.$lte = params.endDate;
        }

        const page = params.page || 1;
        const limit = params.limit || 50;
        const skip = (page - 1) * limit;

        const [conversations, total] = await Promise.all([
            Conversation.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Conversation.countDocuments(query),
        ]);

        return { conversations, total, page, limit };
    }

    /**
     * 获取对话统计
     */
    async getStats(
        userId: string,
        range?: { startDate: Date; endDate: Date }
    ): Promise<ConversationStats> {
        const matchStage: any = { userId };
        if (range) {
            matchStage.timestamp = {
                $gte: range.startDate,
                $lte: range.endDate,
            };
        }

        // 基础统计
        const basicStats = await Conversation.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalMessages: { $sum: 1 },
                    userMessages: {
                        $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] },
                    },
                    assistantMessages: {
                        $sum: { $cond: [{ $eq: ['$role', 'assistant'] }, 1, 0] },
                    },
                    sessions: { $addToSet: '$sessionId' },
                },
            },
        ]);

        // 工具调用统计
        const toolStats = await Conversation.aggregate([
            { $match: { ...matchStage, toolCalls: { $exists: true, $ne: [] } } },
            { $unwind: '$toolCalls' },
            {
                $group: {
                    _id: null,
                    totalToolCalls: { $sum: 1 },
                    successfulToolCalls: {
                        $sum: { $cond: ['$toolCalls.success', 1, 0] },
                    },
                    failedToolCalls: {
                        $sum: { $cond: ['$toolCalls.success', 0, 1] },
                    },
                },
            },
        ]);

        // 模块统计
        const moduleStats = await Conversation.aggregate([
            { $match: { ...matchStage, module: { $exists: true, $ne: null } } },
            { $group: { _id: '$module', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        const basic = basicStats[0] || {
            totalMessages: 0,
            userMessages: 0,
            assistantMessages: 0,
            sessions: [],
        };
        const tools = toolStats[0] || {
            totalToolCalls: 0,
            successfulToolCalls: 0,
            failedToolCalls: 0,
        };

        return {
            totalMessages: basic.totalMessages,
            userMessages: basic.userMessages,
            assistantMessages: basic.assistantMessages,
            totalToolCalls: tools.totalToolCalls,
            successfulToolCalls: tools.successfulToolCalls,
            failedToolCalls: tools.failedToolCalls,
            avgMessagesPerSession: basic.sessions.length > 0
                ? Math.round(basic.totalMessages / basic.sessions.length)
                : 0,
            topModules: moduleStats.map(m => ({ module: m._id, count: m.count })),
        };
    }

    /**
     * 根据 ID 获取单条对话
     */
    async getById(id: string): Promise<IConversation | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }
        return await Conversation.findById(id).lean();
    }

    /**
     * 删除会话的所有对话
     */
    async deleteSession(sessionId: string): Promise<number> {
        const result = await Conversation.deleteMany({ sessionId });
        return result.deletedCount;
    }

    /**
     * 搜索对话内容
     */
    async search(
        userId: string,
        keyword: string,
        options?: { page?: number; limit?: number }
    ): Promise<{ conversations: IConversation[]; total: number }> {
        const page = options?.page || 1;
        const limit = options?.limit || 20;
        const skip = (page - 1) * limit;

        const query = {
            userId,
            content: { $regex: keyword, $options: 'i' },
        };

        const [conversations, total] = await Promise.all([
            Conversation.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Conversation.countDocuments(query),
        ]);

        return { conversations, total };
    }
}

// 导出单例
export const conversationService = new ConversationService();
export default conversationService;

