import PricingPolicy, { IPricingPolicy, ITierSetting } from '../models/PricingPolicy'

export interface CreatePolicyData {
    name: string
    alias: string
    type: 'tiered_discount' | 'uniform_discount'
    summary: string
    validUntil: string | null
    discountRatio?: number
    tierSettings?: ITierSetting[]
}

export interface UpdatePolicyData {
    name: string
    alias: string
    type: 'tiered_discount' | 'uniform_discount'
    summary: string
    validUntil: string | null
    discountRatio?: number
    tierSettings?: ITierSetting[]
}

export class PricingPolicyService {
    // 获取所有价格政策
    static async getAllPolicies(): Promise<IPricingPolicy[]> {
        try {
            const policies = await PricingPolicy.find().sort({ createTime: -1 })
            
            // 迁移旧数据格式
            return policies.map(policy => {
                if (policy.tierSettings) {
                    policy.tierSettings = policy.tierSettings.map(tier => {
                        const newTier = { ...tier }
                        
                        // 如果使用旧字段名，迁移到新字段名
                        if (newTier.minQuantity !== undefined && newTier.startQuantity === undefined) {
                            newTier.startQuantity = newTier.minQuantity
                        }
                        if (newTier.maxQuantity !== undefined && newTier.endQuantity === undefined) {
                            newTier.endQuantity = newTier.maxQuantity
                        }
                        
                        // 如果使用金额字段，转换为数量字段
                        if (newTier.minAmount !== undefined && newTier.startQuantity === undefined) {
                            newTier.startQuantity = newTier.minAmount
                        }
                        if (newTier.maxAmount !== undefined && newTier.endQuantity === undefined) {
                            newTier.endQuantity = newTier.maxAmount
                        }
                        
                        return newTier
                    })
                }
                return policy
            })
        } catch (error) {
            throw new Error('获取价格政策列表失败')
        }
    }

    // 根据ID获取价格政策
    static async getPolicyById(id: string): Promise<IPricingPolicy | null> {
        try {
            const policy = await PricingPolicy.findById(id)
            if (!policy) return null
            
            // 迁移旧数据格式
            if (policy.tierSettings) {
                policy.tierSettings = policy.tierSettings.map(tier => {
                    const newTier = { ...tier }
                    
                    // 如果使用旧字段名，迁移到新字段名
                    if (newTier.minQuantity !== undefined && newTier.startQuantity === undefined) {
                        newTier.startQuantity = newTier.minQuantity
                    }
                    if (newTier.maxQuantity !== undefined && newTier.endQuantity === undefined) {
                        newTier.endQuantity = newTier.maxQuantity
                    }
                    
                    // 如果使用金额字段，转换为数量字段
                    if (newTier.minAmount !== undefined && newTier.startQuantity === undefined) {
                        newTier.startQuantity = newTier.minAmount
                    }
                    if (newTier.maxAmount !== undefined && newTier.endQuantity === undefined) {
                        newTier.endQuantity = newTier.maxAmount
                    }
                    
                    return newTier
                })
            }
            
            return policy
        } catch (error) {
            throw new Error('获取价格政策详情失败')
        }
    }

    // 创建价格政策
    static async createPolicy(data: CreatePolicyData): Promise<IPricingPolicy> {
        try {
            // 为阶梯设置生成ID
            if (data.tierSettings) {
                data.tierSettings = data.tierSettings.map((tier, index) => ({
                    ...tier,
                    id: `tier_${Date.now()}_${index}`
                }))
            }

            const policy = new PricingPolicy(data)
            return await policy.save()
        } catch (error) {
            throw new Error('创建价格政策失败')
        }
    }

    // 更新价格政策
    static async updatePolicy(id: string, data: UpdatePolicyData): Promise<IPricingPolicy | null> {
        try {
            // 为阶梯设置生成ID
            if (data.tierSettings) {
                data.tierSettings = data.tierSettings.map((tier, index) => ({
                    ...tier,
                    id: tier.id || `tier_${Date.now()}_${index}`
                }))
            }

            return await PricingPolicy.findByIdAndUpdate(
                id,
                data,
                { new: true, runValidators: true }
            )
        } catch (error) {
            throw new Error('更新价格政策失败')
        }
    }

    // 切换价格政策状态
    static async togglePolicyStatus(id: string): Promise<IPricingPolicy | null> {
        try {
            const policy = await PricingPolicy.findById(id)
            if (!policy) {
                throw new Error('价格政策不存在')
            }

            // 迁移旧数据格式
            if (policy.tierSettings) {
                policy.tierSettings = policy.tierSettings.map(tier => {
                    const newTier = { ...tier }

                    // 如果使用旧字段名，迁移到新字段名
                    if (newTier.minQuantity !== undefined && newTier.startQuantity === undefined) {
                        newTier.startQuantity = newTier.minQuantity
                        delete newTier.minQuantity
                    }
                    if (newTier.maxQuantity !== undefined && newTier.endQuantity === undefined) {
                        newTier.endQuantity = newTier.maxQuantity
                        delete newTier.maxQuantity
                    }

                    // 如果使用金额字段，转换为数量字段
                    if (newTier.minAmount !== undefined && newTier.startQuantity === undefined) {
                        newTier.startQuantity = newTier.minAmount
                        delete newTier.minAmount
                    }
                    if (newTier.maxAmount !== undefined && newTier.endQuantity === undefined) {
                        newTier.endQuantity = newTier.maxAmount
                        delete newTier.maxAmount
                    }

                    return newTier
                })
            }

            policy.status = policy.status === 'active' ? 'inactive' : 'active'
            return await policy.save()
        } catch (error) {
            throw new Error('切换价格政策状态失败')
        }
    }

    // 删除价格政策
    static async deletePolicy(id: string): Promise<void> {
        try {
            const result = await PricingPolicy.findByIdAndDelete(id)
            if (!result) {
                throw new Error('价格政策不存在')
            }
        } catch (error) {
            throw new Error('删除价格政策失败')
        }
    }

    // 搜索价格政策
    static async searchPolicies(searchTerm: string): Promise<IPricingPolicy[]> {
        try {
            const regex = new RegExp(searchTerm, 'i')
            return await PricingPolicy.find({
                $or: [
                    { name: regex },
                    { alias: regex },
                    { summary: regex }
                ]
            }).sort({ createTime: -1 })
        } catch (error) {
            throw new Error('搜索价格政策失败')
        }
    }
}