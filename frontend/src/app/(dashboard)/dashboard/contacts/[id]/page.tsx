'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Building2,
  Phone,
  Mail,
  User as UserIcon,
  Briefcase,
  Calendar,
  Eye,
  Plus,
  ChevronRight,
  FolderOpen,
  Receipt,
  FileText,
  Users,
  MapPin,
  Copy,
  Package,
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
import { useUser, useUsers } from '@/hooks/queries/use-users';
import { useClient, useClients } from '@/hooks/queries/use-clients';
import { useProjects } from '@/hooks/queries/use-projects';
import { useQuotationsByClient } from '@/hooks/queries/use-quotations';
import { useSettlements } from '@/hooks/queries/use-settlements';
import { useContractsByRelatedIds } from '@/hooks/queries/use-contracts';
import type { GeneratedContract } from '@/api/generatedContracts';
import { useClientFiles, fileKeys } from '@/hooks/queries/use-files';
import { useQueries, useQuery } from '@tanstack/react-query';
import { getProjectFiles, FileItem, isImageFile, getFileUrl, getThumbnailUrl, formatFileSize, downloadFile } from '@/api/files';
import { servicePricingApi, ServicePricing } from '@/api/service-pricing';
import { Quotation } from '@/api/quotations';
import { format } from 'date-fns';
import { toast } from 'sonner';

// 根据文件扩展名获取对应图标
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf') return <FileText className="h-8 w-8 text-red-500" />;
  if (['doc', 'docx'].includes(ext)) return <FileType className="h-8 w-8 text-blue-600" />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
  if (['ppt', 'pptx'].includes(ext)) return <FileText className="h-8 w-8 text-orange-500" />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return <FileImage className="h-8 w-8 text-purple-500" />;
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) return <FileVideo className="h-8 w-8 text-pink-500" />;
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(ext)) return <FileAudio className="h-8 w-8 text-cyan-500" />;
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return <FileArchive className="h-8 w-8 text-yellow-600" />;
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'go', 'rs'].includes(ext)) return <FileCode className="h-8 w-8 text-emerald-500" />;

  return <File className="h-8 w-8 text-muted-foreground" />;
}

