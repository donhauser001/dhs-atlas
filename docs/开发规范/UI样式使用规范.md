# UI 样式使用规范

> **版本**: v3.0  
> **最后更新**: 2025-12-28  
> **适用范围**: dhs-atlas 前端所有样式代码  
> **技术栈**: shadcn/ui + Tailwind CSS v4 + Next.js 15

---

## 一、AI 原生架构约束

### 1.1 UI 系统宪法级约束

本项目 UI 系统：**只允许使用 shadcn/ui**。

这是强制约束，不是推荐方案。

**明确禁止的 UI 行为**：

| 禁止行为 | 原因 |
|---------|------|
| 自行封装"类似 shadcn 的组件体系" | 破坏系统一致性 |
| 魔改 shadcn 组件内部结构 | 导致不可预测行为 |
| 为"好看"破坏 shadcn 组件语义 | AI 无法理解 |
| 引入第二套 UI 设计语言 | 增加系统复杂度 |
| 为局部效果引入非 shadcn 组件库 | 破坏统一性 |

**允许的唯一方式**：
- 使用 shadcn 官方组件
- 在其允许范围内通过 class / variant 扩展
- 保持组件语义、结构、可预测性不变

### 1.2 为什么这是伦理要求

- shadcn 组件是**可预测、可结构化、可被 AI 理解**的 UI 单元
- 魔改 UI 会破坏系统的可读性与可操作性
- AI 原生系统**必须避免"不可推断 UI"**

### 1.3 全项目禁止 Emoji

Emoji 在本项目中被视为：**非结构化、不可解析、不可推断的噪声**。

**禁止范围**：
- UI 中使用 emoji 作为图标
- 按钮、标签、状态提示中使用 emoji
- AI 输出中使用 emoji 作为语义标记
- 文案中用 emoji 代替结构化信息

**替代方式**：
- 使用 shadcn + Lucide Icons
- 使用明确文本标签
- 使用结构化状态（badge / variant / color）

---

## 二、技术架构概述

### 2.1 核心技术栈

| 技术 | 版本 | 用途 |
|-----|------|-----|
| shadcn/ui | new-york 风格 | 基础组件库（唯一） |
| Tailwind CSS | v4 | 工具类样式 |
| Radix UI | 最新 | 无障碍原语组件 |
| Lucide React | 最新 | 图标库（唯一） |
| class-variance-authority | 最新 | 组件变体管理 |

### 2.2 关键配置文件

```
src/
├── components.json          # shadcn/ui 配置
├── app/globals.css          # CSS 变量与主题定义
├── lib/utils.ts             # cn() 工具函数
└── components/ui/           # shadcn 组件目录
```

### 2.3 工具函数

使用 `cn()` 函数合并类名：

```tsx
import { cn } from "@/lib/utils"

// 合并基础类与动态类
<div className={cn("base-class", isActive && "active-class")} />
```

---

## 三、shadcn/ui 组件使用规范

### 3.1 组件目录结构

```
src/components/
├── ui/                      # shadcn 基础组件（勿修改源码）
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── common/                  # 通用业务组件
│   ├── data-table.tsx
│   ├── page-header.tsx
│   └── ...
├── features/                # 功能模块组件
│   ├── clients/
│   ├── projects/
│   └── ...
└── layout/                  # 布局组件
    ├── app-header.tsx
    └── app-sidebar.tsx
```

### 3.2 组件使用原则

**优先使用 shadcn/ui 组件**：

```tsx
// ✅ 正确 - 使用 shadcn 组件
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

// ❌ 错误 - 自己实现基础组件
const MyButton = styled.button`...`
```

**通过 className 扩展组件**：

```tsx
// ✅ 正确 - 使用 className 扩展
<Button className="w-full" variant="default" size="lg">
  提交
</Button>

// ❌ 错误 - 使用内联样式
<Button style={{ width: '100%' }}>提交</Button>
```

### 3.3 组件变体（Variants）

使用 shadcn 预定义的变体：

