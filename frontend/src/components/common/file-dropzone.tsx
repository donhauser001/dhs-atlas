'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, FileIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

interface FileDropzoneProps {
    onUpload: (
        files: File[],
        onProgress: (progress: number) => void
    ) => Promise<{ success: boolean; message?: string }>;
    accept?: string;
    maxSize?: number; // 单位：字节
    maxFiles?: number;
    disabled?: boolean;
    className?: string;
    hint?: string;
}

export function FileDropzone({
    onUpload,
    accept,
    maxSize = 1024 * 1024 * 1024, // 默认 1GB
    maxFiles = 50,
    disabled = false,
    className,
    hint,
}: FileDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 格式化文件大小
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    // 验证文件
    const validateFiles = (files: FileList | File[]): File[] => {
        const validFiles: File[] = [];
        const fileArray = Array.from(files);

        for (const file of fileArray) {
            if (file.size > maxSize) {
                setUploadingFiles((prev) => [
                    ...prev,
                    {
                        id: `${file.name}-${Date.now()}`,
                        file,
                        progress: 0,
                        status: 'error',
                        error: `文件超过 ${formatSize(maxSize)} 限制`,
                    },
                ]);
                continue;
            }

            if (validFiles.length >= maxFiles) {
                break;
            }

            validFiles.push(file);
        }

        return validFiles;
    };

    // 处理上传
    const handleUpload = useCallback(
        async (files: File[]) => {
            if (files.length === 0 || disabled) return;

            const validFiles = validateFiles(files);
            if (validFiles.length === 0) return;

            // 创建上传中的文件记录
            const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
                id: `${file.name}-${Date.now()}-${Math.random()}`,
                file,
                progress: 0,
                status: 'uploading' as const,
            }));

            setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

            // 更新总体进度
            const updateProgress = (progress: number) => {
                setUploadingFiles((prev) =>
                    prev.map((f) =>
                        newUploadingFiles.find((nf) => nf.id === f.id)
                            ? { ...f, progress: Math.min(progress, 99) }
                            : f
                    )
                );
            };

            try {
                const result = await onUpload(validFiles, updateProgress);

                // 更新状态为成功或失败
                setUploadingFiles((prev) =>
                    prev.map((f) =>
                        newUploadingFiles.find((nf) => nf.id === f.id)
                            ? {
                                ...f,
                                progress: 100,
                                status: result.success ? 'success' : 'error',
                                error: result.success ? undefined : result.message,
                            }
                            : f
                    )
                );

                // 3秒后清除成功的文件
                setTimeout(() => {
                    setUploadingFiles((prev) =>
                        prev.filter(
                            (f) =>
                                !newUploadingFiles.find((nf) => nf.id === f.id) ||
                                f.status === 'error'
                        )
                    );
                }, 3000);
            } catch {
                setUploadingFiles((prev) =>
                    prev.map((f) =>
                        newUploadingFiles.find((nf) => nf.id === f.id)
                            ? {
                                ...f,
                                status: 'error',
                                error: '上传失败',
                            }
                            : f
                    )
                );
            }
        },
        [disabled, maxSize, maxFiles, onUpload]
    );

    // 拖拽事件处理
    const handleDragEnter = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) {
                setIsDragging(true);
            }
        },
        [disabled]
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) {
                setIsDragging(true);
            }
        },
        [disabled]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            if (disabled) return;

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                handleUpload(Array.from(files));
            }
        },
        [disabled, handleUpload]
    );

    // 点击选择文件
    const handleClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    // 文件选择变化
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleUpload(Array.from(files));
        }
        // 重置 input 以允许重复选择相同文件
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 移除错误文件
    const removeFile = (id: string) => {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const isUploading = uploadingFiles.some((f) => f.status === 'uploading');

    return (
        <div className={cn('space-y-2', className)}>
            {/* 拖拽区域 */}
            <div
                className={cn(
                    'relative border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer',
                    'hover:border-primary/50 hover:bg-muted/30',
                    isDragging && 'border-primary bg-primary/5',
                    disabled && 'opacity-50 cursor-not-allowed',
                    isUploading && 'pointer-events-none'
                )}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={accept}
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={disabled}
                />

                <div className="flex items-center justify-center gap-3 text-center">
                    <div
                        className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0',
                            isDragging ? 'bg-primary/10' : 'bg-muted'
                        )}
                    >
                        <Upload
                            className={cn(
                                'h-5 w-5 transition-colors',
                                isDragging ? 'text-primary' : 'text-muted-foreground'
                            )}
                        />
                    </div>
                    <div>
                        <p className="text-sm font-medium">
                            {isDragging ? '松开鼠标上传文件' : '拖拽文件到此处，或点击选择'}
                        </p>
                        {hint && (
                            <p className="text-xs text-muted-foreground">{hint}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 上传进度列表 */}
            {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                    {uploadingFiles.map((item) => (
                        <div
                            key={item.id}
                            className={cn(
                                'flex items-center gap-3 p-3 rounded-lg',
                                item.status === 'error' ? 'bg-destructive/5' : 'bg-muted/50'
                            )}
                        >
                            {/* 图标 */}
                            <div className="flex-shrink-0">
                                {item.status === 'uploading' ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                ) : item.status === 'success' ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : item.status === 'error' ? (
                                    <AlertCircle className="h-5 w-5 text-destructive" />
                                ) : (
                                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>

                            {/* 文件信息和进度 */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium truncate">
                                        {item.file.name}
                                    </p>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                        {formatSize(item.file.size)}
                                    </span>
                                </div>
                                {item.status === 'uploading' && (
                                    <div className="mt-2">
                                        <Progress value={item.progress} className="h-1.5" />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            上传中 {item.progress}%
                                        </p>
                                    </div>
                                )}
                                {item.status === 'error' && item.error && (
                                    <p className="text-xs text-destructive mt-1">{item.error}</p>
                                )}
                                {item.status === 'success' && (
                                    <p className="text-xs text-green-600 mt-1">上传成功</p>
                                )}
                            </div>

                            {/* 移除按钮（仅错误状态显示） */}
                            {item.status === 'error' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 flex-shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(item.id);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

