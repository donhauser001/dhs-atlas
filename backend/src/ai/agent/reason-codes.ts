/**
 * ReasonCode 标准化定义
 * 
 * 命名规范：{STATUS}_{MODULE}_{DETAIL}
 * 
 * STATUS 类型：
 * - EMPTY: 查询无结果（数据不存在）
 * - BLOCKED: 权限/系统阻止（不允许执行）
 * - ERROR: 系统错误（执行失败）
 * 
 * MODULE 类型：
 * - CLIENT, PROJECT, CONTRACT, USER 等业务模块
 * - PERMISSION, COLLECTION, TOOL 等系统模块
 * - DATABASE, LLM, NETWORK 等基础设施
 */

// ============================================================================
// ReasonCode 枚举定义
// ============================================================================

/**
 * Empty 类 - 查询无结果
 */
export type EmptyReasonCode =
    | 'EMPTY_CLIENT_NOT_FOUND'
    | 'EMPTY_PROJECT_NOT_FOUND'
    | 'EMPTY_CONTRACT_NOT_FOUND'
    | 'EMPTY_CONTRACT_NO_TEMPLATE'
    | 'EMPTY_USER_NOT_FOUND'
    | 'EMPTY_DATA_NOT_FOUND'
    | 'EMPTY_QUERY_NO_RESULTS'
    // 新增：更细粒度的 Empty 类型
    | 'EMPTY_INVOICE_NOT_FOUND'
    | 'EMPTY_QUOTATION_NOT_FOUND'
    | 'EMPTY_TEMPLATE_NOT_FOUND'
    | 'EMPTY_MEMORY_NOT_FOUND';

/**
 * Blocked 类 - 权限/系统阻止
 */
export type BlockedReasonCode =
    | 'BLOCKED_PERMISSION_DENIED'
    | 'BLOCKED_TOOL_DISABLED'
    | 'BLOCKED_TOOL_NOT_FOUND'
    | 'BLOCKED_COLLECTION_NOT_ALLOWED'
    | 'BLOCKED_VALIDATION_FAILED'
    | 'BLOCKED_PARAM_INVALID'
    | 'BLOCKED_DANGEROUS_OPERATOR'
    | 'BLOCKED_RATE_LIMIT'
    | 'BLOCKED_USER_NOT_AUTHENTICATED'
    | 'BLOCKED_REQUIRES_CONFIRMATION'
    // 新增：更细粒度的 Blocked 类型
    | 'BLOCKED_CONCURRENT_MODIFICATION'
    | 'BLOCKED_RESOURCE_LOCKED'
    | 'BLOCKED_QUOTA_EXCEEDED'
    | 'BLOCKED_FEATURE_DISABLED';

/**
 * Error 类 - 系统错误
 */
export type ErrorReasonCode =
    | 'ERROR_DATABASE_CONNECTION'
    | 'ERROR_DATABASE_QUERY'
    | 'ERROR_TOOL_EXECUTION'
    | 'ERROR_LLM_UNAVAILABLE'
    | 'ERROR_LLM_TIMEOUT'
    | 'ERROR_NETWORK'
    | 'ERROR_INTERNAL'
    | 'ERROR_UNKNOWN'
    // 新增：更细粒度的 Error 类型
    | 'ERROR_SERIALIZATION'
    | 'ERROR_DESERIALIZATION'
    | 'ERROR_FILE_OPERATION'
    | 'ERROR_EXTERNAL_SERVICE';

/**
 * 所有 ReasonCode 类型
 */
export type ReasonCode = EmptyReasonCode | BlockedReasonCode | ErrorReasonCode;

// ============================================================================
// ReasonCode 解释结构
// ============================================================================

/**
 * 解释结构
 */
export interface ReasonExplanation {
    /** 用户友好的消息 */
    userMessage: string;
    /** 建议的下一步操作 */
    suggestion?: string;
    /** 是否可重试 */
    canRetry: boolean;
    /** 严重程度 */
    severity: 'info' | 'warning' | 'error';
}

// ============================================================================
// ReasonCode 解释映射表
// ============================================================================

/**
 * ReasonCode 到解释的映射表
 */
