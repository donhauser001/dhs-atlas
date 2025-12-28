'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  FolderTree,
  ArrowLeft,
} from 'lucide-react';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClientCategory, clientCategoryApi } from '@/api/client-categories';
import { toast } from 'sonner';

export default function ClientCategoriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ClientCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [submitting, setSubmitting] = useState(false);

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await clientCategoryApi.getAll({ limit: 100 });
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
      toast.error('获取分类列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'active',
    });
  };

  // 打开创建模态框
  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // 打开编辑模态框
  const handleOpenEdit = (category: ClientCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      status: category.status,
    });
    setShowEditModal(true);
  };

  // 创建分类
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入分类名称');
      return;
    }
    try {
      setSubmitting(true);
      const response = await clientCategoryApi.create(formData);
      if (response.success) {
        toast.success('分类创建成功');
        setShowCreateModal(false);
        fetchCategories();
      } else {
        toast.error(response.message || '创建失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建失败';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // 更新分类
  const handleUpdate = async () => {
    if (!editingCategory || !formData.name.trim()) {
      toast.error('请输入分类名称');
      return;
    }
    try {
      setSubmitting(true);
      const response = await clientCategoryApi.update(editingCategory._id, formData);
      if (response.success) {
        toast.success('分类更新成功');
        setShowEditModal(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        toast.error(response.message || '更新失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新失败';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // 删除分类
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setSubmitting(true);
      await clientCategoryApi.delete(deleteId);
      toast.success('分类删除成功');
      setDeleteId(null);
      fetchCategories();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除失败';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
      {/* 页面头部 */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center">
                <FolderTree className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">客户分类管理</h1>
                <p className="text-sm text-muted-foreground">
                  共 {categories.length} 个分类
                </p>
              </div>
            </div>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新建分类
          </Button>
        </div>
      </div>

      {/* 分类列表 */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">分类名称</TableHead>
                  <TableHead className="w-[35%]">描述</TableHead>
                  <TableHead className="w-[15%]">客户数量</TableHead>
                  <TableHead className="w-[10%]">状态</TableHead>
                  <TableHead className="w-[15%]">创建时间</TableHead>
                  <TableHead className="w-[10%]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      暂无分类数据，点击右上角按钮新建
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell>
                        <span className="font-medium">{category.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {category.description || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span>{category.clientCount || 0}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
                          {category.status === 'active' ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {category.createTime || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(category)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteId(category._id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 创建分类模态框 */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建分类</DialogTitle>
            <DialogDescription>创建新的客户分类</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">分类名称 *</Label>
              <Input
                id="name"
                placeholder="请输入分类名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="请输入分类描述..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑分类模态框 */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
            <DialogDescription>修改客户分类信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">分类名称 *</Label>
              <Input
                id="edit-name"
                placeholder="请输入分类名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                placeholder="请输入分类描述..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              取消
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除分类</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。如果该分类下还有客户，删除后客户的分类将被清空。确定要删除吗？
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

