/**
 * AI 解释权产品化
 * 
 * 核心理念：把"AI 解释权"当成一个显性产品能力
 * 
 * 传统做法（报错）：
 *   "抱歉，我无法完成此操作。"
 *   → 冷、硬、像机器
 * 
 * 正确做法（专业同事式解释）：
 *   "这个任务我目前没有处理流程。
 *    我可以帮你做 XXX、YYY、ZZZ。
 *    如果确实需要这个功能，可以联系管理员配置。"
 *   → 专业、诚实、有边界感
 */

import {
    ReasonCode,
    getReasonExplanation,
    getReasonCodeType,
    ReasonExplanation,
} from './reason-codes';
import type { StructuredError, CreateStructuredErrorParams } from '../tools/types';

// ============================================================================
// 解释模板系统
// ============================================================================

/**
 * 解释上下文（用于模板变量替换）
 */
export interface ExplanationContext {
    /** 相关模块名称 */
    module?: string;
    /** 具体操作 */
    operation?: string;
    /** 目标实体名称 */
    entityName?: string;
    /** 用户名 */
    userName?: string;
    /** 搜索关键词 */
    keyword?: string;
    /** 可用能力列表 */
    availableCapabilities?: string[];
    /** 其他自定义变量 */
    [key: string]: any;
}

/**
 * 解释结果
 */
export interface ExplanationResult {
    /** 完整的解释文本 */
    text: string;
    /** 用户友好消息 */
    userMessage: string;
    /** 建议操作 */
    suggestion?: string;
    /** 是否可重试 */
    canRetry: boolean;
    /** 严重程度 */
    severity: 'info' | 'warning' | 'error';
    /** 推荐的替代操作 */
    alternatives?: string[];
}

// ============================================================================
// 模板定义
// ============================================================================

/**
 * 场景化解释模板
 */
const EXPLANATION_TEMPLATES: Record<string, {
    prefix: string;
    suffix?: string;
    alternatives?: string[];
}> = {
    // Empty 类场景
    'EMPTY_CLIENT': {
        prefix: '我没有找到符合条件的客户信息。',
        suffix: '你可以尝试：',
        alternatives: [
            '使用不同的关键词搜索',
            '检查客户名称是否正确',
            '查看所有客户列表',
        ],
    },
    'EMPTY_PROJECT': {
        prefix: '我没有找到符合条件的项目。',
        suffix: '你可以尝试：',
        alternatives: [
            '使用不同的筛选条件',
            '查看所有项目列表',
            '创建新项目',
        ],
    },
    'EMPTY_CONTRACT': {
        prefix: '我没有找到相关的合同。',
        suffix: '你可以尝试：',
        alternatives: [
            '查看合同列表',
            '创建新合同',
        ],
    },
    'EMPTY_DATA': {
        prefix: '没有找到相关数据。',
        suffix: '你可以尝试使用不同的查询条件。',
    },

    // Blocked 类场景
    'BLOCKED_PERMISSION': {
        prefix: '你目前没有权限执行这个操作。',
        suffix: '如果需要此权限，请联系系统管理员。',
    },
    'BLOCKED_TOOL': {
        prefix: '这个功能暂时不可用。',
        suffix: '可能正在维护中，请稍后再试。',
    },
    'BLOCKED_COLLECTION': {
        prefix: '无法访问这类数据。',
        suffix: '这可能涉及敏感信息，请联系管理员了解详情。',
    },
    'BLOCKED_VALIDATION': {
        prefix: '提供的信息格式不正确。',
        suffix: '请检查输入的数据是否完整和正确。',
    },

    // Error 类场景
    'ERROR_DATABASE': {
        prefix: '数据库操作遇到问题。',
        suffix: '请稍后重试，如果问题持续请联系技术支持。',
    },
    'ERROR_LLM': {
        prefix: 'AI 服务暂时不可用。',
        suffix: '请稍后重试。',
    },
    'ERROR_NETWORK': {
        prefix: '网络连接出现问题。',
        suffix: '请检查网络连接后重试。',
    },
    'ERROR_SYSTEM': {
        prefix: '系统遇到了意外问题。',
        suffix: '请稍后重试，如果问题持续请联系技术支持。',
    },
};

/**
 * 模块中文名映射
 */
const MODULE_LABELS: Record<string, string> = {
    client: '客户',
    crm: '客户关系',
    project: '项目',
    contract: '合同',
    quotation: '报价单',
    invoice: '发票',
    settlement: '结算',
    user: '用户',
    role: '角色',
    permission: '权限',
};

// ============================================================================
// 核心函数
// ============================================================================

/**
 * 获取解释（主入口）
 * 
 * @param reasonCode 原因码
 * @param context 解释上下文
 * @returns 解释结果
 */
