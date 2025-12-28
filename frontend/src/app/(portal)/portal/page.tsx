'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  FolderOpen,
  Receipt,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DashboardData {
  statistics: {
    totalProjects: number;
    activeProjects: number;
    totalContracts: number;
    pendingInvoices: number;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
  }>;
}

export default function PortalDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/client-portal/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error('获取首页数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      '进行中': { label: '进行中', variant: 'default' },
      'in_progress': { label: '进行中', variant: 'default' },
      '已完成': { label: '已完成', variant: 'secondary' },
      'completed': { label: '已完成', variant: 'secondary' },
      '待开始': { label: '待开始', variant: 'outline' },
      'pending': { label: '待开始', variant: 'outline' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const stats = data?.statistics;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">欢迎回来</h1>
        <p className="text-muted-foreground">这是您的项目和业务概览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">项目总数</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeProjects || 0} 个进行中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中项目</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeProjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              当前正在进行的项目
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">合同数量</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalContracts || 0}</div>
            <p className="text-xs text-muted-foreground">
              已签订的合同
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待付发票</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingInvoices || 0}</div>
            <p className="text-xs text-muted-foreground">
              待付款发票
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 最近项目 */}
      <Card>
        <CardHeader>
          <CardTitle>最近项目</CardTitle>
          <CardDescription>您最近的项目动态</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentProjects && data.recentProjects.length > 0 ? (
            <div className="space-y-4">
              {data.recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <Link
                      href={`/portal/projects/${project.id}`}
                      className="font-medium hover:underline"
                    >
                      {project.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      创建于 {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              暂无项目数据
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" asChild className="w-full">
              <Link href="/portal/projects">查看全部项目</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 快捷操作 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <Link href="/portal/projects">
            <CardHeader>
              <FolderOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">查看项目</CardTitle>
              <CardDescription>浏览所有项目进度和详情</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <Link href="/portal/contracts">
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">合同管理</CardTitle>
              <CardDescription>查看已签订的合同文件</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <Link href="/portal/invoices">
            <CardHeader>
              <Receipt className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">发票记录</CardTitle>
              <CardDescription>查看发票和付款状态</CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}