// 基本信息项组件
function InfoItem({
  icon: Icon,
  label,
  value,
  copyable = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | undefined;
  copyable?: boolean;
}) {
  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      toast.success(`${label}已复制`);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-md bg-muted/60 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="font-medium truncate">{value || '—'}</p>
          {copyable && value && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  // UI 状态 (预留删除功能)
  const [_deleteDialogOpen, _setDeleteDialogOpen] = useState(false);

  // 获取联系人详情
  const { data: userResponse, isLoading: userLoading } = useUser(contactId);
  const contact = userResponse?.success ? userResponse.data : null;

  // 获取关联客户信息
  const clientId = contact?.enterpriseId || '';
  const { data: clientResponse } = useClient(clientId);
  const client = clientResponse?.success ? clientResponse.data : null;

  // 如果没有 enterpriseId，尝试通过名称查找客户
  const { data: clientsResponse } = useClients({
    search: contact?.enterpriseName || contact?.company,
    limit: 1
  });
  const clientByName = !client && contact?.enterpriseName
    ? (clientsResponse?.success ? clientsResponse.data[0] : null)
    : null;
  const actualClient = client || clientByName;
  const actualClientId = actualClient?._id || '';

  // 获取同事列表
  const { data: usersResponse } = useUsers({ limit: 200 });
  const colleagues = useMemo(() => {
    if (!contact || !usersResponse?.success) return [];
    return usersResponse.data.filter((user) => {
      if (user._id === contactId) return false;
      if (contact.enterpriseId && user.enterpriseId === contact.enterpriseId) return true;
      if (contact.enterpriseName && user.enterpriseName === contact.enterpriseName) return true;
      return false;
    });
  }, [contact, contactId, usersResponse]);

  // 获取关联项目
  const { data: projectsResponse } = useProjects({ limit: 100 });
  const projects = useMemo(() => {
    if (!contact || !projectsResponse?.success) return [];
    return projectsResponse.data.filter((project) => {
      if (project.contactIds?.includes(contactId)) return true;
      if (project.contactNames?.includes(contact.realName)) return true;
      return false;
    });
  }, [contact, contactId, projectsResponse]);

  // 获取报价单（通过客户ID）
  const { data: quotationsResponse, isLoading: quotationsLoading } = useQuotationsByClient(actualClientId);
  const quotations = quotationsResponse?.success ? quotationsResponse.data : [];

  // 获取服务定价数据（用于显示报价单详情）
  const { data: servicePricingsResponse } = useQuery({
    queryKey: ['service-pricings'],
    queryFn: () => servicePricingApi.getAll({ limit: 1000 }),
    enabled: quotations.length > 0,
  });
  const allServicePricings = servicePricingsResponse?.success ? servicePricingsResponse.data : [];

  // 获取报价单服务
  const getQuotationServices = useMemo(() => {
    return (quotation: Quotation): ServicePricing[] => {
      if (!quotation.selectedServices || quotation.selectedServices.length === 0) return [];
      return allServicePricings.filter(service => quotation.selectedServices.includes(service._id));
    };
  }, [allServicePricings]);

  // 获取结算单（通过项目关联）
  const projectIds = projects.map(p => p._id);
  const { data: settlementsResponse, isLoading: settlementsLoading } = useSettlements({
    clientId: actualClientId,
    limit: 100,
  });
  const settlements = useMemo(() => {
    if (!settlementsResponse?.success) return [];
    // 过滤出与联系人关联项目相关的结算单
    return settlementsResponse.data.filter(settlement =>
      projectIds.includes(settlement.projectId)
    );
  }, [settlementsResponse, projectIds]);

  // 获取合同
  const { data: contractsResponse, isLoading: contractsLoading } = useContractsByRelatedIds({
    clientId: actualClientId,
    limit: 100,
  });
  const contracts = useMemo((): GeneratedContract[] => {
    if (!contractsResponse?.success) return [];
    const data = contractsResponse.data as { contracts?: GeneratedContract[] } | GeneratedContract[];
    const contractsData = (data && 'contracts' in data ? data.contracts : data) || [];
    // 过滤出与联系人关联的合同
    return Array.isArray(contractsData) ? contractsData.filter((contract) =>
      (contract as unknown as { contactId?: string }).contactId === contactId || 
      projectIds.includes((contract as unknown as { projectId?: string }).projectId || '')
    ) : [];
  }, [contractsResponse, contactId, projectIds]);

  // 获取客户文件
  const { data: clientFilesData, isLoading: clientFilesLoading } = useClientFiles(actualClientId);
  const clientFiles = clientFilesData || [];

  // 获取项目文件
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

  // 统计数据
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.progressStatus === 'completed').length;
    const totalAmount = 0; // 需要从项目/结算中计算
    return { totalProjects, completedProjects, totalAmount };
  }, [projects]);

  // 复制快递信息
  const copyShippingInfo = () => {
    if (contact?.shippingMethod) {
      navigator.clipboard.writeText(contact.shippingMethod);
      toast.success('快递信息已复制');
    }
  };

  // 复制开票资料
  const copyInvoiceInfo = () => {
    if (actualClient?.invoiceInfo && actualClient.invoiceType !== '不开票') {
      const text = `发票类型：${actualClient.invoiceType}\n开票信息：${actualClient.invoiceInfo}`;
      navigator.clipboard.writeText(text);
      toast.success('开票资料已复制');
    }
  };

  if (userLoading) {
    return <PageLoading />;
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <p className="text-muted-foreground">联系人不存在</p>
      </div>
    );
  }

  const companyName = contact.company || contact.enterpriseName;

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
              <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{contact.realName}</h1>
                  <Badge variant={contact.status === 'active' ? 'default' : 'secondary'}>
                    {contact.status === 'active' ? '启用' : '禁用'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-0.5">
                  {contact.position && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {contact.position}
                    </span>
                  )}
                  {companyName && (
                    <span
                      className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => {
                        if (actualClient?._id) {
                          router.push(`/dashboard/clients/${actualClient._id}`);
                        }
                      }}
                    >
                      <Building2 className="h-3 w-3" />
                      {companyName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button onClick={() => router.push(`/dashboard/contacts/${contactId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            编辑
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="flex gap-6 h-full">
          {/* 左侧主内容 */}
          <div className="flex-1 space-y-6">
            {/* 基本信息卡片 */}
            <Card>
              <CardContent className="p-4">
                {/* 统计数据 */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{stats.totalProjects}</p>
                    <p className="text-xs text-muted-foreground">关联项目</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{stats.completedProjects}</p>
                    <p className="text-xs text-muted-foreground">已完成</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">¥{stats.totalAmount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">项目总额</p>
                  </div>
                </div>

                <Separator className="my-[35px]" />

                {/* 联系方式 */}
                <div className="grid grid-cols-4 gap-6">
                  <InfoItem icon={Phone} label="电话" value={contact.phone} copyable />
                  <InfoItem icon={Mail} label="邮箱" value={contact.email} copyable />
                  <InfoItem icon={Briefcase} label="部门" value={contact.departmentName || contact.department} />
                  <InfoItem icon={Calendar} label="创建时间" value={contact.createTime} />
                </div>

                {/* 快递信息和开票信息 */}
                {(contact.shippingMethod || (actualClient?.invoiceInfo && actualClient.invoiceType !== '不开票')) && (
                  <>
                    <Separator className="my-[35px]" />
                    <div className="flex items-center gap-4">
                      {contact.shippingMethod && (
                        <Button variant="outline" size="sm" onClick={copyShippingInfo}>
                          <Package className="mr-2 h-4 w-4" />
                          复制快递信息
                        </Button>
                      )}
                      {actualClient?.invoiceInfo && actualClient.invoiceType !== '不开票' && (
                        <Button variant="outline" size="sm" onClick={copyInvoiceInfo}>
                          <FileText className="mr-2 h-4 w-4" />
                          复制开票资料
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 选项卡内容 */}
            <Tabs defaultValue="projects" className="flex-1">
              <TabsList>
                <TabsTrigger value="projects">
                  关联项目 ({projects.length})
                </TabsTrigger>
                <TabsTrigger value="company">
                  单位信息
                </TabsTrigger>
                <TabsTrigger value="documents">
                  客户文档 ({clientFiles.length + projectFiles.length})
                </TabsTrigger>
                <TabsTrigger value="quotations">
                  报价单 ({quotations.length})
                </TabsTrigger>
                <TabsTrigger value="settlements">
                  结算单 ({settlements.length})
                </TabsTrigger>
                <TabsTrigger value="contracts">
                  发票 ({contracts.length})
                </TabsTrigger>
              </TabsList>

              {/* 关联项目 */}
              <TabsContent value="projects" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>项目名称</TableHead>
                          <TableHead>项目状态</TableHead>
                          <TableHead>结算状态</TableHead>
                          <TableHead>项目金额</TableHead>
                          <TableHead>创建时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
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
                              <TableCell>
                                {project.createdAt ? format(new Date(project.createdAt), 'yyyy-MM-dd') : '—'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 单位信息 */}
              <TabsContent value="company" className="mt-4">
                {actualClient ? (
                  <Card>
                    <CardContent className="pt-6 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{actualClient.name}</h3>
                            {actualClient.address && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                {actualClient.address}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/clients/${actualClient._id}`)}
                        >
                          查看详情
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground">发票类型</p>
                          <p className="font-medium mt-1">{actualClient.invoiceType || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">客户分类</p>
                          <p className="font-medium mt-1">{actualClient.category || '—'}</p>
                        </div>
                      </div>

                      {actualClient.invoiceInfo && (
                        <div>
                          <p className="text-sm text-muted-foreground">开票信息</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm">{actualClient.invoiceInfo}</p>
                        </div>
                      )}

                      {/* 同事列表 */}
                      {colleagues.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              同事 ({colleagues.length})
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              {colleagues.map((colleague) => (
                                <div
                                  key={colleague._id}
                                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                                  onClick={() => router.push(`/dashboard/contacts/${colleague._id}`)}
                                >
                                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{colleague.realName}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {colleague.position || colleague.department || '—'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>暂无关联单位信息</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* 客户文档 */}
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

              {/* 报价单 */}
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
                    <CardContent>
                      <div className="py-12 text-center text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>暂无报价单</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {quotations.map((quotation) => {
                      const services = getQuotationServices(quotation);
                      const groupedServices: { [key: string]: ServicePricing[] } = {};
                      services.forEach(service => {
                        const categoryName = service.categoryName || '其他';
                        if (!groupedServices[categoryName]) groupedServices[categoryName] = [];
                        groupedServices[categoryName].push(service);
                      });
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
                                {quotation.isDefault && <Badge variant="outline">默认</Badge>}
                              </div>
                              {quotation.validUntil && (
                                <p className="text-sm text-muted-foreground">
                                  有效期至：{format(new Date(quotation.validUntil), 'yyyy-MM-dd')}
                                </p>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            {services.length > 0 && sortedCategories.length > 0 ? (
                              <Tabs defaultValue={sortedCategories[0]} className="w-full">
                                <TabsList className="w-full">
                                  {sortedCategories.map((category) => (
                                    <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
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
                                              <span className="font-medium">{service.serviceName}</span>
                                              {service.alias && (
                                                <span className="text-sm text-muted-foreground ml-2">({service.alias})</span>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              ¥{service.unitPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}/{service.unit}
                                            </TableCell>
                                            <TableCell>
                                              {service.pricingPolicyNames?.length ? (
                                                <div className="flex flex-wrap gap-1">
                                                  {service.pricingPolicyNames.map((name, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs">{name}</Badge>
                                                  ))}
                                                </div>
                                              ) : '—'}
                                            </TableCell>
                                            <TableCell className="text-sm">{service.priceDescription || '—'}</TableCell>
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
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* 结算单 */}
              <TabsContent value="settlements" className="mt-4">
                <Card>
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
                              className="cursor-pointer"
                              onClick={() => router.push(`/dashboard/settlements/${settlement._id}`)}
                            >
                              <TableCell className="font-medium">{settlement.settlementNo}</TableCell>
                              <TableCell>{settlement.projectName}</TableCell>
                              <TableCell>¥{settlement.totalAmount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={settlement.status === 'completed' ? 'default' : settlement.status === 'partial' ? 'secondary' : 'outline'}>
                                  {settlement.status === 'pending' && '待结算'}
                                  {settlement.status === 'partial' && '部分结算'}
                                  {settlement.status === 'completed' && '已结算'}
                                </Badge>
                              </TableCell>
                              <TableCell>{format(new Date(settlement.createdAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/settlements/${settlement._id}`)}>
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

              {/* 发票/合同 */}
              <TabsContent value="contracts" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {contractsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : contracts.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>暂无发票</p>
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
                          {contracts.map((contract: { _id: string; name: string; contractNumber?: string; status: string; generateTime?: string }) => (
                            <TableRow
                              key={contract._id}
                              className="cursor-pointer"
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
                              <TableCell>{contract.generateTime ? format(new Date(contract.generateTime), 'yyyy-MM-dd HH:mm') : '—'}</TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/contracts/${contract._id}`)}>
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
                  onClick={() => {
                    const queryParams = new URLSearchParams();
                    if (actualClient?._id) queryParams.set('clientId', actualClient._id);
                    if (actualClient?.name) queryParams.set('clientName', actualClient.name);
                    queryParams.set('contactId', contactId);
                    queryParams.set('contactName', contact.realName);
                    router.push(`/dashboard/projects/create?${queryParams.toString()}`);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  创建新项目
                </Button>
                <Button variant="ghost" className="w-full justify-start h-9">
                  <Receipt className="mr-2 h-4 w-4" />
                  创建报价单
                </Button>
                <Button variant="ghost" className="w-full justify-start h-9">
                  <FileText className="mr-2 h-4 w-4" />
                  创建合同
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
