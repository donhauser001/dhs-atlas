/**
 * AI 设置模块 - 删除确认对话框
 */

'use client';

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
import { useDeleteAiModel } from '@/hooks/queries/use-ai-settings';
import type { DeleteConfirmDialogProps } from './types';

export function DeleteConfirmDialog({
    open,
    onOpenChange,
    modelId,
}: DeleteConfirmDialogProps) {
    const deleteModel = useDeleteAiModel();

    const handleDelete = () => {
        if (modelId) {
            deleteModel.mutate(modelId, {
                onSuccess: onOpenChange,
            });
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>确认删除</AlertDialogTitle>
                    <AlertDialogDescription>
                        确定要删除这个 AI 模型配置吗？此操作不可撤销。
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleteModel.isPending}
                    >
                        {deleteModel.isPending ? '删除中...' : '删除'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

