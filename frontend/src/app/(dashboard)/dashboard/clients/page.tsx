'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Star,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Ban,
  CircleCheck,
} from 'lucide-react';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useClients, useDeleteClient } from '@/hooks/queries/use-clients';
import { Client, clientApi } from '@/api/clients';
import { ClientCategory, clientCategoryApi } from '@/api/client-categories';
import { FormModal } from '@/components/forms';
import { toast } from 'sonner';

// 导入表单注册（确保表单被注册）
import '@/components/forms/register';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

export default function ClientsPage() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categories, setCategories] = useState<ClientCategory[]>([]);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // 模态窗状态 - 使用新的表单系统
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalFormId, setModalFormId] = useState<string>('client-create');
  const [modalOperationMode, setModalOperationMode] = useState<'create' | 'edit' | 'view'>('create');

  const { data, isLoading, refetch } = useClients();
  const deleteClient = useDeleteClient();

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await clientCategoryApi.getAll({ status: 'active', limit: 100 });
        if (response.success) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('获取分类列表失败:', error);
      }
    };
    fetchCategories();
  }, []);

  // 过滤客户列表
  const filteredClients = useMemo(() => {
    return (data?.data || []).filter((client) => {
      // 搜索过滤
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!client.name.toLowerCase().includes(term) &&
          !client.address?.toLowerCase().includes(term)) {
          return false;
        }
      }
      // 分类过滤
      if (categoryFilter !== 'all' && client.category !== categoryFilter) {
        return false;
      }
      // 状态过滤
      if (statusFilter !== 'all' && client.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [data?.data, searchTerm, categoryFilter, statusFilter]);

  // 分页数据
  const totalItems = filteredClients.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // 自动修正页码：当筛选后数据减少导致当前页超出范围时
  const validCurrentPage = useMemo(() => {
    if (totalPages === 0) return 1;
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const paginatedClients = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredClients.slice(startIndex, startIndex + pageSize);
  }, [filteredClients, validCurrentPage, pageSize]);

  // 带重置页码的筛选器设置函数
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  }, []);

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteClient.mutateAsync(deleteId);
        toast.success('客户删除成功');
        setDeleteId(null);
      } catch {
        toast.error('删除失败');
      }
    }
  };

  // 复制发票信息
  const copyInvoiceInfo = async (client: Client) => {
    try {
      const invoiceText = `票种类别：${client.invoiceType}\n开票信息：${client.invoiceInfo || '无'}`;
      await navigator.clipboard.writeText(invoiceText);
      toast.success('发票信息已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  // 打开新增模态窗
  const handleAdd = () => {
    setSelectedClient(null);
    setModalFormId('client-create');
    setModalOperationMode('create');
    setModalOpen(true);
  };

  // 打开编辑模态窗
  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setModalFormId('client-edit');
    setModalOperationMode('edit');
    setModalOpen(true);
  };

  // 打开查看模态窗
  const handleView = (client: Client) => {
    setSelectedClient(client);
    setModalFormId('client-view');
    setModalOperationMode('view');
    setModalOpen(true);
  };

  // 切换状态
  const handleStatusChange = async (client: Client) => {
    try {
      const newStatus = client.status === 'active' ? 'inactive' : 'active';
      await clientApi.update(client._id, { status: newStatus });
      toast.success(`客户${newStatus === 'active' ? '启用' : '禁用'}成功`);
      refetch();
    } catch {
      toast.error('状态更新失败');
    }
  };

  // 统计数据
  const totalClients = data?.data?.length || 0;
  const activeClients = data?.data?.filter(c => c.status === 'active').length || 0;

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
      {/* 页面头部 */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">客户管理</h1>
            <p className="text-sm text-muted-foreground mt-1">
              共 {totalClients} 个客户，{activeClients} 个活跃
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            新建客户
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex-shrink-0 px-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索客户名称或地址..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="客户分类" />
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
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="inactive">禁用</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              onClick={() => {
                handleSearchChange('');
                handleCategoryChange('all');
                handleStatusFilterChange('all');
              }}
            >
              清除筛选
            </Button>
          )}
        </div>
      </div>

      {/* 客户列表 */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <Card className="py-0">
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20%]">客户名称</TableHead>
                  <TableHead className="w-[12%]">发票信息</TableHead>
                  <TableHead className="w-[10%]">分类</TableHead>
                  <TableHead className="w-[10%]">评级</TableHead>
                  <TableHead className="w-[8%]">文件</TableHead>
                  <TableHead className="w-[20%]">地址</TableHead>
                  <TableHead className="w-[8%]">状态</TableHead>
                  <TableHead className="w-[12%]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                        ? '没有找到匹配的客户'
                        : '暂无客户数据，点击右上角按钮新建'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedClients.map((client) => (
                    <TableRow
                      key={client._id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/dashboard/clients/${client._id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{client.name}</span>
                          {client.rating === 5 && (
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.invoiceType ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{client.invoiceType}</span>
                            {client.invoiceInfo && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyInvoiceInfo(client);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.category ? (
                          <Badge variant="outline">{client.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${star <= (client.rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground/30'
                                }`}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {client.files?.length || 0} 个
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.address ? (
                          <span className="text-sm truncate block max-w-[200px]">
                            {client.address}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                          {client.status === 'active' ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(client);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(client);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(client);
                              }}
                            >
                              {client.status === 'active' ? (
                                <>
                                  <Ban className="mr-2 h-4 w-4" />
                                  禁用
                                </>
                              ) : (
                                <>
                                  <CircleCheck className="mr-2 h-4 w-4" />
                                  启用
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(client._id);
                              }}
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

            {/* 分页组件 */}
            {totalItems > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>每页</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>条，共 {totalItems} 条记录</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    第 {validCurrentPage} / {totalPages || 1} 页
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(1)}
                      disabled={validCurrentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(validCurrentPage - 1)}
                      disabled={validCurrentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(validCurrentPage + 1)}
                      disabled={validCurrentPage === totalPages || totalPages === 0}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={validCurrentPage === totalPages || totalPages === 0}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 客户模态窗 - 使用新的 FormModal 组件 */}
      <FormModal
        formId={modalFormId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialData={(selectedClient ?? undefined) as Record<string, unknown> | undefined}
        operationMode={modalOperationMode}
        onSuccess={() => refetch()}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，删除后该客户的所有信息将被清除。确定要删除吗？
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
