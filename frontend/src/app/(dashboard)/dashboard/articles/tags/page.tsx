'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Tag,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';
import { format } from 'date-fns';

// 标签类型
interface ArticleTag {
  _id: string;
  name: string;
  slug: string;
  color: string;
  articleCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

// 模拟数据
const mockTags: ArticleTag[] = [
  {
    _id: '1',
    name: '设计趋势',
    slug: 'design-trends',
    color: '#3B82F6',
    articleCount: 12,
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    _id: '2',
    name: '品牌策略',
    slug: 'brand-strategy',
    color: '#10B981',
    articleCount: 8,
    status: 'active',
    createdAt: '2024-01-20',
  },
  {
    _id: '3',
    name: 'UI/UX',
    slug: 'ui-ux',
    color: '#8B5CF6',
    articleCount: 15,
    status: 'active',
    createdAt: '2024-02-01',
  },
  {
    _id: '4',
    name: '案例分享',
    slug: 'case-study',
    color: '#F59E0B',
    articleCount: 6,
    status: 'inactive',
    createdAt: '2024-02-10',
  },
];

const colorOptions = [
  { label: '蓝色', value: '#3B82F6' },
  { label: '绿色', value: '#10B981' },
  { label: '紫色', value: '#8B5CF6' },
  { label: '橙色', value: '#F59E0B' },
  { label: '红色', value: '#EF4444' },
  { label: '粉色', value: '#EC4899' },
];

export default function ArticleTagsPage() {
  const [loading] = useState(false);
  const [tags] = useState<ArticleTag[]>(mockTags);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState({
    name: '',
    slug: '',
    color: '#3B82F6',
  });

  const handleCreate = () => {
    if (!newTag.name) {
      toast.error('请填写标签名称');
      return;
    }
    toast.success('标签创建成功');
    setCreateDialogOpen(false);
    setNewTag({ name: '', slug: '', color: '#3B82F6' });
  };

  const handleDelete = () => {
    if (deleteId) {
      toast.success('标签已删除');
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<ArticleTag>[] = [
    {
      accessorKey: 'name',
      header: '标签名称',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: row.original.color }}
          />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {row.original.slug}
        </code>
      ),
    },
    {
      accessorKey: 'articleCount',
      header: '文章数量',
      cell: ({ row }) => (
        <Badge variant="secondary">
          <FileText className="h-3 w-3 mr-1" />
          {row.original.articleCount} 篇
        </Badge>
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

  // 统计
  const activeCount = tags.filter((t) => t.status === 'active').length;
  const totalArticles = tags.reduce((sum, t) => sum + t.articleCount, 0);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="文章标签"
        description="管理文章的标签"
        action={{
          label: '新建标签',
          onClick: () => setCreateDialogOpen(true),
        }}
      />

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">标签总数</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
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
            <CardTitle className="text-sm font-medium">关联文章</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArticles}</div>
          </CardContent>
        </Card>
      </div>

      {/* 标签列表 */}
      <DataTable
        columns={columns}
        data={tags}
        searchKey="name"
        searchPlaceholder="搜索标签名称..."
      />

      {/* 新建对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建标签</DialogTitle>
            <DialogDescription>创建新的文章标签</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">标签名称 *</Label>
              <Input
                id="name"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                placeholder="请输入标签名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={newTag.slug}
                onChange={(e) => setNewTag({ ...newTag, slug: e.target.value })}
                placeholder="如：design-trends"
              />
            </div>
            <div className="space-y-2">
              <Label>标签颜色</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${newTag.color === color.value
                        ? 'border-foreground scale-110'
                        : 'border-transparent'
                      }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewTag({ ...newTag, color: color.value })}
                    title={color.label}
                  />
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
              确定要删除这个标签吗？关联的文章将移除该标签。
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
