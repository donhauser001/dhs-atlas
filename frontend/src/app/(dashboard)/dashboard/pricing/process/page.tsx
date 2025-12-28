'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  GitBranch,
  CheckCircle,
  XCircle,
  Plus,
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

// 服务流程类型
interface ServiceProcess {
  _id: string;
  name: string;
  description: string;
  steps: string[];
  status: 'active' | 'inactive';
  serviceCount: number;
  createdAt: string;
}

// 模拟数据
const mockProcesses: ServiceProcess[] = [
  {
    _id: '1',
    name: '品牌VI设计流程',
    description: '完整的品牌VI设计服务流程',
    steps: ['需求调研', '概念设计', '初稿呈现', '修改完善', '定稿输出', '源文件交付'],
    status: 'active',
    serviceCount: 5,
    createdAt: '2024-01-15',
  },
  {
    _id: '2',
    name: '网站设计流程',
    description: '企业官网设计服务流程',
    steps: ['需求分析', '原型设计', '视觉设计', '前端开发', '测试验收', '上线部署'],
    status: 'active',
    serviceCount: 3,
    createdAt: '2024-01-20',
  },
  {
    _id: '3',
    name: '包装设计流程',
    description: '产品包装设计服务流程',
    steps: ['需求沟通', '创意提案', '设计执行', '打样确认', '印刷跟进'],
    status: 'inactive',
    serviceCount: 2,
    createdAt: '2024-02-01',
  },
];

export default function ServiceProcessPage() {
  const [loading] = useState(false);
  const [processes] = useState<ServiceProcess[]>(mockProcesses);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProcess, setNewProcess] = useState({
    name: '',
    description: '',
    steps: [''],
  });

  const handleCreate = () => {
    if (!newProcess.name) {
      toast.error('请填写流程名称');
      return;
    }
    toast.success('服务流程创建成功');
    setCreateDialogOpen(false);
    setNewProcess({ name: '', description: '', steps: [''] });
  };

  const handleDelete = () => {
    if (deleteId) {
      toast.success('服务流程已删除');
      setDeleteId(null);
    }
  };

  const addStep = () => {
    setNewProcess({ ...newProcess, steps: [...newProcess.steps, ''] });
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...newProcess.steps];
    newSteps[index] = value;
    setNewProcess({ ...newProcess, steps: newSteps });
  };

  const removeStep = (index: number) => {
    if (newProcess.steps.length > 1) {
      const newSteps = newProcess.steps.filter((_, i) => i !== index);
      setNewProcess({ ...newProcess, steps: newSteps });
    }
  };

  const columns: ColumnDef<ServiceProcess>[] = [
    {
      accessorKey: 'name',
      header: '流程名称',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.name}</span>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {row.original.description}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'steps',
      header: '流程步骤',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[300px]">
          {row.original.steps.slice(0, 3).map((step, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {i + 1}. {step}
            </Badge>
          ))}
          {row.original.steps.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{row.original.steps.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'serviceCount',
      header: '关联服务',
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.serviceCount} 项</Badge>
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
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
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
  const filteredProcesses = statusFilter === 'all'
    ? processes
    : processes.filter((p) => p.status === statusFilter);

  // 统计
  const activeCount = processes.filter((p) => p.status === 'active').length;
  const totalSteps = processes.reduce((sum, p) => sum + p.steps.length, 0);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="服务流程"
        description="管理服务的标准化流程"
        action={{
          label: '新建流程',
          onClick: () => setCreateDialogOpen(true),
        }}
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">启用</SelectItem>
            <SelectItem value="inactive">禁用</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">流程总数</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">启用中</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总步骤数</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSteps}</div>
          </CardContent>
        </Card>
      </div>

      {/* 流程列表 */}
      <DataTable
        columns={columns}
        data={filteredProcesses}
        searchKey="name"
        searchPlaceholder="搜索流程名称..."
      />

      {/* 新建对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建服务流程</DialogTitle>
            <DialogDescription>创建新的服务流程模板</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">流程名称 *</Label>
              <Input
                id="name"
                value={newProcess.name}
                onChange={(e) => setNewProcess({ ...newProcess, name: e.target.value })}
                placeholder="请输入流程名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">流程描述</Label>
              <Textarea
                id="description"
                value={newProcess.description}
                onChange={(e) => setNewProcess({ ...newProcess, description: e.target.value })}
                placeholder="请输入流程描述"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>流程步骤</Label>
                <Button type="button" variant="outline" size="sm" onClick={addStep}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加步骤
                </Button>
              </div>
              <div className="space-y-2">
                {newProcess.steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                    <Input
                      value={step}
                      onChange={(e) => updateStep(index, e.target.value)}
                      placeholder={`步骤 ${index + 1}`}
                    />
                    {newProcess.steps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(index)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
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
              确定要删除这个服务流程吗？关联的服务将失去流程信息。
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
