'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Building2,
  MapPin,
  FileText,
  Star,
  Phone,
  Mail,
  User as UserIcon,
  MoreHorizontal,
  Eye,
  Trash2,
  Plus,
  FolderOpen,
  Receipt,
  Download,
  Loader2,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  FileType,
  File,
  FileCode,
} from 'lucide-react';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
import { getFileUrl, formatFileSize, isImageFile, getThumbnailUrl, downloadFile, type FileItem } from '@/api/files';
import { ClientModal } from '@/components/features/clients/client-modal';
import { ClientBasicInfoCard } from '@/components/features/clients/client-basic-info-card';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useClient, useUpdateClient } from '@/hooks/queries/use-clients';
import { useUsers, useDeleteUser } from '@/hooks/queries/use-users';
import { useProjects } from '@/hooks/queries/use-projects';
import { useQuotationsByClient, useQuotation } from '@/hooks/queries/use-quotations';
import { useSettlements } from '@/hooks/queries/use-settlements';
import { useContractsByRelatedIds } from '@/hooks/queries/use-contracts';
import type { GeneratedContract } from '@/api/generatedContracts';
import { useClientFiles, fileKeys } from '@/hooks/queries/use-files';
import { useQueries, useQuery } from '@tanstack/react-query';
import { getProjectFiles } from '@/api/files';
import { servicePricingApi, ServicePricing } from '@/api/service-pricing';
import { Quotation } from '@/api/quotations';
import './client-detail.css';

