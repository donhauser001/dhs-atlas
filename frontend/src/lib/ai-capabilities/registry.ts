/**
 * AI 能力注册表
 * 
 * 管理模块能力定义，不包含工作流逻辑。
 * 工作流由后端 Agent Service 真正控制。
 */

import type { ModuleCapability } from './types';

// ============ 模块能力注册表 ============

const capabilities = new Map<string, ModuleCapability>();
const subscribers = new Set<() => void>();

// 缓存 getAll 结果
let cachedCapabilities: ModuleCapability[] = [];

function updateCache() {
  cachedCapabilities = Array.from(capabilities.values()).filter((c) => c.enabled !== false);
}

function notifySubscribers() {
  updateCache();
  subscribers.forEach((callback) => callback());
}

/**
 * 模块能力注册表
 */
export const moduleRegistry = {
  register(capability: ModuleCapability) {
    capabilities.set(capability.moduleId, {
      ...capability,
      enabled: capability.enabled !== false,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Module Registry] 注册模块: ${capability.moduleId} (${capability.moduleName})`
      );
    }

    notifySubscribers();
  },

  get(moduleId: string) {
    return capabilities.get(moduleId);
  },

  getAll() {
    return cachedCapabilities;
  },

  matchByRoute(pathname: string) {
    for (const capability of capabilities.values()) {
      if (capability.enabled === false) continue;

      if (capability.routePatterns) {
        for (const pattern of capability.routePatterns) {
          const regex = new RegExp(
            '^' + pattern.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$'
          );
          if (regex.test(pathname)) {
            return capability;
          }
        }
      }
    }
    return null;
  },

  unregister(moduleId: string) {
    if (capabilities.delete(moduleId)) {
      notifySubscribers();
    }
  },

  subscribe(callback: () => void) {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  },
};

// ============ 便捷函数 ============

export function registerModule(capability: ModuleCapability): void {
  moduleRegistry.register(capability);
}

export function getModule(moduleId: string): ModuleCapability | undefined {
  return moduleRegistry.get(moduleId);
}

export function getAllModules(): ModuleCapability[] {
  return moduleRegistry.getAll();
}

export function matchModuleByRoute(pathname: string): ModuleCapability | null {
  return moduleRegistry.matchByRoute(pathname);
}

// ============ 向后兼容的别名 ============

export const aiCapabilityRegistry = moduleRegistry;
export const registerAiCapability = registerModule;
export const getAiCapability = getModule;
export const getAllAiCapabilities = getAllModules;
export const matchAiCapabilityByRoute = matchModuleByRoute;

// 不再支持 getWorkflow - 工作流由后端控制
export function getWorkflow(): undefined {
  console.warn('[Deprecated] getWorkflow 已废弃，工作流由后端 Agent Service 控制');
  return undefined;
}
