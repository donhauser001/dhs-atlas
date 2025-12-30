/**
 * AI 工具集模型
 * 
 * 存储 AI 可用的工具定义和执行配置
 * 
 * 设计理念：
 * - 工具的元数据（名称、描述、使用方法）用于生成 AI 的 system prompt
 * - 工具的执行配置（execution）用于实际执行工具调用
 * - 通过声明式配置实现工具逻辑，无需编写代码
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * 执行步骤类型
 */
export type ExecutionStepType = 
    | 'db_query'        // 数据库查询
    | 'db_aggregate'    // 数据库聚合
    | 'db_insert'       // 数据库插入
    | 'db_update'       // 数据库更新
    | 'db_delete'       // 数据库删除
    | 'template_replace' // 模板占位符替换
    | 'transform'       // 数据转换
    | 'condition'       // 条件判断
    | 'return';         // 返回结果

/**
 * 执行步骤配置
 */
export interface IExecutionStep {
    name: string;                   // 步骤名称，用于引用结果
    type: ExecutionStepType;        // 步骤类型
    
    // 数据库操作配置
    collection?: string;            // 集合名称（支持模板变量）
    query?: Record<string, any>;    // 查询条件
    projection?: Record<string, any>; // 投影
    sort?: Record<string, any>;     // 排序
    limit?: number | string;        // 限制数量（支持模板变量）
    pipeline?: Record<string, any>[]; // 聚合管道
    document?: Record<string, any>; // 插入/更新的文档
    update?: Record<string, any>;   // 更新操作
    single?: boolean;               // 是否只返回单个结果
    
    // 模板处理配置
    template?: string;              // 模板内容（支持引用上一步结果）
    data?: string | Record<string, any>; // 填充数据
    
    // 数据转换配置
    input?: string;                 // 输入数据（引用表达式）
    expression?: string;            // 转换表达式
    
    // 条件配置
    condition?: string;             // 条件表达式
    thenStep?: string;              // 条件为真时跳转的步骤
    elseStep?: string;              // 条件为假时跳转的步骤
    
    // 返回配置
    result?: string | Record<string, any>; // 返回结果（引用表达式或对象模板）
    message?: string;               // 返回消息
}

/**
 * 工具执行配置
 */
export interface IToolExecution {
    // 执行类型：simple（单步）、pipeline（多步）或 custom（自定义处理器）
    type: 'simple' | 'pipeline' | 'custom';
    
    // 自定义处理器名称（当 type 为 custom 时使用）
    handler?: string;
    
    // 简单模式配置（单步数据库操作）
    collection?: string;
    operation?: 'find' | 'findOne' | 'aggregate' | 'insert' | 'update' | 'delete' | 'count';
    query?: Record<string, any>;
    projection?: Record<string, any>;
    sort?: Record<string, any>;
    limit?: number | string;
    pipeline?: Record<string, any>[];
    document?: Record<string, any>;
    update?: Record<string, any>;
    
    // 管道模式配置（多步骤流程）
    steps?: IExecutionStep[];
    
    // 是否需要用户确认
    requiresConfirmation?: boolean;
    
    // 结果格式化模板
    resultTemplate?: string;
    
    // 错误处理配置
    onError?: {
        message: string;
        fallback?: any;
    };
}

export interface IAiTool extends Document {
    toolId: string;           // 工具ID，如 db.query
    name: string;             // 工具名称
    description: string;      // 工具描述
    usage: string;            // 使用方法（Markdown）
    examples: string;         // 调用示例（Markdown）
    enabled: boolean;         // 是否启用
    category: string;         // 分类：database, form, api, contract 等
    order: number;            // 排序
    
    // 执行配置
    execution?: IToolExecution;
    
    // 参数校验规则（JSON Schema 格式）
    paramsSchema?: Record<string, any>;
    
    // 权限配置
    requiredPermission?: string;  // 执行此工具所需的权限，如 ai:db.query
    
    createdAt: Date;
    updatedAt: Date;
}

// 执行步骤 Schema
const ExecutionStepSchema = new Schema({
    name: { type: String, required: true },
    type: { 
        type: String, 
        required: true,
        enum: ['db_query', 'db_aggregate', 'db_insert', 'db_update', 'db_delete', 'template_replace', 'transform', 'condition', 'return']
    },
    collection: String,
    query: Schema.Types.Mixed,
    projection: Schema.Types.Mixed,
    sort: Schema.Types.Mixed,
    limit: Schema.Types.Mixed,
    pipeline: [Schema.Types.Mixed],
    document: Schema.Types.Mixed,
    update: Schema.Types.Mixed,
    single: Boolean,
    template: String,
    data: Schema.Types.Mixed,
    input: String,
    expression: String,
    condition: String,
    thenStep: String,
    elseStep: String,
    result: Schema.Types.Mixed,  // 支持字符串或对象
    message: String,
}, { _id: false });

// 执行配置 Schema
const ToolExecutionSchema = new Schema({
    type: { 
        type: String, 
        enum: ['simple', 'pipeline', 'custom'],
        default: 'simple'
    },
    // 自定义处理器名称（当 type 为 custom 时使用）
    handler: String,
    collection: String,
    operation: { 
        type: String, 
        enum: ['find', 'findOne', 'aggregate', 'insert', 'update', 'delete', 'count']
    },
    query: Schema.Types.Mixed,
    projection: Schema.Types.Mixed,
    sort: Schema.Types.Mixed,
    limit: Schema.Types.Mixed,
    pipeline: [Schema.Types.Mixed],
    document: Schema.Types.Mixed,
    update: Schema.Types.Mixed,
    steps: [ExecutionStepSchema],
    requiresConfirmation: { type: Boolean, default: false },
    resultTemplate: String,
    onError: {
        message: String,
        fallback: Schema.Types.Mixed,
    },
}, { _id: false });

const AiToolSchema = new Schema<IAiTool>({
    toolId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    usage: {
        type: String,
        default: '',
    },
    examples: {
        type: String,
        default: '',
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    category: {
        type: String,
        default: 'general',
    },
    order: {
        type: Number,
        default: 0,
    },
    execution: ToolExecutionSchema,
    paramsSchema: Schema.Types.Mixed,
    requiredPermission: {
        type: String,
        default: null,
        index: true,
    },
}, {
    timestamps: true,
});

export default mongoose.model<IAiTool>('AiTool', AiToolSchema);