export function getExplanation(
    reasonCode: ReasonCode,
    context: ExplanationContext = {}
): ExplanationResult {
    // 获取基础解释
    const baseExplanation = getReasonExplanation(reasonCode);
    
    // 获取场景模板
    const templateKey = getTemplateKey(reasonCode);
    const template = EXPLANATION_TEMPLATES[templateKey];
    
    // 构建解释文本
    let text = baseExplanation.userMessage;
    let alternatives: string[] | undefined;
    
    if (template) {
        // 替换模板变量
        text = replaceVariables(template.prefix, context);
        if (template.suffix) {
            text += ' ' + replaceVariables(template.suffix, context);
        }
        alternatives = template.alternatives;
    }
    
    // 添加建议
    const suggestion = baseExplanation.suggestion
        ? replaceVariables(baseExplanation.suggestion, context)
        : undefined;
    
    return {
        text,
        userMessage: baseExplanation.userMessage,
        suggestion,
        canRetry: baseExplanation.canRetry,
        severity: baseExplanation.severity,
        alternatives,
    };
}

/**
 * 获取模板键
 */
function getTemplateKey(reasonCode: ReasonCode): string {
    // 尝试精确匹配
    const type = getReasonCodeType(reasonCode);
    
    // 根据 reasonCode 推断模板键
    if (reasonCode.includes('CLIENT')) return 'EMPTY_CLIENT';
    if (reasonCode.includes('PROJECT')) return 'EMPTY_PROJECT';
    if (reasonCode.includes('CONTRACT')) return 'EMPTY_CONTRACT';
    if (reasonCode.includes('PERMISSION')) return 'BLOCKED_PERMISSION';
    if (reasonCode.includes('TOOL')) return 'BLOCKED_TOOL';
    if (reasonCode.includes('COLLECTION')) return 'BLOCKED_COLLECTION';
    if (reasonCode.includes('VALIDATION') || reasonCode.includes('PARAM')) return 'BLOCKED_VALIDATION';
    if (reasonCode.includes('DATABASE')) return 'ERROR_DATABASE';
    if (reasonCode.includes('LLM')) return 'ERROR_LLM';
    if (reasonCode.includes('NETWORK')) return 'ERROR_NETWORK';
    
    // 默认根据类型返回
    switch (type) {
        case 'empty': return 'EMPTY_DATA';
        case 'blocked': return 'BLOCKED_PERMISSION';
        case 'error': return 'ERROR_SYSTEM';
        default: return 'ERROR_SYSTEM';
    }
}

/**
 * 替换模板变量
 */
function replaceVariables(template: string, context: ExplanationContext): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
        if (key === 'module' && context.module) {
            return MODULE_LABELS[context.module] || context.module;
        }
        return context[key] || `{${key}}`;
    });
}

// ============================================================================
// StructuredError 工厂函数
// ============================================================================

/**
 * 创建 StructuredError
 * 
 * @param params 创建参数
 * @param context 解释上下文（用于生成 userMessage 和 suggestion）
 * @returns StructuredError
 */
export function createStructuredError(
    params: CreateStructuredErrorParams,
    context?: ExplanationContext
): StructuredError {
    const explanation = getExplanation(params.reasonCode, context);
    
    return {
        code: params.code,
        message: params.message,
        reasonCode: params.reasonCode,
        userMessage: params.userMessage || explanation.userMessage,
        suggestion: params.suggestion || explanation.suggestion,
        canRetry: params.canRetry ?? explanation.canRetry,
    };
}

/**
 * 从普通错误创建 StructuredError
 * 
 * @param error 原始错误
 * @param fallbackReasonCode 默认 reasonCode
 * @param context 解释上下文
 * @returns StructuredError
 */
export function fromError(
    error: Error | { code?: string; message: string },
    fallbackReasonCode: ReasonCode = 'ERROR_UNKNOWN',
    context?: ExplanationContext
): StructuredError {
    const code = (error as any).code || 'UNKNOWN_ERROR';
    const message = error.message || '未知错误';
    
    // 尝试从错误信息推断 reasonCode
    let reasonCode = fallbackReasonCode;
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('permission') || lowerMessage.includes('denied') || lowerMessage.includes('权限')) {
        reasonCode = 'BLOCKED_PERMISSION_DENIED';
    } else if (lowerMessage.includes('not found') || lowerMessage.includes('不存在') || lowerMessage.includes('找不到')) {
        reasonCode = 'EMPTY_DATA_NOT_FOUND';
    } else if (lowerMessage.includes('validation') || lowerMessage.includes('验证') || lowerMessage.includes('格式')) {
        reasonCode = 'BLOCKED_VALIDATION_FAILED';
    } else if (lowerMessage.includes('timeout') || lowerMessage.includes('超时')) {
        reasonCode = 'ERROR_LLM_TIMEOUT';
    } else if (lowerMessage.includes('database') || lowerMessage.includes('mongo') || lowerMessage.includes('数据库')) {
        // 数据库检查优先于通用网络检查，因为 "MongoDB connection" 应该被识别为数据库错误
        reasonCode = 'ERROR_DATABASE_QUERY';
    } else if (lowerMessage.includes('connection') || lowerMessage.includes('网络') || lowerMessage.includes('连接')) {
        reasonCode = 'ERROR_NETWORK';
    }
    
    return createStructuredError({
        code,
        message,
        reasonCode,
    }, context);
}

