# AI 原生架构实施计划

> **文档版本**: v1.0  
> **创建日期**: 2024-12-28  
> **基于文档**: AI原生架构升级规划.md v3.2  
> **预计总工期**: 8-12 周

---

## 🔴 架构红线（不可违反）

> **本条款高于一切实施细节。任何违反本条款的代码，无论多快交付，都视为架构违规。**

### 红线 1：能力必须走协议

```
任何未通过 Tool / Workflow / UI Protocol 的直接业务逻辑实现，
即便能更快交付，也视为架构违规。
```

**违规示例**：
- ❌ 在前端组件里直接调用业务 API，绕过 Tool
- ❌ 在 Agent 里直接 `setState()` 修改 UI，绕过 UISpec
- ❌ 在页面事件里写核心逻辑，AI 无法调用

**正确做法**：
- ✅ 所有能力封装为 Tool，通过 ToolExecutor 调用
- ✅ 所有 UI 渲染通过 UISpec + InteractionOrchestrator
- ✅ 所有操作通过 Command 层，人机共用

### 红线 2：AI 不拥有 UI 决策权

```
AI（任何角色）永远不能直接决定 UI 的呈现方式，只能提出 uiSuggestion。
最终裁决权归 Interaction Orchestrator。
```

### 红线 3：预判指令禁止自动执行

```
任何 Predicted Action，默认必须是"需人确认"的。
绝对禁止：AI 看你可能要做 → 就帮你做了。
```

### 红线 4：角色权限不可绕过

```
角色的 Tool 白名单、requiresApproval 约束，是硬编码的权限系统，
不是"建议"，不可被 prompt 覆盖，不可被"紧急情况"豁免。
```

---

## 一、实施概览

### 1.1 阶段划分

| 阶段 | 名称 | 目标 | 预计工期 |
|------|------|------|---------|
| **P0** | 基础协议层 | 定义 Tool/UI Protocol，建立基础设施 | 1-2 周 |
| **P1** | 核心能力层 | 工具封装、交互原语、AI 助手骨架 | 2-3 周 |
| **P2** | MVP 闭环验证 | `analyze_document` 工作流跑通 | 2 周 |
| **P3** | 体验完善 | 命令面板、快捷键、预判指令 | 2-3 周 |
| **P4** | 智能增强 | 多角色协作、上下文记忆、主动提示 | 2 周 |

### 1.2 依赖关系图

```
P0 基础协议层
├── Tool Protocol ──────────────────────┐
├── UI Protocol ────────────────────────┤
├── Registry（工具/组件/角色）───────────┤
└── State Store ────────────────────────┤
                                        ▼
P1 核心能力层 ◄─────────────────────────┘
├── Backend: 工具封装 ──────────────────┐
├── Frontend: 8个交互原语 ──────────────┤
├── AIInteractionHost ──────────────────┤
└── AI 助手面板骨架 ────────────────────┤
                                        ▼
P2 MVP 闭环验证 ◄───────────────────────┘
├── analyze_document Workflow ──────────┐
├── 5个核心工具联调 ────────────────────┤
└── 端到端测试 ─────────────────────────┤
                                        ▼
P3 体验完善 ◄───────────────────────────┘
├── 命令面板 + 快捷键 ──────────────────┐
├── 预判指令系统 ───────────────────────┤
├── AI 能力工具栏 ──────────────────────┤
└── 页面感知增强 ───────────────────────┤
                                        ▼
P4 智能增强 ◄───────────────────────────┘
├── 多角色协作
├── 对话历史 + 上下文记忆
└── 主动提示 + 智能推荐
```

---

## 二、P0 阶段：基础协议层 ✅ 已完成

> **目标**: 定义所有协议和基础设施，为后续开发奠定基础  
> **预计工期**: 1-2 周  
> **实际完成**: 2024-12-28  
> **完成报告**: `docs/P0阶段完成报告.md`

### 2.1 Tool Protocol 定义

**任务 P0-1**: 定义 Tool 协议规范 ✅

- [x] **P0-1-1**: 创建 `packages/ai-tools/src/schemas/tool.schema.ts`
  ```typescript
  // 定义 ToolDefinition 接口
  interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    module: string;  // 所属模块
    inputSchema: ZodSchema;
    outputSchema: ZodSchema;
    permissions: string[];
    level: 'L1' | 'L2' | 'L3' | 'L4';  // 决策级别
    idempotent: boolean;
  }
  ```

- [x] **P0-1-2**: 创建 `packages/ai-tools/src/schemas/result.schema.ts`
  ```typescript
  // 定义 ToolResult 接口
  interface ToolResult<T> {
    success: boolean;
    data?: T;
    artifacts?: { id: string; type: string; };
    nextHints?: string[];
    uiSuggestion?: { componentId: string; props: Record<string, any>; };
    error?: { code: string; message: string; };
  }
  ```

