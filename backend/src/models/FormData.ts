import mongoose, { Schema, Document } from 'mongoose'

export interface IFormData extends Document {
    formId: string
    formName: string
    submissionData: any
    submittedBy?: string // 提交者用户ID
    submitterName?: string // 提交者姓名（冗余字段，便于查询）
    submittedAt: Date
}

const FormDataSchema = new Schema<IFormData>({
    formId: {
        type: String,
        required: true
    },
    formName: {
        type: String,
        required: true
    },
    submissionData: {
        type: Schema.Types.Mixed,
        required: true
    },
    submittedBy: {
        type: String,
        required: false
    },
    submitterName: {
        type: String,
        required: false
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
})

const FormData = mongoose.model<IFormData>('FormData', FormDataSchema)

export default FormData
