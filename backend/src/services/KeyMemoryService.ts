/**
 * 关键记忆服务
 * 
 * 功能：
 * - 获取用户关键记忆
 * - 添加关键记忆
 * - 更新关键记忆
 * - 删除关键记忆
 * - 记录记忆使用
 */

import KeyMemory, {
    IKeyMemory,
    CreateKeyMemoryInput,
    UpdateKeyMemoryInput,
    KeyMemoryQuery,
    MemorySource,
} from '../models/KeyMemory';
import { MemoryType } from '../models/StagingMemory';
import { Types } from 'mongoose';

/**
 * 记忆分组结果
 */
export interface GroupedKeyMemories {
    preference: IKeyMemory[];
    project: IKeyMemory[];
    role: IKeyMemory[];
    boundary: IKeyMemory[];
}

/**
 * 关键记忆统计
 */
export interface KeyMemoryStats {
    total: number;
    active: number;
    inactive: number;
    byType: Array<{ type: MemoryType; count: number }>;
    bySource: Array<{ source: MemorySource; count: number }>;
    mostUsed: Array<{ id: string; content: string; useCount: number }>;
}

/**
 * 关键记忆服务
 */
class KeyMemoryService {
    /**
     * 获取用户的关键记忆
     */
    async getUserKeyMemories(
        userId: string,
        options?: { activeOnly?: boolean; type?: MemoryType }
    ): Promise<IKeyMemory[]> {
        const query: any = { userId };
        
        if (options?.activeOnly !== false) {
            query.isActive = true;
        }
        
        if (options?.type) {
            query.memoryType = options.type;
        }

        return await KeyMemory.find(query)
            .sort({ useCount: -1, updatedAt: -1 })
            .lean();
    }

    /**
     * 获取用户记忆（按类型分组）
     */
    async getUserMemoriesGrouped(
        userId: string,
        activeOnly: boolean = true
    ): Promise<GroupedKeyMemories> {
        const query: any = { userId };
        if (activeOnly) {
            query.isActive = true;
        }

        const memories = await KeyMemory.find(query)
            .sort({ useCount: -1 })
            .lean();

        const grouped: GroupedKeyMemories = {
            preference: [],
            project: [],
            role: [],
            boundary: [],
        };

        for (const memory of memories) {
            if (grouped[memory.memoryType as keyof GroupedKeyMemories]) {
                grouped[memory.memoryType as keyof GroupedKeyMemories].push(memory);
            }
        }

        return grouped;
    }

    /**
     * 添加关键记忆
     */
    async addKeyMemory(input: CreateKeyMemoryInput): Promise<IKeyMemory> {
        try {
            // 检查是否已存在相同内容的记忆
            const existing = await KeyMemory.findOne({
                userId: input.userId,
                content: input.content,
                isActive: true,
            });

            if (existing) {
                console.log('[KeyMemoryService] 已存在相同内容的记忆，跳过');
                return existing;
            }

            const keyMemory = new KeyMemory({
                userId: input.userId,
                content: input.content,
                memoryType: input.memoryType,
                source: input.source,
                sourceEventId: input.sourceEventId
                    ? new Types.ObjectId(input.sourceEventId as string)
                    : undefined,
                isActive: true,
                useCount: 0,
            });

            await keyMemory.save();
            console.log('[KeyMemoryService] 创建关键记忆:', keyMemory._id);
            return keyMemory;
        } catch (error) {
            console.error('[KeyMemoryService] 添加关键记忆失败:', error);
            throw error;
        }
    }