export const REASON_EXPLANATIONS: Record<ReasonCode, ReasonExplanation> = {
    // Empty 类
    EMPTY_CLIENT_NOT_FOUND: {
        userMessage: '没有找到符合条件的客户',
        suggestion: '你可以尝试使用不同的关键词搜索，或者检查客户名称是否正确',
        canRetry: false,
        severity: 'info',
    },
    EMPTY_PROJECT_NOT_FOUND: {
        userMessage: '没有找到符合条件的项目',
        suggestion: '你可以尝试使用不同的筛选条件，或者查看全部项目列表',
        canRetry: false,
        severity: 'info',
    },
    EMPTY_CONTRACT_NOT_FOUND: {
        userMessage: '没有找到符合条件的合同',
        suggestion: '你可以尝试查看合同列表，或者创建新的合同',
        canRetry: false,
        severity: 'info',
    },
    EMPTY_CONTRACT_NO_TEMPLATE: {
        userMessage: '没有找到合适的合同模板',
        suggestion: '请先在合同模板管理中创建对应类型的模板',
        canRetry: false,
        severity: 'warning',
    },
    EMPTY_USER_NOT_FOUND: {
        userMessage: '没有找到该用户',
        suggestion: '请检查用户名或 ID 是否正确',
        canRetry: false,
        severity: 'info',
    },
    EMPTY_DATA_NOT_FOUND: {
        userMessage: '没有找到相关数据',
        suggestion: '你可以尝试使用不同的查询条件',
        canRetry: false,
        severity: 'info',
    },
    EMPTY_QUERY_NO_RESULTS: {
        userMessage: '查询没有返回任何结果',
        suggestion: '请检查查询条件是否正确，或尝试放宽筛选范围',
        canRetry: false,
        severity: 'info',
    },
    EMPTY_INVOICE_NOT_FOUND: {
        userMessage: '没有找到符合条件的发票',
        suggestion: '你可以尝试查看发票列表，或者创建新的发票',
        canRetry: false,
        severity: 'info',
    },
    EMPTY_QUOTATION_NOT_FOUND: {
        userMessage: '没有找到符合条件的报价单',
        suggestion: '你可以尝试查看报价单列表，或者创建新的报价单',
        canRetry: false,
        severity: 'info',
    },
    EMPTY_TEMPLATE_NOT_FOUND: {
        userMessage: '没有找到合适的模板',
        suggestion: '请先在模板管理中创建对应的模板',
        canRetry: false,
        severity: 'warning',
    },
    EMPTY_MEMORY_NOT_FOUND: {
        userMessage: '没有找到相关的记忆',
        suggestion: '你可以添加新的记忆来帮助我更好地了解你的偏好',
        canRetry: false,
        severity: 'info',
    },

    // Blocked 类
    BLOCKED_PERMISSION_DENIED: {
        userMessage: '你目前没有权限执行这个操作',
        suggestion: '如果需要此权限，请联系系统管理员',
        canRetry: false,
        severity: 'warning',
    },
    BLOCKED_TOOL_DISABLED: {
        userMessage: '这个功能暂时不可用',
        suggestion: '该功能可能正在维护中，请稍后再试或联系管理员',
        canRetry: true,
        severity: 'warning',
    },
    BLOCKED_TOOL_NOT_FOUND: {
        userMessage: '我目前没有处理这个任务的能力',
        suggestion: '你可以尝试用不同的方式描述需求，或者询问我能做什么',
        canRetry: false,
        severity: 'info',
    },
    BLOCKED_COLLECTION_NOT_ALLOWED: {
        userMessage: '无法访问这类数据',
        suggestion: '这可能涉及敏感信息，请联系管理员了解详情',
        canRetry: false,
        severity: 'warning',
    },
    BLOCKED_VALIDATION_FAILED: {
        userMessage: '提供的信息格式不正确',
        suggestion: '请检查输入的数据是否完整和正确',
        canRetry: true,
        severity: 'warning',
    },
    BLOCKED_PARAM_INVALID: {
        userMessage: '参数不正确',
        suggestion: '请检查输入的参数是否符合要求',
        canRetry: true,
        severity: 'warning',
    },
    BLOCKED_DANGEROUS_OPERATOR: {
        userMessage: '检测到不安全的操作',
        suggestion: '请使用标准的查询方式',
        canRetry: false,
        severity: 'error',
    },
    BLOCKED_RATE_LIMIT: {
        userMessage: '操作太频繁，请稍后再试',
        suggestion: '请等待几秒后重试',
        canRetry: true,
        severity: 'warning',
    },
    BLOCKED_USER_NOT_AUTHENTICATED: {
        userMessage: '请先登录',
        suggestion: '请刷新页面或重新登录',
        canRetry: false,
        severity: 'warning',
    },
    BLOCKED_REQUIRES_CONFIRMATION: {
        userMessage: '此操作需要你的确认',
        suggestion: '请确认是否要执行此操作',
        canRetry: true,
        severity: 'info',
    },
    BLOCKED_CONCURRENT_MODIFICATION: {
        userMessage: '该数据正在被其他操作修改',
        suggestion: '请等待其他操作完成后重试',
        canRetry: true,
        severity: 'warning',
    },
    BLOCKED_RESOURCE_LOCKED: {
        userMessage: '该资源当前被锁定',
        suggestion: '请稍后再试，或联系管理员解锁',
        canRetry: true,
        severity: 'warning',
    },
    BLOCKED_QUOTA_EXCEEDED: {
        userMessage: '已达到使用配额上限',
        suggestion: '请联系管理员提升配额',
        canRetry: false,
        severity: 'warning',
    },
    BLOCKED_FEATURE_DISABLED: {
        userMessage: '该功能当前已关闭',
        suggestion: '请联系管理员开启该功能',
        canRetry: false,
        severity: 'info',
    },

    // Error 类
    ERROR_DATABASE_CONNECTION: {
        userMessage: '数据库连接出现问题',
        suggestion: '请稍后重试，如果问题持续请联系技术支持',
        canRetry: true,
        severity: 'error',
    },
    ERROR_DATABASE_QUERY: {
        userMessage: '查询数据时遇到问题',
        suggestion: '请稍后重试',
        canRetry: true,
        severity: 'error',
    },
    ERROR_TOOL_EXECUTION: {
        userMessage: '在执行操作时遇到了问题',
        suggestion: '请稍后重试，如果问题持续请联系技术支持',
        canRetry: true,
        severity: 'error',
    },
    ERROR_LLM_UNAVAILABLE: {
        userMessage: 'AI 服务暂时不可用',
        suggestion: '请稍后重试',
        canRetry: true,
        severity: 'error',
    },
    ERROR_LLM_TIMEOUT: {
        userMessage: 'AI 响应超时',
        suggestion: '请尝试简化你的问题或稍后重试',
        canRetry: true,
        severity: 'error',
    },
    ERROR_NETWORK: {
        userMessage: '网络连接出现问题',
        suggestion: '请检查网络连接后重试',
        canRetry: true,
        severity: 'error',
    },
    ERROR_INTERNAL: {
        userMessage: '系统内部错误',
        suggestion: '请稍后重试，如果问题持续请联系技术支持',
        canRetry: true,
        severity: 'error',
    },
    ERROR_UNKNOWN: {
        userMessage: '遇到了意外的问题',
        suggestion: '请稍后重试',
        canRetry: true,
        severity: 'error',
    },
    ERROR_SERIALIZATION: {
        userMessage: '数据序列化时遇到问题',
        suggestion: '请检查数据格式是否正确',
        canRetry: false,
        severity: 'error',
    },
    ERROR_DESERIALIZATION: {
        userMessage: '数据解析时遇到问题',
        suggestion: '请检查数据格式是否正确',
        canRetry: false,
        severity: 'error',
    },
    ERROR_FILE_OPERATION: {
        userMessage: '文件操作失败',
        suggestion: '请检查文件是否存在或格式是否正确',
        canRetry: true,
        severity: 'error',
    },
    ERROR_EXTERNAL_SERVICE: {
        userMessage: '外部服务调用失败',
        suggestion: '请稍后重试',
        canRetry: true,
        severity: 'error',
    },
};

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 获取 ReasonCode 的解释
 */
