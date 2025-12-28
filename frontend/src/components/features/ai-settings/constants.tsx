/**
 * AI 设置模块 - 常量定义
 */

import {
    Bot,
    Settings2,
    Zap,
    Globe,
    Server,
    Sparkles,
    Cpu,
} from 'lucide-react';
import type { AiProvider } from '@/api/ai-settings';
import type { FormData } from './types';

/**
 * 各提供商对应的图标
 */
export const PROVIDER_ICONS: Record<AiProvider, React.ReactNode> = {
    openai: <Sparkles className="h-4 w-4" />,
    anthropic: <Bot className="h-4 w-4" />,
    google: <Globe className="h-4 w-4" />,
    deepseek: <Zap className="h-4 w-4" />,
    zhipu: <Bot className="h-4 w-4" />,
    moonshot: <Sparkles className="h-4 w-4" />,
    qwen: <Bot className="h-4 w-4" />,
    ollama: <Server className="h-4 w-4" />,
    lmstudio: <Cpu className="h-4 w-4" />,
    custom: <Settings2 className="h-4 w-4" />,
};

/**
 * 默认表单数据
 */
export const DEFAULT_FORM_DATA: FormData = {
    name: '',
    provider: 'openai',
    model: '',
    apiKey: '',
    baseUrl: '',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    isDefault: false,
    isEnabled: true,
};

