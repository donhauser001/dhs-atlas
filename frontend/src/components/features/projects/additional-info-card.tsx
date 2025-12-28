'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  FolderOpen,
  MessageSquare,
  StickyNote,
  Download,
  File,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileType,
  Presentation,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { toast } from 'sonner';
import { Project } from '@/api/projects';
import {
  FileItem,
  ClientFile,
  getProjectFiles,
  getClientFiles,
  uploadProjectFiles,
  downloadFile,
  deleteFile,
  getFileUrl,
  getThumbnailUrl,
  formatFileSize,
  isImageFile,
} from '@/api/files';
import { FileDropzone } from '@/components/common/file-dropzone';

// 根据文件名获取对应图标和颜色
function getFileIconInfo(fileName: string): { icon: React.ElementType; color: string } {
  const ext = fileName.toLowerCase().split('.').pop() || '';

  // PDF 文件
  if (ext === 'pdf') {
    return { icon: FileText, color: 'text-red-500' };
  }

  // Word 文档
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
    return { icon: FileText, color: 'text-blue-500' };
  }

  // Excel 表格
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
    return { icon: FileSpreadsheet, color: 'text-green-500' };
  }

  // PowerPoint 演示文稿
  if (['ppt', 'pptx', 'odp'].includes(ext)) {
    return { icon: Presentation, color: 'text-orange-500' };
  }

  // 视频文件
  if (['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v'].includes(ext)) {
    return { icon: FileVideo, color: 'text-purple-500' };
  }

  // 音频文件
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(ext)) {
    return { icon: FileAudio, color: 'text-pink-500' };
  }

  // 压缩文件
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
    return { icon: FileArchive, color: 'text-yellow-600' };
  }

  // 代码文件
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'go', 'rs', 'rb', 'php', 'swift', 'kt'].includes(ext)) {
    return { icon: FileCode, color: 'text-cyan-500' };
  }

  // Web 文件
  if (['html', 'htm', 'css', 'scss', 'less', 'xml', 'json', 'yaml', 'yml'].includes(ext)) {
    return { icon: FileCode, color: 'text-teal-500' };
  }

  // 文本文件
  if (['txt', 'md', 'log'].includes(ext)) {
    return { icon: FileType, color: 'text-gray-500' };
  }

  // 默认图标
  return { icon: File, color: 'text-muted-foreground' };
}

