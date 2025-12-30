/**
 * 暂存记忆服务
 * 
 * 功能：
 * - AI 提议记忆
 * - 获取待确认的记忆
 * - 提升记忆为关键记忆
 * - 拒绝/删除记忆
 */

import StagingMemory, {
    IStagingMemory,
    CreateStagingMemoryInput,
    StagingMemoryProposal,
    MemoryType,
    StagingMemoryStatus,
} from '../models/StagingMemory';
import KeyMemory from '../models/KeyMemory';
import { Types } from 'mongoose';

/**
 * 暂存记忆统计
 */
export interface StagingMemoryStats {
    total: number;
    pending: number;
    confirmed: number;
    rejected: number;
    byType: Array<{ type: MemoryType; count: number }>;
}

/**
 * 暂存记忆服务
 */
class StagingMemoryService {
    /**
     * AI 提议记忆
     */
    async proposeMemory(proposal: StagingMemoryProposal): Promise<IStagingMemory> {
        try {
            // 检查是否已存在相似的暂存记忆（避免重复）
            const existing = await StagingMemory.findOne({
                userId: proposal.userId,
                content: proposal.content,
                status: 'pending',
            });

            if (existing) {
                console.log('[StagingMemoryService] 已存在相似的暂存记忆，跳过');
                return existing;
            }

            const stagingMemory = new StagingMemory({
                userId: proposal.userId,
                content: proposal.content,
                memoryType: proposal.memoryType,
                sourceEventId: new Types.ObjectId(proposal.sourceEventId as string),
                sourceQuote: proposal.sourceQuote,
                status: 'pending',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 天后过期
            });

            await stagingMemory.save();
            console.log('[StagingMemoryService] 创建暂存记忆:', stagingMemory._id);
            return stagingMemory;
        } catch (error) {
            console.error('[StagingMemoryService] 提议记忆失败:', error);
            throw error;
        }
    }

    /**
     * 批量提议记忆
     */
    async proposeMemories(proposals: StagingMemoryProposal[]): Promise<IStagingMemory[]> {
        const results: IStagingMemory[] = [];
        for (const proposal of proposals) {
            try {
                const memory = await this.proposeMemory(proposal);
                results.push(memory);
            } catch (error) {
                console.error('[StagingMemoryService] 批量提议记忆失败:', error);
            }
        }
        return results;
    }

    /**
     * 获取用户的待确认记忆
     */
    async getUserStagingMemories(
        userId: string,
        options?: { status?: StagingMemoryStatus; type?: MemoryType }
    ): Promise<IStagingMemory[]> {
        const query: any = { userId };
        
        if (options?.status) {
            query.status = options.status;
        } else {
            query.status = 'pending'; // 默认只获取待确认的
        }
        
        if (options?.type) {
            query.memoryType = options.type;
        }

        return await StagingMemory.find(query)
            .sort({ createdAt: -1 })
            .lean();
    }

    /**
     * 获取所有待确认的记忆（不分用户）
     */
    async getAllPendingMemories(
        options?: { page?: number; limit?: number }
    ): Promise<{ memories: IStagingMemory[]; total: number }> {
        const page = options?.page || 1;
        const limit = options?.limit || 50;
        const skip = (page - 1) * limit;

        const query = { status: 'pending' };

        const [memories, total] = await Promise.all([
            StagingMemory.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            StagingMemory.countDocuments(query),
        ]);

        return { memories, total };
    }

