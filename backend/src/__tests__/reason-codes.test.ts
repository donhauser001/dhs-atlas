/**
 * ReasonCode 单元测试
 * 
 * 测试内容：
 * 1. 所有 ReasonCode 都有对应解释
 * 2. StructuredError 创建
 * 3. 解释模板渲染
 */

import {
    ReasonCode,
    REASON_EXPLANATIONS,
    getReasonExplanation,
    getReasonCodeType,
    isRetryable,
    inferReasonCode,
    isValidReasonCode,
} from '../ai/agent/reason-codes';

describe('ReasonCode 标准化', () => {
    describe('REASON_EXPLANATIONS 覆盖率', () => {
        // 获取所有定义的 ReasonCode
        const allReasonCodes = Object.keys(REASON_EXPLANATIONS) as ReasonCode[];

        it('所有 ReasonCode 都有对应的解释', () => {
            for (const code of allReasonCodes) {
                const explanation = getReasonExplanation(code);
                expect(explanation).toBeDefined();
                expect(explanation.userMessage).toBeTruthy();
                expect(typeof explanation.canRetry).toBe('boolean');
                expect(['info', 'warning', 'error']).toContain(explanation.severity);
            }
        });

        it('Empty 类 ReasonCode 有合理的默认值', () => {
            const emptyCodes = allReasonCodes.filter(c => c.startsWith('EMPTY_'));
            expect(emptyCodes.length).toBeGreaterThan(0);

            for (const code of emptyCodes) {
                const explanation = getReasonExplanation(code);
                expect(explanation.canRetry).toBe(false); // Empty 通常不可重试
                expect(['info', 'warning']).toContain(explanation.severity);
            }
        });

        it('Blocked 类 ReasonCode 有合理的默认值', () => {
            const blockedCodes = allReasonCodes.filter(c => c.startsWith('BLOCKED_'));
            expect(blockedCodes.length).toBeGreaterThan(0);

            for (const code of blockedCodes) {
                const explanation = getReasonExplanation(code);
                // Blocked 类可以有 info（如 BLOCKED_TOOL_NOT_FOUND）、warning 或 error 级别
                expect(['info', 'warning', 'error']).toContain(explanation.severity);
            }
        });

        it('Error 类 ReasonCode 有合理的默认值', () => {
            const errorCodes = allReasonCodes.filter(c => c.startsWith('ERROR_'));
            expect(errorCodes.length).toBeGreaterThan(0);

            // 这些错误不可重试（数据格式问题）
            const nonRetryableErrors = ['ERROR_SERIALIZATION', 'ERROR_DESERIALIZATION'];

            for (const code of errorCodes) {
                const explanation = getReasonExplanation(code);
                expect(explanation.severity).toBe('error');
                
                if (nonRetryableErrors.includes(code)) {
                    expect(explanation.canRetry).toBe(false);
                } else {
                    expect(explanation.canRetry).toBe(true); // Error 通常可重试
                }
            }
        });
    });

    describe('getReasonCodeType', () => {
        it('正确识别 Empty 类型', () => {
            expect(getReasonCodeType('EMPTY_CLIENT_NOT_FOUND')).toBe('empty');
            expect(getReasonCodeType('EMPTY_PROJECT_NOT_FOUND')).toBe('empty');
            expect(getReasonCodeType('EMPTY_DATA_NOT_FOUND')).toBe('empty');
        });

        it('正确识别 Blocked 类型', () => {
            expect(getReasonCodeType('BLOCKED_PERMISSION_DENIED')).toBe('blocked');
            expect(getReasonCodeType('BLOCKED_TOOL_DISABLED')).toBe('blocked');
            expect(getReasonCodeType('BLOCKED_COLLECTION_NOT_ALLOWED')).toBe('blocked');
        });

        it('正确识别 Error 类型', () => {
            expect(getReasonCodeType('ERROR_DATABASE_CONNECTION')).toBe('error');
            expect(getReasonCodeType('ERROR_LLM_UNAVAILABLE')).toBe('error');
            expect(getReasonCodeType('ERROR_UNKNOWN')).toBe('error');
        });
    });

    describe('isRetryable', () => {
        it('Empty 类通常不可重试', () => {
            expect(isRetryable('EMPTY_CLIENT_NOT_FOUND')).toBe(false);
            expect(isRetryable('EMPTY_PROJECT_NOT_FOUND')).toBe(false);
        });

        it('部分 Blocked 类可重试', () => {
            expect(isRetryable('BLOCKED_PERMISSION_DENIED')).toBe(false);
            expect(isRetryable('BLOCKED_TOOL_DISABLED')).toBe(true);
            expect(isRetryable('BLOCKED_VALIDATION_FAILED')).toBe(true);
            expect(isRetryable('BLOCKED_RATE_LIMIT')).toBe(true);
        });

        it('Error 类通常可重试', () => {
            expect(isRetryable('ERROR_DATABASE_CONNECTION')).toBe(true);
            expect(isRetryable('ERROR_LLM_UNAVAILABLE')).toBe(true);
            expect(isRetryable('ERROR_NETWORK')).toBe(true);
        });
    });

    describe('inferReasonCode', () => {
        it('从错误码推断权限相关', () => {
            expect(inferReasonCode('PERMISSION_DENIED')).toBe('BLOCKED_PERMISSION_DENIED');
            expect(inferReasonCode('unauthorized')).toBe('BLOCKED_PERMISSION_DENIED');
        });

        it('从错误码推断数据不存在', () => {
            expect(inferReasonCode('NOT_FOUND')).toBe('EMPTY_DATA_NOT_FOUND');
            expect(inferReasonCode('notfound')).toBe('EMPTY_DATA_NOT_FOUND');
        });

        it('根据上下文推断更具体的类型', () => {
            expect(inferReasonCode('NOT_FOUND', { module: 'client' })).toBe('EMPTY_CLIENT_NOT_FOUND');
            expect(inferReasonCode('NOT_FOUND', { module: 'crm' })).toBe('EMPTY_CLIENT_NOT_FOUND');
            expect(inferReasonCode('NOT_FOUND', { module: 'project' })).toBe('EMPTY_PROJECT_NOT_FOUND');
            expect(inferReasonCode('NOT_FOUND', { module: 'contract' })).toBe('EMPTY_CONTRACT_NOT_FOUND');
        });

        it('从错误码推断验证相关', () => {
            expect(inferReasonCode('VALIDATION_ERROR')).toBe('BLOCKED_VALIDATION_FAILED');
            expect(inferReasonCode('invalid_param')).toBe('BLOCKED_VALIDATION_FAILED');
        });

        it('从错误码推断超时', () => {
            expect(inferReasonCode('TIMEOUT')).toBe('ERROR_LLM_TIMEOUT');
        });

        it('从错误码推断数据库错误', () => {
            expect(inferReasonCode('DATABASE_ERROR')).toBe('ERROR_DATABASE_QUERY');
            expect(inferReasonCode('mongo_error')).toBe('ERROR_DATABASE_QUERY');
        });

        it('未知错误返回默认值', () => {
            expect(inferReasonCode('SOME_UNKNOWN_ERROR')).toBe('ERROR_UNKNOWN');
        });
    });

    describe('isValidReasonCode', () => {
        it('有效的 ReasonCode 返回 true', () => {
            expect(isValidReasonCode('EMPTY_CLIENT_NOT_FOUND')).toBe(true);
            expect(isValidReasonCode('BLOCKED_PERMISSION_DENIED')).toBe(true);
            expect(isValidReasonCode('ERROR_UNKNOWN')).toBe(true);
        });

        it('无效的 ReasonCode 返回 false', () => {
            expect(isValidReasonCode('INVALID_CODE')).toBe(false);
            expect(isValidReasonCode('random_string')).toBe(false);
            expect(isValidReasonCode('')).toBe(false);
        });
    });
});

