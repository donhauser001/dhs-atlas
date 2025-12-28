'use client';

/**
 * 客户表单组件
 * 
 * 纯表单组件，不包含 Dialog 容器。
 * 可在模态窗、AI 画板等不同容器中复用。
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Star,
  Trash2,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File,
  FileArchive,
  FileSpreadsheet,
  FileType,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { DialogFooter } from '@/components/ui/dialog';
import { Client, clientApi } from '@/api/clients';
import { ClientCategory, clientCategoryApi } from '@/api/client-categories';
import { Quotation, getAllQuotations } from '@/api/quotations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============ 类型定义 ============

interface ClientFile {
  path: string;
  originalName: string;
  size: number;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: ClientFile;
}

// 表单验证 schema
export const clientFormSchema = z.object({
  name: z.string().min(1, '请输入客户名称'),
  address: z.string().min(1, '请输入地址'),
  category: z.string().min(1, '请选择客户分类'),
  invoiceType: z.string().min(1, '请选择票种类别'),
  invoiceInfo: z.string().optional(),
  quotationId: z.string().optional(),
  rating: z.number().min(1).max(5),
  summary: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

// 客户表单 Props - 使用简化的接口而不是继承
interface ClientFormProps {
  /** 当前展示模式 */
  mode?: 'modal' | 'canvas' | 'inline' | 'drawer';
  /** 操作模式：创建/编辑/查看 */
  operationMode: 'create' | 'edit' | 'view';
  /** 初始数据（编辑/查看模式下传入） */
  initialData?: Client | Record<string, unknown> | null;
  /** 表单提交回调 */
  onSubmit?: (data: ClientFormValues) => Promise<void>;
  /** 取消操作回调 */
  onCancel?: () => void;
  /** 操作成功后的回调 */
  onSuccess?: () => void;
  /** 是否只读模式 */
  readonly?: boolean;
  /** 是否正在提交 */
  isSubmitting?: boolean;
  /** 额外的上下文数据 */
  context?: Record<string, unknown>;
}

// ============ 工具函数 ============

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return <ImageIcon className="h-6 w-6 text-green-500" />;
  }
  if (['pdf'].includes(ext)) {
    return <FileText className="h-6 w-6 text-red-500" />;
  }
  if (['doc', 'docx'].includes(ext)) {
    return <FileType className="h-6 w-6 text-blue-500" />;
  }
  if (['xls', 'xlsx'].includes(ext)) {
    return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return <FileText className="h-6 w-6 text-orange-500" />;
  }
  if (['zip', 'rar', '7z'].includes(ext)) {
    return <FileArchive className="h-6 w-6 text-yellow-600" />;
  }
  if (['psd', 'ai', 'eps', 'indd'].includes(ext)) {
    return <File className="h-6 w-6 text-purple-500" />;
  }
  return <File className="h-6 w-6 text-muted-foreground" />;
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ============ 主组件 ============

