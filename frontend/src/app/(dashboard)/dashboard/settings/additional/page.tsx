'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Settings2,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  Percent,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AdditionalConfig,
  CreateConfigData,
  UpdateConfigData,
} from '@/api/additionalConfig';
import {
  useAdditionalConfigs,
  useCreateAdditionalConfig,
  useUpdateAdditionalConfig,
  useDeleteAdditionalConfig,
  useToggleAdditionalConfigStatus,
  useCopyAdditionalConfig,
} from '@/hooks/queries/use-additional-configs';
import { format } from 'date-fns';

export default function AdditionalConfigsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AdditionalConfig | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateConfigData>({
    name: '',
    description: '',
    initialDraftCount: 2,
    maxDraftCount: 5,
    mainCreatorRatio: 0.7,
    assistantRatio: 0.3,
  });

  const { data: configs, isLoading } = useAdditionalConfigs();
  const createConfig = useCreateAdditionalConfig();
  const updateConfig = useUpdateAdditionalConfig();
  const deleteConfig = useDeleteAdditionalConfig();
  const toggleStatus = useToggleAdditionalConfigStatus();
  const copyConfig = useCopyAdditionalConfig();

  const configList = configs || [];

  const handleCreate = () => {
    setEditingConfig(null);
    setFormData({
      name: '',
      description: '',
      initialDraftCount: 2,
      maxDraftCount: 5,
      mainCreatorRatio: 0.7,
      assistantRatio: 0.3,
    });
    setModalOpen(true);
  };

  const handleEdit = (config: AdditionalConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      description: config.description,
      initialDraftCount: config.initialDraftCount,
      maxDraftCount: config.maxDraftCount,
      mainCreatorRatio: config.mainCreatorRatio,
      assistantRatio: config.assistantRatio,
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingConfig) {
      updateConfig.mutate(
        { id: editingConfig._id, data: formData as UpdateConfigData },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      createConfig.mutate(formData, {
        onSuccess: () => setModalOpen(false),
      });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteConfig.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const columns: ColumnDef<AdditionalConfig>[] = [
    {
      accessorKey: 'name',
      header: '配置名称',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: '描述',
      cell: ({ row }) => (
        <span className="text-muted-foreground max-w-[200px] truncate block">
          {row.original.description || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'draftCount',
      header: '方案数量',
      cell: ({ row }) => (
        <span>
          {row.original.initialDraftCount} - {row.original.maxDraftCount}
        </span>
      ),
    },
    {
      accessorKey: 'ratio',
      header: '绩效比例',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            主创 {(row.original.mainCreatorRatio * 100).toFixed(0)}%
          </Badge>
          <Badge variant="secondary" className="text-xs">
            助理 {(row.original.assistantRatio * 100).toFixed(0)}%
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) =>
        row.original.status === 'active' ? (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
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
      accessorKey: 'updateTime',
      header: '更新时间',
      cell: ({ row }) =>
        row.original.updateTime
          ? format(new Date(row.original.updateTime), 'yyyy-MM-dd HH:mm')
          : '—',
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
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyConfig.mutate(row.original._id)}>
              <Copy className="mr-2 h-4 w-4" />
              复制
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleStatus.mutate(row.original._id)}>
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

  if (isLoading) {
    return <PageLoading />;
  }

  // 统计
  const activeCount = configList.filter((c) => c.status === 'active').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="附加配置"
        description="管理项目的附加配置选项"
        action={{
          label: '新建配置',
          onClick: handleCreate,
        }}
      />

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">配置总数</CardTitle>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configList.length}</div>
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
            <CardTitle className="text-sm font-medium">已禁用</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configList.length - activeCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 配置列表 */}
      <DataTable
        columns={columns}
        data={configList}
        searchKey="name"
        searchPlaceholder="搜索配置名称..."
      />

      {/* 新建/编辑弹窗 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? '编辑配置' : '新建配置'}
            </DialogTitle>
            <DialogDescription>
              {editingConfig
                ? '修改附加配置信息'
                : '创建一个新的附加配置'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">配置名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="输入配置名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="输入配置描述"
                rows={2}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="initialDraftCount">
                  <FileText className="inline h-3 w-3 mr-1" />
                  初稿方案数量
                </Label>
                <Input
                  id="initialDraftCount"
                  type="number"
                  min={1}
                  value={formData.initialDraftCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialDraftCount: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDraftCount">
                  <FileText className="inline h-3 w-3 mr-1" />
                  最多方案数量
                </Label>
                <Input
                  id="maxDraftCount"
                  type="number"
                  min={1}
                  value={formData.maxDraftCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDraftCount: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mainCreatorRatio">
                  <Percent className="inline h-3 w-3 mr-1" />
                  主创绩效比例
                </Label>
                <Input
                  id="mainCreatorRatio"
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={formData.mainCreatorRatio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mainCreatorRatio: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assistantRatio">
                  <Users className="inline h-3 w-3 mr-1" />
                  助理绩效比例
                </Label>
                <Input
                  id="assistantRatio"
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={formData.assistantRatio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assistantRatio: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.name ||
                createConfig.isPending ||
                updateConfig.isPending
              }
            >
              {createConfig.isPending || updateConfig.isPending
                ? '保存中...'
                : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除配置</AlertDialogTitle>
            <AlertDialogDescription>
              删除后该配置将无法恢复。确定要删除吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
