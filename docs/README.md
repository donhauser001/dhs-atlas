# dhs-atlas 文档中心

> **版本**: v2.3  
> **最后更新**: 2025-12-28  
> **核心理念**: AI 原生工作操作系统 · 服务型组织运营平台

---

## 文档结构

```
docs/
├── README.md                              # 本文档 - 文档中心索引
│
├── 项目规划（立法文件）
│   └── dhs-atlas项目计划文档.md            # 项目最高依据
│
├── architecture/                          # 架构设计
│   ├── 总体架构设计.md                     # 系统架构总设计
│   ├── 租户模式定义.md                     # Shared/D1/D2 模式定义
│   ├── 租户开通工作流.md                   # Provisioning 状态机
│   ├── 租户隔离三阶段路线图.md             # Phase 1/2/3 工程执行文档
│   ├── 租户开通蓝图.md                     # Provisioning 工程实现细节
│   └── 可逆迁移与一键切换方案.md           # 升级/降级双向切换方案
│
├── domain/                                # 领域架构
│   ├── 领域划分与边界定义.md               # 一级域定义与依赖关系（核心）
│   ├── 服务抽象模型.md                     # Service 泛化抽象
│   ├── 服务类型定义.md                     # Service Type + AI Role 映射
│   ├── 服务流程模板.md                     # Workflow Template 定义
│   └── 用户后台功能架构.md                 # Tenant Console 功能模块
│
├── apps/                                  # 应用规划
│   └── 微信小程序能力规划.md               # 微官网 + 客户工作台
│
├── 开发计划/                              # 开发执行计划
│   └── 第一阶段开发任务规划.md             # Step 1-3 详细任务
│
├── 核心规范
│   ├── 开发伦理与系统操作宪章-最高指示.md   # 最高级约束规范
│   ├── 代码质量标准化体系.md               # 代码质量硬标准
│   ├── AI原生架构升级规划.md               # AI 原生架构设计
│   ├── AI原生架构实施计划.md               # 实施路线图
│   └── AI原生架构违规示例清单.md           # 反模式清单
│
└── 开发规范/                              # 前端开发标准
    ├── UI交互设计规范.md                   # 三条底层准则 + 核心链路交互（新）
    ├── 黄金样板页规范.md                   # 三个标准页模板（新）
    ├── UI样式使用规范.md                   # shadcn/ui + Tailwind 规范
    ├── 样式系统设计规范.md
    ├── 组件样式规范.md
    ├── 列表页面布局标准.md
    └── 前端开发指南.md
```

---

## 项目规划（立法文件）

### [dhs-atlas 项目计划文档](./dhs-atlas项目计划文档.md)

**项目最高依据**，定义了：

- 项目定位：AI 原生工作操作系统
- 产品开发哲学：AI 原生、原则先于能力、系统优先于体验
- 技术栈总览：TypeScript + Next.js 15 + React 19 + shadcn/ui
- AI OS Layer：Agent / Role / Workflow / Orchestrator / Tool Registry
- 多企业架构：Multi-Tenant by Design（安全需求，非商业需求）
- 单企业先行体验：Phase 0 / Phase 1 / Phase 2 演进路径

> 后续所有设计、代码、Cursor 行为，都应以此文档为最高依据。

---

## 架构设计

### [总体架构设计](./architecture/总体架构设计.md)

**系统架构总设计文档**，定义了：

- 系统分层：平台层（AI OS Layer）+ 业务层（Domain Plugins）
- 四大核心协议：Tool / UI / Workflow / Event & Artifact
- AI OS 运行时：Agent / Role Router / Workflow Engine / Tool Runner / Orchestrator / UI Host
- 多角色体系：系统角色 + 领域角色
- 多企业架构：Enterprise / User / Membership
- 订阅与功能开关层：三层门禁（UI / Runtime / Data）
- 部署架构：Control Plane / Tenant Plane 分离
- 业务域架构：商业域 / 组织域 / 内容域
- Monorepo 目录结构
- 实施路线图：Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4

### [租户模式定义](./architecture/租户模式定义.md)

