/**
 * 缓存管理模块
 * 
 * 管理地图和工具的内存缓存
 */

import AiMap from '../../models/AiMap';
import AiTool from '../../models/AiToolkit';

// ============================================================================
// 地图缓存
// ============================================================================

interface CachedMaps {
    maps: any[];
    timestamp: number;
}

let mapsCache: CachedMaps | null = null;
const MAPS_CACHE_TTL = 5 * 60 * 1000; // 5 分钟

/**
 * 获取所有启用的地图（带缓存）
 */
export async function getAllMaps(): Promise<any[]> {
    if (mapsCache && Date.now() - mapsCache.timestamp < MAPS_CACHE_TTL) {
        return mapsCache.maps;
    }

    const maps = await AiMap.find({ enabled: true }).sort({ priority: -1 }).lean();
    mapsCache = { maps, timestamp: Date.now() };
    return maps;
}

/**
 * 清除地图缓存
 */
export function clearMapsCache(): void {
    mapsCache = null;
    console.log('[Agent] 地图缓存已清除');
}

// ============================================================================
// 工具缓存
// ============================================================================

interface CachedTools {
    tools: any[];
    timestamp: number;
}

let toolsCache: CachedTools | null = null;
const TOOLS_CACHE_TTL = 5 * 60 * 1000; // 5 分钟

/**
 * 获取所有启用的工具（带缓存）
 */
export async function getAllTools(): Promise<any[]> {
    if (toolsCache && Date.now() - toolsCache.timestamp < TOOLS_CACHE_TTL) {
        return toolsCache.tools;
    }

    const tools = await AiTool.find({ enabled: true }).sort({ order: 1 }).lean();
    toolsCache = { tools, timestamp: Date.now() };
    return tools;
}

/**
 * 清除工具缓存
 */
export function clearToolsCache(): void {
    toolsCache = null;
    console.log('[Agent] 工具缓存已清除');
}

/**
 * 清除所有缓存
 */
export function clearAllCaches(): void {
    clearMapsCache();
    clearToolsCache();
}