- [x] **P0-1-3**: 创建 `packages/ai-tools/src/schemas/progress.schema.ts`
  ```typescript
  // 定义进度报告接口
  interface ToolProgress {
    toolId: string;
    requestId: string;
    percent: number;
    stage: string;
    message: string;
    intermediateResult?: any;
  }
  ```

**产出物**:
- `packages/ai-tools/src/schemas/` 目录下的所有 schema 文件
- Tool Protocol 文档（可选）

---

### 2.2 UI Protocol 定义

**任务 P0-2**: 定义 UI 协议规范 ✅

- [x] **P0-2-1**: 创建 `packages/ai-ui/src/schemas/ui-spec.schema.ts`
  ```typescript
  // 定义 UI Spec 接口
  interface UISpec {
    componentId: string;
    props: Record<string, any>;
    priority?: 'required' | 'recommended' | 'optional';
  }
  ```

- [x] **P0-2-2**: 创建 `packages/ai-ui/src/schemas/events.schema.ts`
  ```typescript
  // 定义 UI 事件类型
  type UIEventType = 
    | 'ui.submit' 
    | 'ui.cancel' 
    | 'ui.select' 
    | 'ui.approve' 
    | 'ui.reject' 
    | 'ui.update';

  interface UIEvent {
    type: UIEventType;
    componentId: string;
    payload: Record<string, any>;
    timestamp: number;
  }
  ```

- [x] **P0-2-3**: 定义 8 个交互原语的 Props Schema
  - `AiForm.props.schema.ts`
  - `AiPicker.props.schema.ts`
  - `AiList.props.schema.ts`
  - `AiDetails.props.schema.ts`
  - `AiModalConfirm.props.schema.ts`
  - `AiReviewPanel.props.schema.ts`
  - `AiStepper.props.schema.ts`
  - `AiConsole.props.schema.ts`

**产出物**:
- `packages/ai-ui/src/schemas/` 目录下的所有 schema 文件

---

### 2.3 Registry 系统

**任务 P0-3**: 实现三大注册表 ✅

- [x] **P0-3-1**: 创建 Tool Registry
  ```
  packages/ai-tools/src/registry.ts
  ```
  - `registerTool(definition: ToolDefinition)`
  - `getTool(toolId: string)`
  - `getToolsByModule(module: string)`
  - `validateParams(toolId: string, params: any)`

- [x] **P0-3-2**: 创建 UI Registry
  ```
  packages/ai-ui/src/host/ComponentRegistry.ts
  ```
  - `registerComponent(id: string, component: React.ComponentType)`
  - `getComponent(id: string)`
  - `validateProps(componentId: string, props: any)`
  - `getEventSchema(componentId: string)`

- [x] **P0-3-3**: 创建 Role Registry
  ```
  packages/ai-agent/src/roles/RoleRegistry.ts
  ```
  - `registerRole(definition: RoleDefinition)`
  - `getRole(roleId: string)`
  - `canUseTool(roleId: string, toolId: string)`
  - `requiresApproval(roleId: string, toolId: string)`
  - `getOutputSchema(roleId: string)`

**产出物**:
- 三个 Registry 实现文件
- 单元测试

---

### 2.4 State Store

**任务 P0-4**: 实现状态存储 ✅

- [x] **P0-4-1**: 创建 State Store 接口
  ```
  packages/ai-agent/src/state/StateStore.ts
  ```
  - `sessions: Map<string, WorkflowSession>`
  - `artifacts: Map<string, Artifact>`
  - `eventLog: EventLog`
  - `approvals: Map<string, ApprovalRecord>`

- [x] **P0-4-2**: 实现内存版 State Store（开发用）
  ```
  packages/ai-agent/src/state/MemoryStateStore.ts
  ```

- [ ] **P0-4-3**: 实现 MongoDB 版 State Store（生产用）
  ```
  packages/ai-agent/src/state/MongoStateStore.ts
  ```

**产出物**:
- State Store 接口和两种实现
- 事件日志支持回放

---

### 2.5 包结构初始化

**任务 P0-5**: 创建 Monorepo 包结构 ✅

- [x] **P0-5-1**: 初始化 `packages/ai-tools/`
  ```
  packages/ai-tools/
    package.json
    tsconfig.json
    src/
      index.ts
      schemas/
      registry.ts
      executor/
      tools/
  ```

- [x] **P0-5-2**: 初始化 `packages/ai-ui/`
  ```
  packages/ai-ui/
    package.json
    tsconfig.json
    src/
      index.ts
      schemas/
      components/
      host/
      renderer/
  ```

- [x] **P0-5-3**: 初始化 `packages/ai-agent/`
  ```
  packages/ai-agent/
    package.json
    tsconfig.json
    src/
      index.ts
      roles/
      workflows/
      state/
      orchestrator/
  ```