**平台托管的部署化租户方案**，定义了：

- 三种部署形态：Shared / D1（独立DB）/ D2（独立实例）
- 隔离边界对比：应用/数据库/存储/队列/域名
- 产品套餐映射：Free → Pro → Business → Enterprise
- 域名策略：二级域名分配 + 自有域绑定
- 订阅门禁在不同模式下的实现
- AI 调用路由（AI Gateway）
- 迁移路径：Shared → D1 → D2

### [租户开通工作流](./architecture/租户开通工作流.md)

**Provisioning 状态机设计**，定义了：

- 租户创建工作流：REQUESTED → VALIDATING → ALLOCATING → DEPLOYING → SEEDING → ISSUING_DOMAIN → READY
- 域名绑定工作流：DNS 验证 → 证书签发 → 路由配置
- 租户升级工作流：Shared → D1 → D2 数据迁移
- 租户封禁/销毁工作流
- 回滚策略
- 事件类型定义

### [租户隔离三阶段路线图](./architecture/租户隔离三阶段路线图.md)

**工程执行文档**，定义了：

- **Phase 1**：公共平台必交付清单（Multi-tenant/Entitlements/Event Log/AI Gateway/两后台）
- **Phase 2**：独立数据库必交付清单（DB Provisioning/TenantDbResolver/数据迁移/备份）
- **Phase 3**：独立实例必交付清单（Instance Provisioning/域名/Entitlement Snapshot/Release Governance）
- 必须预埋的接口与数据模型（tenant_runtime 表、TenantDbResolver）
- 数据模型演进（Phase 1/2/3 新增表）
- 接口预埋清单

### [租户开通蓝图](./architecture/租户开通蓝图.md)

**Provisioning 工程实现细节**，定义了：

- Provisioning 服务架构（Coordinator/Workers/Scheduler/Event Bus/Providers）
- Phase 2 DB Provisioning 状态机（状态处理器、回滚策略）
- Phase 3 Instance Provisioning 状态机（状态处理器、回滚策略）
- Coordinator 实现（状态机驱动器、定时任务）
- 审计要求（必须记录的信息、保留策略）
- 代码结构建议

### [可逆迁移与一键切换方案](./architecture/可逆迁移与一键切换方案.md)

**三阶段双向切换方案（v1.1）**，定义了：

- 两类切换模式：Offline Cutover（强一致）/ Online Cutover（近零停机）
- 双向切换：Shared ⇄ Dedicated DB ⇄ Dedicated Instance
- 数据复制协议（Copy Contract）
- 降级成立的三大前提：企业可分片、Event Log 保险丝、资源可搬运
- 回滚窗口设计（24-72h 可配置）
- 双写 Repo 实现
- Phase 1 必须预埋的清单

---

## 领域架构（Domain）

> **dhs-atlas 不是"设计管理系统"，它是"服务型组织的 AI 原生运营平台"。**

### [领域划分与边界定义](./domain/领域划分与边界定义.md)

**一级域定义与依赖关系**（架构宪章），定义了：

- **9 + 1 个一级域**：platform / svc / crm / proj / fin / contract / cms / org / file / settings
- **三层域架构**：核心业务域 → 支撑域 → 通用域
- 域之间的依赖规则与事件驱动协作
- 核心业务流的域协作（报价到回款）
- Monorepo 按域组织的目录结构
- 域级数据迁移与功能开关

### [服务抽象模型](./domain/服务抽象模型.md)

**Service 泛化抽象文档**，定义了：

- 核心结论：Service = 可定价的服务能力包
- Service 抽象模型：不带行业语义的核心结构
- Pricing Model：fixed / milestone / hourly / daily / unit / subscription / hybrid
- Delivery Model：one_time / phased / continuous / on_demand
- Service 与 Quote / Project / Finance 的关系
- 三种服务类型验证：视觉创意 / 战略咨询 / 技术开发

### [服务类型定义](./domain/服务类型定义.md)

**Service Type + AI Role 映射**，定义了：

