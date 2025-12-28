/**
 * 表单注册表核心实现
 * 
 * 单例模式实现的表单注册表，用于管理系统中所有的表单定义。
 * 支持运行时动态注册和注销表单。
 */

import type { FormDefinition, FormCategory, FormRegistry } from './types';

// ============ 注册表实现 ============

class FormRegistryImpl implements FormRegistry {
  private forms: Map<string, FormDefinition> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * 注册表单
   */
  register<TData = Record<string, unknown>>(definition: FormDefinition<TData>): void {
    if (this.forms.has(definition.id)) {
      console.warn(`[FormRegistry] 表单 "${definition.id}" 已存在，将被覆盖`);
    }

    // 设置默认值
    const normalizedDefinition: FormDefinition = {
      ...definition,
      supportedModes: definition.supportedModes || ['create', 'edit', 'view'],
      canvasEnabled: definition.canvasEnabled ?? true,
    } as FormDefinition;

    this.forms.set(definition.id, normalizedDefinition);
    this.notifyListeners();

    if (process.env.NODE_ENV === 'development') {
      console.log(`[FormRegistry] 已注册表单: ${definition.id}`);
    }
  }

  /**
   * 获取表单定义
   */
  get(id: string): FormDefinition | undefined {
    return this.forms.get(id);
  }

  /**
   * 获取所有表单
   */
  getAll(): FormDefinition[] {
    return Array.from(this.forms.values());
  }

  /**
   * 按分类获取表单
   */
  getByCategory(category: FormCategory): FormDefinition[] {
    return this.getAll().filter((form) => form.category === category);
  }

  /**
   * 检查表单是否存在
   */
  has(id: string): boolean {
    return this.forms.has(id);
  }

  /**
   * 注销表单
   */
  unregister(id: string): void {
    if (this.forms.delete(id)) {
      this.notifyListeners();
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FormRegistry] 已注销表单: ${id}`);
      }
    }
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.forms.clear();
    this.notifyListeners();
  }

  /**
   * 搜索表单
   * 根据标题、描述、触发词进行模糊搜索
   */
  search(query: string): FormDefinition[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return this.getAll();

    return this.getAll().filter((form) => {
      // 匹配标题
      if (form.title.toLowerCase().includes(lowerQuery)) return true;

      // 匹配描述
      if (form.description?.toLowerCase().includes(lowerQuery)) return true;

      // 匹配触发词
      if (form.triggers?.some((t) => t.toLowerCase().includes(lowerQuery))) return true;

      // 匹配分类
      if (form.category.toLowerCase().includes(lowerQuery)) return true;

      // 匹配 ID
      if (form.id.toLowerCase().includes(lowerQuery)) return true;

      return false;
    });
  }

  /**
   * 订阅注册表变化
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * 获取表单统计信息
   */
  getStats(): {
    total: number;
    byCategory: Record<string, number>;
    canvasEnabled: number;
  } {
    const forms = this.getAll();
    const byCategory: Record<string, number> = {};

    forms.forEach((form) => {
      byCategory[form.category] = (byCategory[form.category] || 0) + 1;
    });

    return {
      total: forms.length,
      byCategory,
      canvasEnabled: forms.filter((f) => f.canvasEnabled).length,
    };
  }
}

// ============ 单例导出 ============

/**
 * 全局表单注册表实例
 */
export const formRegistry = new FormRegistryImpl();

// ============ 便捷函数导出 ============

/**
 * 注册表单（便捷函数）
 */
export function registerForm<TData = Record<string, unknown>>(
  definition: FormDefinition<TData>
): void {
  formRegistry.register(definition);
}

/**
 * 获取表单定义（便捷函数）
 */
export function getForm(id: string): FormDefinition | undefined {
  return formRegistry.get(id);
}

/**
 * 获取所有表单（便捷函数）
 */
export function getAllForms(): FormDefinition[] {
  return formRegistry.getAll();
}

/**
 * 按分类获取表单（便捷函数）
 */
export function getFormsByCategory(category: FormCategory): FormDefinition[] {
  return formRegistry.getByCategory(category);
}

/**
 * 搜索表单（便捷函数）
 */
export function searchForms(query: string): FormDefinition[] {
  return formRegistry.search(query);
}

