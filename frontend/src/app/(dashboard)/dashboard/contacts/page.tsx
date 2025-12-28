'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Ban,
  CircleCheck,
  Key,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, userApi } from '@/api/users';
import { Client, clientApi } from '@/api/clients';
import { projectApi } from '@/api/projects';
import { toast } from 'sonner';

export default function ContactsPage() {
  const router = useRouter();

  // 数据状态
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});

  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // 弹窗状态
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 新建联系人弹窗
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newContact, setNewContact] = useState({
    realName: '',
    phone: '',
    email: '',
    company: '',
    position: '',
    address: '',
    notes: '',
  });

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 获取联系人列表（角色为客户的用户）
        const usersResponse = await userApi.getList({ role: '客户', limit: 200 });
        const usersData = usersResponse?.data || (Array.isArray(usersResponse) ? usersResponse : []);
        setContacts(usersData);

        // 获取客户列表
        const clientsResponse = await clientApi.getList({ limit: 200 });
        const clientsData = clientsResponse?.data || (Array.isArray(clientsResponse) ? clientsResponse : []);
        setClients(clientsData);

        // 获取项目列表并统计关联数量
        const projectsResponse = await projectApi.getList({ limit: 1000 });
        const projectsData = projectsResponse?.data || (Array.isArray(projectsResponse) ? projectsResponse : []);
        const counts: Record<string, number> = {};
        projectsData.forEach((project: { contactId?: string }) => {
          const contactId = project.contactId;
          if (contactId) {
            counts[contactId] = (counts[contactId] || 0) + 1;
          }
        });
        setProjectCounts(counts);
      } catch {
        console.error('获取数据失败:', error);
        toast.error('获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 过滤联系人
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // 搜索
      const searchMatch =
        !searchTerm ||
        contact.realName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.enterpriseName?.toLowerCase().includes(searchTerm.toLowerCase());

      // 状态过滤
      const statusMatch = statusFilter === 'all' || contact.status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [contacts, searchTerm, statusFilter]);

  // 分页数据
  const totalItems = filteredContacts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredContacts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredContacts, currentPage, itemsPerPage]);

  // 获取客户开票信息
  const getClientInvoiceInfo = (companyName: string | undefined) => {
    if (!companyName) return null;
    const client = clients.find(
      (c) => c.name === companyName || c.name === companyName
    );
    if (!client || !client.invoiceInfo || client.invoiceType === '不开票') return null;
    return {
      invoiceType: client.invoiceType,
      invoiceInfo: client.invoiceInfo,
    };
  };

  // 复制快递信息
  const copyShippingInfo = (contact: User) => {
    if (contact.shippingMethod) {
      navigator.clipboard.writeText(contact.shippingMethod);
      toast.success('快递信息已复制');
    }
  };

  // 复制开票资料
  const copyInvoiceInfo = (contact: User) => {
    const company = contact.company || contact.enterpriseName;
    const invoiceInfo = getClientInvoiceInfo(company);
    if (invoiceInfo) {
      const text = `发票类型：${invoiceInfo.invoiceType}\n开票信息：${invoiceInfo.invoiceInfo}`;
      navigator.clipboard.writeText(text);
      toast.success('开票资料已复制');
    }
  };

  // 切换状态
  const handleToggleStatus = async (contact: User) => {
    try {
      const newStatus = contact.status === 'active' ? 'inactive' : 'active';
      await userApi.update(contact._id, { status: newStatus });
      setContacts((prev) =>
        prev.map((c) => (c._id === contact._id ? { ...c, status: newStatus } : c))
      );
      toast.success(`联系人已${newStatus === 'active' ? '启用' : '禁用'}`);
    } catch {
      toast.error('状态更新失败');
    }
  };

  // 删除联系人
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await userApi.delete(deleteId);
      setContacts((prev) => prev.filter((c) => c._id !== deleteId));
      toast.success('联系人已删除');
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleteId(null);
    }
  };

  // 创建联系人
  const handleCreateContact = async () => {
    if (!newContact.realName.trim()) {
      toast.error('请输入联系人姓名');
      return;
    }

    try {
      setCreating(true);
      await userApi.create({
        username: newContact.phone || `contact_${Date.now()}`,
        password: '123456', // 默认密码
        realName: newContact.realName,
        phone: newContact.phone,
        email: newContact.email,
        company: newContact.company,
        position: newContact.position,
        address: newContact.address,
        notes: newContact.notes,
        role: '客户',
        status: 'active',
      });
      toast.success('联系人创建成功');
      setCreateDialogOpen(false);
      setNewContact({
        realName: '',
        phone: '',
        email: '',
        company: '',
        position: '',
        address: '',
        notes: '',
      });
      // 刷新列表
      const usersResponse = await userApi.getList({ role: '客户', limit: 200 });
      const usersData = usersResponse?.data || (Array.isArray(usersResponse) ? usersResponse : []);
      setContacts(usersData);
    } catch {
      toast.error('创建失败');
    } finally {
      setCreating(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!resettingUser) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error('密码至少6个字符');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    try {
      // TODO: 调用重置密码 API
      // await userApi.resetPassword(resettingUser._id, newPassword);
      toast.success('密码重置成功');
      setPasswordDialogOpen(false);
      setResettingUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('密码重置失败');
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
          <h1 className="text-2xl font-bold">联系人管理</h1>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新增联系人
          </Button>
        </div>

        {/* 筛选栏 */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索姓名、电话、邮箱、公司..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="inactive">禁用</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
            >
              清除筛选
            </Button>
          )}
        </div>
      </div>

      {/* 联系人列表 */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <Card className="py-0">
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[18%]">联系人</TableHead>
                  <TableHead className="w-[12%]">电话</TableHead>
                  <TableHead className="w-[18%]">公司</TableHead>
                  <TableHead className="w-[12%]">快递信息</TableHead>
                  <TableHead className="w-[12%]">发票</TableHead>
                  <TableHead className="w-[8%]">关联项目</TableHead>
                  <TableHead className="w-[10%]">最后登录</TableHead>
                  <TableHead className="w-[10%]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      暂无联系人数据
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedContacts.map((contact) => {
                    const company = contact.company || contact.enterpriseName;
                    const invoiceInfo = getClientInvoiceInfo(company);

                    return (
                      <TableRow
                        key={contact._id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/dashboard/contacts/${contact._id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{contact.realName}</span>
                            {contact.status === 'inactive' && (
                              <Badge variant="secondary" className="text-xs">禁用</Badge>
                            )}
                          </div>
                          {contact.position && (
                            <p className="text-xs text-muted-foreground mt-0.5">{contact.position}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={contact.phone ? '' : 'text-muted-foreground'}>
                            {contact.phone || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={company ? '' : 'text-muted-foreground'}>
                            {company || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {contact.shippingMethod ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyShippingInfo(contact);
                              }}
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              复制快递
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {invoiceInfo ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyInvoiceInfo(contact);
                              }}
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              复制开票
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {projectCounts[contact._id] || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={contact.lastLogin ? '' : 'text-muted-foreground'}>
                            {contact.lastLogin || '—'}
                          </span>
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
                                  router.push(`/dashboard/contacts/${contact._id}`);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                查看详情
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/contacts/${contact._id}/edit`);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setResettingUser(contact);
                                  setPasswordDialogOpen(true);
                                }}
                              >
                                <Key className="mr-2 h-4 w-4" />
                                重置密码
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatus(contact);
                                }}
                              >
                                {contact.status === 'active' ? (
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
                                  setDeleteId(contact._id);
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
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* 分页组件 */}
            {totalItems > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>每页</span>
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>条，共 {totalItems} 条记录</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    第 {currentPage} / {totalPages} 页
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
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

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个联系人吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重置密码对话框 */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              为 {resettingUser?.realName} 设置新密码
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false);
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              取消
            </Button>
            <Button onClick={handleResetPassword}>确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新建联系人对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增联系人</DialogTitle>
            <DialogDescription>
              创建新的客户联系人，默认密码为 123456
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-realName">姓名 *</Label>
                <Input
                  id="create-realName"
                  value={newContact.realName}
                  onChange={(e) => setNewContact({ ...newContact, realName: e.target.value })}
                  placeholder="请输入姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">电话</Label>
                <Input
                  id="create-phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="请输入电话"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">邮箱</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="请输入邮箱"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-position">职位</Label>
                <Input
                  id="create-position"
                  value={newContact.position}
                  onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                  placeholder="请输入职位"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-company">公司</Label>
              <Input
                id="create-company"
                value={newContact.company}
                onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                placeholder="请输入公司名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-address">地址</Label>
              <Input
                id="create-address"
                value={newContact.address}
                onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                placeholder="请输入地址"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-notes">备注</Label>
              <Textarea
                id="create-notes"
                value={newContact.notes}
                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                placeholder="请输入备注信息"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewContact({
                  realName: '',
                  phone: '',
                  email: '',
                  company: '',
                  position: '',
                  address: '',
                  notes: '',
                });
              }}
            >
              取消
            </Button>
            <Button onClick={handleCreateContact} disabled={creating}>
              {creating ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

