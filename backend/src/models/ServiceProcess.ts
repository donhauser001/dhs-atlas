import mongoose, { Schema, Document } from 'mongoose'

export interface IProcessStep {
    id: string
    name: string
    description: string
    order: number
    progressRatio: number
    lossBillingRatio: number
    cycle: number
}

export interface IServiceProcess extends Document {
    name: string
    description: string
    steps: IProcessStep[]
    status: 'active' | 'inactive'
    createTime: Date
    updateTime: Date
}

const ProcessStepSchema = new Schema<IProcessStep>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    order: { type: Number, required: true },
    progressRatio: { type: Number, required: true, min: 0, max: 100 },
    lossBillingRatio: { type: Number, required: true, min: 0, max: 100 },
    cycle: { type: Number, required: true, min: 0 }
})

const ServiceProcessSchema = new Schema<IServiceProcess>({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    steps: [ProcessStepSchema],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now }
})

ServiceProcessSchema.pre('save', function(next) {
    this.updateTime = new Date()
    next()
})

export default mongoose.model<IServiceProcess>('ServiceProcess', ServiceProcessSchema) 