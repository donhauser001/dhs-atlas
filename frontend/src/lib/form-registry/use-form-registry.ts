/**
 * 表单注册表 React Hooks
 * 
 * 提供在 React 组件中使用表单注册表的 hooks
 */

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { formRegistry, getAllForms, getFormsByCategory, searchForms } from './registry';
import type {
  FormDefinition,
  FormCategory,
  FormOperationMode,
  UseFormModalOptions,
  UseFormModalReturn,
} from './types';

// ============ 基础 Hooks ============

/**
 * 获取所有已注册的表单
 * 当注册表变化时会自动更新
 */
export function useAllForms(): FormDefinition[] {
  const [forms, setForms] = useState<FormDefinition[]>(() => getAllForms());

  useEffect(() => {
    // 初始化时同步
    setForms(getAllForms());

    // 订阅变化
    const unsubscribe = formRegistry.subscribe(() => {
      setForms(getAllForms());
    });

    return unsubscribe;
  }, []);

  return forms;
}

/**
 * 按分类获取表单
 */
export function useFormsByCategory(category: FormCategory): FormDefinition[] {
  const allForms = useAllForms();
  return useMemo(
    () => allForms.filter((form) => form.category === category),
    [allForms, category]
  );
}

/**
 * 获取单个表单定义
 */
export function useForm(id: string): FormDefinition | undefined {
  const allForms = useAllForms();
  return useMemo(
    () => allForms.find((form) => form.id === id),
    [allForms, id]
  );
}

/**
 * 搜索表单
 */
export function useFormSearch(query: string): FormDefinition[] {
  const allForms = useAllForms();
  return useMemo(
    () => (query ? searchForms(query) : allForms),
    [allForms, query]
  );
}

// ============ 模态窗 Hook ============

/**
 * 管理表单模态窗状态的 hook
 * 
 * @example
 * ```tsx
 * const { openForm, closeForm, isOpen, currentFormId, initialData, operationMode } = useFormModal();
 * 
 * // 打开新建客户表单
 * openForm('client-create');
 * 
 * // 打开编辑客户表单
 * openForm('client-edit', { initialData: clientData, operationMode: 'edit' });
 * ```
 */
export function useFormModal(options: UseFormModalOptions = {}): UseFormModalReturn {
  const { closeOnSuccess = true, onSuccess, onError } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Record<string, unknown> | undefined>(undefined);
  const [operationMode, setOperationMode] = useState<FormOperationMode>('create');

  const openForm = useCallback((
    formId: string,
    opts?: {
      initialData?: Record<string, unknown>;
      operationMode?: FormOperationMode;
    }
  ) => {
    // 验证表单是否存在
    const form = formRegistry.get(formId);
    if (!form) {
      console.error(`[useFormModal] 表单 "${formId}" 不存在`);
      onError?.(new Error(`表单 "${formId}" 不存在`));
      return;
    }

    setCurrentFormId(formId);
    setInitialData(opts?.initialData);
    setOperationMode(opts?.operationMode || 'create');
    setIsOpen(true);
  }, [onError]);

  const closeForm = useCallback(() => {
    setIsOpen(false);
    // 延迟清除数据，让动画完成
    setTimeout(() => {
      setCurrentFormId(null);
      setInitialData(undefined);
      setOperationMode('create');
    }, 300);
  }, []);

  const handleSuccess = useCallback(() => {
    onSuccess?.();
    if (closeOnSuccess) {
      closeForm();
    }
  }, [closeOnSuccess, closeForm, onSuccess]);

  return {
    openForm,
    closeForm,
    currentFormId,
    isOpen,
    initialData,
    operationMode,
    // 内部使用
    _handleSuccess: handleSuccess,
  } as UseFormModalReturn & { _handleSuccess: () => void };
}

// ============ AI 集成 Hook ============

/**
 * 为 AI 提供的表单能力 hook
 * 
 * 返回 AI 可以使用的表单列表和操作函数
 */
export function useAiFormCapabilities() {
  const allForms = useAllForms();

  // 只返回支持在 canvas 中展示的表单
  const canvasForms = useMemo(
    () => allForms.filter((form) => form.canvasEnabled),
    [allForms]
  );

  // 为 AI 生成表单摘要
  const formSummaries = useMemo(
    () => canvasForms.map((form) => ({
      id: form.id,
      title: form.title,
      description: form.description,
      category: form.category,
      triggers: form.triggers,
      fields: form.fields?.map((f) => ({
        name: f.name,
        label: f.label,
        type: f.type,
        required: f.required,
      })),
    })),
    [canvasForms]
  );

  // 根据用户意图匹配表单
  const matchFormByIntent = useCallback((intent: string): FormDefinition | null => {
    const lowerIntent = intent.toLowerCase();

    // 精确匹配触发词
    for (const form of canvasForms) {
      if (form.triggers?.some((t) => lowerIntent.includes(t.toLowerCase()))) {
        return form;
      }
    }

    // 模糊匹配标题和描述
    const results = searchForms(intent);
    return results.length > 0 ? results[0] : null;
  }, [canvasForms]);

  return {
    availableForms: canvasForms,
    formSummaries,
    matchFormByIntent,
    getFormsByCategory,
    searchForms,
  };
}

// ============ 表单统计 Hook ============

/**
 * 获取表单注册表统计信息
 */
export function useFormStats() {
  const allForms = useAllForms();

  return useMemo(() => {
    const byCategory: Record<string, number> = {};
    let canvasEnabled = 0;

    allForms.forEach((form) => {
      byCategory[form.category] = (byCategory[form.category] || 0) + 1;
      if (form.canvasEnabled) canvasEnabled++;
    });

    return {
      total: allForms.length,
      byCategory,
      canvasEnabled,
    };
  }, [allForms]);
}

