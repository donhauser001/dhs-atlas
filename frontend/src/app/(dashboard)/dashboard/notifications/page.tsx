'use client';

import { useState } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Mail,
  MailOpen,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// 模拟通知数据
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  content: string;
  time: string;
  read: boolean;
  link?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: '项目审批通过',
    content: '您提交的项目「品牌VI设计」已通过审批，请及时跟进。',
    time: '5分钟前',
    read: false,
  },
  {
    id: '2',
    type: 'warning',
    title: '合同即将到期',
    content: '客户「XX科技有限公司」的服务合同将于7天后到期。',
    time: '1小时前',
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: '新任务分配',
    content: '您有一个新的设计任务「产品包装设计」已分配给您。',
    time: '2小时前',
    read: true,
  },
  {
    id: '4',
    type: 'error',
    title: '付款逾期提醒',
    content: '客户「YY广告公司」的发票已逾期15天未付款。',
    time: '昨天',
    read: true,
  },
  {
    id: '5',
    type: 'success',
    title: '收款确认',
    content: '客户「ZZ传媒」已支付款项 ¥25,000，请确认入账。',
    time: '2天前',
    read: true,
  },
];

const typeConfig = {
  info: {
    icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<string>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="消息中心" description="查看和管理系统通知">
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} 条未读</Badge>
          )}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="unread">未读</SelectItem>
              <SelectItem value="read">已读</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">全部通知</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未读</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已读</CardTitle>
            <MailOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.length - unreadCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日新增</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter((n) => n.time.includes('分钟') || n.time.includes('小时')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            全部已读
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            清空全部
          </Button>
        </div>
      </div>

      {/* 通知列表 */}
      <Card>
        <CardHeader>
          <CardTitle>通知列表</CardTitle>
          <CardDescription>
            {filteredNotifications.length > 0
              ? `共 ${filteredNotifications.length} 条通知`
              : '暂无通知'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">暂无通知</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => {
                const config = typeConfig[notification.type];
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-lg border transition-colors',
                      !notification.read && 'bg-muted/50'
                    )}
                  >
                    <div className={cn('p-2 rounded-full', config.bg)}>
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{notification.title}</h4>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {notification.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 提示信息 */}
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-muted">
              <Info className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-medium">消息中心功能说明</h4>
              <p className="text-sm text-muted-foreground mt-1">
                当前显示的是模拟数据。待后端 API 开发完成后，将接入真实的系统通知、
                任务提醒、审批消息等功能。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