    /**
     * 提升为关键记忆
     */
    async promoteToKeyMemory(id: string): Promise<{ stagingMemory: IStagingMemory; keyMemory: any } | null> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('无效的 ID');
        }

        const stagingMemory = await StagingMemory.findById(id);
        if (!stagingMemory) {
            throw new Error('暂存记忆不存在');
        }

        if (stagingMemory.status !== 'pending') {
            throw new Error('只能提升待确认的记忆');
        }

        // 创建关键记忆
        const keyMemory = new KeyMemory({
            userId: stagingMemory.userId,
            content: stagingMemory.content,
            memoryType: stagingMemory.memoryType,
            source: 'ai_proposal',
            sourceEventId: stagingMemory.sourceEventId,
            isActive: true,
            useCount: 0,
        });

        await keyMemory.save();

        // 更新暂存记忆状态
        stagingMemory.status = 'confirmed';
        await stagingMemory.save();

        console.log('[StagingMemoryService] 提升记忆成功:', {
            stagingId: stagingMemory._id,
            keyId: keyMemory._id,
        });

        return { stagingMemory, keyMemory };
    }

    /**
     * 批量提升为关键记忆
     */
    async promoteMultiple(ids: string[]): Promise<{
        success: string[];
        failed: Array<{ id: string; error: string }>;
    }> {
        const success: string[] = [];
        const failed: Array<{ id: string; error: string }> = [];

        for (const id of ids) {
            try {
                await this.promoteToKeyMemory(id);
                success.push(id);
            } catch (error: any) {
                failed.push({ id, error: error.message });
            }
        }

        return { success, failed };
    }

    /**
     * 拒绝记忆
     */
    async rejectMemory(id: string): Promise<IStagingMemory | null> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('无效的 ID');
        }

        const stagingMemory = await StagingMemory.findByIdAndUpdate(
            id,
            { status: 'rejected' },
            { new: true }
        );

        if (stagingMemory) {
            console.log('[StagingMemoryService] 拒绝记忆:', id);
        }

        return stagingMemory;
    }

    /**
     * 批量拒绝记忆
     */
    async rejectMultiple(ids: string[]): Promise<number> {
        const result = await StagingMemory.updateMany(
            { _id: { $in: ids.map(id => new Types.ObjectId(id)) } },
            { status: 'rejected' }
        );
        return result.modifiedCount;
    }

    /**
     * 删除记忆
     */
    async deleteMemory(id: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('无效的 ID');
        }

        const result = await StagingMemory.findByIdAndDelete(id);
        return !!result;
    }

    /**
     * 根据 ID 获取单条记忆
     */
    async getById(id: string): Promise<IStagingMemory | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }
        return await StagingMemory.findById(id).lean();
    }

    /**
     * 获取统计信息
     */
    async getStats(userId?: string): Promise<StagingMemoryStats> {
        const matchStage = userId ? { userId } : {};

        const [statusStats, typeStats] = await Promise.all([
            StagingMemory.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),
            StagingMemory.aggregate([
                { $match: { ...matchStage, status: 'pending' } },
                {
                    $group: {
                        _id: '$memoryType',
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const statusMap: Record<string, number> = {};
        for (const stat of statusStats) {
            statusMap[stat._id] = stat.count;
        }

        return {
            total: Object.values(statusMap).reduce((a, b) => a + b, 0),
            pending: statusMap['pending'] || 0,
            confirmed: statusMap['confirmed'] || 0,
            rejected: statusMap['rejected'] || 0,
            byType: typeStats.map(t => ({ type: t._id as MemoryType, count: t.count })),
        };
    }

    /**
     * 延长记忆过期时间
     */
    async extendExpiry(id: string, days: number = 7): Promise<IStagingMemory | null> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('无效的 ID');
        }

        const stagingMemory = await StagingMemory.findByIdAndUpdate(
            id,
            {
                expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
            },
            { new: true }
        );

        return stagingMemory;
    }

    /**
     * 清理过期的暂存记忆
     * （通常由 TTL 索引自动处理，这里提供手动清理接口）
     */
    async cleanupExpired(): Promise<number> {
        const result = await StagingMemory.deleteMany({
            expiresAt: { $lt: new Date() },
        });
        return result.deletedCount;
    }
}

// 导出单例
export const stagingMemoryService = new StagingMemoryService();
export default stagingMemoryService;