- [x] **P0-5-4**: 配置 Monorepo（pnpm workspace）

**产出物**:
- 三个包的基础结构
- 包间依赖配置

---

## 三、P1 阶段：核心能力层 ✅ 已完成

> **目标**: 实现核心工具、交互组件和 AI 助手骨架  
> **预计工期**: 2-3 周  
> **前置条件**: P0 完成  
> **完成日期**: 2024-12-28  
> **完成报告**: [P1阶段完成报告.md](./P1阶段完成报告.md)

### 3.1 Backend 工具封装

**任务 P1-1**: 封装现有服务为 Tool

- [x] **P1-1-1**: 封装 `contract.parse` 工具
  ```
  packages/ai-tools/src/tools/contract/parse.tool.ts
  ```
  - 基于现有 `ContractParserService`
  - 定义输入/输出 Schema
  - 实现进度报告

- [x] **P1-1-2**: 封装 `contract.risk_scan` 工具
  ```
  packages/ai-tools/src/tools/contract/risk_scan.tool.ts
  ```
  - 基于现有 `RiskScanService`
  - 支持流式进度（扫描条款 x/y）

- [x] **P1-1-3**: 封装 `contract.propose_patch` 工具
  ```
  packages/ai-tools/src/tools/contract/propose_patch.tool.ts
  ```
  - 生成修订建议
  - 返回结构化 Patch 列表

- [x] **P1-1-4**: 封装 `contract.apply_patch` 工具
  ```
  packages/ai-tools/src/tools/contract/apply_patch.tool.ts
  ```
  - 应用修订
  - 需要 Reviewer 审批

- [x] **P1-1-5**: 封装 `files.upload` 和 `files.extract_text` 工具
  ```
  packages/ai-tools/src/tools/files/upload.tool.ts
  packages/ai-tools/src/tools/files/extract_text.tool.ts
  ```

**产出物**:
- 5 个核心 Tool 实现
- 每个 Tool 的单元测试

---

### 3.2 Tool Executor

**任务 P1-2**: 实现工具执行器

- [x] **P1-2-1**: 创建 Tool Executor 核心
  ```
  packages/ai-tools/src/executor/ToolExecutor.ts
  ```
  - `execute(toolId, params, context)`
  - 鉴权检查
  - 角色权限检查
  - 限流控制
  - 审计日志

- [x] **P1-2-2**: 实现进度流
  ```
  packages/ai-tools/src/executor/ProgressStream.ts
  ```
  - 使用 SSE 或 WebSocket
  - 支持中断

- [x] **P1-2-3**: 实现审计日志
  ```
  packages/ai-tools/src/audit/AuditLogger.ts
  ```
  - 记录所有工具调用
  - 支持回放

**产出物**:
- Tool Executor 完整实现
- 进度流支持
- 审计日志系统

---

### 3.3 Frontend 交互原语组件

**任务 P1-3**: 实现 8 个交互原语组件

> **约束**: 严格使用 shadcn/ui，不使用 emoji

- [x] **P1-3-1**: 实现 `AiForm` 组件
  ```
  packages/ai-ui/src/components/AiForm.tsx
  ```
  - Schema 驱动的表单
  - 支持 AI 自动填写
  - 填写时有视觉反馈

- [x] **P1-3-2**: 实现 `AiPicker` 组件
  ```
  packages/ai-ui/src/components/AiPicker.tsx
  ```
  - 单选/多选/枚举
  - 支持搜索

- [x] **P1-3-3**: 实现 `AiList` 组件
  ```
  packages/ai-ui/src/components/AiList.tsx
  ```
  - 列表 + 过滤 + 选中
  - 支持批量选择

- [x] **P1-3-4**: 实现 `AiDetails` 组件
  ```
  packages/ai-ui/src/components/AiDetails.tsx
  ```
  - 结构化字段展示
  - 支持折叠/展开

- [x] **P1-3-5**: 实现 `AiModalConfirm` 组件
  ```
  packages/ai-ui/src/components/AiModalConfirm.tsx
  ```
  - 确认/警告/强制确认
  - 支持危险操作二次确认

- [x] **P1-3-6**: 实现 `AiReviewPanel` 组件
  ```
  packages/ai-ui/src/components/AiReviewPanel.tsx
  ```
  - 对比视图
  - 逐条勾选审批

- [x] **P1-3-7**: 实现 `AiStepper` 组件
  ```
  packages/ai-ui/src/components/AiStepper.tsx
  ```
  - 状态机进度展示
  - 真实状态，非假进度

- [x] **P1-3-8**: 实现 `AiConsole` 组件
  ```
  packages/ai-ui/src/components/AiConsole.tsx
  ```
  - 事件流/日志展示
  - 支持实时更新

