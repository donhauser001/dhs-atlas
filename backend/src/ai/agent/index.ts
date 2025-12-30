/**
 * Agent Service 入口
 * 
 * V2 架构：智能 AI + 系统守门
 * 
 * - AI 自由理解意图、查询地图、决定行动
 * - 系统负责权限检查、参数验证、审计记录
 */

export * from './types';
export { 
    processAgentRequest, 
    confirmAndExecuteTools,
    clearMapsCache,
} from './agent-service';
