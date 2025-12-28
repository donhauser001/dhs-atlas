// AI 组件系统
export { AiProvider, useAi, useAiOptional } from './ai-context';
export type { AiPanelState, AiMessage, AiContextValue } from './ai-context';

export { AiPanel, AI_PANEL_COLLAPSED_WIDTH, AI_PANEL_EXPANDED_WIDTH, TRANSITION_DURATION } from './ai-panel';
export { AiCanvas } from './ai-canvas';

// 重新导出 AI 能力相关类型（方便使用）
export type { AiQuickAction, AiModuleCapability } from '@/lib/ai-capabilities';