export function getReasonExplanation(code: ReasonCode): ReasonExplanation {
    return REASON_EXPLANATIONS[code] || REASON_EXPLANATIONS.ERROR_UNKNOWN;
}

/**
 * 判断 ReasonCode 的类型
 */
export function getReasonCodeType(code: ReasonCode): 'empty' | 'blocked' | 'error' {
    if (code.startsWith('EMPTY_')) return 'empty';
    if (code.startsWith('BLOCKED_')) return 'blocked';
    return 'error';
}

/**
 * 判断是否可以重试
 */
export function isRetryable(code: ReasonCode): boolean {
    return getReasonExplanation(code).canRetry;
}

/**
 * 从技术错误码推断 ReasonCode
 */
export function inferReasonCode(errorCode: string, context?: { 
    module?: string;
    operation?: string;
}): ReasonCode {
    // 根据错误码模式推断
    const lowerCode = errorCode.toLowerCase();
    
    if (lowerCode.includes('permission') || lowerCode.includes('denied') || lowerCode.includes('unauthorized')) {
        return 'BLOCKED_PERMISSION_DENIED';
    }
    if (lowerCode.includes('not_found') || lowerCode.includes('notfound')) {
        // 根据上下文推断具体的 EMPTY 类型
        if (context?.module === 'client' || context?.module === 'crm') {
            return 'EMPTY_CLIENT_NOT_FOUND';
        }
        if (context?.module === 'project') {
            return 'EMPTY_PROJECT_NOT_FOUND';
        }
        if (context?.module === 'contract') {
            return 'EMPTY_CONTRACT_NOT_FOUND';
        }
        return 'EMPTY_DATA_NOT_FOUND';
    }
    if (lowerCode.includes('validation') || lowerCode.includes('invalid')) {
        return 'BLOCKED_VALIDATION_FAILED';
    }
    if (lowerCode.includes('disabled')) {
        return 'BLOCKED_TOOL_DISABLED';
    }
    if (lowerCode.includes('collection') && lowerCode.includes('not_allowed')) {
        return 'BLOCKED_COLLECTION_NOT_ALLOWED';
    }
    if (lowerCode.includes('dangerous')) {
        return 'BLOCKED_DANGEROUS_OPERATOR';
    }
    if (lowerCode.includes('timeout')) {
        return 'ERROR_LLM_TIMEOUT';
    }
    if (lowerCode.includes('database') || lowerCode.includes('mongo')) {
        return 'ERROR_DATABASE_QUERY';
    }
    if (lowerCode.includes('network') || lowerCode.includes('connection')) {
        return 'ERROR_NETWORK';
    }
    
    return 'ERROR_UNKNOWN';
}

