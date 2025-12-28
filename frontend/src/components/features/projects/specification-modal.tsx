'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { specificationApi, Specification } from '@/api/specifications';
import { toast } from 'sonner';

// 表单验证
const specificationSchema = z.object({
  name: z.string().min(1, '请输入规格名称'),
  length: z.number().min(1, '请输入长度'),
  width: z.number().min(1, '请输入宽度'),
  height: z.number().positive().optional().or(z.literal(undefined)),
  unit: z.string().min(1, '请选择单位'),
  resolution: z.string().optional(),
});

type SpecificationFormData = z.infer<typeof specificationSchema>;

interface SpecificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSpec?: Specification | null;
  onSuccess: () => void;
}

export function SpecificationModal({
  open,
  onOpenChange,
  editingSpec,
  onSuccess,
}: SpecificationModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!editingSpec;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SpecificationFormData>({
    resolver: zodResolver(specificationSchema),
    defaultValues: {
      name: '',
      length: 0,
      width: 0,
      height: undefined,
      unit: 'mm',
      resolution: '',
    },
  });

  const unit = watch('unit');

  // 当 editingSpec 变化时，更新表单值
  useEffect(() => {
    if (open) {
      if (editingSpec) {
        setValue('name', editingSpec.name);
        setValue('length', editingSpec.length);
        setValue('width', editingSpec.width);
        setValue('height', editingSpec.height);
        setValue('unit', editingSpec.unit);
        setValue('resolution', editingSpec.resolution || '');
      } else {
        reset({
          name: '',
          length: 0,
          width: 0,
          height: undefined,
          unit: 'mm',
          resolution: '',
        });
      }
    }
  }, [open, editingSpec, setValue, reset]);

  const onSubmit = async (data: SpecificationFormData) => {
    setLoading(true);
    try {
      if (isEditMode && editingSpec) {
        await specificationApi.update(editingSpec._id, data);
        toast.success('规格更新成功');
      } else {
        await specificationApi.create(data);
        toast.success('规格创建成功');
      }
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error(isEditMode ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '编辑规格' : '创建规格'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 规格名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">规格名称</Label>
            <Input
              id="name"
              placeholder="例如：标准16开"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* 尺寸 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="length">长度</Label>
              <Input
                id="length"
                type="number"
                placeholder="长"
                {...register('length', { valueAsNumber: true })}
              />
              {errors.length && (
                <p className="text-sm text-destructive">{errors.length.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">宽度</Label>
              <Input
                id="width"
                type="number"
                placeholder="宽"
                {...register('width', { valueAsNumber: true })}
              />
              {errors.width && (
                <p className="text-sm text-destructive">{errors.width.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">高度（可选）</Label>
              <Input
                id="height"
                type="number"
                placeholder="高"
                {...register('height', { 
                  setValueAs: (v) => v === '' || v === null || v === undefined ? undefined : Number(v)
                })}
              />
            </div>
          </div>

          {/* 单位 */}
          <div className="space-y-2">
            <Label>单位</Label>
            <Select value={unit} onValueChange={(value) => setValue('unit', value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择单位" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mm">毫米 (mm)</SelectItem>
                <SelectItem value="cm">厘米 (cm)</SelectItem>
                <SelectItem value="px">像素 (px)</SelectItem>
                <SelectItem value="in">英寸 (in)</SelectItem>
              </SelectContent>
            </Select>
            {errors.unit && (
              <p className="text-sm text-destructive">{errors.unit.message}</p>
            )}
          </div>

          {/* 分辨率 */}
          <div className="space-y-2">
            <Label htmlFor="resolution">分辨率（可选）</Label>
            <Input
              id="resolution"
              placeholder="例如：300dpi"
              {...register('resolution')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : isEditMode ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