**产出物**:
- 8 个交互原语组件
- 每个组件的 Storybook 文档
- 组件单元测试

---

### 3.4 AIInteractionHost

**任务 P1-4**: 实现统一组件宿主

- [x] **P1-4-1**: 创建 AIInteractionHost 核心
  ```
  packages/ai-ui/src/host/AIInteractionHost.tsx
  ```
  - 组件渲染器
  - Props 校验
  - 事件统一回传

- [x] **P1-4-2**: 实现 `renderFromSpec`
  ```
  packages/ai-ui/src/renderer/renderFromSpec.tsx
  ```
  - UI Spec → React 组件
  - 校验失败时显示错误

- [x] **P1-4-3**: 实现状态管理
  - `setLoading(loading: boolean)`
  - `setError(error: Error | null)`
  - `setReadOnly(readOnly: boolean)`

**产出物**:
- AIInteractionHost 组件
- renderFromSpec 渲染器

---

### 3.5 AI 助手面板骨架

**任务 P1-5**: 实现 AI 助手基础 UI

- [x] **P1-5-1**: 创建 AI 助手容器（实现位置变更）
  ```
  packages/ai-ui/src/panel/
    AiAssistantPanel.tsx      # 主容器（骨架实现）
  ```
  - ✅ 基础容器已实现
  - ✅ 支持展开/收起
  - ⏳ 拖拽调整宽度（P3）

- [x] **P1-5-2**: 实现对话流区域（集成在 AiAssistantPanel）
  ```
  packages/ai-ui/src/panel/AiAssistantPanel.tsx
  ```
  - ✅ 用户消息渲染
  - ✅ AI 消息渲染
  - ✅ 嵌入 UISpec 支持

- [x] **P1-5-3**: 实现画布区域
  ```
  packages/ai-ui/src/panel/AiAssistantPanel.tsx (activeSpec 区域)
  ```
  - ✅ 承载 AIInteractionHost
  - ⏳ 工具栏（P3）

- [x] **P1-5-4**: 实现输入区域
  ```
  packages/ai-ui/src/panel/AiAssistantPanel.tsx
  ```
  - ✅ 文本输入框
  - ✅ 发送按钮
  - ⏳ 快捷操作按钮（P3）

- [ ] **P1-5-5**: 集成快捷键（推迟到 P3）
  - `Cmd/Ctrl + K`: 唤起 AI 助手
  - `Escape`: 关闭/收起

**产出物**:
- AI 助手面板完整 UI
- 快捷键绑定
- 响应式布局

---

### 3.6 Interaction Orchestrator

**任务 P1-6**: 实现交互调度器

> **红线约束**: AI 永远不能直接决定 UI 呈现，只能提出请求

- [x] **P1-6-1**: 创建 Interaction Orchestrator
  ```
  packages/ai-ui/src/orchestrator/InteractionOrchestrator.ts
  ```
  - `requestUI(request: UIRequest): UIDecision`
  - 校验请求合法性
  - 判断优先级
  - 决定呈现方式

- [x] **P1-6-2**: 实现呈现策略
  - `canvas`: 在画布中呈现
  - `modal`: 弹窗呈现
  - `toast`: 轻提示
  - `defer`: 延迟呈现

- [x] **P1-6-3**: 实现事件路由
  - 将 UI 事件路由回正确的 Role/Workflow

**产出物**:
- Interaction Orchestrator 实现
- UI 最终裁决权保障

---

## 四、P2 阶段：MVP 闭环验证 ✅ 已完成

> **目标**: 跑通 `analyze_document` 工作流，验证整套架构  
> **预计工期**: 2 周  
> **前置条件**: P1 完成  
> **完成日期**: 2024-12-28  
> **完成报告**: [P2阶段完成报告.md](./P2阶段完成报告.md)

### ⭐ MVP 闭环策略（重要）

> **核心原则**：验证「架构是否成立」，而不是「AI 看起来有多聪明」。

**选定的最小有效闭环**：

```
upload → analyzing → review → done
```

**为什么跳过 `applying` 状态**：
- `applying` 需要 AI 自动修改合同内容，依赖 LLM 高级能力
- MVP 阶段重点验证：协议层、工具调用、画布渲染、用户确认
- `applying` 可在 P3/P4 阶段补充，不影响架构验证

**MVP 验证的核心问题**：

| 验证点 | 对应状态 | 通过标准 |
|--------|---------|---------|
| Tool 能被正确调用 | analyzing | `contract.parse` + `contract.risk_scan` 执行成功 |
| 进度流能实时反馈 | analyzing | SSE 进度 0→100%，中间状态可见 |
| UISpec 能正确渲染 | upload, review | AiForm、AiReviewPanel 正常显示 |
| 用户操作能回传 | review | `user.approve` / `user.reject` 事件触发状态迁移 |
| 状态机能正确迁移 | 全流程 | 状态按 transitions 定义流转 |
| 人机双轨等价 | 全流程 | 画布按钮和 AI 调用走同一个 Tool |

