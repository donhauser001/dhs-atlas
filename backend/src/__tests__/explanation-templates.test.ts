/**
 * Explanation Templates 单元测试
 * 
 * 测试内容：
 * 1. StructuredError 创建
 * 2. 解释模板渲染
 * 3. 工厂函数
 */

import {
    getExplanation,
    createStructuredError,
    fromError,
    generateExplanationText,
    createPermissionDeniedError,
    createToolNotFoundError,
    createDataNotFoundError,
    createValidationError,
    createCollectionNotAllowedError,
    createDangerousOperatorError,
    createDatabaseError,
    createExecutionError,
    ExplanationContext,
} from '../ai/agent/explanation-templates';
import type { StructuredError } from '../ai/tools/types';

describe('Explanation Templates', () => {
    describe('getExplanation', () => {
        it('返回正确的解释结构', () => {
            const explanation = getExplanation('EMPTY_CLIENT_NOT_FOUND');
            expect(explanation).toHaveProperty('text');
            expect(explanation).toHaveProperty('userMessage');
            expect(explanation).toHaveProperty('canRetry');
            expect(explanation).toHaveProperty('severity');
        });

        it('Empty 类返回合适的解释', () => {
            const explanation = getExplanation('EMPTY_CLIENT_NOT_FOUND');
            expect(explanation.severity).toBe('info');
            expect(explanation.canRetry).toBe(false);
            expect(explanation.text).toContain('客户');
        });

        it('Blocked 类返回合适的解释', () => {
            const explanation = getExplanation('BLOCKED_PERMISSION_DENIED');
            expect(explanation.severity).toBe('warning');
            expect(explanation.text).toContain('权限');
        });

        it('Error 类返回合适的解释', () => {
            const explanation = getExplanation('ERROR_DATABASE_CONNECTION');
            expect(explanation.severity).toBe('error');
            expect(explanation.canRetry).toBe(true);
        });

        it('支持上下文变量替换', () => {
            const context: ExplanationContext = {
                module: 'project',
                entityName: '测试项目',
            };
            const explanation = getExplanation('EMPTY_PROJECT_NOT_FOUND', context);
            expect(explanation).toBeDefined();
        });
    });

    describe('createStructuredError', () => {
        it('创建完整的 StructuredError', () => {
            const error = createStructuredError({
                code: 'TEST_ERROR',
                message: '测试错误',
                reasonCode: 'ERROR_UNKNOWN',
            });

            expect(error.code).toBe('TEST_ERROR');
            expect(error.message).toBe('测试错误');
            expect(error.reasonCode).toBe('ERROR_UNKNOWN');
            expect(error.userMessage).toBeTruthy();
            expect(typeof error.canRetry).toBe('boolean');
        });

        it('允许覆盖 userMessage', () => {
            const error = createStructuredError({
                code: 'TEST_ERROR',
                message: '测试错误',
                reasonCode: 'ERROR_UNKNOWN',
                userMessage: '自定义用户消息',
            });

            expect(error.userMessage).toBe('自定义用户消息');
        });

        it('允许覆盖 suggestion', () => {
            const error = createStructuredError({
                code: 'TEST_ERROR',
                message: '测试错误',
                reasonCode: 'ERROR_UNKNOWN',
                suggestion: '自定义建议',
            });

            expect(error.suggestion).toBe('自定义建议');
        });

        it('允许覆盖 canRetry', () => {
            const error = createStructuredError({
                code: 'TEST_ERROR',
                message: '测试错误',
                reasonCode: 'ERROR_UNKNOWN',
                canRetry: false,
            });

            expect(error.canRetry).toBe(false);
        });
    });

    describe('fromError', () => {
        it('从 Error 对象创建 StructuredError', () => {
            const error = new Error('测试错误消息');
            const structuredError = fromError(error);

            expect(structuredError.message).toBe('测试错误消息');
            expect(structuredError.reasonCode).toBeDefined();
        });

        it('从带有 code 的错误创建', () => {
            const error = { code: 'CUSTOM_CODE', message: '自定义错误' };
            const structuredError = fromError(error);

            expect(structuredError.code).toBe('CUSTOM_CODE');
        });

        it('自动推断权限相关错误', () => {
            const error = new Error('Permission denied');
            const structuredError = fromError(error);

            expect(structuredError.reasonCode).toBe('BLOCKED_PERMISSION_DENIED');
        });

        it('自动推断数据不存在错误', () => {
            const error = new Error('数据不存在');
            const structuredError = fromError(error);

            expect(structuredError.reasonCode).toBe('EMPTY_DATA_NOT_FOUND');
        });

        it('自动推断验证错误', () => {
            const error = new Error('Validation failed: 格式不正确');
            const structuredError = fromError(error);

            expect(structuredError.reasonCode).toBe('BLOCKED_VALIDATION_FAILED');
        });

        it('自动推断超时错误', () => {
            const error = new Error('Request timeout');
            const structuredError = fromError(error);

            expect(structuredError.reasonCode).toBe('ERROR_LLM_TIMEOUT');
        });

        it('自动推断数据库错误', () => {
            const error = new Error('MongoDB connection failed');
            const structuredError = fromError(error);

            expect(structuredError.reasonCode).toBe('ERROR_DATABASE_QUERY');
        });

        it('未知错误使用默认 reasonCode', () => {
            const error = new Error('完全未知的错误');
            const structuredError = fromError(error, 'ERROR_INTERNAL');

            expect(structuredError.reasonCode).toBe('ERROR_INTERNAL');
        });
    });

    describe('generateExplanationText', () => {
        it('生成完整的解释文本', () => {
            const error: StructuredError = {
                code: 'TEST',
                message: 'test',
                reasonCode: 'ERROR_UNKNOWN',
                userMessage: '遇到了问题',
                suggestion: '请稍后再试',
                canRetry: true,
            };

            const text = generateExplanationText(error);

            expect(text).toContain('遇到了问题');
            expect(text).toContain('请稍后再试');
            expect(text).toContain('稍后再试');
        });

        it('不可重试时不添加重试提示', () => {
            const error: StructuredError = {
                code: 'TEST',
                message: 'test',
                reasonCode: 'BLOCKED_PERMISSION_DENIED',
                userMessage: '没有权限',
                canRetry: false,
            };

            const text = generateExplanationText(error);

            expect(text).toContain('没有权限');
            expect(text).not.toContain('再试');
        });
    });

    describe('便捷创建函数', () => {
        it('createPermissionDeniedError', () => {
            const error = createPermissionDeniedError();
            expect(error.reasonCode).toBe('BLOCKED_PERMISSION_DENIED');
            expect(error.canRetry).toBe(false);
        });

        it('createToolNotFoundError', () => {
            const error = createToolNotFoundError('test.tool');
            expect(error.reasonCode).toBe('BLOCKED_TOOL_NOT_FOUND');
            expect(error.message).toContain('test.tool');
        });

        it('createDataNotFoundError - 客户', () => {
            const error = createDataNotFoundError('客户');
            expect(error.reasonCode).toBe('EMPTY_CLIENT_NOT_FOUND');
        });

        it('createDataNotFoundError - 项目', () => {
            const error = createDataNotFoundError('项目');
            expect(error.reasonCode).toBe('EMPTY_PROJECT_NOT_FOUND');
        });

        it('createDataNotFoundError - 合同', () => {
            const error = createDataNotFoundError('合同');
            expect(error.reasonCode).toBe('EMPTY_CONTRACT_NOT_FOUND');
        });

        it('createValidationError', () => {
            const error = createValidationError(['字段1不能为空', '字段2格式错误']);
            expect(error.reasonCode).toBe('BLOCKED_VALIDATION_FAILED');
            expect(error.message).toContain('字段1');
            expect(error.message).toContain('字段2');
        });

        it('createCollectionNotAllowedError', () => {
            const error = createCollectionNotAllowedError('users');
            expect(error.reasonCode).toBe('BLOCKED_COLLECTION_NOT_ALLOWED');
            expect(error.message).toContain('users');
        });

        it('createDangerousOperatorError', () => {
            const error = createDangerousOperatorError(['$where', '$eval']);
            expect(error.reasonCode).toBe('BLOCKED_DANGEROUS_OPERATOR');
            expect(error.canRetry).toBe(false);
        });

        it('createDatabaseError', () => {
            const error = createDatabaseError('连接失败');
            expect(error.reasonCode).toBe('ERROR_DATABASE_QUERY');
            expect(error.canRetry).toBe(true);
        });

        it('createExecutionError', () => {
            const error = createExecutionError('执行出错');
            expect(error.reasonCode).toBe('ERROR_TOOL_EXECUTION');
            expect(error.canRetry).toBe(true);
        });
    });
});

