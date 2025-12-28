'use client';

/**
 * AI Canvas 组件
 * 
 * 画布（Canvas）= 主内容区域，永远在左侧
 * 当 AI 投射表单时，表单覆盖在主内容区域上
 * 
 * 布局：[Canvas 主画布（左侧）] [AI Panel 对话面板（右侧）]
 * 
 * 设计原则（来自 10-UIUX进化设计规范.md）：
 * 1. Canvas 永远在左侧，AI Panel 永远在右侧
 * 2. 当 AI 活跃时，Canvas 有深度偏移效果 (scale: 0.98, blur: 1px)
 * 3. AI 将表单"投射"到 Canvas 上，覆盖当前页面内容
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useAiOptional } from './ai-context';
import { getForm } from '@/lib/form-registry';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Sparkles } from 'lucide-react';

export function AiCanvas() {
    const ai = useAiOptional();
    const hasCanvas = !!ai?.canvasForm;

    const { formId, initialData, operationMode } = ai?.canvasForm || {};
    const formDef = formId ? getForm(formId) : null;

    const handleClose = () => {
        ai?.closeCanvasForm?.();
    };

    const handleSuccess = () => {
        handleClose();
    };

    const modeLabels = {
        create: '新建',
        edit: '编辑',
        view: '查看',
    };

    // 没有表单时不渲染
    if (!hasCanvas || !formDef) {
        return null;
    }

    const FormComponent = formDef.component;

    return (
        <div
            className={cn(
                // 覆盖在 main 内容区域上（使用 absolute，相对于父容器）
                'absolute inset-0 z-30',
                // 毛玻璃效果：半透明背景 + 背景模糊
                'bg-background/80 backdrop-blur-md',
                'transition-all duration-300 ease-out'
            )}
        >
            {/* 画布内容区 */}
            <div className="h-full flex flex-col">
                {/* 画布头部 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">
                                {modeLabels[operationMode || 'create']}{formDef.title}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                AI 已为你打开表单，请填写或确认信息
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="h-9 w-9"
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">关闭画布</span>
                    </Button>
                </div>

                {/* 画布主体 - 渲染表单 */}
                <ScrollArea className="flex-1">
                    <div className="max-w-2xl mx-auto p-6">
                        {/* AI 预填充提示 */}
                        {initialData && Object.keys(initialData).length > 0 && (
                            <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-medium text-primary">
                                            AI 已预填充部分字段
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            根据对话内容，我已帮你填写了部分信息，请确认或补充
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 表单组件 */}
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <FormComponent
                                mode="canvas"
                                operationMode={operationMode || 'create'}
                                initialData={initialData}
                                onSuccess={handleSuccess}
                                onCancel={handleClose}
                                onSubmit={async (data) => {
                                    console.log('[AiCanvas] 表单提交:', data);
                                    // 表单组件内部会处理提交逻辑
                                }}
                            />
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