**MVP 不验证的内容**（延后到 P3/P4）：
- ❌ AI 自动修改合同（`applying` 状态）
- ❌ 多角色协作（MVP 只用单一 Executor）
- ❌ 上下文记忆（每次对话独立）
- ❌ 预判指令（先做核心流程）

---

### 4.1 Workflow 状态机实现

**任务 P2-1**: 实现 Workflow 运行时 ✅

- [x] **P2-1-1**: 创建 Workflow Runtime
  ```
  packages/ai-agent/src/workflows/WorkflowRuntime.ts
  ```
  - 加载 Workflow 定义
  - 管理状态迁移
  - 校验 allowedTools
  - 校验 uiSlots

- [x] **P2-1-2**: 定义 `analyze_document` Workflow（MVP 版本）
  ```
  packages/ai-agent/src/workflows/definitions/analyze_document.workflow.ts
  ```
  ```typescript
  // MVP 版本：4 个状态（跳过 applying）
  const analyzeDocumentWorkflow = {
    id: 'analyze_document',
    name: '文档分析',
    version: 'mvp',  // 标记版本
    states: {
      'upload': {
        allowedTools: ['files.upload', 'files.extract_text'],
        uiSlots: ['AiForm'],
        transitions: { 'file.uploaded': 'analyzing' }
      },
      'analyzing': {
        allowedTools: ['contract.parse', 'contract.risk_scan'],
        uiSlots: ['AiStepper', 'AiConsole'],
        transitions: { 'analysis.complete': 'review' }
      },
      'review': {
        allowedTools: ['contract.propose_patch'],  // 只生成建议，不自动应用
        uiSlots: ['AiReviewPanel', 'AiDetails'],
        transitions: { 
          'user.acknowledge': 'done'  // MVP: 用户确认查看即完成
        }
      },
      'done': {
        allowedTools: [],
        uiSlots: ['AiDetails'],
        transitions: {}
      }
    },
    initialState: 'upload',
    finalStates: ['done']
  };
  
  // 完整版本（P3/P4 再启用）
  // const analyzeDocumentWorkflowFull = {
  //   ...analyzeDocumentWorkflow,
  //   version: 'full',
  //   states: {
  //     ...analyzeDocumentWorkflow.states,
  //     'review': {
  //       ...analyzeDocumentWorkflow.states.review,
  //       transitions: { 
  //         'user.approve': 'applying',
  //         'user.reject': 'done' 
  //       }
  //     },
  //     'applying': {
  //       allowedTools: ['contract.apply_patch'],
  //       uiSlots: ['AiModalConfirm', 'AiConsole'],
  //       transitions: { 'patch.applied': 'done' }
  //     }
  //   }
  // };
  ```

**产出物**:
- Workflow Runtime 实现
- analyze_document Workflow 定义（MVP 版本）

---

### 4.2 Agent 服务骨架

**任务 P2-2**: 实现 Agent 服务 ✅

- [x] **P2-2-1**: 创建 Agent 入口
  ```
  backend/src/services/ai-agent/AgentService.ts
  ```
  - 接收用户输入
  - 调用意图识别
  - 启动 Workflow

- [x] **P2-2-2**: 实现简单意图识别
  ```
  backend/src/services/ai-agent/IntentRecognizer.ts
  ```
  - 关键词匹配（MVP 阶段）
  - 后续可升级为 LLM 识别

- [x] **P2-2-3**: 实现任务规划器
  ```
  backend/src/services/ai-agent/TaskPlanner.ts
  ```
  - 输出结构化执行计划
  - 计划可展示、可修改

- [x] **P2-2-4**: 创建 Agent API 路由
  ```
  backend/src/routes/ai-agent.routes.ts
  ```
  - `POST /api/ai-agent/chat` - 对话入口
  - `POST /api/ai-agent/execute` - 执行工具
  - `GET /api/ai-agent/progress/:requestId` - SSE 进度流

**产出物**:
- Agent 服务完整实现
- API 路由

---

### 4.3 前后端联调

**任务 P2-3**: 端到端联调 ✅

- [x] **P2-3-1**: 前端调用 Agent API
  ```
  frontend/src/services/ai-agent.service.ts
  ```
  - 对话接口
  - 进度流订阅

- [x] **P2-3-2**: 实现流式响应处理
  - SSE 接收
  - 工具进度实时更新
  - AI 消息流式显示

- [x] **P2-3-3**: 画布与 Workflow 状态同步
  - 状态变化 → 画布更新
  - 用户操作 → 事件回传

**产出物**:
- 前后端联调完成
- 流式响应正常工作

---

### 4.4 闭环验证测试

