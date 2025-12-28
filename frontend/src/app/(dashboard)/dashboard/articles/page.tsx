'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  FileText,
  CheckCircle,
  Star,
  Pin,
  Send,
  FileEdit,
  Archive,
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
import { Article } from '@/api/articles';
import {
  useArticles,
  useDeleteArticle,
  useToggleTopStatus,
  useToggleRecommendStatus,
} from '@/hooks/queries/use-articles';
import { useArticleCategories } from '@/hooks/queries/use-article-categories';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: {
    label: '草稿',
    color: 'bg-gray-500/10 text-gray-600',
    icon: <FileEdit className="h-3 w-3 mr-1" />,
  },
  published: {
    label: '已发布',
    color: 'bg-green-500/10 text-green-600',
    icon: <Send className="h-3 w-3 mr-1" />,
  },
  archived: {
    label: '已归档',
    color: 'bg-orange-500/10 text-orange-600',
    icon: <Archive className="h-3 w-3 mr-1" />,
  },
};

export default function ArticlesPage() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data, isLoading } = useArticles({
    status: statusFilter === 'all' ? undefined : statusFilter,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    limit: 100,
  });
  const { data: categoriesData } = useArticleCategories();
  const deleteArticle = useDeleteArticle();
  const toggleTop = useToggleTopStatus();
  const toggleRecommend = useToggleRecommendStatus();

  const articles = data?.data || [];
  const categories = categoriesData?.categories || [];

  const handleDelete = () => {
    if (deleteId) {
      deleteArticle.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const columns: ColumnDef<Article>[] = [
    {
      accessorKey: 'title',
      header: '标题',
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{row.original.title}</span>
            {row.original.isTop && (
              <Pin className="h-3 w-3 text-orange-500" />
            )}
            {row.original.isRecommend && (
              <Star className="h-3 w-3 text-yellow-500" />
            )}
          </div>
          {row.original.summary && (
            <p className="text-xs text-muted-foreground truncate mt-1">
              {row.original.summary}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: '分类',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.category || '未分类'}</Badge>
      ),
    },
    {
      accessorKey: 'author',
      header: '作者',
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const config = statusConfig[row.original.status];
        return (
          <Badge className={config?.color || ''}>
            {config?.icon}
            {config?.label || row.original.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'viewCount',
      header: '浏览量',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.viewCount || 0}</span>
      ),
    },
    {
      accessorKey: 'publishTime',
      header: '发布时间',
      cell: ({ row }) =>
        row.original.publishTime
          ? format(new Date(row.original.publishTime), 'yyyy-MM-dd HH:mm')
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
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/articles/${row.original._id}`)
              }
            >
              <Eye className="mr-2 h-4 w-4" />
              查看
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/articles/${row.original._id}/edit`)
              }
            >
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toggleTop.mutate(row.original._id)}>
              <Pin className="mr-2 h-4 w-4" />
              {row.original.isTop ? '取消置顶' : '置顶'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleRecommend.mutate(row.original._id)}>
              <Star className="mr-2 h-4 w-4" />
              {row.original.isRecommend ? '取消推荐' : '推荐'}
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
  const totalArticles = data?.total || articles.length;
  const publishedCount = articles.filter((a) => a.status === 'published').length;
  const draftCount = articles.filter((a) => a.status === 'draft').length;
  const totalViews = articles.reduce((sum, a) => sum + (a.viewCount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="文章管理"
        description="管理网站的文章内容"
        action={{
          label: '新建文章',
          onClick: () => router.push('/dashboard/articles/new'),
        }}
      >
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="分类筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="published">已发布</SelectItem>
              <SelectItem value="archived">已归档</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">文章总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArticles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已发布</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">草稿</CardTitle>
            <FileEdit className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总浏览量</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalViews.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 文章列表 */}
      <DataTable
        columns={columns}
        data={articles}
        searchKey="title"
        searchPlaceholder="搜索文章标题..."
      />

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除文章</AlertDialogTitle>
            <AlertDialogDescription>
              删除后文章将无法恢复。确定要删除吗？
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
