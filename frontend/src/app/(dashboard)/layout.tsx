'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AiProvider, AiPanel, AiCanvas, useAiOptional } from '@/components/ai';

// 导入表单注册 - 确保所有表单在应用启动时被注册
import '@/components/forms/register';

// 导入模块能力注册 - 告诉系统每个模块有哪些快捷操作
// 注意：这不是假工作流，真正的 AI 决策由后端 Agent Service 完成
import '@/lib/ai-capabilities/modules';

// 内部布局组件 - 需要在 AiProvider 内部才能使用 useAi
function InnerLayout({ children }: { children: React.ReactNode }) {
  const ai = useAiOptional();
  const hasCanvasContent = !!ai?.canvasForm;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* 主内容区 */}
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          {/* main 区域 - Canvas 投射目标 */}
          <div className="relative flex-1 overflow-hidden">
            {/* 原始页面内容 */}
            <main className="h-full p-6 overflow-auto">
              {children}
            </main>

            {/* AI Canvas - 覆盖在 main 区域上，画板本身有毛玻璃效果 */}
            {hasCanvasContent && <AiCanvas />}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* AI Panel - 永远在右侧 */}
      <AiPanel />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AiProvider defaultPanelState="collapsed">
      <InnerLayout>{children}</InnerLayout>
    </AiProvider>
  );
}