```tsx
// Button 变体
<Button variant="default">默认按钮</Button>
<Button variant="destructive">危险按钮</Button>
<Button variant="outline">轮廓按钮</Button>
<Button variant="secondary">次要按钮</Button>
<Button variant="ghost">幽灵按钮</Button>
<Button variant="link">链接按钮</Button>

// Button 尺寸
<Button size="default">默认</Button>
<Button size="sm">小</Button>
<Button size="lg">大</Button>
<Button size="icon">图标</Button>
```

### 3.4 自定义变体

如需添加新变体，使用 `cva`：

```tsx
import { cva, type VariantProps } from "class-variance-authority"

const customButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        success: "bg-green-500 text-white hover:bg-green-600",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600",
      },
    },
  }
)
```

---

## 四、Tailwind CSS v4 使用规范

### 4.1 颜色系统

项目使用 oklch 颜色空间，通过 CSS 变量定义：

**语义化颜色（推荐）**：

```tsx
// 背景色
className="bg-background"        // 页面背景
className="bg-card"              // 卡片背景
className="bg-popover"           // 弹出层背景
className="bg-muted"             // 柔和背景
className="bg-accent"            // 强调背景

// 文本色
className="text-foreground"      // 主要文本
className="text-muted-foreground" // 次要文本
className="text-primary"         // 主色文本
className="text-destructive"     // 危险文本

// 边框色
className="border-border"        // 默认边框
className="border-input"         // 输入框边框
```

**状态指示色**（用于徽章、状态标签）：

```tsx
// 成功状态
className="bg-green-500 text-white"
className="bg-green-100 text-green-700"

// 警告状态
className="bg-yellow-500 text-white"
className="bg-yellow-100 text-yellow-700"

// 错误状态
className="bg-red-500 text-white"
className="bg-red-100 text-red-700"

// 信息状态
className="bg-blue-500 text-white"
className="bg-blue-100 text-blue-700"
```

### 4.2 间距系统

使用 Tailwind 间距类：

```tsx
// padding
className="p-4"     // 16px
className="px-6"    // 水平 24px
className="py-2"    // 垂直 8px

// margin
className="m-4"     // 16px
className="mt-6"    // 顶部 24px
className="mb-2"    // 底部 8px

// gap（flex/grid）
className="gap-4"   // 16px
className="gap-2"   // 8px
```

### 4.3 布局系统

```tsx
// Flexbox
className="flex items-center justify-between"
className="flex flex-col gap-4"
className="flex-1"  // flex-grow: 1

// Grid
className="grid grid-cols-4 gap-4"
className="grid grid-cols-2 md:grid-cols-4"

// 宽度
className="w-full"
className="w-[20%]"  // 百分比宽度
className="w-40"     // 固定宽度 160px
className="max-w-sm" // 最大宽度
```

### 4.4 表格列宽规范

**使用 Tailwind 类设置列宽**：

```tsx
// ✅ 正确 - 使用 className
<TableHead className="w-[20%]">名称</TableHead>
<TableHead className="w-[10%]">状态</TableHead>
<TableHead className="w-40">操作</TableHead>

// ❌ 错误 - 使用内联样式
<TableHead style={{ width: '20%' }}>名称</TableHead>
```

### 4.5 响应式设计

使用 Tailwind 断点前缀：

```tsx
// 移动优先
className="flex flex-col md:flex-row"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
className="text-sm md:text-base"
className="p-4 md:p-6 lg:p-8"
```

---

## 五、CSS 变量参考

### 5.1 全局 CSS 变量（globals.css）

```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}
```

### 5.2 Tailwind 颜色映射

| CSS 变量 | Tailwind 类 | 用途 |
|---------|------------|-----|
| --background | bg-background | 页面背景 |
| --foreground | text-foreground | 主文本 |
| --card | bg-card | 卡片背景 |
| --primary | bg-primary, text-primary | 主色 |
| --secondary | bg-secondary | 次要色 |
| --muted | bg-muted | 柔和背景 |
| --muted-foreground | text-muted-foreground | 次要文本 |
| --destructive | bg-destructive, text-destructive | 危险/错误 |
| --border | border-border | 边框 |

---

## 六、内联样式使用规则

### 6.1 禁止使用内联样式的情况

以下情况**必须**使用 Tailwind 类或 CSS 类：

