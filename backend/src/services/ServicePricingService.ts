import ServicePricing, { IServicePricing } from '../models/ServicePricing'
import { PricingCategoryService } from './PricingCategoryService'
import AdditionalConfig from '../models/AdditionalConfig'
import ServiceProcess from '../models/ServiceProcess'
import PricingPolicy from '../models/PricingPolicy'

export interface CreateServicePricingData {
    serviceName: string
    alias: string
    categoryId: string
    unitPrice: number
    unit: string
    priceDescription: string
    link: string
    additionalConfigId?: string
    serviceProcessId?: string
    pricingPolicyIds?: string[]
}

export interface UpdateServicePricingData {
    serviceName: string
    alias: string
    categoryId: string
    unitPrice: number
    unit: string
    priceDescription: string
    link: string
    additionalConfigId?: string
    serviceProcessId?: string
    pricingPolicyIds?: string[]
}

export class ServicePricingService {
    // 获取所有服务定价
    static async getAllServicePricing(): Promise<IServicePricing[]> {
        try {
            return await ServicePricing.find().sort({ createTime: -1 })
        } catch (error) {
            throw new Error('获取服务定价列表失败')
        }
    }

    // 根据ID获取服务定价
    static async getServicePricingById(id: string): Promise<IServicePricing | null> {
        try {
            const service = await ServicePricing.findById(id)

            if (!service) {
                return null
            }

            // 如果已经有价格政策名称，直接返回
            if (service.pricingPolicyNames && service.pricingPolicyNames.length > 0) {
                return service
            }

            // 如果没有价格政策名称，但有价格政策ID，则获取名称
            if (service.pricingPolicyIds && service.pricingPolicyIds.length > 0) {
                const policies = await PricingPolicy.find({ _id: { $in: service.pricingPolicyIds } })
                const pricingPolicyNames = policies.map(policy => policy.name)

                // 更新服务定价的价格政策名称
                await ServicePricing.findByIdAndUpdate(service._id, {
                    pricingPolicyNames: pricingPolicyNames
                })

                return {
                    ...service.toObject(),
                    pricingPolicyNames: pricingPolicyNames
                } as unknown as IServicePricing
            }

            return service
        } catch (error) {
            throw new Error('获取服务定价详情失败')
        }
    }

    // 根据ID列表获取服务定价
    static async getServicePricingByIds(ids: string[]): Promise<IServicePricing[]> {
        try {
            const servicePricingList = await ServicePricing.find({ _id: { $in: ids } })

            // 确保每个服务定价都有完整的价格政策信息
            const enrichedServicePricing = await Promise.all(
                servicePricingList.map(async (service) => {
                    // 如果已经有价格政策名称，直接返回
                    if (service.pricingPolicyNames && service.pricingPolicyNames.length > 0) {
                        return service
                    }

                    // 如果没有价格政策名称，但有价格政策ID，则获取名称
                    if (service.pricingPolicyIds && service.pricingPolicyIds.length > 0) {
                        const policies = await PricingPolicy.find({ _id: { $in: service.pricingPolicyIds } })
                        const pricingPolicyNames = policies.map(policy => policy.name)

                        // 更新服务定价的价格政策名称
                        const updatedService = await ServicePricing.findByIdAndUpdate(
                            service._id,
                            { pricingPolicyNames: pricingPolicyNames },
                            { new: true }
                        )

                        return updatedService || service
                    }

                    return service
                })
            )

            return enrichedServicePricing as unknown as IServicePricing[]
        } catch (error) {
            throw new Error('获取服务定价列表失败')
        }
    }

    // 创建服务定价
    static async createServicePricing(data: CreateServicePricingData): Promise<IServicePricing> {
        try {
            // 获取关联数据的名称
            const category = await PricingCategoryService.getCategoryById(data.categoryId)
            const additionalConfig = data.additionalConfigId ? await AdditionalConfig.findById(data.additionalConfigId) : null
            const serviceProcess = data.serviceProcessId ? await ServiceProcess.findById(data.serviceProcessId) : null

            // 获取价格政策名称
            let pricingPolicyNames: string[] = []
            if (data.pricingPolicyIds && data.pricingPolicyIds.length > 0) {
                const policies = await PricingPolicy.find({ _id: { $in: data.pricingPolicyIds } })
                pricingPolicyNames = policies.map(policy => policy.name)
            }

            const servicePricing = new ServicePricing({
                ...data,
                categoryName: category?.name,
                additionalConfigName: additionalConfig?.name,
                serviceProcessName: serviceProcess?.name,
                pricingPolicyNames: pricingPolicyNames
            })

            return await servicePricing.save()
        } catch (error) {
            throw new Error('创建服务定价失败')
        }
    }

