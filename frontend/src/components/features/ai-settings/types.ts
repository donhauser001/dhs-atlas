/**
 * AI 设置模块 - 类型定义
 */

import type { AiProvider, AiModelConfig, CreateAiModelRequest } from '@/api/ai-settings';

export type ModalMode = 'create' | 'edit';

export interface FormData extends CreateAiModelRequest { }

export interface ModelCardProps {
    model: AiModelConfig;
    onEdit: () => void;
    onDelete: () => void;
}

export interface ModelConfigModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: ModalMode;
    initialData: AiModelConfig | null;
}

export interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: () => void;
    modelId: string | null;
}

export interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export interface OllamaStatusProps {
    defaultBaseUrl?: string;
}

export type { AiProvider, AiModelConfig };