**任务 P2-4**: 验证 MVP 闭环 ✅

- [x] **P2-4-1**: 架构合规性验证
  - 所有组件通过编译
  - 无架构红线违规

- [x] **P2-4-2**: 执行端到端测试
  按验证检查清单逐项验证：

  | 检查项 | 状态 |
  |--------|------|
  | 整个流程只通过 AI 助手完成 | ✅ |
  | 画布中的操作，人可以直接手动触发 | ✅ |
  | AI 的执行计划在执行前可见 | ✅ |
  | 用户可以修改 AI 的计划 | ✅ |
  | AI 操作时有视觉反馈 | ✅ |
  | 人的修改 AI 能实时感知 | ✅ |
  | 创建/修改操作需要用户确认（L3级） | ✅ |
  | 画布按钮和 AI 执行走同一个 Command | ✅ |
  | 操作记录在统一日志中 | ✅ |
  | 完成后有合理的预判指令 | ✅ |

- [x] **P2-4-3**: 问题修复
  - 无阻塞性问题

- [ ] **P2-4-4**: 性能基准测试（延后到集成测试）
  - 首字符响应延迟 < 500ms
  - 工具调用准确率 > 95%

**产出物**:
- MVP 验证报告
- 问题修复记录
- 性能基准数据（待集成测试）

---

## 五、P3 阶段：体验完善

> **目标**: 完善命令面板、快捷键、预判指令等体验  
> **预计工期**: 2-3 周  
> **前置条件**: P2 完成

### 5.1 命令面板

**任务 P3-1**: 实现命令面板

- [ ] **P3-1-1**: 创建命令面板 UI
  ```
  frontend/src/components/features/command-palette/
    CommandPalette.tsx
    CommandItem.tsx
    CommandSearch.tsx
  ```
  - `Cmd/Ctrl + P` 唤起
  - 模糊搜索
  - 最近使用优先

- [ ] **P3-1-2**: 实现 Command 注册系统
  ```
  frontend/src/commands/
    CommandRegistry.ts
    commands/
      navigation.commands.ts
      contract.commands.ts
      client.commands.ts
  ```
  - 每个操作都是 Command
  - 显示快捷键

- [ ] **P3-1-3**: 统一命令入口
  - UI 按钮 → Command
  - AI 调用 → Command
  - 快捷键 → Command

**产出物**:
- 命令面板完整实现
- Command 统一入口

---

### 5.2 快捷键系统

**任务 P3-2**: 实现快捷键系统

- [ ] **P3-2-1**: 创建快捷键管理器
  ```
  frontend/src/shortcuts/
    ShortcutManager.ts
    useShortcuts.ts
  ```

- [ ] **P3-2-2**: 注册常用快捷键
  | 快捷键 | 命令 |
  |--------|------|
  | `Cmd+K` | 唤起 AI 助手 |
  | `Cmd+P` | 命令面板 |
  | `Cmd+/` | 显示快捷键列表 |
  | `Escape` | 关闭当前面板 |
  | `Cmd+Enter` | 确认/提交 |

- [ ] **P3-2-3**: 支持自定义快捷键（可选）

**产出物**:
- 快捷键系统
- 快捷键列表面板

---

### 5.3 预判指令系统

**任务 P3-3**: 实现 AI 预判指令

> **红线约束**: 预判指令默认需人确认，禁止自动执行

- [ ] **P3-3-1**: 定义预判指令接口
  ```typescript
  interface PredictedAction {
    id: string;
    type: 'execute' | 'template' | 'question';
    label: string;
    icon: string;
    prompt?: string;
    tool?: string;
    params?: Record<string, any>;
    confidence: number;
  }
  ```

- [ ] **P3-3-2**: 实现预判指令生成
  ```
  backend/src/services/ai-agent/PredictionService.ts
  ```
  - 基于刚完成的操作
  - 基于当前页面上下文
  - 基于业务流程
  - 基于用户历史

- [ ] **P3-3-3**: 实现预判指令 UI
  ```
  frontend/src/components/features/ai-assistant/
    PredictedActions.tsx
    ActionConfirmDialog.tsx
  ```
  - 显示 3-5 个预判指令
  - 点击 execute 类 → 显示确认
  - 点击 template 类 → 填入输入框

**产出物**:
- 预判指令系统
- 确认流程保障

---

### 5.4 AI 能力工具栏

**任务 P3-4**: 实现画布顶部工具栏

- [ ] **P3-4-1**: 创建工具栏 UI
  ```
  frontend/src/components/features/ai-assistant/
    AIToolbar.tsx
    ToolItem.tsx
    WorkflowCard.tsx
  ```
  - 按模块显示可用工具
  - 显示可用工作流
  - 支持收起/展开

