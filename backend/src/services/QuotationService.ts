import Quotation, { IQuotation } from '../models/Quotation'

export class QuotationService {
    // 获取所有报价单
    async getAllQuotations(): Promise<IQuotation[]> {
        return await Quotation.find().sort({ createTime: -1 })
    }

    // 根据ID获取报价单
    async getQuotationById(id: string): Promise<IQuotation | null> {
        return await Quotation.findById(id)
    }

    // 创建报价单
    async createQuotation(data: {
        name: string
        description: string
        isDefault: boolean
        selectedServices: string[]
        validUntil?: Date
    }): Promise<IQuotation> {
        // 如果设置为默认报价，先取消其他默认报价
        if (data.isDefault) {
            await Quotation.updateMany(
                { isDefault: true },
                { isDefault: false }
            )
        }

        const quotation = new Quotation(data)
        return await quotation.save()
    }

    // 更新报价单
    async updateQuotation(id: string, data: {
        name: string
        description: string
        isDefault: boolean
        selectedServices: string[]
        validUntil?: Date
    }): Promise<IQuotation | null> {
        // 如果设置为默认报价，先取消其他默认报价
        if (data.isDefault) {
            await Quotation.updateMany(
                { _id: { $ne: id }, isDefault: true },
                { isDefault: false }
            )
        }

        return await Quotation.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        )
    }

    // 删除报价单
    async deleteQuotation(id: string): Promise<boolean> {
        const result = await Quotation.findByIdAndDelete(id)
        return !!result
    }

    // 切换报价单状态
    async toggleQuotationStatus(id: string): Promise<IQuotation | null> {
        const quotation = await Quotation.findById(id)
        if (!quotation) {
            return null
        }

        quotation.status = quotation.status === 'active' ? 'inactive' : 'active'
        return await quotation.save()
    }

    // 搜索报价单
    async searchQuotations(searchText: string): Promise<IQuotation[]> {
        const regex = new RegExp(searchText, 'i')
        return await Quotation.find({
            name: regex
        }).sort({ createTime: -1 })
    }

    // 获取默认报价单
    async getDefaultQuotation(): Promise<IQuotation | null> {
        return await Quotation.findOne({ isDefault: true })
    }
}

export default new QuotationService() 