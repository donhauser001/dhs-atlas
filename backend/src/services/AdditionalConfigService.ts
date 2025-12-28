import AdditionalConfig, { IAdditionalConfig } from '../models/AdditionalConfig'

export interface CreateConfigData {
    name: string
    description: string
    initialDraftCount: number
    maxDraftCount: number
    mainCreatorRatio: number
    assistantRatio: number
}

export interface UpdateConfigData {
    name: string
    description: string
    initialDraftCount: number
    maxDraftCount: number
    mainCreatorRatio: number
    assistantRatio: number
}

export class AdditionalConfigService {
    // 获取所有附加配置
    static async getAllConfigs(): Promise<IAdditionalConfig[]> {
        try {
            return await AdditionalConfig.find().sort({ createTime: -1 })
        } catch (error) {
            throw new Error('获取附加配置列表失败')
        }
    }

    // 根据ID获取附加配置
    static async getConfigById(id: string): Promise<IAdditionalConfig | null> {
        try {
            return await AdditionalConfig.findById(id)
        } catch (error) {
            throw new Error('获取附加配置详情失败')
        }
    }

    // 创建附加配置
    static async createConfig(data: CreateConfigData): Promise<IAdditionalConfig> {
        try {
            const config = new AdditionalConfig(data)
            return await config.save()
        } catch (error) {
            throw new Error('创建附加配置失败')
        }
    }

    // 更新附加配置
    static async updateConfig(id: string, data: UpdateConfigData): Promise<IAdditionalConfig | null> {
        try {
            return await AdditionalConfig.findByIdAndUpdate(
                id,
                data,
                { new: true, runValidators: true }
            )
        } catch (error) {
            throw new Error('更新附加配置失败')
        }
    }

    // 切换附加配置状态
    static async toggleConfigStatus(id: string): Promise<IAdditionalConfig | null> {
        try {
            const config = await AdditionalConfig.findById(id)
            if (!config) {
                throw new Error('附加配置不存在')
            }

            config.status = config.status === 'active' ? 'inactive' : 'active'
            return await config.save()
        } catch (error) {
            throw new Error('切换附加配置状态失败')
        }
    }

    // 删除附加配置
    static async deleteConfig(id: string): Promise<void> {
        try {
            const result = await AdditionalConfig.findByIdAndDelete(id)
            if (!result) {
                throw new Error('附加配置不存在')
            }
        } catch (error) {
            throw new Error('删除附加配置失败')
        }
    }

    // 搜索附加配置
    static async searchConfigs(searchTerm: string): Promise<IAdditionalConfig[]> {
        try {
            const regex = new RegExp(searchTerm, 'i')
            return await AdditionalConfig.find({
                $or: [
                    { name: regex },
                    { description: regex }
                ]
            }).sort({ createTime: -1 })
        } catch (error) {
            throw new Error('搜索附加配置失败')
        }
    }

    // 复制附加配置
    static async copyConfig(id: string): Promise<IAdditionalConfig | null> {
        try {
            const originalConfig = await AdditionalConfig.findById(id)
            if (!originalConfig) {
                throw new Error('附加配置不存在')
            }

            // 创建新的配置数据，复制所有字段但生成新的ID和时间戳
            const newConfigData = {
                name: `${originalConfig.name} - 副本`,
                description: originalConfig.description,
                initialDraftCount: originalConfig.initialDraftCount,
                maxDraftCount: originalConfig.maxDraftCount,
                mainCreatorRatio: originalConfig.mainCreatorRatio,
                assistantRatio: originalConfig.assistantRatio,
                status: 'active' as const
            }

            const newConfig = new AdditionalConfig(newConfigData)
            return await newConfig.save()
        } catch (error) {
            throw new Error('复制附加配置失败')
        }
    }
} 