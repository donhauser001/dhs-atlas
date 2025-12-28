/**
 * AI 设置模块 - 模型配置弹窗
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    useCreateAiModel,
    useUpdateAiModel,
    useTestConnection,
} from '@/hooks/queries/use-ai-settings';
import { AI_PROVIDERS, type AiProvider } from '@/api/ai-settings';
import { DEFAULT_FORM_DATA } from './constants';
import {
    BasicInfoSection,
    ConnectionSection,
    ModelParamsSection,
    StatusSection,
} from './form-sections/index';
import type { ModelConfigModalProps, FormData } from './types';

export function ModelConfigModal({
    open,
    onOpenChange,
    mode,
    initialData,
}: ModelConfigModalProps) {
    const createModel = useCreateAiModel();
    const updateModel = useUpdateAiModel();
    const testConnection = useTestConnection();

    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
    const [showApiKey, setShowApiKey] = useState(false);

    // 当弹窗打开或 initialData 变化时重置表单
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    name: initialData.name,
                    provider: initialData.provider,
                    model: initialData.model,
                    apiKey: '',
                    baseUrl: initialData.baseUrl || '',
                    temperature: initialData.temperature ?? 0.7,
                    maxTokens: initialData.maxTokens ?? 4096,
                    topP: initialData.topP ?? 1,
                    isDefault: initialData.isDefault,
                    isEnabled: initialData.isEnabled,
                });
            } else {
                setFormData(DEFAULT_FORM_DATA);
            }
            setShowApiKey(false);
        }
    }, [open, mode, initialData]);

    const provider = AI_PROVIDERS[formData.provider];
    const isLocalProvider =
        formData.provider === 'ollama' || formData.provider === 'lmstudio';
    const isCustom = formData.provider === 'custom';

    const handleProviderChange = (value: AiProvider) => {
        const newProvider = AI_PROVIDERS[value];
        setFormData({
            ...formData,
            provider: value,
            model: newProvider.models[0]?.id || '',
            baseUrl: newProvider.defaultBaseUrl || '',
        });
    };

    const handleTest = () => {
        testConnection.mutate({
            provider: formData.provider,
            model: formData.model,
            apiKey: formData.apiKey,
            baseUrl: formData.baseUrl,
        });
    };

    const handleSubmit = () => {
        if (mode === 'create') {
            createModel.mutate(formData, {
                onSuccess: () => onOpenChange(false),
            });
        } else if (initialData) {
            updateModel.mutate(
                { id: initialData._id, data: formData },
                { onSuccess: () => onOpenChange(false) }
            );
        }
    };

    const isPending = createModel.isPending || updateModel.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? '添加 AI 模型' : '编辑 AI 模型'}
                    </DialogTitle>
                    <DialogDescription>配置 AI 模型连接信息和参数</DialogDescription>
                </DialogHeader>

                <div className="max-h-[calc(85vh-180px)] space-y-6 overflow-auto py-4">
                    <BasicInfoSection
                        formData={formData}
                        setFormData={setFormData}
                        provider={provider}
                        isCustom={isCustom}
                        onProviderChange={handleProviderChange}
                    />

                    <ConnectionSection
                        formData={formData}
                        setFormData={setFormData}
                        provider={provider}
                        isLocalProvider={isLocalProvider}
                        isEditMode={mode === 'edit'}
                        initialData={initialData}
                        showApiKey={showApiKey}
                        setShowApiKey={setShowApiKey}
                        onTest={handleTest}
                        isTestPending={testConnection.isPending}
                    />

                    <ModelParamsSection formData={formData} setFormData={setFormData} />

                    <StatusSection formData={formData} setFormData={setFormData} />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending || !formData.name || !formData.model}
                    >
                        {isPending ? '保存中...' : '保存'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
