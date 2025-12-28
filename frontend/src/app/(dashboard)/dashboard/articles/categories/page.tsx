'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderTree,
  CheckCircle,
  XCircle,
  FileText,
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
  ArticleCategory,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/api/articleCategories';
import {
  useArticleCategories,
  useCreateArticleCategory,
  useUpdateArticleCategory,
  useDeleteArticleCategory,
  useToggleArticleCategoryStatus,
} from '@/hooks/queries/use-article-categories';
import { format } from 'date-fns';

export default function ArticleCategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ArticleCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6',
  });

  const { data, isLoading } = useArticleCategories();
  const createCategory = useCreateArticleCategory();
  const updateCategory = useUpdateArticleCategory();
  const deleteCategory = useDeleteArticleCategory();
  const toggleStatus = useToggleArticleCategoryStatus();

  const categories = data?.categories || [];
  const stats = data?.stats;

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#3b82f6',
    });
    setModalOpen(true);
  };

  const handleEdit = (category: ArticleCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color || '#3b82f6',
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingCategory) {
      updateCategory.mutate(
        { id: editingCategory._id, data: formData as UpdateCategoryRequest },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      createCategory.mutate(formData, {
        onSuccess: () => setModalOpen(false),
      });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteCategory.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleStatus.mutate(id);
  };

  const columns: ColumnDef<ArticleCategory>[] = [
    {
      accessorKey: 'name',
      header: '分类名称',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: row.original.color || '#3b82f6' }}
          />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.slug}
        </Badge>
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
      accessorKey: 'articleCount',
      header: '文章数',
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.articleCount || 0}</Badge>
      ),
    },
    {
      accessorKey: 'isActive',
      header: '状态',
      cell: ({ row }) =>
        row.original.isActive ? (
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
            <DropdownMenuItem onClick={() => handleToggleStatus(row.original._id)}>
              {row.original.isActive ? (
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="文章分类"
        description="管理文章的分类"
        action={{
          label: '新建分类',
          onClick: handleCreate,
        }}
      />

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">分类总数</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">启用中</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.active || categories.filter((c) => c.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">文章总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalArticles || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* 分类列表 */}
      <DataTable
        columns={columns}
        data={categories}
        searchKey="name"
        searchPlaceholder="搜索分类名称..."
      />

      {/* 新建/编辑弹窗 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? '编辑分类' : '新建分类'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? '修改分类信息'
                : '创建一个新的文章分类'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">分类名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="输入分类名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="输入URL标识（英文）"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">颜色</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="输入分类描述（可选）"
                rows={3}
              />
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
                !formData.slug ||
                createCategory.isPending ||
                updateCategory.isPending
              }
            >
              {createCategory.isPending || updateCategory.isPending
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
            <AlertDialogTitle>确认删除分类</AlertDialogTitle>
            <AlertDialogDescription>
              删除后该分类下的文章将变为未分类状态。确定要删除吗？
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
