/**
 * AI 设置模块 - 模型参数表单区域
 */

'use client';

import { Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { FormData } from '../types';

interface ModelParamsSectionProps {
    formData: FormData;
    setFormData: (data: FormData) => void;
}

export function ModelParamsSection({
    formData,
    setFormData,
}: ModelParamsSectionProps) {
    return (
        <section className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                模型参数
            </h4>

            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>温度 (Temperature)</Label>
                        <span className="text-sm text-muted-foreground">
                            {formData.temperature}
                        </span>
                    </div>
                    <Slider
                        value={[formData.temperature ?? 0.7]}
                        onValueChange={(values: number[]) =>
                            setFormData({ ...formData, temperature: values[0] })
                        }
                        min={0}
                        max={2}
                        step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                        较低的值使输出更确定，较高的值使输出更随机
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="maxTokens">最大 Token 数</Label>
                    <Input
                        id="maxTokens"
                        type="number"
                        value={formData.maxTokens}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                maxTokens: parseInt(e.target.value),
                            })
                        }
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Top P</Label>
                        <span className="text-sm text-muted-foreground">
                            {formData.topP}
                        </span>
                    </div>
                    <Slider
                        value={[formData.topP ?? 1]}
                        onValueChange={(values: number[]) =>
                            setFormData({ ...formData, topP: values[0] })
                        }
                        min={0}
                        max={1}
                        step={0.05}
                    />
                </div>
            </div>
        </section>
    );
}

