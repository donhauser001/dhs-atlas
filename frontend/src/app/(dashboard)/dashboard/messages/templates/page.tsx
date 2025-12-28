'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Mail,
  CheckCircle,
  XCircle,
  Copy,
  MessageSquare,
  Bell,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

// 消息模板类型
interface MessageTemplate {
  _id: string;
  name: string;
  code: string;
  type: 'email' | 'sms' | 'notification';
  subject: string;
  content: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// 模拟数据
const mockTemplates: MessageTemplate[] = [
  {
    _id: '1',
    name: '项目启动通知',
    code: 'PROJECT_START',
    type: 'email',
    subject: '您的项目【{{projectName}}】已启动',
    content: '尊敬的{{clientName}}，您的项目【{{projectName}}】已正式启动...',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    _id: '2',
    name: '付款提醒',
    code: 'PAYMENT_REMINDER',
    type: 'sms',
    subject: '',
    content: '【唐好思】您有一笔待付款订单，金额{{amount}}元，请及时处理。',
    status: 'active',
    createdAt: '2024-01-20',
  },
  {
    _id: '3',
    name: '项目完成通知',
    code: 'PROJECT_COMPLETE',
    type: 'notification',
    subject: '',
    content: '您的项目【{{projectName}}】已完成，请查收交付文件。',
    status: 'active',
    createdAt: '2024-02-01',
  },
  {
    _id: '4',
    name: '账户注册欢迎',
    code: 'WELCOME',
    type: 'email',
    subject: '欢迎加入唐好思',
    content: '尊敬的{{userName}}，欢迎您注册成为唐好思用户...',
    status: 'inactive',
    createdAt: '2024-02-10',
  },
];

export default function MessageTemplatesPage() {
  const [loading] = useState(false);
  const [templates] = useState<MessageTemplate[]>(mockTemplates);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    code: '',
    type: 'email' as 'email' | 'sms' | 'notification',
    subject: '',
    content: '',
  });

  const getTypeBadge = (type: MessageTemplate['type']) => {
    const configs = {
      email: { label: '邮件', icon: Mail, className: 'bg-blue-500/10 text-blue-600' },
      sms: { label: '短信', icon: MessageSquare, className: 'bg-green-500/10 text-green-600' },
      notification: { label: '站内通知', icon: Bell, className: 'bg-purple-500/10 text-purple-600' },
    };
    const config = configs[type];
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleCreate = () => {
    if (!newTemplate.name || !newTemplate.code) {
      toast.error('请填写模板名称和编码');
      return;
    }
    toast.success('消息模板创建成功');
    setCreateDialogOpen(false);
    setNewTemplate({
      name: '',
      code: '',
      type: 'email',
      subject: '',
      content: '',
    });
  };

  const handleDelete = () => {
    if (deleteId) {
      toast.success('消息模板已删除');
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<MessageTemplate>[] = [
    {
      accessorKey: 'name',
      header: '模板名称',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.name}</span>
          <p className="text-xs text-muted-foreground font-mono">{row.original.code}</p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: '类型',
      cell: ({ row }) => getTypeBadge(row.original.type),
    },
    {
      accessorKey: 'subject',
      header: '主题/内容预览',
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1 max-w-[200px]">
          {row.original.subject || row.original.content}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) =>
        row.original.status === 'active' ? (
          <Badge className="bg-green-500/10 text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            启用
          </Badge>
        ) : (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            禁用
          </Badge>
        ),
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'yyyy-MM-dd'),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              预览
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              复制
            </DropdownMenuItem>
            <DropdownMenuItem>
              {row.original.status === 'active' ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  禁用
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  启用
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteId(row.original._id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // 筛选
  const filteredTemplates = typeFilter === 'all'
    ? templates
    : templates.filter((t) => t.type === typeFilter);

  // 统计
  const emailCount = templates.filter((t) => t.type === 'email').length;
  const smsCount = templates.filter((t) => t.type === 'sms').length;
  const notificationCount = templates.filter((t) => t.type === 'notification').length;

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="消息模板"
        description="管理系统消息模板"
        action={{
          label: '新建模板',
          onClick: () => setCreateDialogOpen(true),
        }}
      >
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="类型筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="email">邮件</SelectItem>
            <SelectItem value="sms">短信</SelectItem>
            <SelectItem value="notification">站内通知</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">模板总数</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">邮件模板</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">短信模板</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{smsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">通知模板</CardTitle>
            <Bell className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 模板列表 */}
      <DataTable
        columns={columns}
        data={filteredTemplates}
        searchKey="name"
        searchPlaceholder="搜索模板名称..."
      />

      {/* 新建对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建消息模板</DialogTitle>
            <DialogDescription>
              创建新的消息模板，支持使用 {'{{变量名}}'} 格式的占位符
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">模板名称 *</Label>
                <Input
                  id="name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="请输入模板名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">模板编码 *</Label>
                <Input
                  id="code"
                  value={newTemplate.code}
                  onChange={(e) => setNewTemplate({ ...newTemplate, code: e.target.value.toUpperCase() })}
                  placeholder="如：PROJECT_START"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">模板类型</Label>
              <Select
                value={newTemplate.type}
                onValueChange={(value) => setNewTemplate({ ...newTemplate, type: value as 'email' | 'sms' | 'notification' })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">邮件</SelectItem>
                  <SelectItem value="sms">短信</SelectItem>
                  <SelectItem value="notification">站内通知</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newTemplate.type === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="subject">邮件主题</Label>
                <Input
                  id="subject"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  placeholder="请输入邮件主题"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="content">模板内容 *</Label>
              <Textarea
                id="content"
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                placeholder="请输入模板内容，可使用 {{变量名}} 格式的占位符"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个消息模板吗？使用此模板的消息发送功能将受到影响。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
