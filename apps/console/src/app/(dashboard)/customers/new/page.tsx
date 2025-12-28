'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dhs-atlas/ui';
import { useCreateCustomer, type CreateCustomerInput } from '@dhs-atlas/api-client/hooks';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NewCustomerPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    type: 'company',
    level: 'normal',
    industry: '',
    address: '',
    website: '',
    notes: '',
  });

  const createCustomer = useCreateCustomer({
    onSuccess: (customer) => {
      toast.success('客户创建成功');
      router.push(`/customers/${customer.id}`);
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('请输入客户名称');
      return;
    }

    createCustomer.mutate(formData);
  };

  const handleChange = (field: keyof CreateCustomerInput, value: string) => {
    setFormData((prev: CreateCustomerInput) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/customers')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">新建客户</h1>
          <p className="text-muted-foreground">添加新的客户信息</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>填写客户的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">客户名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="输入客户名称"
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">客户类型</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    handleChange('type', value as 'company' | 'individual')
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="选择客户类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">企业</SelectItem>
                    <SelectItem value="individual">个人</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Level */}
              <div className="space-y-2">
                <Label htmlFor="level">客户级别</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) =>
                    handleChange('level', value as 'normal' | 'important' | 'vip')
                  }
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="选择客户级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">普通</SelectItem>
                    <SelectItem value="important">重要</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label htmlFor="industry">行业</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  placeholder="输入行业"
                />
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">地址</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="输入地址"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">网站</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">备注</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="输入备注信息"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/customers')}
              >
                取消
              </Button>
              <Button type="submit" disabled={createCustomer.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {createCustomer.isPending ? '保存中...' : '保存'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

