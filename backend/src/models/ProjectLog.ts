import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectLog extends Document {
    projectId: string;
    type: 'status_change' | 'team_change' | 'task_update' | 'settlement' | 'file_upload' | 'remark' | 'system';
    title: string;
    content: string;
    createdBy: string;
    createdAt: Date;

    // 详细信息
    details?: {
        oldValue?: any;
        newValue?: any;
        relatedIds?: string[];
    };
}

const ProjectLogSchema = new Schema<IProjectLog>({
    projectId: { type: String, required: true },
    type: {
        type: String,
        enum: ['status_change', 'team_change', 'task_update', 'settlement', 'file_upload', 'remark', 'system'],
        required: true
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },

    // 详细信息
    details: {
        oldValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed,
        relatedIds: [String]
    }
}, {
    timestamps: true,
    collection: 'project_logs'
});

// 索引
ProjectLogSchema.index({ projectId: 1 });
ProjectLogSchema.index({ type: 1 });
ProjectLogSchema.index({ createdAt: -1 });

export default mongoose.model<IProjectLog>('ProjectLog', ProjectLogSchema); 