// 安全渲染 HTML 内容
function RichContent({ html }: { html: string }) {
  if (!html) return null;

  // 简单的 HTML 清理（移除潜在危险标签）
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');

  return (
    <div
      className="prose prose-sm max-w-none text-sm leading-relaxed text-justify [&_img]:max-w-full [&_img]:rounded-md [&_img]:my-2"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}

interface AdditionalInfoCardProps {
  project: Project;
  onRemarkAdd: () => void;
  onRemarkEdit: (index: number, content: string) => void;
  onRemarkDelete: (index: number) => void;
  onRequirementAdd: () => void;
  onRequirementEdit: (index: number, content: string) => void;
  onRequirementDelete: (index: number) => void;
  onProjectFileChange?: () => void;
}

export function AdditionalInfoCard({
  project,
  onRemarkAdd,
  onRemarkEdit,
  onRemarkDelete,
  onRequirementAdd,
  onRequirementEdit,
  onRequirementDelete,
  onProjectFileChange,
}: AdditionalInfoCardProps) {
  // 文件状态
  const [projectFiles, setProjectFiles] = useState<FileItem[]>([]);
  const [clientFiles, setClientFiles] = useState<ClientFile[]>([]);
  const [projectFilesLoading, setProjectFilesLoading] = useState(false);
  const [clientFilesLoading, setClientFilesLoading] = useState(false);

  // 获取项目文件
  const fetchProjectFiles = useCallback(async () => {
    if (!project._id) return;
    setProjectFilesLoading(true);
    try {
      const files = await getProjectFiles(project._id);
      setProjectFiles(files);
    } catch {
      console.error('获取项目文件失败:', error);
    } finally {
      setProjectFilesLoading(false);
    }
  }, [project._id]);

  // 获取客户文件
  const fetchClientFiles = useCallback(async () => {
    if (!project.clientId) return;
    setClientFilesLoading(true);
    try {
      const files = await getClientFiles(project.clientId);
      setClientFiles(files);
    } catch {
      console.error('获取客户文件失败:', error);
    } finally {
      setClientFilesLoading(false);
    }
  }, [project.clientId]);

  useEffect(() => {
    fetchProjectFiles();
    fetchClientFiles();
  }, [fetchProjectFiles, fetchClientFiles]);

  // 处理文件上传（配合 FileDropzone 使用）
  const handleFileUpload = async (
    files: File[],
    onProgress: (progress: number) => void
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await uploadProjectFiles(project._id, files, onProgress);
      if (result.success) {
        toast.success(result.message || `成功上传 ${files.length} 个文件`);
        await fetchProjectFiles();
        onProjectFileChange?.();
      } else {
        toast.error(result.message || '文件上传失败');
      }
      return result;
    } catch {
      toast.error('文件上传过程中发生错误');
      return { success: false, message: '上传失败' };
    }
  };

  // 处理项目文件下载
  const handleProjectFileDownload = async (file: FileItem) => {
    try {
      await downloadFile(file._id);
    } catch {
      toast.error('文件下载失败');
    }
  };

  // 处理项目文件删除
  const handleProjectFileDelete = async (file: FileItem) => {
    try {
      await deleteFile(file._id);
      toast.success('文件已删除');
      await fetchProjectFiles();
      onProjectFileChange?.();
    } catch {
      toast.error('文件删除失败');
    }
  };

  // 清空所有项目文件
  const handleClearAllProjectFiles = async () => {
    if (projectFiles.length === 0) return;

    try {
      let successCount = 0;
      let failCount = 0;

      for (const file of projectFiles) {
        try {
          await deleteFile(file._id);
          successCount++;
        } catch {
          failCount++;
        }
      }

      if (failCount === 0) {
        toast.success(`已清空 ${successCount} 个文件`);
      } else {
        toast.error(`删除了 ${successCount} 个文件，${failCount} 个失败`);
      }

      await fetchProjectFiles();
      onProjectFileChange?.();
    } catch {
      toast.error('清空文件失败');
    }
  };

  // 处理客户文件下载
  const handleClientFileDownload = (file: ClientFile) => {
    const link = document.createElement('a');
    link.href = getFileUrl(file.path);
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col bg-background border rounded-lg shadow-sm overflow-hidden">
      <Tabs defaultValue="requirements" className="h-full flex flex-col">
        {/* 侧边栏头部 */}
        <div className="p-4 border-b flex-shrink-0">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="requirements" className="text-xs px-1">
              <MessageSquare className="h-3 w-3 mr-1" />
              嘱托
            </TabsTrigger>
            <TabsTrigger value="remarks" className="text-xs px-1">
              <StickyNote className="h-3 w-3 mr-1" />
              备注
            </TabsTrigger>
            <TabsTrigger value="projectFiles" className="text-xs px-1">
              <FileText className="h-3 w-3 mr-1" />
              项目文件
            </TabsTrigger>
            <TabsTrigger value="clientFiles" className="text-xs px-1">
              <FolderOpen className="h-3 w-3 mr-1" />
              客户文件
            </TabsTrigger>
          </TabsList>
        </div>
        {/* 侧边栏内容 */}
        <div className="flex-1 overflow-hidden p-4 min-h-0">
          {/* 客户嘱托 */}
          <TabsContent value="requirements" className="mt-0 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <span className="text-sm text-muted-foreground">
                {project.clientRequirements?.length || 0} 条嘱托
              </span>
              <Button variant="ghost" size="sm" onClick={onRequirementAdd}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {project.clientRequirements && project.clientRequirements.length > 0 ? (
              <ScrollArea className="flex-1">
                <div className="space-y-4">
                  {project.clientRequirements.map((req, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-muted/50 group"
                    >
                      {/* 顶部：时间和操作按钮 */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(req.createdAt), 'yyyy-MM-dd HH:mm')}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onRequirementEdit(index, req.content)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除这条客户嘱托吗？
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onRequirementDelete(index)}>
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      {/* 内容：显示全部 */}
                      <RichContent html={req.content} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">暂无客户嘱托</p>
              </div>
            )}
          </TabsContent>

          {/* 备注 */}
          <TabsContent value="remarks" className="mt-0 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <span className="text-sm text-muted-foreground">
                {project.remark?.length || 0} 条备注
              </span>
              <Button variant="ghost" size="sm" onClick={onRemarkAdd}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {project.remark && project.remark.length > 0 ? (
              <ScrollArea className="flex-1">
                <div className="space-y-4">
                  {project.remark.map((rem, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-muted/50 group"
                    >
                      {/* 顶部：时间和操作按钮 */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(rem.createdAt), 'yyyy-MM-dd HH:mm')}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onRemarkEdit(index, rem.content)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除这条备注吗？
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onRemarkDelete(index)}>
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      {/* 内容：显示全部 */}
                      <RichContent html={rem.content} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">暂无备注</p>
              </div>
            )}
          </TabsContent>

          {/* 项目文件 */}
          <TabsContent value="projectFiles" className="mt-0 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <span className="text-sm text-muted-foreground">
                {projectFiles.length} 个文件
              </span>
            </div>

            {/* 拖拽上传区域 */}
            <div className="flex-shrink-0">
              <FileDropzone
                onUpload={handleFileUpload}
                maxSize={1024 * 1024 * 1024}
                maxFiles={50}
                hint="支持拖拽多个文件，单个文件最大 1GB"
              />
            </div>

            {projectFilesLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : projectFiles.length > 0 ? (
              <div className="flex flex-col flex-1 mt-4 min-h-0">
                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-3">
                    {projectFiles.map((file) => {
                      const { icon: FileIcon, color: iconColor } = getFileIconInfo(file.originalName);
                      return (
                        <div
                          key={file._id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
                        >
                          {/* 文件图标或缩略图 */}
                          {isImageFile(file.originalName) ? (
                            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-muted">
                              <img
                                src={getThumbnailUrl(file)}
                                alt={file.originalName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <FileIcon className={`h-5 w-5 ${iconColor}`} />
                            </div>
                          )}

                          {/* 文件信息 */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.originalName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.fileSize)} · {format(new Date(file.uploadTime), 'yyyy-MM-dd HH:mm')}
                            </p>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleProjectFileDownload(file)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    确定要删除文件 &quot;{file.originalName}&quot; 吗？
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleProjectFileDelete(file)}>
                                    删除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
                {/* 清空文件按钮 */}
                <div className="pt-3 border-t mt-3 flex-shrink-0">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        清空文件
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认清空</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除所有 {projectFiles.length} 个项目文件吗？此操作不可撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAllProjectFiles}>
                          清空
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">暂无项目文件，拖拽文件到上方区域开始上传</p>
              </div>
            )}
          </TabsContent>

          {/* 客户文件 */}
          <TabsContent value="clientFiles" className="mt-0 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <span className="text-sm text-muted-foreground">
                {clientFiles.length} 个文件
              </span>
            </div>
            {clientFilesLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !project.clientId ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">项目未关联客户</p>
              </div>
            ) : clientFiles.length > 0 ? (
              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {clientFiles.map((file, index) => {
                    const { icon: FileIcon, color: iconColor } = getFileIconInfo(file.originalName);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
                      >
                        {/* 文件图标或缩略图 */}
                        {isImageFile(file.originalName) ? (
                          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-muted">
                            <img
                              src={getFileUrl(file.path)}
                              alt={file.originalName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            <FileIcon className={`h-5 w-5 ${iconColor}`} />
                          </div>
                        )}

                        {/* 文件信息 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>

                        {/* 下载按钮 */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleClientFileDownload(file)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">该客户暂无常用文件</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