/**
 * 生成完整的解释文本（用于 AI 回复）
 * 
 * @param error StructuredError
 * @param includeAlternatives 是否包含替代建议
 * @returns 解释文本
 */
export function generateExplanationText(
    error: StructuredError,
    includeAlternatives: boolean = true
): string {
    const parts: string[] = [error.userMessage];
    
    if (error.suggestion) {
        parts.push(error.suggestion);
    }
    
    if (includeAlternatives && error.canRetry) {
        parts.push('你可以稍后再试。');
    }
    
    return parts.join(' ');
}

// ============================================================================
// 便捷创建函数
// ============================================================================

/**
 * 创建权限拒绝错误
 */
export function createPermissionDeniedError(
    message: string = '无权限执行此操作',
    context?: ExplanationContext
): StructuredError {
    return createStructuredError({
        code: 'PERMISSION_DENIED',
        message,
        reasonCode: 'BLOCKED_PERMISSION_DENIED',
    }, context);
}

/**
 * 创建工具未找到错误
 */
export function createToolNotFoundError(
    toolId: string,
    context?: ExplanationContext
): StructuredError {
    return createStructuredError({
        code: 'TOOL_NOT_FOUND',
        message: `工具 ${toolId} 不存在或未启用`,
        reasonCode: 'BLOCKED_TOOL_NOT_FOUND',
    }, context);
}

/**
 * 创建数据未找到错误
 */
export function createDataNotFoundError(
    entityType: string,
    context?: ExplanationContext
): StructuredError {
    // 根据实体类型选择更具体的 reasonCode
    let reasonCode: ReasonCode = 'EMPTY_DATA_NOT_FOUND';
    if (entityType === 'client' || entityType === '客户') {
        reasonCode = 'EMPTY_CLIENT_NOT_FOUND';
    } else if (entityType === 'project' || entityType === '项目') {
        reasonCode = 'EMPTY_PROJECT_NOT_FOUND';
    } else if (entityType === 'contract' || entityType === '合同') {
        reasonCode = 'EMPTY_CONTRACT_NOT_FOUND';
    }
    
    return createStructuredError({
        code: 'DATA_NOT_FOUND',
        message: `未找到符合条件的${entityType}`,
        reasonCode,
    }, context);
}

/**
 * 创建验证失败错误
 */
export function createValidationError(
    errors: string[],
    context?: ExplanationContext
): StructuredError {
    return createStructuredError({
        code: 'VALIDATION_FAILED',
        message: `参数验证失败: ${errors.join('; ')}`,
        reasonCode: 'BLOCKED_VALIDATION_FAILED',
        canRetry: true,
    }, context);
}

/**
 * 创建集合访问拒绝错误
 */
export function createCollectionNotAllowedError(
    collection: string,
    context?: ExplanationContext
): StructuredError {
    return createStructuredError({
        code: 'COLLECTION_NOT_ALLOWED',
        message: `访问被拒绝：集合 "${collection}" 未在数据模型中定义`,
        reasonCode: 'BLOCKED_COLLECTION_NOT_ALLOWED',
    }, context);
}

/**
 * 创建危险操作符错误
 */
export function createDangerousOperatorError(
    operators: string[],
    context?: ExplanationContext
): StructuredError {
    return createStructuredError({
        code: 'DANGEROUS_OPERATOR',
        message: `安全检查失败: 禁止使用操作符 ${operators.join(', ')}`,
        reasonCode: 'BLOCKED_DANGEROUS_OPERATOR',
        canRetry: false,
    }, context);
}

/**
 * 创建数据库错误
 */
export function createDatabaseError(
    message: string,
    context?: ExplanationContext
): StructuredError {
    return createStructuredError({
        code: 'DATABASE_ERROR',
        message,
        reasonCode: 'ERROR_DATABASE_QUERY',
        canRetry: true,
    }, context);
}

/**
 * 创建执行错误
 */
export function createExecutionError(
    message: string,
    context?: ExplanationContext
): StructuredError {
    return createStructuredError({
        code: 'EXECUTION_ERROR',
        message,
        reasonCode: 'ERROR_TOOL_EXECUTION',
        canRetry: true,
    }, context);
}

