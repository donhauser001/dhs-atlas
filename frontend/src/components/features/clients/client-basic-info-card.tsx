'use client';

import { useRouter } from 'next/navigation';
import { MapPin, FileCheck, Receipt, FileText, LucideIcon, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Client } from '@/api/clients';
import { Quotation } from '@/api/quotations';
import { toast } from 'sonner';

interface ClientBasicInfoCardProps {
  client: Client;
  stats: {
    totalProjects: number;
    completedProjects: number;
    totalAmount: number;
    contactCount: number;
  };
  selectedQuotation?: Quotation | null;
}

// 信息项组件 - 与项目详情页 BasicInfoCard 保持一致
function InfoItem({
  label,
  value,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: string | React.ReactNode;
  icon: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 ${onClick ? 'group cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="w-8 h-8 rounded-md bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {typeof value === 'string' ? (
          <p
            className={`text-sm font-medium ${onClick ? 'group-hover:text-primary transition-colors' : ''}`}
          >
            {value || '—'}
          </p>
        ) : (
          <div className="text-sm font-medium">{value}</div>
        )}
      </div>
    </div>
  );
}

// 统计卡片组件 - 与项目详情页保持一致
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function ClientBasicInfoCard({
  client,
  stats,
  selectedQuotation,
}: ClientBasicInfoCardProps) {
  const router = useRouter();

  const handleCopyInvoiceInfo = () => {
    if (client.invoiceInfo) {
      navigator.clipboard.writeText(client.invoiceInfo);
      toast.success('开票信息已复制到剪贴板');
    }
  };

  const handleQuotationClick = () => {
    if (selectedQuotation) {
      router.push(`/dashboard/pricing/quotations/${selectedQuotation._id}`);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* 统计数据 - 与项目详情页保持一致 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatCard label="关联项目" value={stats.totalProjects} />
          <StatCard label="已完成" value={stats.completedProjects} />
          <StatCard label="项目总额" value={`¥${stats.totalAmount.toLocaleString()}`} />
          <StatCard label="联系人" value={stats.contactCount} />
        </div>

        <Separator className="my-[35px]" />

        {/* 详细信息 - 四列布局 */}
        <div className="grid grid-cols-4 gap-4">
          <InfoItem
            label="地址"
            value={client.address || '—'}
            icon={MapPin}
          />

          <InfoItem
            label="发票类型"
            value={client.invoiceType || '—'}
            icon={FileCheck}
          />

          <InfoItem
            label="关联报价单"
            value={
              selectedQuotation
                ? selectedQuotation.name
                : client.quotationId
                  ? '加载中...'
                  : '—'
            }
            icon={Receipt}
            onClick={selectedQuotation ? handleQuotationClick : undefined}
          />

          <InfoItem
            label="开票信息"
            value={
              <div className="w-full flex flex-col gap-2">
                <p className="text-sm font-medium whitespace-pre-wrap break-words leading-relaxed">
                  {client.invoiceInfo || '—'}
                </p>
                {client.invoiceInfo && client.invoiceType && client.invoiceType !== '不开票' && (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-5 px-1.5 text-xs self-start"
                    onClick={handleCopyInvoiceInfo}
                  >
                    <Copy className="h-2.5 w-2.5 mr-0.5" />
                    复制
                  </Button>
                )}
              </div>
            }
            icon={FileText}
          />
        </div>

        {/* 客户简介 */}
        {client.summary && (
          <>
            <Separator className="my-[35px]" />
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">客户简介</p>
                <p className="text-sm font-medium whitespace-pre-wrap break-words">
                  {client.summary}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
