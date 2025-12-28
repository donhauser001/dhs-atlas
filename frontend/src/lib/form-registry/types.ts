/**
 * 表单注册表类型定义
 * 
 * 这个模块定义了表单注册表系统的核心类型，用于将表单内容与展示容器解耦，
 * 使得同一个表单可以在模态窗、AI画板等不同容器中展示。
 */

import { ComponentType } from 'react';
import { ZodSchema } from 'zod';

// ============ 基础类型 ============

/**
 * 表单展示模式
 * - modal: 在模态窗中展示
 * - canvas: 在 AI 画板中展示
 * - inline: 内嵌在页面中展示
 * - drawer: 在抽屉中展示
 */
export type FormDisplayMode = 'modal' | 'canvas' | 'inline' | 'drawer';

/**
 * 表单操作模式
 * - create: 创建新记录
 * - edit: 编辑现有记录
 * - view: 只读查看
 */
export type FormOperationMode = 'create' | 'edit' | 'view';

/**
 * 表单分类
 */
export type FormCategory =
  | 'customer'    // 客户相关
  | 'project'     // 项目相关
  | 'contract'    // 合同相关
  | 'finance'     // 财务相关
  | 'pricing'     // 定价相关
  | 'system'      // 系统设置
  | 'content'     // 内容管理
  | 'organization'// 组织管理
  | string;       // 允许扩展

// ============ 表单渲染 Props ============

/**
 * 传递给表单组件的 props
 * 表单组件必须实现这个接口
 */
export interface FormRenderProps<TData = Record<string, unknown>> {
  /** 当前展示模式 */
  mode: FormDisplayMode;

  /** 操作模式：创建/编辑/查看 */
  operationMode: FormOperationMode;

  /** 初始数据（编辑/查看模式下传入） */
  initialData?: TData;

  /** 表单提交回调 */
  onSubmit: (data: TData) => Promise<void>;

  /** 取消操作回调 */
  onCancel?: () => void;

  /** 操作成功后的回调 */
  onSuccess?: () => void;

  /** 是否只读模式 */
  readonly?: boolean;

  /** 是否正在提交 */
  isSubmitting?: boolean;

  /** 额外的上下文数据（如关联数据） */
  context?: Record<string, unknown>;
}

// ============ 表单定义 ============

/**
 * 表单字段元信息（供 AI 理解）
 */
export interface FormFieldMeta {
  /** 字段名 */
  name: string;
  /** 字段标签 */
  label: string;
  /** 字段类型 */
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'file' | 'rating' | 'custom';
  /** 是否必填 */
  required?: boolean;
  /** 字段描述 */
  description?: string;
  /** 选项（select 类型） */
  options?: Array<{ label: string; value: string }>;
}

/**
 * 表单定义
 * 注册到表单库中的完整表单定义
 */
export interface FormDefinition<TData = Record<string, unknown>> {
  /** 
   * 唯一标识符
   * 命名规范: {entity}-{operation}，如 'client-create', 'project-edit'
   */
  id: string;

  /** 表单标题 */
  title: string;

  /** 
   * 表单描述（供 AI 理解）
   * 应该清晰描述这个表单的用途，AI 会根据这个描述来决定是否调用
   */
  description?: string;

  /** 表单分类 */
  category: FormCategory;

  /** 表单组件 */
  component: ComponentType<FormRenderProps<TData>>;

  /** Zod 验证 schema（可选，用于预验证） */
  schema?: ZodSchema<TData>;

  /** 默认值 */
  defaultValues?: Partial<TData>;

  /** 所需权限 */
  permissions?: string[];

  /** 
   * 字段元信息（供 AI 理解表单结构）
   * 如果提供，AI 可以更好地理解表单内容
   */
  fields?: FormFieldMeta[];

  /** 支持的操作模式 */
  supportedModes?: FormOperationMode[];

  /** 是否支持在 AI 画板中展示 */
  canvasEnabled?: boolean;

  /** 表单图标（用于在 AI 建议中展示） */
  icon?: string;

  /** 快捷触发词（AI 可以通过这些词触发表单） */
  triggers?: string[];
}

// ============ 注册表类型 ============

/**
 * 表单注册表接口
 */
export interface FormRegistry {
  /** 注册表单 */
  register: <TData = Record<string, unknown>>(definition: FormDefinition<TData>) => void;

  /** 获取表单定义 */
  get: (id: string) => FormDefinition | undefined;

  /** 获取所有表单 */
  getAll: () => FormDefinition[];

  /** 按分类获取表单 */
  getByCategory: (category: FormCategory) => FormDefinition[];

  /** 检查表单是否存在 */
  has: (id: string) => boolean;

  /** 注销表单 */
  unregister: (id: string) => void;

  /** 清空注册表 */
  clear: () => void;

  /** 搜索表单（根据标题、描述、触发词） */
  search: (query: string) => FormDefinition[];
}

// ============ Hook 类型 ============

/**
 * useFormModal hook 的参数
 */
export interface UseFormModalOptions {
  /** 操作成功后是否自动关闭 */
  closeOnSuccess?: boolean;
  /** 成功回调 */
  onSuccess?: () => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * useFormModal hook 的返回值
 */
export interface UseFormModalReturn {
  /** 打开表单模态窗 */
  openForm: (formId: string, options?: {
    initialData?: Record<string, unknown>;
    operationMode?: FormOperationMode;
  }) => void;
  /** 关闭模态窗 */
  closeForm: () => void;
  /** 当前打开的表单ID */
  currentFormId: string | null;
  /** 是否打开 */
  isOpen: boolean;
  /** 当前初始数据 */
  initialData: Record<string, unknown> | undefined;
  /** 当前操作模式 */
  operationMode: FormOperationMode;
}

// ============ 容器 Props ============

/**
 * 表单模态窗容器 Props
 */
export interface FormModalContainerProps {
  /** 表单ID */
  formId: string;
  /** 是否打开 */
  open: boolean;
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
  /** 初始数据 */
  initialData?: Record<string, unknown>;
  /** 操作模式 */
  operationMode?: FormOperationMode;
  /** 成功回调 */
  onSuccess?: () => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 额外上下文 */
  context?: Record<string, unknown>;
}

/**
 * AI 画板表单容器 Props
 */
export interface FormCanvasContainerProps {
  /** 表单ID */
  formId: string;
  /** 初始数据 */
  initialData?: Record<string, unknown>;
  /** 操作模式 */
  operationMode?: FormOperationMode;
  /** 成功回调 */
  onSuccess?: () => void;
  /** 关闭回调 */
  onClose?: () => void;
  /** 是否显示投射动画 */
  showProjection?: boolean;
}

