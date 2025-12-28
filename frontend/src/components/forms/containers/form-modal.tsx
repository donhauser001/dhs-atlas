'use client';

/**
 * 通用表单模态窗容器
 * 
 * 从表单注册表动态加载表单，在 Dialog 中渲染。
 * 支持创建、编辑、查看三种模式。
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAllForms } from '@/lib/form-registry';
import type { FormModalContainerProps, FormOperationMode } from '@/lib/form-registry';

export function FormModal({
  formId,
  open,
  onOpenChange,
  initialData,
  operationMode = 'create',
  onSuccess,
  onCancel,
  context,
}: FormModalContainerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 使用 hook 订阅表单注册表变化
  const allForms = useAllForms();

  // 获取表单定义
  const formDefinition = useMemo(() => {
    if (!formId) return null;
    return allForms.find(f => f.id === formId) || null;
  }, [formId, allForms]);

  // 处理提交
  const handleSubmit = useCallback(async (data: unknown) => {
    setIsSubmitting(true);
    try {
      // 表单组件负责实际的 API 调用
      // 这里只是一个透传
      await Promise.resolve();
      onSuccess?.();
    } catch (error) {
      console.error('[FormModal] 提交失败:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSuccess]);

  // 处理取消
  const handleCancel = useCallback(() => {
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  // 处理成功
  const handleSuccess = useCallback(() => {
    onSuccess?.();
    onOpenChange(false);
  }, [onSuccess, onOpenChange]);

  // 如果没有表单定义，不渲染
  if (!formDefinition) {
    if (open && formId) {
      console.error(`[FormModal] 未找到表单: ${formId}`);
    }
    return null;
  }

  const FormComponent = formDefinition.component;

  // 计算标题
  const title = useMemo(() => {
    if (operationMode === 'view') {
      return formDefinition.title.replace(/新建|创建/, '查看');
    }
    if (operationMode === 'edit') {
      return formDefinition.title.replace(/新建|创建/, '编辑');
    }
    return formDefinition.title;
  }, [formDefinition.title, operationMode]);

  // 计算描述
  const description = useMemo(() => {
    if (operationMode === 'view') {
      return '查看详细信息';
    }
    if (operationMode === 'edit') {
      return '修改信息';
    }
    return formDefinition.description || '填写表单信息';
  }, [formDefinition.description, operationMode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-180px)] overflow-auto">
          <div className="px-1 py-2">
            <FormComponent
              mode="modal"
              operationMode={operationMode}
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              onSuccess={handleSuccess}
              readonly={operationMode === 'view'}
              isSubmitting={isSubmitting}
              context={context}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============ 便捷组件 ============

/**
 * 带有内置状态管理的 FormModal
 * 适用于不需要外部控制打开状态的场景
 */
interface FormModalWithStateProps {
  formId: string;
  trigger: React.ReactNode;
  initialData?: Record<string, unknown>;
  operationMode?: FormOperationMode;
  onSuccess?: () => void;
}

export function FormModalWithTrigger({
  formId,
  trigger,
  initialData,
  operationMode = 'create',
  onSuccess,
}: FormModalWithStateProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <FormModal
        formId={formId}
        open={open}
        onOpenChange={setOpen}
        initialData={initialData}
        operationMode={operationMode}
        onSuccess={onSuccess}
      />
    </>
  );
}

