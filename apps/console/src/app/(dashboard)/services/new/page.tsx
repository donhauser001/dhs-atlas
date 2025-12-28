'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@dhs-atlas/ui';
import { ArrowLeft, Plus, Trash2, Save, Send } from 'lucide-react';
import { toast } from 'sonner';

// ============ 类型定义 ============

interface ServiceFormData {
  name: string;
  code: string;
  serviceType: 'standard' | 'custom' | 'consulting';
  category: string;
  basePrice: string;
  unit: string;
  estimatedDays: string;
  description: string;
  deliverables: string[];
  requirements: string;
  notes: string;
}

// ============ 预设数据 ============

const serviceTypes = [
  { value: 'standard', label: '标准服务', description: '固定价格和交付物的标准化服务' },
  { value: 'custom', label: '定制服务', description: '根据客户需求定制的个性化服务' },
  { value: 'consulting', label: '咨询服务', description: '按时间计费的咨询类服务' },
];

const categories = [
  '网站开发',
  'APP开发',
  '小程序开发',
  '品牌设计',
  '电商开发',
  '数据可视化',
  '营销推广',
  '技术支持',
  '设计咨询',
  '其他',
];

const units = ['套', '个', '天', '月', '小时', '页'];

// ============ 页面组件 ============

export default function NewServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyFrom = searchParams.get('copy');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: copyFrom ? '企业官网设计与开发（副本）' : '',
    code: '',
    serviceType: 'standard',
    category: '',
    basePrice: copyFrom ? '28000' : '',
    unit: '套',
    estimatedDays: copyFrom ? '15' : '',
    description: copyFrom
      ? '为企业提供专业的官方网站设计与开发服务，包含首页设计、5个内页设计、响应式适配、SEO基础优化、后台管理系统。'
      : '',
    deliverables: copyFrom
      ? ['UI设计稿（Figma/Sketch）', 'HTML/CSS/JS源代码', '响应式适配', 'SEO基础配置', '部署上线服务']
      : [''],
    requirements: copyFrom
      ? '客户需提供：企业介绍资料、产品/服务信息、联系方式、LOGO源文件（如有）'
      : '',
    notes: '',
  });

  // 更新表单字段
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // 添加交付物
  const handleAddDeliverable = () => {
    setFormData((prev) => ({
      ...prev,
      deliverables: [...prev.deliverables, ''],
    }));
  };

  // 更新交付物
  const handleDeliverableChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      deliverables: prev.deliverables.map((item, i) => (i === index ? value : item)),
    }));
  };

  // 删除交付物
  const handleRemoveDeliverable = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index),
    }));
  };

  // 保存为草稿
  const handleSaveDraft = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入服务名称');
      return;
    }

    setIsSubmitting(true);
    try {
      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('服务已保存为草稿');
      router.push('/services');
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 保存并发布
  const handlePublish = async () => {
    // 验证必填字段
    if (!formData.name.trim()) {
      toast.error('请输入服务名称');
      return;
    }
    if (!formData.category) {
      toast.error('请选择服务分类');
      return;
    }
    if (!formData.basePrice) {
      toast.error('请输入基准价格');
      return;
    }
    if (!formData.estimatedDays) {
      toast.error('请输入预计工期');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('请输入服务描述');
      return;
    }
    const validDeliverables = formData.deliverables.filter((d) => d.trim());
    if (validDeliverables.length === 0) {
      toast.error('请至少添加一个交付物');
      return;
    }

    setIsSubmitting(true);
    try {
      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('服务已发布上架');
      router.push('/services');
    } catch {
      toast.error('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {copyFrom ? '复制服务' : '新建服务'}
            </h1>
            <p className="text-muted-foreground">
              {copyFrom ? '基于现有服务创建新服务' : '创建一个新的服务产品'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            保存草稿
          </Button>
          <Button onClick={handlePublish} disabled={isSubmitting}>
            <Send className="h-4 w-4 mr-2" />
            保存并发布
          </Button>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：基本信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>服务的基本信息和定价</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    服务名称 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="如：企业官网设计与开发"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">服务编号</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="留空自动生成"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">
                    服务类型 <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {serviceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {serviceTypes.find((t) => t.value === formData.serviceType)?.description}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">
                    服务分类 <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">请选择分类</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">
                    基准价格 <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ¥
                    </span>
                    <Input
                      id="basePrice"
                      type="number"
                      value={formData.basePrice}
                      onChange={handleChange}
                      placeholder="28000"
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">计价单位</Label>
                  <select
                    id="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedDays">
                    预计工期（天） <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="estimatedDays"
                    type="number"
                    value={formData.estimatedDays}
                    onChange={handleChange}
                    placeholder="15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  服务描述 <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="详细描述服务内容、特点、适用场景等..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* 交付物卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>交付物清单</CardTitle>
              <CardDescription>客户将收到的交付物列表</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.deliverables.map((deliverable, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <Input
                    value={deliverable}
                    onChange={(e) => handleDeliverableChange(index, e.target.value)}
                    placeholder={`交付物 ${index + 1}`}
                    className="flex-1"
                  />
                  {formData.deliverables.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDeliverable(index)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={handleAddDeliverable}>
                <Plus className="h-4 w-4 mr-2" />
                添加交付物
              </Button>
            </CardContent>
          </Card>

          {/* 补充信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>补充信息</CardTitle>
              <CardDescription>客户需要提供的资料和其他备注</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requirements">客户需提供</Label>
                <textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  rows={3}
                  placeholder="如：企业介绍资料、产品信息、LOGO源文件等..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">内部备注</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="仅内部可见的备注信息..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：预览和提示 */}
        <div className="space-y-6">
          {/* 预览卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>预览</CardTitle>
              <CardDescription>服务展示效果预览</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold">
                  {formData.name || '服务名称'}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {formData.description || '服务描述'}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary">
                    ¥{formData.basePrice || '0'}
                  </span>
                  <span className="text-muted-foreground">/{formData.unit}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  预计 {formData.estimatedDays || '0'} 个工作日
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 提示卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>创建提示</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• 服务名称应简洁明了，便于客户理解</p>
              <p>• 基准价格用于快速报价参考</p>
              <p>• 交付物清单影响项目验收标准</p>
              <p>• 草稿状态的服务不会展示给客户</p>
              <p>• 发布后可随时调整价格和内容</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
