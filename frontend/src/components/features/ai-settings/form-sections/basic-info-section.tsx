/**
 * AI 设置模块 - 基本信息表单区域
 */

'use client';

import { Settings2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AI_PROVIDERS, type AiProvider } from '@/api/ai-settings';
import { PROVIDER_ICONS } from '../constants';
import type { FormData } from '../types';

interface BasicInfoSectionProps {
    formData: FormData;
    setFormData: (data: FormData) => void;
    provider: (typeof AI_PROVIDERS)[AiProvider];
    isCustom: boolean;
    onProviderChange: (value: AiProvider) => void;
}

export function BasicInfoSection({
    formData,
    setFormData,
    provider,
    isCustom,
    onProviderChange,
}: BasicInfoSectionProps) {
    return (
        <section className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-medium">
                <Settings2 className="h-4 w-4" />
                基本信息
            </h4>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">配置名称</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="例如：GPT-4 主力模型"
                    />
                </div>

                <div className="space-y-2">
                    <Label>提供商</Label>
                    <Select value={formData.provider} onValueChange={onProviderChange}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(AI_PROVIDERS).map(([key, value]) => (
                                <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                        {PROVIDER_ICONS[key as AiProvider]}
                                        <span>{value.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>模型</Label>
                {isCustom ? (
                    <Input
                        value={formData.model}
                        onChange={(e) =>
                            setFormData({ ...formData, model: e.target.value })
                        }
                        placeholder="输入模型名称"
                    />
                ) : (
                    <Select
                        value={formData.model}
                        onValueChange={(value) =>
                            setFormData({ ...formData, model: value })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="选择模型" />
                        </SelectTrigger>
                        <SelectContent>
                            {provider.models.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                    <div>
                                        <span>{model.name}</span>
                                        {model.description && (
                                            <span className="ml-2 text-muted-foreground">
                                                - {model.description}
                                            </span>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
        </section>
    );
}

