'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  File,
  Film,
  Music,
  Archive,
  HardDrive,
  FileImage,
  Eye,
  FolderOpen,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileItem, formatFileSize, getFileUrl, isImageFile } from '@/api/files';
import { useFiles, useDeleteFile } from '@/hooks/queries/use-files';
import { fileCenterService } from '@/api/fileCenter';
import { format } from 'date-fns';
import { toast } from 'sonner';

// 文件类型图标映射
const getFileIcon = (mimeType: string, fileName: string) => {
  if (mimeType.startsWith('image/')) {
    return <ImageIcon className="h-4 w-4 text-blue-500" />;
  }
  if (mimeType.startsWith('video/')) {
    return <Film className="h-4 w-4 text-purple-500" />;
  }
  if (mimeType.startsWith('audio/')) {
    return <Music className="h-4 w-4 text-green-500" />;
  }
  if (mimeType === 'application/pdf') {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('7z')
  ) {
    return <Archive className="h-4 w-4 text-yellow-500" />;
  }
  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    fileName.endsWith('.doc') ||
    fileName.endsWith('.docx')
  ) {
    return <FileText className="h-4 w-4 text-blue-600" />;
  }
  if (
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet') ||
    fileName.endsWith('.xls') ||
    fileName.endsWith('.xlsx')
  ) {
    return <FileText className="h-4 w-4 text-green-600" />;
  }
  return <File className="h-4 w-4 text-muted-foreground" />;
};

// 分类名称映射
const categoryNames: Record<string, string> = {
  projects: '项目文件',
  clients: '客户文件',
  contracts: '合同文件',
  invoices: '发票文件',
  quotations: '报价单',
  settlements: '结算单',
  user: '用户文件',
  other: '其他',
};

export default function FileCenterPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const { data, isLoading } = useFiles({
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    limit: 100,
    sortBy: 'uploadTime',
    sortOrder: 'desc',
  });
  const deleteFile = useDeleteFile();

  // 安全获取数据，兼容不同的响应格式
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const responseData = data as any;
  const files = responseData?.data?.files || responseData?.files || (Array.isArray(responseData?.data) ? responseData.data : []);
  const pagination = responseData?.data?.pagination || responseData?.pagination;

  const handleDelete = () => {
    if (deleteId) {
      deleteFile.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      await fileCenterService.downloadFile(file._id);
      toast.success('开始下载');
    } catch {
      toast.error('下载失败');
    }
  };

  const handlePreview = (file: FileItem) => {
    if (isImageFile(file.originalName)) {
      setPreviewFile(file);
    } else {
      // 非图片文件直接下载
      handleDownload(file);
    }
  };

  const columns: ColumnDef<FileItem>[] = [
    {
      accessorKey: 'originalName',
      header: '文件名',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 max-w-[300px]">
          {getFileIcon(row.original.mimeType, row.original.originalName)}
          <span className="font-medium truncate">{row.original.originalName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: '分类',
      cell: ({ row }) => (
        <Badge variant="outline">
          {categoryNames[row.original.category] || row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: 'fileSize',
      header: '大小',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatFileSize(row.original.fileSize)}
        </span>
      ),
    },
    {
      accessorKey: 'uploaderName',
      header: '上传者',
      cell: ({ row }) => row.original.uploaderName || '—',
    },
    {
      accessorKey: 'uploadTime',
      header: '上传时间',
      cell: ({ row }) =>
        row.original.uploadTime
          ? format(new Date(row.original.uploadTime), 'yyyy-MM-dd HH:mm')
          : '—',
    },
    {
      accessorKey: 'downloadCount',
      header: '下载次数',
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.downloadCount || 0}</Badge>
      ),
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
            {isImageFile(row.original.originalName) && (
              <DropdownMenuItem onClick={() => handlePreview(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                预览
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleDownload(row.original)}>
              <Download className="mr-2 h-4 w-4" />
              下载
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
  const totalFiles = pagination?.total || files.length;
  const totalSize = files.reduce((sum: number, f: FileItem) => sum + f.fileSize, 0);

  // 分类统计
  const categoryStats = files.reduce(
    (acc: Record<string, number>, f: FileItem) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="文件中心" description="管理系统中的所有文件">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="分类筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {Object.entries(categoryNames).map(([key, name]) => (
              <SelectItem key={key} value={key}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">文件总数</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总存储</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">项目文件</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats['projects'] || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">图片文件</CardTitle>
            <FileImage className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {files.filter((f: FileItem) => f.mimeType.startsWith('image/')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 文件列表 */}
      <DataTable
        columns={columns}
        data={files}
        searchKey="originalName"
        searchPlaceholder="搜索文件名..."
      />

      {/* 图片预览 */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.originalName}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFileUrl(previewFile.filePath)}
                alt={previewFile.originalName}
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除文件</AlertDialogTitle>
            <AlertDialogDescription>
              删除后文件将无法恢复。确定要删除吗？
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
