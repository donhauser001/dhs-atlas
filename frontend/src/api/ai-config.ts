/**
 * AI 配置 API
 * 
 * 管理 AI 工具集、数据模型、样例模板
 */

import api from '@/lib/axios';

// ==================== 类型定义 ====================

// 执行步骤类型
export type ExecutionStepType =
    | 'db_query'
    | 'db_aggregate'
    | 'db_insert'
    | 'db_update'
    | 'db_delete'
    | 'template_replace'
    | 'transform'
    | 'condition'
    | 'return';

// 执行步骤配置
export interface ExecutionStep {
    name: string;
    type: ExecutionStepType;
    collection?: string;
    query?: Record<string, unknown>;
    projection?: Record<string, unknown>;
    sort?: Record<string, unknown>;
    limit?: number | string;
    pipeline?: Record<string, unknown>[];
    document?: Record<string, unknown>;
    update?: Record<string, unknown>;
    single?: boolean;
    template?: string;
    data?: string | Record<string, unknown>;
    input?: string;
    expression?: string;
    condition?: string;
    thenStep?: string;
    elseStep?: string;
    result?: string | Record<string, unknown>;
    message?: string;
}

// 工具执行配置
export interface ToolExecution {
    type: 'simple' | 'pipeline';
    collection?: string;
    operation?: 'find' | 'findOne' | 'aggregate' | 'insert' | 'update' | 'delete' | 'count';
    query?: Record<string, unknown>;
    projection?: Record<string, unknown>;
    sort?: Record<string, unknown>;
    limit?: number | string;
    pipeline?: Record<string, unknown>[];
    document?: Record<string, unknown>;
    update?: Record<string, unknown>;
    steps?: ExecutionStep[];
    requiresConfirmation?: boolean;
    resultTemplate?: string;
    onError?: {
        message: string;
        fallback?: unknown;
    };
}

export interface AiTool {
    _id: string;
    toolId: string;
    name: string;
    description: string;
    usage: string;
    examples: string;
    enabled: boolean;
    category: string;
    order: number;
    execution?: ToolExecution;
    paramsSchema?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

// AiDataModel 已移除，数据结构现在由 DataMapService 自动从 Schema 提取

export interface AiTemplate {
    _id: string;
    templateId: string;
    name: string;
    scenario: string;
    template: string;
    tags: string[];
    enabled: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface AiMapStep {
    order: number;
    action: string;
    toolId?: string;
    dataModel?: string;
    templateId?: string;
    condition?: string;
    note?: string;
}

export interface AiMap {
    _id: string;
    mapId: string;
    name: string;
    description: string;
    triggers: string[];
    steps: AiMapStep[];
    examples: string;
    enabled: boolean;
    priority: number;
    module: string;
    createdAt: string;
    updatedAt: string;
}

// ==================== 工具集 API ====================

export async function getAiTools(): Promise<AiTool[]> {
    const response = await api.get<{ success: boolean; data: AiTool[] }>('/ai-config/tools');
    return response.data.data;
}

export async function createAiTool(data: Partial<AiTool>): Promise<AiTool> {
    const response = await api.post<{ success: boolean; data: AiTool }>('/ai-config/tools', data);
    return response.data.data;
}

export async function updateAiTool(id: string, data: Partial<AiTool>): Promise<AiTool> {
    const response = await api.put<{ success: boolean; data: AiTool }>(`/ai-config/tools/${id}`, data);
    return response.data.data;
}

export async function deleteAiTool(id: string): Promise<void> {
    await api.delete(`/ai-config/tools/${id}`);
}

// ==================== 样例模板 API ====================

export async function getAiTemplates(): Promise<AiTemplate[]> {
    const response = await api.get<{ success: boolean; data: AiTemplate[] }>('/ai-config/templates');
    return response.data.data;
}

export async function createAiTemplate(data: Partial<AiTemplate>): Promise<AiTemplate> {
    const response = await api.post<{ success: boolean; data: AiTemplate }>('/ai-config/templates', data);
    return response.data.data;
}

export async function updateAiTemplate(id: string, data: Partial<AiTemplate>): Promise<AiTemplate> {
    const response = await api.put<{ success: boolean; data: AiTemplate }>(`/ai-config/templates/${id}`, data);
    return response.data.data;
}

export async function deleteAiTemplate(id: string): Promise<void> {
    await api.delete(`/ai-config/templates/${id}`);
}

// ==================== AI 地图 API ====================

export async function getAiMaps(): Promise<AiMap[]> {
    const response = await api.get<{ success: boolean; data: AiMap[] }>('/ai-config/maps');
    return response.data.data;
}

export async function createAiMap(data: Partial<AiMap>): Promise<AiMap> {
    const response = await api.post<{ success: boolean; data: AiMap }>('/ai-config/maps', data);
    return response.data.data;
}

export async function updateAiMap(id: string, data: Partial<AiMap>): Promise<AiMap> {
    const response = await api.put<{ success: boolean; data: AiMap }>(`/ai-config/maps/${id}`, data);
    return response.data.data;
}

export async function deleteAiMap(id: string): Promise<void> {
    await api.delete(`/ai-config/maps/${id}`);
}