// 根据文件扩展名获取对应图标
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // PDF
  if (ext === 'pdf') {
    return <FileText className="h-8 w-8 text-red-500" />;
  }

  // Word 文档
  if (['doc', 'docx'].includes(ext)) {
    return <FileType className="h-8 w-8 text-blue-600" />;
  }

  // Excel 表格
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
  }

  // PowerPoint
  if (['ppt', 'pptx'].includes(ext)) {
    return <FileText className="h-8 w-8 text-orange-500" />;
  }

  // 图片
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
    return <FileImage className="h-8 w-8 text-purple-500" />;
  }

  // 视频
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
    return <FileVideo className="h-8 w-8 text-pink-500" />;
  }

  // 音频
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(ext)) {
    return <FileAudio className="h-8 w-8 text-cyan-500" />;
  }

  // 压缩包
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
    return <FileArchive className="h-8 w-8 text-yellow-600" />;
  }

  // 代码文件
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'go', 'rs'].includes(ext)) {
    return <FileCode className="h-8 w-8 text-emerald-500" />;
  }

  // 默认文件图标
  return <File className="h-8 w-8 text-muted-foreground" />;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  // UI 状态
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // 使用 TanStack Query hooks 获取数据
  const { data: clientResponse, isLoading: clientLoading } = useClient(clientId);
  const client = clientResponse?.success ? clientResponse.data : null;

  // 获取所有用户，然后筛选联系人
  const { data: usersResponse } = useUsers({ limit: 1000 });
  const allUsers = usersResponse?.success ? usersResponse.data : [];

  // 筛选属于此客户的联系人
  const contacts = useMemo(() => {
    if (!client || !allUsers.length) return [];
    return allUsers.filter((user) => {
      if (user.enterpriseId === clientId || user.enterpriseName === client.name) {
        return true;
      }
      // 兼容旧数据：如果用户有 company 字段，也进行匹配
      const userData = user as unknown as Record<string, unknown>;
      if (userData.company === client.name) {
        return true;
      }
      return false;
    });
  }, [client, clientId, allUsers]);

  // 获取项目列表，然后筛选客户项目
  const { data: projectsResponse } = useProjects({ limit: 100 });
  const allProjects = projectsResponse?.success ? projectsResponse.data : [];
  const projects = useMemo(() => {
    if (!client) return [];
    return allProjects.filter(
      (project) => project.clientId === clientId || project.clientName === client.name
    );
  }, [client, clientId, allProjects]);

  // 获取报价单
  const { data: quotationsResponse, isLoading: quotationsLoading } = useQuotationsByClient(clientId);
  const quotations = quotationsResponse?.success ? quotationsResponse.data : [];

  // 获取关联报价单详情
  const { data: selectedQuotationResponse } = useQuotation(client?.quotationId || '');
  const selectedQuotation = selectedQuotationResponse?.success ? selectedQuotationResponse.data : null;

  // 获取所有服务定价（用于显示报价单详情）
  const { data: servicePricingsResponse } = useQuery({
    queryKey: ['service-pricings'],
    queryFn: () => servicePricingApi.getAll({ limit: 1000 }),
  });
  const allServicePricings = servicePricingsResponse?.success ? servicePricingsResponse.data : [];

  // 获取报价单服务的函数
  const getQuotationServices = useMemo(() => {
    return (quotation: Quotation): ServicePricing[] => {
      if (!quotation.selectedServices || quotation.selectedServices.length === 0) {
        return [];
      }
      return allServicePricings.filter(service =>
        quotation.selectedServices.includes(service._id)
      );
    };
  }, [allServicePricings]);

  // 获取结算单
  const { data: settlementsResponse, isLoading: settlementsLoading } = useSettlements({
    clientId,
    limit: 100,
  });
  const settlements = settlementsResponse?.success ? settlementsResponse.data : [];

  // 获取合同
  const { data: contractsResponse, isLoading: contractsLoading } = useContractsByRelatedIds({
    clientId,
    limit: 100,
  });
  const contracts = useMemo((): GeneratedContract[] => {
    if (!contractsResponse?.success) return [];
    const data = contractsResponse.data as { contracts?: GeneratedContract[] } | GeneratedContract[];
    const contractsData = (data && 'contracts' in data ? data.contracts : data) || [];
    return Array.isArray(contractsData) ? contractsData : [];
  }, [contractsResponse]);

  // 获取客户文件
  const { data: clientFilesData, isLoading: clientFilesLoading } = useClientFiles(clientId);
  const clientFiles = clientFilesData || [];

  // 获取项目文件（所有关联项目的文件）
  // 使用 useQueries 来批量获取多个项目的文件
  const projectFilesQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: fileKeys.projectFiles(project._id),
      queryFn: () => getProjectFiles(project._id),
      enabled: projects.length > 0,
    })),
  });
  const projectFiles = useMemo(() => {
    const allFiles: FileItem[] = [];
    projectFilesQueries.forEach((query) => {
      if (query.data && Array.isArray(query.data)) {
        allFiles.push(...query.data);
      }
    });
    return allFiles;
  }, [projectFilesQueries]);
  const projectFilesLoading = projectFilesQueries.some((query) => query.isLoading);

  // 删除联系人 mutation
  const deleteUserMutation = useDeleteUser();
  const _updateClientMutation = useUpdateClient(); // 预留更新客户功能

  // 处理删除联系人
  const handleDeleteContact = async () => {
    if (deleteContactId) {
      deleteUserMutation.mutate(deleteContactId, {
        onSuccess: () => {
          setDeleteContactId(null);
        },
      });
    }
  };

  // 统计数据
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.progressStatus === 'completed').length;
    const totalAmount = 0; // 项目金额需要从项目数据中获取，目前API中没有这个字段
    const contactCount = contacts.length;
    return { totalProjects, completedProjects, totalAmount, contactCount };
  }, [projects, contacts]);

  if (clientLoading) {
    return <PageLoading />;
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <p className="text-muted-foreground">客户不存在</p>
      </div>
    );
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
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{client.name}</h1>
                  {/* 客户评级 */}
                  {client.rating && client.rating > 0 && (
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= (client.rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground/30'
                            }`}
                        />
                      ))}
                    </div>
                  )}
                  <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                    {client.status === 'active' ? '活跃' : '停用'}
                  </Badge>
                  {client.category && (
                    <Badge variant="outline">{client.category}</Badge>
                  )}
                </div>
                {client.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {client.address}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Button onClick={() => setEditModalOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            编辑客户
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="flex gap-6 h-full">
          {/* 左侧主内容 */}
          <div className="flex-1 space-y-6">
            {/* 基本信息卡片 */}
            <ClientBasicInfoCard
              client={client}
              stats={stats}
              selectedQuotation={selectedQuotation}
            />

            {/* 选项卡内容 */}
            <Tabs defaultValue="contacts" className="flex-1">
              <TabsList>
                <TabsTrigger value="contacts">
                  联系人 ({contacts.length})
                </TabsTrigger>
                <TabsTrigger value="projects">
                  关联项目 ({projects.length})
                </TabsTrigger>
                <TabsTrigger value="documents">
                  客户文档 ({(clientFiles.length + projectFiles.length)})
                </TabsTrigger>
                <TabsTrigger value="quotations">
                  报价单 ({quotations.length})
                </TabsTrigger>
                <TabsTrigger value="settlements">
                  结算单 ({settlements.length})
                </TabsTrigger>
                <TabsTrigger value="contracts">
                  合同 ({contracts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contacts" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-base">联系人列表 ({contacts.length})</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/dashboard/users/create?clientId=${clientId}&clientName=${encodeURIComponent(client.name)}`)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      添加联系人
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6">
                    {contacts.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        <UserIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>暂无联系人</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {contacts.map((contact) => (
                          <Card
                            key={contact._id}
                            className="hover:shadow-md transition-shadow cursor-pointer group relative py-0"
                            onClick={() => router.push(`/dashboard/contacts/${contact._id}`)}
                          >
                            <CardContent className="px-4 py-3">
                              {/* 头部：头像和姓名 */}
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium truncate">{contact.realName}</h3>
                                </div>
                                {/* 操作按钮 - 悬停时显示 */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
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
                                        router.push(`/dashboard/users/${contact._id}/edit`);
                                      }}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      编辑
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteContactId(contact._id);
                                      }}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      删除
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <Separator className="my-2" />

                              {/* 详细信息 */}
                              <div className="space-y-1.5">
                                {contact.position && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">{contact.position}</span>
                                  </div>
                                )}
                                {contact.phone && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">{contact.phone}</span>
                                  </div>
                                )}
                                {contact.email && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground truncate">{contact.email}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>项目名称</TableHead>
                          <TableHead>联系人</TableHead>
                          <TableHead>项目状态</TableHead>
                          <TableHead>结算状态</TableHead>
                          <TableHead>项目金额</TableHead>
                          <TableHead>创建时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              暂无关联项目
                            </TableCell>
                          </TableRow>
                        ) : (
                          projects.map((project) => (
                            <TableRow
                              key={project._id}
                              className="cursor-pointer"
                              onClick={() => router.push(`/dashboard/projects/${project._id}`)}
                            >
                              <TableCell className="font-medium">{project.projectName}</TableCell>
                              <TableCell>{project.contactNames?.[0] || '—'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {project.progressStatus === 'consulting' && '咨询中'}
                                  {project.progressStatus === 'in-progress' && '进行中'}
                                  {project.progressStatus === 'partial-delivery' && '部分交付'}
                                  {project.progressStatus === 'completed' && '已完成'}
                                  {project.progressStatus === 'on-hold' && '暂停'}
                                  {project.progressStatus === 'cancelled' && '已取消'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={project.settlementStatus === 'fully-paid' ? 'default' : 'secondary'}>
                                  {project.settlementStatus === 'unpaid' && '未付款'}
                                  {project.settlementStatus === 'prepaid' && '预付款'}
                                  {project.settlementStatus === 'partial-paid' && '部分付款'}
                                  {project.settlementStatus === 'fully-paid' && '已付清'}
                                </Badge>
                              </TableCell>
                              <TableCell>¥0</TableCell>
                              <TableCell>{project.createdAt ? format(new Date(project.createdAt), 'yyyy-MM-dd') : '—'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    {(clientFilesLoading || projectFilesLoading) ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (clientFiles.length === 0 && projectFiles.length === 0) ? (
                      <div className="py-12 text-center text-muted-foreground">
                        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>暂无文档</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-3">
                        {/* 客户文件 */}
                        {clientFiles.map((file, index) => (
                          <div
                            key={`client-${index}`}
                            className="group relative border rounded-lg p-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <Badge variant="outline" className="absolute top-1.5 right-1.5 text-xs">客户</Badge>
                            <div className="flex justify-center mb-1.5">
                              {isImageFile(file.originalName) ? (
                                <img
                                  src={getFileUrl(file.path)}
                                  alt={file.originalName}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              ) : (
                                getFileIcon(file.originalName)
                              )}
                            </div>
                            <p className="text-xs truncate text-center mb-0.5" title={file.originalName}>
                              {file.originalName}
                            </p>
                            <p className="text-xs text-muted-foreground text-center">
                              {formatFileSize(file.size)}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-1.5 h-7 text-xs opacity-0 group-hover:opacity-100"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = getFileUrl(file.path);
                                link.download = file.originalName;
                                link.click();
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              下载
                            </Button>
                          </div>
                        ))}

                        {/* 项目文件 */}
                        {projectFiles.map((file) => (
                          <div
                            key={file._id}
                            className="group relative border rounded-lg p-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <Badge variant="outline" className="absolute top-1.5 right-1.5 text-xs">项目</Badge>
                            <div className="flex justify-center mb-1.5">
                              {isImageFile(file.originalName) ? (
                                <img
                                  src={getThumbnailUrl(file)}
                                  alt={file.originalName}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              ) : (
                                getFileIcon(file.originalName)
                              )}
                            </div>
                            <p className="text-xs truncate text-center mb-0.5" title={file.originalName}>
                              {file.originalName}
                            </p>
                            <p className="text-xs text-muted-foreground text-center">
                              {formatFileSize(file.fileSize)}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-1.5 h-7 text-xs opacity-0 group-hover:opacity-100"
                              onClick={() => downloadFile(file._id)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              下载
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quotations" className="mt-4">
                {quotationsLoading ? (
                  <Card>
                    <CardContent>
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ) : quotations.length === 0 ? (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between py-4">
                      <CardTitle className="text-base">报价单列表</CardTitle>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/dashboard/quotations/create?clientId=${clientId}&clientName=${encodeURIComponent(client.name)}`)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        创建报价单
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="py-12 text-center text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>暂无报价单</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium">报价单列表 ({quotations.length})</h3>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/dashboard/quotations/create?clientId=${clientId}&clientName=${encodeURIComponent(client.name)}`)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        创建报价单
                      </Button>
                    </div>
                    {quotations.map((quotation) => {
                      const services = getQuotationServices(quotation);

                      // 按分类分组服务
                      const groupedServices: { [key: string]: ServicePricing[] } = {};
                      services.forEach(service => {
                        const categoryName = service.categoryName || '其他';
                        if (!groupedServices[categoryName]) {
                          groupedServices[categoryName] = [];
                        }
                        groupedServices[categoryName].push(service);
                      });

                      // 分类排序
                      const sortedCategories = Object.keys(groupedServices).sort();

                      return (
                        <Card key={quotation._id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base">{quotation.name}</CardTitle>
                                <Badge variant={quotation.status === 'active' ? 'default' : 'secondary'}>
                                  {quotation.status === 'active' ? '启用' : '禁用'}
                                </Badge>
                                {quotation.isDefault && (
                                  <Badge variant="outline">默认</Badge>
                                )}
                              </div>
                              {quotation.validUntil && (
                                <p className="text-sm text-muted-foreground">
                                  有效期至：{format(new Date(quotation.validUntil), 'yyyy-MM-dd')}
                                </p>
                              )}
                            </div>
                            {quotation.description && (
                              <p className="text-sm text-muted-foreground mt-2">{quotation.description}</p>
                            )}
                          </CardHeader>
                          <CardContent>
                            {services.length > 0 ? (
                              sortedCategories.length > 0 ? (
                                <Tabs defaultValue={sortedCategories[0]} className="w-full">
                                  <TabsList className="w-full">
                                    {sortedCategories.map((category) => (
                                      <TabsTrigger key={category} value={category}>
                                        {category}
                                      </TabsTrigger>
                                    ))}
                                  </TabsList>
                                  {sortedCategories.map((category) => (
                                    <TabsContent key={category} value={category} className="mt-4">
                                      <Table className="table-fixed">
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="w-[30%]">服务名称</TableHead>
                                            <TableHead className="w-[15%] text-right">单价</TableHead>
                                            <TableHead className="w-[25%]">价格政策</TableHead>
                                            <TableHead className="w-[30%]">价格说明</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {groupedServices[category].map((service) => (
                                            <TableRow key={service._id}>
                                              <TableCell>
                                                <div>
                                                  <span className="font-medium">{service.serviceName}</span>
                                                  {service.alias && (
                                                    <span className="text-sm text-muted-foreground ml-2">
                                                      ({service.alias})
                                                    </span>
                                                  )}
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <span className="font-medium">
                                                  ¥{service.unitPrice.toLocaleString('zh-CN', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  })}/{service.unit}
                                                </span>
                                              </TableCell>
                                              <TableCell>
                                                {service.pricingPolicyNames && service.pricingPolicyNames.length > 0 ? (
                                                  <div className="flex flex-wrap gap-1">
                                                    {service.pricingPolicyNames.map((policyName, index) => (
                                                      <Badge key={index} variant="outline" className="text-xs">
                                                        {policyName}
                                                      </Badge>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <span className="text-muted-foreground">—</span>
                                                )}
                                              </TableCell>
                                              <TableCell>
                                                <span className="text-sm">{service.priceDescription || '—'}</span>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </TabsContent>
                                  ))}
                                </Tabs>
                              ) : (
                                <div className="py-8 text-center text-muted-foreground">
                                  <p>该报价单暂无服务项目</p>
                                </div>
                              )
                            ) : (
                              <div className="py-8 text-center text-muted-foreground">
                                <p>该报价单暂无服务项目</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settlements" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-base">结算单列表 ({settlements.length})</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/dashboard/settlements/create?clientId=${clientId}&clientName=${encodeURIComponent(client.name)}`)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      创建结算单
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {settlementsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : settlements.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>暂无结算单</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>结算单号</TableHead>
                            <TableHead>项目名称</TableHead>
                            <TableHead>金额</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead>操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {settlements.map((settlement) => (
                            <TableRow
                              key={settlement._id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => router.push(`/dashboard/settlements/${settlement._id}`)}
                            >
                              <TableCell className="font-medium">{settlement.settlementNo}</TableCell>
                              <TableCell>{settlement.projectName}</TableCell>
                              <TableCell>¥{settlement.totalAmount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  settlement.status === 'completed' ? 'default' :
                                    settlement.status === 'partial' ? 'secondary' : 'outline'
                                }>
                                  {settlement.status === 'pending' && '待结算'}
                                  {settlement.status === 'partial' && '部分结算'}
                                  {settlement.status === 'completed' && '已结算'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(settlement.createdAt), 'yyyy-MM-dd HH:mm')}
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/settlements/${settlement._id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  查看
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contracts" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-base">合同列表 ({contracts.length})</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/dashboard/contracts/create?clientId=${clientId}&clientName=${encodeURIComponent(client.name)}`)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      创建合同
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {contractsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : !Array.isArray(contracts) || contracts.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>暂无合同</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>合同名称</TableHead>
                            <TableHead>合同编号</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>生成时间</TableHead>
                            <TableHead>操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(contracts) && contracts.map((contract) => (
                            <TableRow
                              key={contract._id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => router.push(`/dashboard/contracts/${contract._id}`)}
                            >
                              <TableCell className="font-medium">{contract.name}</TableCell>
                              <TableCell>{contract.contractNumber || '—'}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  contract.status === 'completed' ? 'default' :
                                    contract.status === 'signed' ? 'secondary' :
                                      contract.status === 'cancelled' ? 'destructive' : 'outline'
                                }>
                                  {contract.status === 'pending' && '待签署'}
                                  {contract.status === 'signed' && '已签署'}
                                  {contract.status === 'cancelled' && '已取消'}
                                  {contract.status === 'completed' && '已完成'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(contract.generateTime), 'yyyy-MM-dd HH:mm')}
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/contracts/${contract._id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  查看
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* 右侧边栏 - 快捷操作 */}
          <div className="w-[280px] flex-shrink-0">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">快捷操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-9"
                  onClick={() => router.push(`/dashboard/projects/create?clientId=${clientId}&clientName=${encodeURIComponent(client.name)}`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  创建新项目
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-9"
                  onClick={() => router.push(`/dashboard/users/create?clientId=${clientId}&clientName=${encodeURIComponent(client.name)}`)}
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  添加联系人
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-9"
                  onClick={() => router.push(`/dashboard/quotations/create?clientId=${clientId}&clientName=${encodeURIComponent(client.name)}`)}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  创建报价单
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-9"
                  onClick={() => router.push(`/dashboard/contracts/create?clientId=${clientId}&clientName=${encodeURIComponent(client.name)}`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  创建合同
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 删除联系人确认对话框 */}
      <AlertDialog open={!!deleteContactId} onOpenChange={() => setDeleteContactId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除联系人</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，确定要删除这个联系人吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 编辑客户模态窗 */}
      {client && (
        <ClientModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          client={client}
          mode="edit"
          onSuccess={() => {
            // useClient hook 会自动更新数据
            toast.success('客户信息已更新');
          }}
        />
      )}
    </div>
  );
}

