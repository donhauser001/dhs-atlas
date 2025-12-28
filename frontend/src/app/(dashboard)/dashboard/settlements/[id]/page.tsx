'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSettlement, useUpdateSettlement } from '@/hooks/queries/use-settlements';
import { format } from 'date-fns';

export default function SettlementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const settlementId = params.id as string;

  const { data, isLoading } = useSettlement(settlementId);
  const updateSettlement = useUpdateSettlement();

  const settlement = data?.success ? data.data : null;

  const handleStatusChange = (status: 'pending' | 'partial' | 'completed') => {
    updateSettlement.mutate({
      id: settlementId,
      data: { status },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            待结算
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            部分结算
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            已结算
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (!settlement) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <p className="text-muted-foreground">结算单不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{settlement.settlementNo}</h1>
              {getStatusBadge(settlement.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              创建于 {format(new Date(settlement.createdAt), 'yyyy-MM-dd HH:mm')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：结算明细 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">结算明细</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>任务名称</TableHead>
                    <TableHead className="text-right">单价</TableHead>
                    <TableHead className="text-right">数量</TableHead>
                    <TableHead className="text-right">小计</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlement.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{item.taskName}</span>
                          {item.isDamaged && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              损坏 {item.damagedPercentage}%
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        ¥{item.settlementUnitPrice.toLocaleString()}
                        {item.unit && <span className="text-muted-foreground">/{item.unit}</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.settlementQuantity}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ¥{item.subtotal.toLocaleString('zh-CN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">小计</span>
                    <span>
                      ¥{settlement.totalAmount.toLocaleString('zh-CN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {settlement.totalIncomeAmount !== undefined && settlement.totalIncomeAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">已回款</span>
                      <span className="text-green-600">
                        -¥{settlement.totalIncomeAmount.toLocaleString('zh-CN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>应收金额</span>
                    <span className="text-lg">
                      ¥{(settlement.totalAmount - (settlement.totalIncomeAmount || 0)).toLocaleString('zh-CN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {settlement.totalAmountInWords && (
                    <p className="text-xs text-muted-foreground text-right">
                      大写：{settlement.totalAmountInWords}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 备注 */}
          {settlement.remark && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">备注</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{settlement.remark}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧：信息卡片 */}
        <div className="space-y-6">
          {/* 关联信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">关联信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">项目</p>
                  <p
                    className="text-sm text-primary cursor-pointer hover:underline"
                    onClick={() => router.push(`/dashboard/projects/${settlement.projectId}`)}
                  >
                    {settlement.projectName}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">客户</p>
                  <p
                    className="text-sm text-primary cursor-pointer hover:underline"
                    onClick={() => router.push(`/dashboard/clients/${settlement.clientId}`)}
                  >
                    {settlement.clientName}
                  </p>
                </div>
              </div>
              {settlement.contactNames && settlement.contactNames.length > 0 && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">联系人</p>
                    <p className="text-sm text-muted-foreground">
                      {settlement.contactNames.join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 结算信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">结算信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">结算状态</span>
                {getStatusBadge(settlement.status)}
              </div>
              {settlement.settledAmount !== undefined && settlement.settledAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">已结算金额</span>
                  <span className="text-sm font-medium">
                    ¥{settlement.settledAmount.toLocaleString()}
                  </span>
                </div>
              )}
              {settlement.settledDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">结算日期</span>
                  <span className="text-sm">
                    {format(new Date(settlement.settledDate), 'yyyy-MM-dd')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 状态操作 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">状态操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {settlement.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleStatusChange('partial')}
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    标记部分结算
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => handleStatusChange('completed')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    标记已结算
                  </Button>
                </>
              )}
              {settlement.status === 'partial' && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusChange('completed')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  标记已结算
                </Button>
              )}
              {settlement.status === 'completed' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusChange('pending')}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  重置为待结算
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
