import mongoose, { Document, Schema } from 'mongoose'

// 规格接口
export interface ISpecification extends Document {
  name: string
  length: number
  width: number
  height?: number
  unit: string
  resolution?: string
  description?: string
  isDefault: boolean
  category?: string
  createdBy: string
  updatedBy: string
  createTime: Date
  updateTime: Date
}

// 规格Schema
const SpecificationSchema = new Schema<ISpecification>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  length: {
    type: Number,
    required: true,
    min: 0
  },
  width: {
    type: Number,
    required: true,
    min: 0
  },
  height: {
    type: Number,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['mm', 'cm', 'm', 'px', 'inch']
  },
  resolution: {
    type: String,
    enum: ['72dpi', '150dpi', '300dpi', '600dpi']
  },
  description: {
    type: String,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String,
    required: true
  },
  createTime: {
    type: Date,
    default: Date.now
  },
  updateTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'specifications'
})

// 索引
SpecificationSchema.index({ name: 1 })
SpecificationSchema.index({ category: 1 })
SpecificationSchema.index({ isDefault: 1 })
SpecificationSchema.index({ createTime: -1 })

// 虚拟字段：格式化显示
SpecificationSchema.virtual('displayName').get(function() {
  const parts = [this.name]
  if (this.length && this.width) {
    parts.push(`${this.length}×${this.width}`)
  }
  if (this.height) {
    parts[parts.length - 1] += `×${this.height}`
  }
  if (this.unit) {
    parts.push(this.unit)
  }
  if (this.resolution) {
    parts.push(this.resolution)
  }
  return parts.join(' ')
})

export const Specification = mongoose.model<ISpecification>('Specification', SpecificationSchema)
export default Specification 