    // 更新服务定价
    static async updateServicePricing(id: string, data: UpdateServicePricingData): Promise<IServicePricing | null> {
        try {
            console.log('更新服务定价 - 输入数据:', { id, data })

            // 获取关联数据的名称
            const category = await PricingCategoryService.getCategoryById(data.categoryId)
            console.log('获取到的分类:', category)

            const additionalConfig = data.additionalConfigId ? await AdditionalConfig.findById(data.additionalConfigId) : null
            const serviceProcess = data.serviceProcessId ? await ServiceProcess.findById(data.serviceProcessId) : null

            // 获取价格政策名称
            let pricingPolicyNames: string[] = []
            if (data.pricingPolicyIds && data.pricingPolicyIds.length > 0) {
                const policies = await PricingPolicy.find({ _id: { $in: data.pricingPolicyIds } })
                pricingPolicyNames = policies.map(policy => policy.name)
            }

            const updateData = {
                ...data,
                categoryName: category?.name,
                additionalConfigName: additionalConfig?.name,
                serviceProcessName: serviceProcess?.name,
                pricingPolicyNames: pricingPolicyNames
            }

            console.log('更新数据:', updateData)

            const result = await ServicePricing.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            )

            console.log('更新结果:', result)
            return result
        } catch (error) {
            console.error('更新服务定价详细错误:', error)
            throw new Error(`更新服务定价失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    // 切换服务定价状态
    static async toggleServicePricingStatus(id: string): Promise<IServicePricing | null> {
        try {
            const servicePricing = await ServicePricing.findById(id)
            if (!servicePricing) {
                throw new Error('服务定价不存在')
            }

            servicePricing.status = servicePricing.status === 'active' ? 'inactive' : 'active'
            return await servicePricing.save()
        } catch (error) {
            throw new Error('切换服务定价状态失败')
        }
    }

    // 删除服务定价
    static async deleteServicePricing(id: string): Promise<void> {
        try {
            const result = await ServicePricing.findByIdAndDelete(id)
            if (!result) {
                throw new Error('服务定价不存在')
            }
        } catch (error) {
            throw new Error('删除服务定价失败')
        }
    }

    // 搜索服务定价
    static async searchServicePricing(searchTerm: string): Promise<IServicePricing[]> {
        try {
            const regex = new RegExp(searchTerm, 'i')
            return await ServicePricing.find({
                $or: [
                    { serviceName: regex },
                    { alias: regex },
                    { priceDescription: regex }
                ]
            }).sort({ createTime: -1 })
        } catch (error) {
            throw new Error('搜索服务定价失败')
        }
    }

    // 复制服务定价
    static async copyServicePricing(id: string): Promise<IServicePricing | null> {
        try {
            const originalPricing = await ServicePricing.findById(id)
            if (!originalPricing) {
                throw new Error('服务定价不存在')
            }

            // 创建新的定价数据，复制所有字段但生成新的ID和时间戳
            const newPricingData = {
                serviceName: `${originalPricing.serviceName} - 副本`,
                alias: originalPricing.alias,
                categoryId: originalPricing.categoryId,
                categoryName: originalPricing.categoryName,
                unitPrice: originalPricing.unitPrice,
                unit: originalPricing.unit,
                priceDescription: originalPricing.priceDescription,
                link: originalPricing.link,
                additionalConfigId: originalPricing.additionalConfigId,
                additionalConfigName: originalPricing.additionalConfigName,
                serviceProcessId: originalPricing.serviceProcessId,
                serviceProcessName: originalPricing.serviceProcessName,
                pricingPolicyIds: originalPricing.pricingPolicyIds,
                pricingPolicyNames: originalPricing.pricingPolicyNames,
                status: 'active' as const
            }

            const newPricing = new ServicePricing(newPricingData)
            return await newPricing.save()
        } catch (error) {
            throw new Error('复制服务定价失败')
        }
    }
}