- 固定颜色值
- 固定间距值（padding, margin）
- 固定尺寸值（width, height）
- 固定字体样式
- 固定边框样式
- 固定圆角值

```tsx
// ❌ 错误
<div style={{ padding: '16px', backgroundColor: '#fff' }}>

// ✅ 正确
<div className="p-4 bg-card">
```

### 6.2 允许使用内联样式的情况

1. **动态计算样式**（运行时计算的值）

```tsx
// ✅ 允许 - 动态进度条
<div 
  className="h-1 bg-primary transition-all"
  style={{ width: `${progress}%` }}
/>

// ✅ 允许 - 动态定位
<div 
  className="absolute"
  style={{ left: `${position}px`, top: `${position}px` }}
/>
```

2. **CSS 变量动态注入**

```tsx
// ✅ 推荐方式
<div 
  className="w-[var(--dynamic-width)]"
  style={{ '--dynamic-width': `${width}px` } as React.CSSProperties}
/>
```

---

## 七、设计规范

### 7.1 主色调

项目采用**黑白灰**主色调：

- 背景：白色/浅灰（light）、深灰/黑色（dark）
- 文本：黑色/深灰（light）、白色/浅灰（dark）
- 强调色：根据语义使用（成功/警告/错误/信息）

### 7.2 禁止使用

| 禁止项 | 原因 |
|-------|------|
| 彩色大面积背景（除状态指示外） | 破坏视觉一致性 |
| 装饰性渐变背景 | 非功能性视觉噪音 |
| 过于鲜艳的颜色组合 | 影响可读性 |
| 硬编码颜色值（`#hex`、`rgb()`） | 无法主题切换 |
| Emoji 作为图标或状态 | AI 无法解析 |

### 7.3 状态颜色使用

| 状态 | 背景色 | 文本色 | 用途 |
|-----|-------|-------|-----|
| 成功 | bg-green-100/500 | text-green-700/white | 完成、通过 |
| 警告 | bg-yellow-100/500 | text-yellow-700/white | 提醒、进行中 |
| 错误 | bg-red-100/500 | text-red-700/white | 失败、危险 |
| 信息 | bg-blue-100/500 | text-blue-700/white | 提示、进行中 |
| 中性 | bg-gray-100/500 | text-gray-700/white | 禁用、暂停 |

---

## 八、AI 原生自检清单

### 8.1 组件使用检查

- [ ] 是否只使用了 shadcn/ui 组件？
- [ ] 是否正确使用了组件变体（variant、size）？
- [ ] 是否通过 className 扩展而非内联样式？
- [ ] 组件是否可被 AI 理解和操作？

### 8.2 样式检查

- [ ] 是否使用了内联样式？（仅动态值允许）
- [ ] 是否使用了硬编码颜色值？
- [ ] 表格列宽是否使用了 Tailwind 类？
- [ ] 是否正确使用了语义化颜色类？

### 8.3 AI 原生检查

- [ ] 是否使用了 Emoji？（禁止）
- [ ] UI 状态是否可被结构化表达？
- [ ] 组件交互是否可被 AI 驱动？
- [ ] 是否引入了非 shadcn 组件库？

### 8.4 PR 合并前必问

> "如果我是 AI，而不是人，我是否能完整、正确、无歧义地使用这个 UI？"

**不能 → PR 不允许合并。**

---

## 九、常见问题

### Q1: 如何添加新的 shadcn 组件？

```bash
npx shadcn@latest add [component-name]
```

### Q2: 如何覆盖 shadcn 组件样式？

通过 `className` 属性添加 Tailwind 类，而非修改源文件。

### Q3: 动态样式如何处理？

使用内联样式配合 CSS 变量，并添加注释说明。

### Q4: 为什么不能用 Emoji？

Emoji 是非结构化信息，AI 无法可靠解析其语义。使用 Lucide Icons 替代。

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.0 | 2025-12-28 | 重构为 dhs-atlas AI 原生规范，加入 AI 约束章节 |
| v2.0 | 2025-11 | shadcn/ui + Tailwind CSS v4 规范 |

---

**文档维护**: 本文档应随项目发展持续更新  
**最高约束**: [开发伦理与系统操作宪章](../开发伦理与系统操作宪章-最高指示.md)
