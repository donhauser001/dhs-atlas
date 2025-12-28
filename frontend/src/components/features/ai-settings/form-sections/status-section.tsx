/**
 * AI 设置模块 - 状态设置表单区域
 */

'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { FormData } from '../types';

interface StatusSectionProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
}

export function StatusSection({ formData, setFormData }: StatusSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>启用此模型</Label>
          <p className="text-sm text-muted-foreground">
            禁用后将不会在 AI 功能中使用此模型
          </p>
        </div>
        <Switch
          checked={formData.isEnabled}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isEnabled: checked })
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>设为默认模型</Label>
          <p className="text-sm text-muted-foreground">
            AI 功能将优先使用默认模型
          </p>
        </div>
        <Switch
          checked={formData.isDefault}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isDefault: checked })
          }
        />
      </div>
    </section>
  );
}