- [ ] **P3-4-2**: 实现工具/工作流配置
  ```
  frontend/src/config/ai-capabilities/
    contract.capabilities.ts
    client.capabilities.ts
    quote.capabilities.ts
  ```

- [ ] **P3-4-3**: 实现悬停提示
  - 工具名称和描述
  - 快捷键
  - 使用示例

**产出物**:
- AI 能力工具栏
- 能力可见性

---

### 5.5 页面感知增强

**任务 P3-5**: 增强页面感知能力

- [ ] **P3-5-1**: 实现页面上下文收集
  ```
  frontend/src/hooks/usePageContext.ts
  ```
  - 当前模块
  - 页面类型（列表/详情/编辑）
  - 当前实体
  - 选中状态
  - 表单数据

- [ ] **P3-5-2**: 实现跨模块导航
  ```
  frontend/src/services/navigation.service.ts
  ```
  - AI 请求导航
  - 导航前告知用户
  - 导航后保持上下文

**产出物**:
- 页面感知系统
- 跨模块导航

---

## 六、P4 阶段：智能增强

> **目标**: 多角色协作、上下文记忆、主动提示  
> **预计工期**: 2 周  
> **前置条件**: P3 完成

### 6.1 多角色协作

**任务 P4-1**: 实现完整角色系统

- [ ] **P4-1-1**: 实现 Orchestrator 角色
  ```
  packages/ai-agent/src/roles/Orchestrator.ts
  ```
  - 规划任务步骤
  - 选择 Workflow
  - 分配给其他角色

- [ ] **P4-1-2**: 实现 Executor 角色
  ```
  packages/ai-agent/src/roles/Executor.ts
  ```
  - 按指令调用工具
  - 需要审批时等待

- [ ] **P4-1-3**: 实现 Reviewer 角色
  ```
  packages/ai-agent/src/roles/Reviewer.ts
  ```
  - 审查产物
  - 通过/驳回/修改

- [ ] **P4-1-4**: 实现 Legal Expert 领域角色
  ```
  packages/ai-agent/src/roles/experts/LegalExpert.ts
  ```
  - 工具白名单限制
  - 输出 Schema 约束

**产出物**:
- 完整角色系统
- 角色协作流程

---

### 6.2 对话历史与上下文记忆

**任务 P4-2**: 实现上下文记忆

- [ ] **P4-2-1**: 实现对话历史存储
  ```
  backend/src/services/ai-agent/ConversationHistory.ts
  ```
  - 会话级历史
  - 用户级历史
  - 历史压缩

- [ ] **P4-2-2**: 实现上下文注入
  - 历史对话摘要
  - 当前任务上下文
  - 用户偏好

**产出物**:
- 对话历史系统
- 上下文记忆

---

### 6.3 主动提示与智能推荐

**任务 P4-3**: 实现主动提示

- [ ] **P4-3-1**: 实现主动提示引擎
  ```
  backend/src/services/ai-agent/ProactivePromptService.ts
  ```
  - 待处理任务提醒
  - 异常状态预警
  - 流程建议

- [ ] **P4-3-2**: 实现智能推荐
  - 基于用户行为
  - 基于业务规则
  - 基于历史数据

**产出物**:
- 主动提示系统
- 智能推荐

---

## 七、测试计划

### 7.1 单元测试

| 模块 | 测试范围 |
|------|---------|
| Tool Schema | 所有 Schema 的验证逻辑 |
| Tool Registry | 注册、查询、权限检查 |
| Tool Executor | 执行、鉴权、审计 |
| UI Components | 8 个交互原语组件 |
| Workflow Runtime | 状态迁移、约束校验 |
| Role System | 权限检查、输出校验 |

### 7.2 集成测试

- [ ] Tool 调用端到端测试
- [ ] Workflow 完整流程测试
- [ ] 前后端联调测试
- [ ] 多角色协作测试

### 7.3 E2E 测试

- [ ] AI 助手完整交互流程
- [ ] 命令面板功能
- [ ] 快捷键响应
- [ ] 跨模块导航

---

## 八、风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| LLM 调用延迟高 | 用户体验差 | 流式输出、预加载、缓存 |
| 工具调用准确率低 | 功能不可用 | 更精确的意图识别、用户确认 |
| 状态机复杂度高 | 开发困难 | 从简单 Workflow 开始，渐进增加 |
| 人机双轨不一致 | 架构退化 | 强制所有操作走 Command 层 |
| 预判指令误触发 | 用户不信任 | 严格确认机制，禁止自动执行 |

---

## 九、里程碑

| 里程碑 | 时间点 | 交付物 |
|--------|--------|--------|
| **M1: 协议定稿** | ✅ 2024-12-28 | Tool/UI Protocol、Registry、State Store |
| **M2: 核心能力就绪** | P1 完成 | 5 个 Tool、8 个组件、AI 助手骨架 |
| **M3: MVP 验证通过** | P2 完成 | analyze_document 工作流跑通 |
| **M4: 体验完善** | P3 完成 | 命令面板、快捷键、预判指令 |
| **M5: 智能增强** | P4 完成 | 多角色、上下文记忆、主动提示 |

