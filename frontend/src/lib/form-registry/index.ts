/**
 * 表单注册表系统
 * 
 * 提供表单与容器解耦的能力，使得同一个表单可以在模态窗、AI画板等不同容器中展示。
 * 
 * @example
 * ```tsx
 * // 1. 定义表单组件
 * function ClientForm({ mode, initialData, onSubmit, onCancel }: FormRenderProps) {
 *   return <form>...</form>;
 * }
 * 
 * // 2. 注册表单
 * registerForm({
 *   id: 'client-create',
 *   title: '新建客户',
 *   category: 'customer',
 *   component: ClientForm,
 * });
 * 
 * // 3. 在页面中使用
 * const { openForm, isOpen, currentFormId, initialData, operationMode } = useFormModal();
 * 
 * <Button onClick={() => openForm('client-create')}>新建客户</Button>
 * 
 * <FormModal
 *   formId={currentFormId}
 *   open={isOpen}
 *   initialData={initialData}
 *   operationMode={operationMode}
 * />
 * ```
 */

// 类型导出
export * from './types';

// 注册表导出
export {
  formRegistry,
  registerForm,
  getForm,
  getAllForms,
  getFormsByCategory,
  searchForms,
} from './registry';

// Hooks 导出
export {
  useAllForms,
  useFormsByCategory,
  useForm,
  useFormSearch,
  useFormModal,
  useAiFormCapabilities,
  useFormStats,
} from './use-form-registry';