/**
 * 验证 ReasonCode 是否有效
 */
export function isValidReasonCode(code: string): code is ReasonCode {
    return code in REASON_EXPLANATIONS;
}

// ============================================================================
// 上下文感知错误消息
// ============================================================================

/**
 * 错误上下文
 */
export interface ErrorContext {
    /** 业务实体名称（如客户名、项目名） */
    entityName?: string;
    /** 业务实体类型 */
    entityType?: string;
    /** 操作类型 */
    operation?: string;
    /** 模块名称 */
    module?: string;
    /** 额外信息 */
    extra?: Record<string, any>;
}

/**
 * 生成上下文感知的错误消息
 */
export function getContextAwareMessage(
    code: ReasonCode,
    context?: ErrorContext
): string {
    const base = getReasonExplanation(code);
    
    if (!context) {
        return base.userMessage;
    }
    
    // 根据 ReasonCode 类型和上下文生成更具体的消息
    const type = getReasonCodeType(code);
    
    if (type === 'empty' && context.entityName) {
        const entityLabel = getEntityLabel(context.entityType);
        return `没有找到${entityLabel}"${context.entityName}"`;
    }
    
    if (type === 'empty' && context.entityType) {
        const entityLabel = getEntityLabel(context.entityType);
        return `没有找到符合条件的${entityLabel}`;
    }
    
    if (code === 'BLOCKED_PERMISSION_DENIED' && context.operation) {
        return `你没有权限${context.operation}`;
    }
    
    if (code === 'BLOCKED_COLLECTION_NOT_ALLOWED' && context.entityType) {
        const entityLabel = getEntityLabel(context.entityType);
        return `无法访问${entityLabel}数据`;
    }
    
    return base.userMessage;
}

/**
 * 获取实体的中文标签
 */
function getEntityLabel(entityType?: string): string {
    const labels: Record<string, string> = {
        client: '客户',
        project: '项目',
        contract: '合同',
        invoice: '发票',
        quotation: '报价单',
        user: '用户',
        template: '模板',
        memory: '记忆',
        settlement: '结算',
    };
    return entityType ? (labels[entityType] || entityType) : '数据';
}

/**
 * 生成完整的上下文感知解释
 */
export function getContextAwareExplanation(
    code: ReasonCode,
    context?: ErrorContext
): ReasonExplanation {
    const base = getReasonExplanation(code);
    const contextMessage = getContextAwareMessage(code, context);
    
    // 根据上下文生成更具体的建议
    let suggestion = base.suggestion;
    if (context?.entityType && getReasonCodeType(code) === 'empty') {
        const entityLabel = getEntityLabel(context.entityType);
        suggestion = `你可以尝试使用不同的关键词搜索，或者查看${entityLabel}列表`;
    }
    
    return {
        ...base,
        userMessage: contextMessage,
        suggestion,
    };
}