export function ClientForm({
  operationMode,
  initialData,
  onCancel,
  onSuccess,
  readonly,
  isSubmitting: externalIsSubmitting,
}: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [showInvoiceInfo, setShowInvoiceInfo] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentMode, setCurrentMode] = useState(operationMode);

  // 文件相关状态
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isViewMode = currentMode === 'view' || readonly;
  const isCreateMode = currentMode === 'create';
  const isEditMode = currentMode === 'edit';
  const isSubmitting = loading || externalIsSubmitting;

  // 将 Client 类型的 initialData 转换为表单值
  const client = initialData as Client | null | undefined;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      address: '',
      category: '',
      invoiceType: '不开票',
      invoiceInfo: '',
      quotationId: '',
      rating: 3,
      summary: '',
      status: 'active',
    },
  });

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

  // 获取报价单列表
  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const data = await getAllQuotations();
        setQuotations(data || []);
      } catch (error) {
        console.error('获取报价单列表失败:', error);
      }
    };
    fetchQuotations();
  }, []);

  // 初始化表单数据
  useEffect(() => {
    setCurrentMode(operationMode);
    setUploadingFiles([]);

    if (client && (operationMode === 'view' || operationMode === 'edit')) {
      form.reset({
        name: client.name || '',
        address: client.address || '',
        category: client.category || '',
        invoiceType: client.invoiceType || '不开票',
        invoiceInfo: client.invoiceInfo || '',
        quotationId: client.quotationId || '',
        rating: client.rating || 3,
        summary: client.summary || '',
        status: client.status || 'active',
      });
      setShowInvoiceInfo(client.invoiceType !== '不开票');
      setFiles(client.files || []);
    } else {
      form.reset({
        name: '',
        address: '',
        category: '',
        invoiceType: '不开票',
        invoiceInfo: '',
        quotationId: '',
        rating: 3,
        summary: '',
        status: 'active',
      });
      setShowInvoiceInfo(false);
      setFiles([]);
    }
  }, [client, operationMode, form]);

  // 处理票种类别变化
  const handleInvoiceTypeChange = (value: string) => {
    form.setValue('invoiceType', value);
    if (value === '不开票') {
      form.setValue('invoiceInfo', '');
      setShowInvoiceInfo(false);
    } else {
      setShowInvoiceInfo(true);
    }
  };

  // 处理文件拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isViewMode) {
      setIsDragging(true);
    }
  }, [isViewMode]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isViewMode) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFilesSelected(droppedFiles);
  }, [isViewMode]);

  // 处理文件选择
  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    const newUploadingFiles: UploadingFile[] = selectedFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    for (const uploadFile of newUploadingFiles) {
      try {
        const formData = new FormData();
        formData.append('file', uploadFile.file);
        formData.append('category', 'clients');
        if (client?._id) {
          formData.append('subDirectory', client._id);
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success && result.data?.url) {
          const newFile: ClientFile = {
            path: result.data.url,
            originalName: uploadFile.file.name,
            size: uploadFile.file.size,
          };

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: 'success', progress: 100, result: newFile }
                : f
            )
          );

          setFiles((prev) => [...prev, newFile]);
        } else {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: 'error', error: result.message || '上传失败' }
                : f
            )
          );
        }
      } catch {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: 'error', error: '上传失败' }
              : f
          )
        );
      }
    }

    setTimeout(() => {
      setUploadingFiles((prev) => prev.filter((f) => f.status === 'uploading'));
    }, 2000);
  };

  // 删除文件
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 提交表单
  const onSubmit = async (values: ClientFormValues) => {
    try {
      setLoading(true);

      const submitData = {
        ...values,
        invoiceInfo: values.invoiceType === '不开票' ? '' : values.invoiceInfo,
        files: files,
      };

      if (isEditMode && client) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await clientApi.update(client._id, submitData as any);
        if (response.success) {
          toast.success('客户更新成功');
          onSuccess?.();
        } else {
          toast.error(response.message || '更新失败');
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await clientApi.create(submitData as any);
        if (response.success) {
          toast.success('客户创建成功');
          onSuccess?.();
        } else {
          toast.error(response.message || '创建失败');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 删除客户
  const handleDelete = async () => {
    if (!client) return;
    try {
      setLoading(true);
      await clientApi.delete(client._id);
      toast.success('客户删除成功');
      setShowDeleteDialog(false);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除失败';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const rating = form.watch('rating');

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 客户名称 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>客户名称 *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="请输入客户名称"
                    disabled={isViewMode}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 地址 */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>地址 *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="请输入详细地址"
                    rows={2}
                    disabled={isViewMode}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 票种类别 和 客户评级 */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="invoiceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>票种类别 *</FormLabel>
                  <Select
                    onValueChange={handleInvoiceTypeChange}
                    value={field.value}
                    disabled={isViewMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择票种类别" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="增值税专用发票">增值税专用发票</SelectItem>
                      <SelectItem value="增值税普通发票">增值税普通发票</SelectItem>
                      <SelectItem value="不开票">不开票</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>客户评级</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-1 h-9">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => !isViewMode && field.onChange(star)}
                          disabled={isViewMode}
                          className="focus:outline-none disabled:cursor-default"
                        >
                          <Star
                            className={`h-5 w-5 transition-colors ${star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground/30 hover:text-yellow-400/50'
                              } ${isViewMode ? '' : 'cursor-pointer'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 开票信息 */}
          {showInvoiceInfo && (
            <FormField
              control={form.control}
              name="invoiceInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>开票信息</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入开票信息，包括公司名称、税号、开户行、账号等"
                      rows={3}
                      disabled={isViewMode}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* 客户分类 和 状态 */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>客户分类 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isViewMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择客户分类" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>状态 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isViewMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择状态" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">启用</SelectItem>
                      <SelectItem value="inactive">禁用</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 报价单 */}
          <FormField
            control={form.control}
            name="quotationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>报价单</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === '_none_' ? '' : value)}
                  value={field.value || '_none_'}
                  disabled={isViewMode}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择报价单（可选）" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_none_">不设置</SelectItem>
                    {quotations
                      .filter((q) => q.status === 'active')
                      .map((quotation) => (
                        <SelectItem key={quotation._id} value={quotation._id}>
                          {quotation.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 客户摘要 */}
          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>客户摘要</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="请输入客户摘要信息"
                    rows={2}
                    disabled={isViewMode}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 客户常用文件 */}
          <div className="space-y-3">
            <Label>客户常用文件</Label>

            {/* 文件上传区域 */}
            {!isViewMode && (
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors',
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.psd,.ai,.tiff,.tif,.eps,.indd"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFilesSelected(Array.from(e.target.files));
                      e.target.value = '';
                    }
                  }}
                />
                <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  点击或拖拽文件上传
                </p>
              </div>
            )}

            {/* 上传进度 */}
            {uploadingFiles.length > 0 && (
              <div className="space-y-2">
                {uploadingFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm"
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                    <span className="truncate flex-1">{file.file.name}</span>
                    {file.status === 'error' && (
                      <span className="text-xs text-destructive flex-shrink-0">{file.error}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 已有文件网格列表 */}
            {files.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="group relative border rounded-lg p-2 bg-muted/30 hover:bg-muted/50 transition-colors text-center"
                  >
                    {/* 删除按钮 */}
                    {!isViewMode && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}

                    {/* 文件图标 */}
                    <div className="flex justify-center mb-1">
                      {getFileIcon(file.originalName)}
                    </div>

                    {/* 文件名 */}
                    <p className="text-xs truncate" title={file.originalName}>
                      {file.originalName}
                    </p>

                    {/* 文件大小 */}
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 无文件提示 */}
            {files.length === 0 && isViewMode && (
              <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg bg-muted/20">
                暂无文件
              </div>
            )}
          </div>

          {/* 表单按钮 */}
          <DialogFooter>
            {isViewMode && !readonly ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  关闭
                </Button>
                <Button type="button" onClick={() => setCurrentMode('edit')}>
                  编辑
                </Button>
              </>
            ) : readonly ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                关闭
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={onCancel}>
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? isCreateMode
                      ? '创建中...'
                      : '保存中...'
                    : isCreateMode
                      ? '创建客户'
                      : '保存修改'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </Form>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除客户</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除客户「{client?.name}」吗？此操作不可撤销。
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
    </>
  );
}

