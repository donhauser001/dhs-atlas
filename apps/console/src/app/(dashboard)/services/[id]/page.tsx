'use client';

import * as React from 'react';
import { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { EntityDetail, type EntityDetailConfig, Badge } from '@dhs-atlas/ui';
import {
  Edit,
  Trash2,
  Archive,
  CheckCircle,
  Copy,
  ExternalLink,
  Clock,
  DollarSign,
  FileText,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

// ============ 类型定义 ============

interface Service {
  id: string;
  name: string;
  code: string;
  serviceType: 'standard' | 'custom' | 'consulting';
  category: string;
  status: 'draft' | 'active' | 'archived';
  basePrice: number;
  unit: string;
  description: string;
  deliverables: string[];
  estimatedDays: number;
  requirements: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  // 关联统计
  orderCount: number;
  quoteCount: number;
  projectCount: number;
  revenue: number;
}

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

// ============ Mock 数据 ============

const mockServices: Record<string, Service> = {
  'svc-001': {
    id: 'svc-001',
    name: '企业官网设计与开发',
    code: 'SVC-WEB-001',
    serviceType: 'standard',
    category: '网站开发',
    status: 'active',
    basePrice: 28000,
    unit: '套',
    description:
      '为企业提供专业的官方网站设计与开发服务，包含首页设计、5个内页设计、响应式适配、SEO基础优化、后台管理系统。',
    deliverables: ['UI设计稿（Figma/Sketch）', 'HTML/CSS/JS源代码', '响应式适配', 'SEO基础配置', '部署上线服务'],
    requirements: '客户需提供：企业介绍资料、产品/服务信息、联系方式、LOGO源文件（如有）',
    notes: '标准周期15个工作日，加急可压缩至10个工作日（加收30%）',
    estimatedDays: 15,
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-20T14:30:00Z',
    orderCount: 12,
    quoteCount: 28,
    projectCount: 10,
    revenue: 336000,
  },
  'svc-002': {
    id: 'svc-002',
    name: '移动端APP开发',
    code: 'SVC-APP-001',
    serviceType: 'standard',
    category: 'APP开发',
    status: 'active',
    basePrice: 88000,
    unit: '套',
    description: 'iOS/Android双端开发，含UI设计、后端接口、上架指导',
    deliverables: ['UI设计稿', '源代码', '测试报告', '上架协助'],
    requirements: '需提供详细需求文档',
    notes: '复杂功能另计',
    estimatedDays: 45,
    createdAt: '2024-11-15T09:00:00Z',
    updatedAt: '2024-12-18T16:20:00Z',
    orderCount: 5,
    quoteCount: 15,
    projectCount: 4,
    revenue: 440000,
  },
  'svc-007': {
    id: 'svc-007',
    name: 'UI/UX设计咨询',
    code: 'SVC-UX-001',
    serviceType: 'consulting',
    category: '设计咨询',
    status: 'draft',
    basePrice: 5000,
    unit: '天',
    description: '产品用户体验评估、设计规范制定、可用性测试',
    deliverables: ['评估报告', '设计规范', '改进建议'],
    requirements: '需提供产品访问权限',
    notes: '草稿状态，待定价审核',
    estimatedDays: 5,
    createdAt: '2024-12-20T14:00:00Z',
    updatedAt: '2024-12-20T14:00:00Z',
    orderCount: 0,
    quoteCount: 3,
    projectCount: 0,
    revenue: 0,
  },
};

const mockTimeline: Record<string, TimelineEvent[]> = {
  'svc-001': [
    {
      id: 'evt-1',
      type: 'order.created',
      title: '新订单创建',
      description: '客户「深圳创新科技」下单购买此服务',
      timestamp: '2024-12-20T10:30:00Z',
      actor: '系统',
    },
    {
      id: 'evt-2',
      type: 'price.updated',
      title: '价格调整',
      description: '基准价格从 ¥25,000 调整为 ¥28,000',
      timestamp: '2024-12-15T14:20:00Z',
      actor: '张经理',
    },
    {
      id: 'evt-3',
      type: 'project.completed',
      title: '项目交付',
      description: '客户「杭州数字」的网站项目已交付',
      timestamp: '2024-12-10T16:00:00Z',
      actor: '李工程师',
    },
    {
      id: 'evt-4',
      type: 'quote.sent',
      title: '报价发送',
      description: '向客户「北京智联」发送报价单',
      timestamp: '2024-12-08T09:15:00Z',
      actor: '销售小王',
    },
    {
      id: 'evt-5',
      type: 'status.changed',
      title: '状态变更',
      description: '服务状态从「草稿」变更为「已上架」',
      timestamp: '2024-12-01T10:00:00Z',
      actor: '张经理',
    },
    {
      id: 'evt-6',
      type: 'service.created',
      title: '服务创建',
      description: '创建了服务「企业官网设计与开发」',
      timestamp: '2024-12-01T10:00:00Z',
      actor: '张经理',
    },
  ],
  'svc-007': [
    {
      id: 'evt-1',
      type: 'service.created',
      title: '服务创建',
      description: '创建了服务「UI/UX设计咨询」',
      timestamp: '2024-12-20T14:00:00Z',
      actor: '产品经理',
    },
  ],
};

// ============ 状态映射 ============

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: '草稿', variant: 'secondary' },
  active: { label: '已上架', variant: 'default' },
  archived: { label: '已归档', variant: 'outline' },
};