- Service Type 定位：语义层，不参与核心计算逻辑
- 完整类型枚举：7 大分类（创意/内容/咨询/技术/商务/教育/活动）40+ 子类型
- 类型元数据：displayName / icon / defaultAiRole / defaultWorkflowTemplate
- AI 角色定义：design_expert / strategy_consultant / tech_expert / content_expert 等
- 角色选择逻辑

### [服务流程模板](./domain/服务流程模板.md)

**Workflow Template 定义**，包含：

- Workflow Template 数据模型
- 阶段定义：allowedTools / allowedUIComponents / customerTouchpoints / checkpoints / artifactTypes
- 平台级模板库：视觉创意 / 战略咨询 / 技术开发
- 与 AI OS 的集成：Workflow Engine / Tool Gate / UI Protocol
- 企业自定义模板

### [用户后台功能架构](./domain/用户后台功能架构.md)

**Tenant Console 功能模块**，包含：

- **9 大模块**：项目管理 / 财务管理 / 合同管理 / 服务管理 / 客户管理 / 文件系统 / 组织管理 / 内容管理 / 系统设置
- 每个模块的功能清单与 AI 可操作性
- 完整数据模型定义
- Tool 清单汇总（100+ Tools）
- 与 AI OS 的集成方式

---

## 应用规划（Apps）

### [微信小程序能力规划](./apps/微信小程序能力规划.md)

**微官网 + 客户工作台**，定义了：

- **双区架构**：公共区（认知与信任）+ 客户工作台（协作与留痕）
- **公共区**：首页 / 作品展示 / 团队介绍 / 报价展示
- **客户工作台**：项目进度 / 提案协作 / 交付物获取 / 结算单 / 发票
- 信息架构（IA）与页面数据模型
- 与用户后台的数据对象映射
- 权限与身份（微信登录、Scope、多企业切换）
- BFF 架构（鉴权、脱敏、聚合、审计）
- 分期交付：MP-1 / MP-2 / MP-3
- 关键约束：只围绕客户动作、不做后台级操作、真实交互强制

---

## 开发计划

### [第一阶段开发任务规划](./开发计划/第一阶段开发任务规划.md)

**工程执行计划**（目标：clone 后 10 分钟能跑起来），包含：

**Step 1：部署环境与工程骨架**
- Monorepo 结构（apps / packages / domains / services）
- 数据库与迁移框架（Drizzle ORM）
- Auth 基线（Better Auth + 企业上下文）
- 统一日志与审计事件
- Feature Flag 框架
- Docker Compose 配置

**Step 2：前端界面（IA + 协议优先）**
- OpenAPI 契约定义
- Mock Server + API 客户端生成
- UI 组件库（shadcn/ui + 三态组件）
- 四个应用壳：
  - `platform-web`（平台前台）
  - `platform`（平台后台）
  - `portal`（客户网站前台）
  - `console`（用户后台）

**Step 3：后端能力（按域填充）**
- 第一条业务闭环：Service → Quote → Order → Project → Deliverable
- 完整的事件/审计日志
- 状态机驱动的流程

**时间线**: 约 6 周

---

## 核心规范（必读）

### 1. [开发伦理与系统操作宪章](./开发伦理与系统操作宪章-最高指示.md)

**最高级约束规范**，所有开发必须遵循：

- AI 是系统的一等操作主体
- 人能操作的，AI 必须能操作
- 禁止"演出来的智能"
- 只允许使用 shadcn/ui
- 全项目禁止 Emoji

### 2. [代码质量标准化体系](./代码质量标准化体系.md)

**代码质量硬标准**，约束人类开发者与 AI（Cursor）：

- 红线（零容忍）：enterpriseId 缺失、绕过 Protocol、假交互
- 工程基线：TypeScript 严格模式、pnpm monorepo、ESLint/Prettier
- 架构边界：五层分离（UI/Agent/Tool/Data/Protocol）
- 测试标准：Tool/Workflow/Multi-tenant/Role Policy 必测
- 合并门槛：lint + typecheck + tests 全绿 + 无红线违规

### 3. [AI 原生架构升级规划](./AI原生架构升级规划.md)

