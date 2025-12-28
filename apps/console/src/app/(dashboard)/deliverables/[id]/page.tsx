'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import {
  EntityDetail,
  type EntityDetailConfig,
  Badge,
  type TimelineEvent as UITimelineEvent,
} from '@dhs-atlas/ui';
import {
  useDeliverable,
  useDeliverableTimeline,
  useSubmitDeliverable,
  useApproveDeliverable,
  useRejectDeliverable,
  type Deliverable,
  type DeliverableStatus,
} from '@dhs-atlas/api-client/hooks';
import { formatTimelineEvent } from '@dhs-atlas/api-client/hooks';
import { Edit, Upload, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const statusMap: Record<DeliverableStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: '待提交', variant: 'secondary' },
  in_progress: { label: '进行中', variant: 'default' },
  submitted: { label: '待验收', variant: 'outline' },
  approved: { label: '已通过', variant: 'default' },
  rejected: { label: '已驳回', variant: 'destructive' },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DeliverableDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: deliverable, isLoading, error, refetch } = useDeliverable(id);
  const { data: timelineData } = useDeliverableTimeline(id);

  const submitDeliverable = useSubmitDeliverable({
    onSuccess: () => {
      toast.success('交付物已提交');
      refetch();
    },
    onError: (error) => toast.error(`提交失败: ${error.message}`),
  });

  const approveDeliverable = useApproveDeliverable({
    onSuccess: () => {
      toast.success('交付物已通过验收');
      refetch();
    },
    onError: (error) => toast.error(`操作失败: ${error.message}`),
  });

  const rejectDeliverable = useRejectDeliverable({
    onSuccess: () => {
      toast.success('交付物已驳回');
      refetch();
    },
    onError: (error) => toast.error(`操作失败: ${error.message}`),
  });

  const handleReject = () => {
    const notes = prompt('请输入驳回原因');
    if (deliverable && notes !== null) {
      rejectDeliverable.mutate({ id: deliverable.id, notes });
    }
  };

  // Convert API timeline to UI timeline format
  const timeline: UITimelineEvent[] = (timelineData?.data ?? []).map((event) => {
    const { description, actorName } = formatTimelineEvent(event);
    return {
      id: event.id,
      eventType: event.eventType,
      actorType: event.actorType,
      actorName,
      description,
      timestamp: event.createdAt,
      payload: event.payload,
    };
  });

  const config: EntityDetailConfig<Deliverable> = {
    title: (entity) => entity.name,
    subtitle: (entity) => `项目: ${entity.projectId}`, // TODO: Replace with project name

    status: {
      key: 'status',
      render: (value) => {
        const status = statusMap[value as DeliverableStatus];
        return status ? (
          <Badge variant={status.variant}>{status.label}</Badge>
        ) : (
          String(value)
        );
      },
    },

    fields: (entity) => [
      { key: 'name', label: '交付物名称', value: entity.name },
      { key: 'description', label: '描述', value: entity.description },
      { key: 'projectId', label: '所属项目ID', value: entity.projectId },
      { key: 'status', label: '状态', value: statusMap[entity.status]?.label ?? entity.status },
      {
        key: 'dueDate',
        label: '截止日期',
        value: entity.dueDate ? new Date(entity.dueDate).toLocaleDateString('zh-CN') : '-',
      },
      {
        key: 'submittedAt',
        label: '提交时间',
        value: entity.submittedAt ? new Date(entity.submittedAt).toLocaleString('zh-CN') : '-',
      },
      {
        key: 'approvedAt',
        label: '验收时间',
        value: entity.approvedAt ? new Date(entity.approvedAt).toLocaleString('zh-CN') : '-',
      },
      { key: 'reviewNotes', label: '审核备注', value: entity.reviewNotes },
      {
        key: 'createdAt',
        label: '创建时间',
        value: new Date(entity.createdAt).toLocaleString('zh-CN'),
      },
    ],

    primaryAction: (entity) => {
      // State machine driven primary action
      switch (entity.status) {
        case 'pending':
        case 'in_progress':
          return {
            key: 'submit',
            label: '提交验收',
            icon: Upload,
            onClick: () => submitDeliverable.mutate(entity.id),
          };
        case 'submitted':
          return {
            key: 'approve',
            label: '通过验收',
            icon: CheckCircle,
            onClick: () => approveDeliverable.mutate(entity.id),
          };
        case 'rejected':
          return {
            key: 'resubmit',
            label: '重新提交',
            icon: RotateCcw,
            onClick: () => submitDeliverable.mutate(entity.id),
          };
        default:
          return null;
      }
    },

    secondaryActions: (entity) => [
      {
        key: 'edit',
        label: '编辑',
        icon: Edit,
        onClick: () => router.push(`/deliverables/${entity.id}/edit`),
        disabled: entity.status === 'approved',
      },
      {
        key: 'reject',
        label: '驳回',
        icon: XCircle,
        variant: 'destructive',
        onClick: handleReject,
        disabled: entity.status !== 'submitted',
      },
    ],

    relatedObjects: (entity) => [
      {
        type: 'project',
        label: '所属项目',
        items: [
          {
            id: entity.projectId,
            title: `项目 ${entity.projectId}`,
            href: `/projects/${entity.projectId}`,
          },
        ],
      },
    ],

    tabs: [
      {
        key: 'files',
        label: '附件文件',
        content: (
          <div className="text-sm text-muted-foreground">
            文件附件功能即将推出
          </div>
        ),
      },
      {
        key: 'history',
        label: '提交历史',
        content: (
          <div className="text-sm text-muted-foreground">
            提交历史记录即将推出
          </div>
        ),
      },
    ],

    timeline: {
      events: timeline,
    },

    comments: {
      enabled: true,
      items: [],
      onSubmit: async () => {
        toast.info('评论功能即将推出');
      },
    },
  };

  return (
    <EntityDetail
      config={config}
      entity={deliverable ?? null}
      isLoading={isLoading}
      error={error}
      onBack={() => router.push('/deliverables')}
      onRetry={() => refetch()}
    />
  );
}