    /**
     * 更新关键记忆
     */
    async updateKeyMemory(
        id: string,
        updates: UpdateKeyMemoryInput
    ): Promise<IKeyMemory | null> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('无效的 ID');
        }

        const updateData: any = { ...updates };
        if (updates.content !== undefined) {
            updateData.content = updates.content;
        }
        if (updates.memoryType !== undefined) {
            updateData.memoryType = updates.memoryType;
        }
        if (updates.isActive !== undefined) {
            updateData.isActive = updates.isActive;
        }

        const keyMemory = await KeyMemory.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (keyMemory) {
            console.log('[KeyMemoryService] 更新关键记忆:', id);
        }

        return keyMemory;
    }

    /**
     * 删除关键记忆
     */
    async deleteKeyMemory(id: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('无效的 ID');
        }

        const result = await KeyMemory.findByIdAndDelete(id);
        if (result) {
            console.log('[KeyMemoryService] 删除关键记忆:', id);
        }
        return !!result;
    }

    /**
     * 停用关键记忆（软删除）
     */
    async deactivateKeyMemory(id: string): Promise<IKeyMemory | null> {
        return await this.updateKeyMemory(id, { isActive: false });
    }

    /**
     * 激活关键记忆
     */
    async activateKeyMemory(id: string): Promise<IKeyMemory | null> {
        return await this.updateKeyMemory(id, { isActive: true });
    }

    /**
     * 记录记忆使用
     */
    async recordMemoryUsage(id: string): Promise<IKeyMemory | null> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('无效的 ID');
        }

        const keyMemory = await KeyMemory.findByIdAndUpdate(
            id,
            {
                $inc: { useCount: 1 },
                $set: { lastUsedAt: new Date() },
            },
            { new: true }
        );

        return keyMemory;
    }

    /**
     * 批量记录记忆使用
     */
    async recordMultipleUsage(ids: string[]): Promise<number> {
        const result = await KeyMemory.updateMany(
            { _id: { $in: ids.map(id => new Types.ObjectId(id)) } },
            {
                $inc: { useCount: 1 },
                $set: { lastUsedAt: new Date() },
            }
        );
        return result.modifiedCount;
    }

    /**
     * 根据 ID 获取单条记忆
     */
    async getById(id: string): Promise<IKeyMemory | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }
        return await KeyMemory.findById(id).lean();
    }

    /**
     * 通用查询接口
     */
    async query(
        params: KeyMemoryQuery
    ): Promise<{ memories: IKeyMemory[]; total: number; page: number; limit: number }> {
        const query: any = {};

        if (params.userId) query.userId = params.userId;
        if (params.memoryType) query.memoryType = params.memoryType;
        if (params.source) query.source = params.source;
        if (params.isActive !== undefined) query.isActive = params.isActive;

        const page = params.page || 1;
        const limit = params.limit || 50;
        const skip = (page - 1) * limit;

        const [memories, total] = await Promise.all([
            KeyMemory.find(query)
                .sort({ useCount: -1, updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            KeyMemory.countDocuments(query),
        ]);

        return { memories, total, page, limit };
    }

    /**
     * 获取统计信息
     */
    async getStats(userId?: string): Promise<KeyMemoryStats> {
        const matchStage = userId ? { userId } : {};

        const [basicStats, typeStats, sourceStats, mostUsed] = await Promise.all([
            KeyMemory.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$isActive',
                        count: { $sum: 1 },
                    },
                },
            ]),
            KeyMemory.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$memoryType',
                        count: { $sum: 1 },
                    },
                },
            ]),
            KeyMemory.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$source',
                        count: { $sum: 1 },
                    },
                },
            ]),
            KeyMemory.find({ ...matchStage, isActive: true })
                .sort({ useCount: -1 })
                .limit(10)
                .select('_id content useCount')
                .lean(),
        ]);

        let active = 0;
        let inactive = 0;
        for (const stat of basicStats) {
            if (stat._id) {
                active += stat.count;
            } else {
                inactive += stat.count;
            }
        }

        return {
            total: active + inactive,
            active,
            inactive,
            byType: typeStats.map(t => ({ type: t._id as MemoryType, count: t.count })),
            bySource: sourceStats.map(s => ({ source: s._id as MemorySource, count: s.count })),
            mostUsed: mostUsed.map(m => ({
                id: m._id.toString(),
                content: m.content,
                useCount: m.useCount,
            })),
        };
    }

    /**
     * 搜索记忆
     */
    async search(
        userId: string,
        keyword: string,
        options?: { page?: number; limit?: number }
    ): Promise<{ memories: IKeyMemory[]; total: number }> {
        const page = options?.page || 1;
        const limit = options?.limit || 20;
        const skip = (page - 1) * limit;

        const query = {
            userId,
            isActive: true,
            content: { $regex: keyword, $options: 'i' },
        };

        const [memories, total] = await Promise.all([
            KeyMemory.find(query)
                .sort({ useCount: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            KeyMemory.countDocuments(query),
        ]);

        return { memories, total };
    }

    /**
     * 获取最近使用的记忆
     */
    async getRecentlyUsed(
        userId: string,
        limit: number = 10
    ): Promise<IKeyMemory[]> {
        return await KeyMemory.find({
            userId,
            isActive: true,
            lastUsedAt: { $exists: true },
        })
            .sort({ lastUsedAt: -1 })
            .limit(limit)
            .lean();
    }

    /**
     * 获取 AI 上下文所需的记忆（精简版）
     * 用于注入到系统提示词
     */
    async getMemoriesForContext(userId: string): Promise<{
        preferences: string[];
        projects: string[];
        roles: string[];
        boundaries: string[];
    }> {
        const grouped = await this.getUserMemoriesGrouped(userId, true);

        return {
            preferences: grouped.preference.map(m => m.content),
            projects: grouped.project.map(m => m.content),
            roles: grouped.role.map(m => m.content),
            boundaries: grouped.boundary.map(m => m.content),
        };
    }

    // ========================================================================
    // 优化功能：相似度匹配与去重
    // ========================================================================

    /**
     * 计算两个字符串的相似度（基于 Jaccard 相似系数）
     */
    private calculateSimilarity(str1: string, str2: string): number {
        const words1 = new Set(str1.toLowerCase().split(/\s+/));
        const words2 = new Set(str2.toLowerCase().split(/\s+/));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    /**
     * 查找相似记忆
     */
    async findSimilarMemories(
        userId: string,
        content: string,
        threshold: number = 0.6
    ): Promise<Array<{ memory: IKeyMemory; similarity: number }>> {
        const memories = await this.getUserKeyMemories(userId);
        
        const similar = memories
            .map(memory => ({
                memory,
                similarity: this.calculateSimilarity(content, memory.content),
            }))
            .filter(item => item.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity);

        return similar;
    }

    /**
     * 智能添加记忆（自动去重和合并）
     */
    async addMemoryWithDedup(
        input: CreateKeyMemoryInput,
        options?: { similarityThreshold?: number; autoMerge?: boolean }
    ): Promise<{ memory: IKeyMemory; action: 'created' | 'merged' | 'skipped' }> {
        const threshold = options?.similarityThreshold ?? 0.8;
        const autoMerge = options?.autoMerge ?? false;

        // 查找相似记忆
        const similar = await this.findSimilarMemories(
            input.userId,
            input.content,
            threshold
        );

        if (similar.length > 0) {
            const mostSimilar = similar[0];
            
            // 如果完全相同（相似度 >= 0.95），跳过
            if (mostSimilar.similarity >= 0.95) {
                console.log('[KeyMemoryService] 发现重复记忆，跳过');
                return { memory: mostSimilar.memory, action: 'skipped' };
            }

            // 如果高度相似且允许自动合并
            if (autoMerge && mostSimilar.similarity >= 0.8) {
                // 合并记忆：保留更长/更详细的版本
                const mergedContent = input.content.length > mostSimilar.memory.content.length
                    ? input.content
                    : mostSimilar.memory.content;
                
                const memoryId = (mostSimilar.memory._id as Types.ObjectId).toString();
                const updated = await this.updateKeyMemory(
                    memoryId,
                    { content: mergedContent }
                );
                
                if (updated) {
                    console.log('[KeyMemoryService] 合并相似记忆');
                    return { memory: updated, action: 'merged' };
                }
            }
        }

        // 创建新记忆
        const memory = await this.addKeyMemory(input);
        return { memory, action: 'created' };
    }

    /**
     * 计算记忆重要性分数
     * 基于：使用频率、新鲜度、类型权重
     */
    calculateImportanceScore(memory: IKeyMemory): number {
        const now = Date.now();
        
        // 使用频率权重（对数缩放）
        const frequencyScore = Math.log(memory.useCount + 1) * 10;
        
        // 新鲜度权重（指数衰减，30天半衰期）
        const daysSinceUpdate = (now - memory.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        const freshnessScore = Math.exp(-daysSinceUpdate / 30) * 50;
        
        // 类型权重
        const typeWeights: Record<string, number> = {
            preference: 40,
            role: 35,
            project: 30,
            boundary: 25,
        };
        const typeScore = typeWeights[memory.memoryType] || 20;
        
        return frequencyScore + freshnessScore + typeScore;
    }

    /**
     * 获取按重要性排序的记忆
     */
    async getMemoriesByImportance(
        userId: string,
        limit: number = 20
    ): Promise<Array<{ memory: IKeyMemory; score: number }>> {
        const memories = await this.getUserKeyMemories(userId);
        
        const scored = memories.map(memory => ({
            memory,
            score: this.calculateImportanceScore(memory),
        }));
        
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * 整理记忆（合并相似项、清理过期项）
     */
    async consolidateMemories(
        userId: string
    ): Promise<{ merged: number; deactivated: number }> {
        const memories = await this.getUserKeyMemories(userId);
        let merged = 0;
        let deactivated = 0;

        // 按类型分组
        const byType = new Map<string, IKeyMemory[]>();
        for (const memory of memories) {
            if (!byType.has(memory.memoryType)) {
                byType.set(memory.memoryType, []);
            }
            byType.get(memory.memoryType)!.push(memory);
        }

        // 辅助函数：安全获取 _id 字符串
        const getIdString = (memory: IKeyMemory): string => {
            return (memory._id as Types.ObjectId).toString();
        };

        // 在每个类型内查找相似项
        for (const [type, typeMemories] of byType) {
            const processed = new Set<string>();
            
            for (let i = 0; i < typeMemories.length; i++) {
                const currentId = getIdString(typeMemories[i]);
                if (processed.has(currentId)) continue;
                
                const current = typeMemories[i];
                const similar: IKeyMemory[] = [];
                
                for (let j = i + 1; j < typeMemories.length; j++) {
                    const jId = getIdString(typeMemories[j]);
                    if (processed.has(jId)) continue;
                    
                    const similarity = this.calculateSimilarity(
                        current.content,
                        typeMemories[j].content
                    );
                    
                    if (similarity >= 0.7) {
                        similar.push(typeMemories[j]);
                        processed.add(jId);
                    }
                }
                
                // 合并相似记忆
                if (similar.length > 0) {
                    // 保留使用次数最多的，停用其他
                    const allRelated = [current, ...similar];
                    allRelated.sort((a, b) => b.useCount - a.useCount);
                    
                    // 合并使用计数
                    const totalUseCount = allRelated.reduce((sum, m) => sum + m.useCount, 0);
                    await KeyMemory.findByIdAndUpdate(allRelated[0]._id, {
                        useCount: totalUseCount,
                    });
                    
                    // 停用其他相似记忆
                    for (let k = 1; k < allRelated.length; k++) {
                        await this.deactivateKeyMemory(getIdString(allRelated[k]));
                        deactivated++;
                    }
                    
                    merged++;
                }
                
                processed.add(currentId);
            }
        }

        console.log(`[KeyMemoryService] 整理完成: 合并 ${merged} 组, 停用 ${deactivated} 条`);
        return { merged, deactivated };
    }
}

// 导出单例
export const keyMemoryService = new KeyMemoryService();
export default keyMemoryService;