**架构设计文档**，包含：

- 统一 AI 助手设计
- 对话流 + 画布双区交互
- Tool Protocol / UI Protocol
- 8 个交互原语组件
- 多角色系统设计
- 三大风险防护机制
- 两条架构红线

### 4. [AI 原生架构实施计划](./AI原生架构实施计划.md)

**实施路线图**，包含：

- P0-P4 五个阶段规划
- 任务分解与依赖关系
- 验证标准与里程碑

### 5. [AI 原生架构违规示例清单](./AI原生架构违规示例清单.md)

**反模式清单**，包含：

- 35 个违规示例
- PR 审查清单
- Cursor 自检指令

---

## 开发规范

> 所有开发规范已更新为 dhs-atlas AI 原生架构规范（v2.0+）

| 文档 | 说明 | 版本 | 重要程度 |
|------|------|------|----------|
| [UI交互设计规范](./开发规范/UI交互设计规范.md) | **三条底层准则** + 核心链路交互 | v1.0 | **必读** |
| [黄金样板页规范](./开发规范/黄金样板页规范.md) | **三个标准页模板**（EntityList/Detail/Workbench） | v1.0 | **必读** |
| [前端开发指南](./开发规范/前端开发指南.md) | 开发流程总入口、Command-First 模式 | v2.0 | **必读** |
| [UI样式使用规范](./开发规范/UI样式使用规范.md) | shadcn/ui + Tailwind CSS 规范 | v3.0 | **强制** |
| [组件样式规范](./开发规范/组件样式规范.md) | 8 个 AI 交互原语组件规范 | v2.0 | **强制** |
| [样式系统设计规范](./开发规范/样式系统设计规范.md) | CSS 变量、设计 Token 系统 | v2.0 | 参考 |
| [列表页面布局标准](./开发规范/列表页面布局标准.md) | 列表页布局类型与状态处理 | v2.0 | 参考 |

### UI 设计核心规范速览

**三条底层准则**（不可违背）：

| 准则 | 核心要求 |
|------|---------|
| **真实交互** | 每个按钮必须对应后端可审计的状态变化 |
| **单一交互协议** | 所有模块用同一套交互原语（List/Detail/Form/Wizard/Review/Timeline） |
| **AI 可操作** | 所有交互组件暴露统一的 Action Schema |

**三个黄金样板页**：

| 样板 | 适用场景 |
|------|---------|
| **EntityList** | 客户/服务/项目/订单等所有列表 |
| **EntityDetail** | 所有详情页（时间线 + 状态机 CTA） |
| **TaskWorkbench** | 合同预检/审批/验收/导入等任务型页面 |

---

## 开发者入门指南

### 新功能开发流程

1. **首先阅读** -> [开发伦理与系统操作宪章](./开发伦理与系统操作宪章-最高指示.md)
2. **架构理解** -> [总体架构设计](./architecture/总体架构设计.md) **必读**
3. **质量标准** -> [代码质量标准化体系](./代码质量标准化体系.md) **强制**
4. **样式规范** -> [UI样式使用规范](./开发规范/UI样式使用规范.md) **强制**
5. **反模式** -> [AI原生架构违规示例清单](./AI原生架构违规示例清单.md)

### 关键原则

```
Human-only features are bugs.
If AI cannot operate it, it is not finished.

No fake intelligence.
No fake interaction.
No UI that AI cannot understand.
```

---

## 下一步

- [x] 创建项目计划文档（立法文件）
- [x] 创建仓库 README
- [x] 创建总体架构设计文档
- [x] 创建代码质量标准化体系
- [x] 创建租户模式与迁移方案文档
- [x] 创建服务域抽象模型（Service 泛化）
- [x] 制定开发计划（第一阶段开发任务规划）
- [ ] **执行 Step 1**：部署环境与工程骨架
- [ ] **执行 Step 2**：前端界面（IA + 协议）
- [ ] **执行 Step 3**：后端能力（第一条闭环）

---

**文档中心版本**: v2.3  
**最后更新**: 2025-12-28  
**维护状态**: 活跃维护中