const serviceTypeMap: Record<string, string> = {
  standard: '标准服务',
  custom: '定制服务',
  consulting: '咨询服务',
};

// ============ 工具函数 ============

function formatPrice(price: number): string {
  return `¥${price.toLocaleString('zh-CN')}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============ 页面组件 ============

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ServiceDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading] = useState(false);

  // 获取服务数据（mock）
  const service = mockServices[id] || mockServices['svc-001'];
  const timeline = mockTimeline[id] || mockTimeline['svc-001'];

  // 格式化时间线事件
  const formattedTimeline = useMemo(() => {
    return timeline.map((event) => ({
      id: event.id,
      eventType: event.type,
      actorType: 'user' as const,
      actorName: event.actor,
      description: event.description || event.title,
      timestamp: event.timestamp,
    }));
  }, [timeline]);

  // 操作处理
  const handleEdit = () => {
    router.push(`/services/${id}/edit`);
  };

  const handlePublish = () => {
    toast.success(`服务「${service.name}」已上架`);
  };

  const handleArchive = () => {
    if (confirm(`确定要归档服务「${service.name}」吗？归档后客户将无法下单。`)) {
      toast.success(`服务「${service.name}」已归档`);
    }
  };

  const handleDelete = () => {
    if (confirm(`确定要删除服务「${service.name}」吗？此操作无法撤销。`)) {
      toast.success(`服务「${service.name}」已删除`);
      router.push('/services');
    }
  };

  const handleDuplicate = () => {
    toast.success('服务已复制，正在跳转编辑页...');
    router.push(`/services/new?copy=${id}`);
  };

  const handleCreateQuote = () => {
    router.push(`/quotes/new?serviceId=${id}`);
  };

  // EntityDetail 配置
  const config: EntityDetailConfig<Service> = {
    title: (entity) => entity.name,
    subtitle: (entity) => `服务编号：${entity.code}`,

    status: {
      key: 'status',
      render: (value) => {
        const status = statusMap[value as string];
        return status ? (
          <Badge variant={status.variant}>{status.label}</Badge>
        ) : (
          String(value)
        );
      },
    },

    // 主动作 - 根据状态动态显示
    primaryAction: (entity) => {
      if (entity.status === 'draft') {
        return {
          key: 'publish',
          label: '发布上架',
          icon: CheckCircle,
          onClick: handlePublish,
        };
      }
      if (entity.status === 'active') {
        return {
          key: 'createQuote',
          label: '创建报价',
          icon: FileText,
          onClick: handleCreateQuote,
        };
      }
      return null;
    },

    // 次要动作
    secondaryActions: (entity) => {
      const actions: Array<{
        key: string;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
        variant: 'default' | 'destructive' | 'outline';
        onClick: () => void;
      }> = [
          {
            key: 'edit',
            label: '编辑',
            icon: Edit,
            variant: 'outline',
            onClick: handleEdit,
          },
          {
            key: 'duplicate',
            label: '复制',
            icon: Copy,
            variant: 'outline',
            onClick: handleDuplicate,
          },
        ];

      if (entity.status === 'active') {
        actions.push({
          key: 'archive',
          label: '归档',
          icon: Archive,
          variant: 'outline',
          onClick: handleArchive,
        });
      }

      if (entity.status !== 'active') {
        actions.push({
          key: 'delete',
          label: '删除',
          icon: Trash2,
          variant: 'destructive',
          onClick: handleDelete,
        });
      }

      return actions;
    },

    // 详情字段
    fields: (entity) => [
      {
        key: 'serviceType',
        label: '服务类型',
        value: serviceTypeMap[entity.serviceType],
      },
      {
        key: 'category',
        label: '服务分类',
        value: entity.category,
      },
      {
        key: 'basePrice',
        label: '基准价格',
        value: `${formatPrice(entity.basePrice)} / ${entity.unit}`,
      },
      {
        key: 'estimatedDays',
        label: '预计工期',
        value: `${entity.estimatedDays} 个工作日`,
      },
      {
        key: 'description',
        label: '服务描述',
        value: entity.description,
      },
      {
        key: 'deliverables',
        label: '交付物',
        value: entity.deliverables.join('、'),
      },
      {
        key: 'requirements',
        label: '客户需提供',
        value: entity.requirements,
      },
      {
        key: 'notes',
        label: '备注',
        value: entity.notes,
      },
      {
        key: 'createdAt',
        label: '创建时间',
        value: formatDateTime(entity.createdAt),
      },
      {
        key: 'updatedAt',
        label: '最后更新',
        value: formatDateTime(entity.updatedAt),
      },
    ],

    // 关联对象
    relatedObjects: (entity) => [
      {
        type: 'orders',
        label: '相关订单',
        items: entity.orderCount > 0
          ? [{ id: '1', title: `共 ${entity.orderCount} 个订单`, status: 'active' }]
          : [],
        emptyMessage: '暂无订单',
        createAction:
          entity.status === 'active'
            ? {
              label: '创建订单',
              onClick: () => router.push(`/orders/new?serviceId=${entity.id}`),
            }
            : undefined,
      },
      {
        type: 'quotes',
        label: '相关报价',
        items: entity.quoteCount > 0
          ? [{ id: '1', title: `共 ${entity.quoteCount} 个报价`, status: 'pending' }]
          : [],
        emptyMessage: '暂无报价',
        createAction: {
          label: '创建报价',
          onClick: () => router.push(`/quotes/new?serviceId=${entity.id}`),
        },
      },
      {
        type: 'projects',
        label: '相关项目',
        items: entity.projectCount > 0
          ? [{ id: '1', title: `共 ${entity.projectCount} 个项目`, status: 'in_progress' }]
          : [],
        emptyMessage: '暂无项目',
      },
    ],

    // 标签页
    tabs: [
      {
        key: 'overview',
        label: '概览',
        badge: undefined,
        content: (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Package className="h-4 w-4" />
                订单数
              </div>
              <div className="text-2xl font-semibold">{service.orderCount}</div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <FileText className="h-4 w-4" />
                报价数
              </div>
              <div className="text-2xl font-semibold">{service.quoteCount}</div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Clock className="h-4 w-4" />
                进行中项目
              </div>
              <div className="text-2xl font-semibold">{service.projectCount}</div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                累计收入
              </div>
              <div className="text-2xl font-semibold">{formatPrice(service.revenue)}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'deliverables',
        label: '交付物',
        badge: service.deliverables.length,
        content: (
          <div className="space-y-3">
            {service.deliverables.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {index + 1}
                  </span>
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        key: 'pricing',
        label: '定价',
        content: (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-2">基准定价</h4>
              <div className="text-3xl font-bold text-primary">
                {formatPrice(service.basePrice)}
                <span className="text-lg font-normal text-muted-foreground">
                  /{service.unit}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-2">预计工期</h4>
              <div className="text-lg">{service.estimatedDays} 个工作日</div>
              <p className="text-sm text-muted-foreground mt-1">
                {service.notes}
              </p>
            </div>
          </div>
        ),
      },
    ],

    // 时间线
    timeline: {
      events: formattedTimeline,
    },

    // 评论
    comments: {
      enabled: true,
      items: [],
      onSubmit: async (content) => {
        toast.success('评论已添加');
      },
    },
  };

  return (
    <EntityDetail
      config={config}
      entity={service}
      isLoading={isLoading}
      error={null}
      onBack={() => router.push('/services')}
      onRetry={() => { }}
    />
  );
}
