import Form, { IForm } from '../models/Form'
import FormCategory from '../models/FormCategory'
import FormData from '../models/FormData'

export interface CreateFormData {
    name: string
    description?: string
    categoryId: string
    content?: any
    status?: 'draft' | 'published' | 'disabled'
    createdBy?: string
}

export interface UpdateFormData {
    name?: string
    description?: string
    categoryId?: string
    content?: any
    status?: 'draft' | 'published' | 'disabled'
    allowGuestView?: boolean
    allowGuestSubmit?: boolean
    showFormTitle?: boolean
    showFormDescription?: boolean
    submitButtonText?: string
    submitButtonPosition?: 'left' | 'center' | 'right'
    submitButtonIcon?: string
    enableDraft?: boolean
    requireConfirmation?: boolean
    redirectAfterSubmit?: boolean
    redirectUrl?: string
    successMessage?: string
    settings?: {
        security?: {
            autoSave?: boolean
            autoSaveInterval?: number
            enableFormAutoSave?: boolean
            formAutoSaveInterval?: number
            saveTrigger?: 'interval' | 'change' | 'both'
            saveLocation?: 'localStorage' | 'server' | 'both'
            autoSaveNotification?: boolean
        }
        submission?: {
            enableSubmissionLimit?: boolean
            maxSubmissions?: number
            limitType?: 'ip' | 'user'
            resetPeriod?: 'never' | 'daily' | 'weekly' | 'monthly'
            limitMessage?: string
        }
        expiry?: {
            enableExpiry?: boolean
            expiryType?: 'date' | 'duration' | 'submissions'
            expiryDate?: string | null
            expiryDuration?: number
            expirySubmissions?: number
            expiryMessage?: string
        }
        layout?: any
        theme?: any
    }
}

export interface FormQuery {
    search?: string
    categoryId?: string
    status?: string
    createdBy?: string
    page?: number
    limit?: number
}

export interface FormListResponse {
    forms: IForm[]
    total: number
    page: number
    limit: number
    totalPages: number
}

class FormService {
    // 获取表单列表
    async getForms(query: FormQuery): Promise<FormListResponse> {
        const { search, categoryId, status, createdBy, page = 1, limit = 10 } = query

        const filter: any = {}

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        }

        if (categoryId) {
            filter.categoryId = categoryId
        }

        if (status) {
            filter.status = status
        }

        if (createdBy) {
            filter.createdBy = createdBy
        }

        const skip = (page - 1) * limit

        const [forms, total] = await Promise.all([
            Form.find(filter)
                .populate('categoryId', 'name color')
                .populate('createdBy', 'username realName')
                .sort({ updateTime: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Form.countDocuments(filter)
        ])

        // 为每个表单添加真实的提交次数
        const formsWithSubmissions = await Promise.all(
            forms.map(async (form) => {
                const submissionCount = await FormData.countDocuments({ formId: form._id.toString() })
                return {
                    ...form,
                    realSubmissions: submissionCount
                }
            })
        )

        return {
            forms: formsWithSubmissions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    // 根据ID获取表单
    async getFormById(id: string): Promise<IForm | null> {
        return Form.findById(id)
            .populate('categoryId', 'name color')
            .populate('createdBy', 'username realName')
    }

    // 创建表单
    async createForm(data: CreateFormData): Promise<IForm> {
        // 如果createdBy为空，则不设置该字段
        const formData = { ...data }
        if (!formData.createdBy) {
            delete formData.createdBy
        }

        const form = new Form(formData)
        const savedForm = await form.save()

        // 更新分类的表单数量
        await this.updateCategoryFormCount(data.categoryId, 1)

        return savedForm
    }

    // 更新表单
    async updateForm(id: string, data: UpdateFormData): Promise<IForm | null> {
        const form = await Form.findById(id)
        if (!form) return null

        // 如果分类发生变化，需要更新两个分类的表单数量
        if (data.categoryId && data.categoryId !== form.categoryId.toString()) {
            await this.updateCategoryFormCount(form.categoryId.toString(), -1)
            await this.updateCategoryFormCount(data.categoryId, 1)
        }

        // 验证submitButtonPosition字段
        if (data.submitButtonPosition && !['left', 'center', 'right'].includes(data.submitButtonPosition)) {
            throw new Error('Invalid submitButtonPosition value')
        }

        // 验证status字段
        if (data.status && !['draft', 'published', 'disabled'].includes(data.status)) {
            throw new Error('Invalid status value')
        }

        console.log('更新表单数据:', {
            id,
            name: data.name,
            status: data.status,
            allowGuestView: data.allowGuestView,
            allowGuestSubmit: data.allowGuestSubmit,
            submitButtonText: data.submitButtonText,
            submitButtonPosition: data.submitButtonPosition,
            submitButtonIcon: data.submitButtonIcon,
            hasSettings: !!data.settings
        })

        return Form.findByIdAndUpdate(id, data, { new: true, runValidators: true })
            .populate('categoryId', 'name color')
            .populate('createdBy', 'username realName')
    }

    // 删除表单
    async deleteForm(id: string): Promise<boolean> {
        const form = await Form.findById(id)
        if (!form) return false

        await Form.findByIdAndDelete(id)

        // 更新分类的表单数量
        await this.updateCategoryFormCount(form.categoryId.toString(), -1)

        return true
    }

    // 切换表单状态
    async toggleFormStatus(id: string): Promise<IForm | null> {
        const form = await Form.findById(id)
        if (!form) return null

        const newStatus = form.status === 'published' ? 'disabled' : 'published'

        return Form.findByIdAndUpdate(id, { status: newStatus }, { new: true })
            .populate('categoryId', 'name color')
            .populate('createdBy', 'username realName')
    }

    // 更新分类的表单数量
    private async updateCategoryFormCount(categoryId: string, increment: number): Promise<void> {
        await FormCategory.findByIdAndUpdate(categoryId, {
            $inc: { formCount: increment }
        })
    }
}

export default new FormService() 