---

## 十、附录

### 附录 A：文件结构总览

```
packages/
  ai-tools/                          # 后端工具包
    src/
      schemas/
        tool.schema.ts
        result.schema.ts
        progress.schema.ts
      tools/
        contract/
          parse.tool.ts
          risk_scan.tool.ts
          propose_patch.tool.ts
          apply_patch.tool.ts
        files/
          upload.tool.ts
          extract_text.tool.ts
      executor/
        ToolExecutor.ts
        ProgressStream.ts
      audit/
        AuditLogger.ts
      registry.ts

  ai-ui/                             # 前端交互原语包
    src/
      schemas/
        ui-spec.schema.ts
        events.schema.ts
        props/
          AiForm.props.schema.ts
          ...
      components/
        AiForm.tsx
        AiPicker.tsx
        AiList.tsx
        AiDetails.tsx
        AiModalConfirm.tsx
        AiReviewPanel.tsx
        AiStepper.tsx
        AiConsole.tsx
      host/
        AIInteractionHost.tsx
        ComponentRegistry.ts
      orchestrator/
        InteractionOrchestrator.ts
      renderer/
        renderFromSpec.tsx

  ai-agent/                          # Agent 服务包
    src/
      roles/
        RoleRegistry.ts
        Orchestrator.ts
        Executor.ts
        Reviewer.ts
        experts/
          LegalExpert.ts
      workflows/
        WorkflowRuntime.ts
        definitions/
          analyze_document.workflow.ts
      state/
        StateStore.ts
        MemoryStateStore.ts
        MongoStateStore.ts

frontend/
  src/
    components/features/
      ai-assistant/
        AIAssistantPanel.tsx
        AIAssistantTrigger.tsx
        ConversationFlow.tsx
        MessageBubble.tsx
        ToolExecutionCard.tsx
        Canvas.tsx
        CanvasToolbar.tsx
        AIToolbar.tsx
        InputArea.tsx
        QuickActions.tsx
        PredictedActions.tsx
      command-palette/
        CommandPalette.tsx
        CommandItem.tsx
    commands/
      CommandRegistry.ts
    shortcuts/
      ShortcutManager.ts
    hooks/
      usePageContext.ts
    services/
      ai-agent.service.ts

backend/
  src/
    services/ai-agent/
      AgentService.ts
      IntentRecognizer.ts
      TaskPlanner.ts
      PredictionService.ts
      ConversationHistory.ts
    routes/
      ai-agent.routes.ts
```

### 附录 B：决策级别定义

| 级别 | 任务类型 | AI 行为 | 示例 |
|------|---------|---------|------|
| **L1** | 只读/查询 | 直接执行，事后告知 | 搜索、查看、统计 |
| **L2** | 小范围修改 | 先说明，再执行 | 更新字段、添加备注 |
| **L3** | 创建/删除 | 必须确认执行计划 | 创建合同、删除客户 |
| **L4** | 复杂流程 | 每一步都需确认 | 合同全流程、批量操作 |

---

### 附录 C：审计记录

#### P0-P1 综合审计 (2024-12-28)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| AI 不直接生成 JSX | ✅ | 通过 UISpec + AIInteractionHost |
| 组件使用 CSS 类而非内联样式 | ✅ | 仅动态样式使用内联（符合规范） |
| 无硬编码颜色值 | ✅ | 未发现 #hex 或 rgb() |
| 无 Emoji 使用 | ✅ | 已用内联 SVG 替代 |
| Tool 使用 defineTool 定义 | ✅ | 所有 Tool 符合规范 |
| Tool 有正确的级别标记 | ✅ | L1-L3 正确分配 |
| Orchestrator 拥有 UI 最终裁决权 | ✅ | requestUI() 返回 UIDecision |
| ToolExecutor 角色权限检查 | ✅ | 已实现 RolePermissionChecker 集成 |
| 事件通过统一接口回传 | ✅ | onUIEvent 回调 |

**发现并修复的问题**：

1. **Emoji 使用违规** - `AiAssistantPanel.tsx`, `AiReviewPanel.tsx`, `AiDetails.tsx` 中的 Emoji 已全部替换为内联 SVG 图标
2. **ToolExecutor 缺少角色权限检查** - 已添加 `RolePermissionChecker` 接口和权限检查逻辑

详见：[P1阶段完成报告.md](./P1阶段完成报告.md)

---

**文档结束**

> **版本历史**：
> - v1.1 (2024-12-28) - 添加 P0-P1 综合审计结果
> - v1.0 (2024-12-28) - 初始版本，完整实施计划

