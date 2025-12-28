'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Download,
  Pencil,
  Clock,
  CheckCircle,
  FileCheck,
  XCircle,
  Building2,
  User,
  Upload,
  Trash2,
} from 'lucide-react';
import { PageLoading } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useContract,
  useUpdateContractStatus,
  useDeleteContract,
  useUploadSignedFile,
  useDeleteSignedFile,
} from '@/hooks/queries/use-contracts';
import { downloadContractPDF, downloadSignedFile } from '@/api/generatedContracts';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useRef, useState } from 'react';

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading } = useContract(contractId);
  const updateStatus = useUpdateContractStatus();
  const deleteContract = useDeleteContract();
  const uploadSignedFile = useUploadSignedFile();
  const deleteSignedFileMutation = useDeleteSignedFile();

  const contract = data?.success ? data.data : null;

  const handleDownloadPDF = async () => {
    if (!contract) return;
    try {
      const blob = await downloadContractPDF(contractId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contract.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('下载成功');
    } catch {
      toast.error('下载失败');
    }
  };

  const handleDownloadSignedFile = async () => {
    if (!contract) return;
    try {
      const blob = await downloadSignedFile(contractId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contract.name}-已签署.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('下载成功');
    } catch {
      toast.error('下载失败');
    }
  };

  const handleStatusChange = (status: string) => {
    updateStatus.mutate({ id: contractId, status });
  };

  const handleDelete = () => {
    deleteContract.mutate(contractId, {
      onSuccess: () => {
        router.push('/dashboard/contracts/generated');
      },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    uploadSignedFile.mutate(
      { id: contractId, file },
      {
        onSettled: () => {
          setIsUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
      }
    );
  };

  const handleDeleteSignedFile = () => {
    deleteSignedFileMutation.mutate(contractId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            待签署
          </Badge>
        );
      case 'signed':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
            <FileCheck className="h-3 w-3 mr-1" />
            已签署
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            已完成
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            已取消
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (!contract) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <p className="text-muted-foreground">合同不存在</p>
      </div>
    );
  }

  const templateName =
    typeof contract.templateId === 'object'
      ? contract.templateId?.name
      : null;

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{contract.name}</h1>
              {getStatusBadge(contract.status)}
            </div>
            {contract.contractNumber && (
              <p className="text-sm text-muted-foreground">
                合同编号：{contract.contractNumber}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            下载PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/contracts/${contractId}/edit`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            编辑
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除合同</AlertDialogTitle>
                <AlertDialogDescription>
                  删除后无法恢复，确定要删除这份合同吗？
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
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：合同内容 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">合同内容</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: contract.content }}
              />
            </CardContent>
          </Card>
        </div>

        {/* 右侧：合同信息 */}
        <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {templateName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">使用模板</span>
                  <span className="text-sm">{templateName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">生成时间</span>
                <span className="text-sm">
                  {format(new Date(contract.generateTime), 'yyyy-MM-dd HH:mm')}
                </span>
              </div>
              {contract.signedTime && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">签署时间</span>
                  <span className="text-sm">
                    {format(new Date(contract.signedTime), 'yyyy-MM-dd HH:mm')}
                  </span>
                </div>
              )}
              {contract.expirationDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">到期日期</span>
                  <span className="text-sm">
                    {format(new Date(contract.expirationDate), 'yyyy-MM-dd')}
                  </span>
                </div>
              )}
              {contract.description && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">描述</span>
                    <p className="text-sm mt-1">{contract.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 关联信息 */}
          {(contract.clientInfo || contract.relatedIds) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">关联信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(contract.relatedIds?.clientNames?.length ||
                  contract.clientInfo?.name) && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">客户</p>
                        <p className="text-sm text-muted-foreground">
                          {contract.relatedIds?.clientNames?.join(', ') ||
                            contract.clientInfo?.name}
                        </p>
                      </div>
                    </div>
                  )}
                {(contract.relatedIds?.contactNames?.length ||
                  contract.clientInfo?.contact) && (
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">联系人</p>
                        <p className="text-sm text-muted-foreground">
                          {contract.relatedIds?.contactNames?.join(', ') ||
                            contract.clientInfo?.contact}
                        </p>
                      </div>
                    </div>
                  )}
                {contract.relatedIds?.projectName && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">关联项目</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.relatedIds.projectName}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 签署文件 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">签署文件</CardTitle>
            </CardHeader>
            <CardContent>
              {contract.signedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-green-500" />
                      <span className="text-sm">已上传签署文件</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownloadSignedFile}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteSignedFile}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    上传已签署的合同文件
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? '上传中...' : '上传文件'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 状态操作 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">状态操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contract.status === 'pending' && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusChange('signed')}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  标记已签署
                </Button>
              )}
              {contract.status === 'signed' && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusChange('completed')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  标记已完成
                </Button>
              )}
              {contract.status !== 'cancelled' && (
                <Button
                  variant="outline"
                  className="w-full text-destructive"
                  onClick={() => handleStatusChange('cancelled')}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  取消合同
                </Button>
              )}
              {contract.status === 'cancelled' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusChange('pending')}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  恢复为待签署
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
