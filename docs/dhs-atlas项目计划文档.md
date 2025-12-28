# dhs-atlas 项目计划文档（v1.0）

**An AI-Native Operating System for Work**

> **文档性质**：立法文件  
> **约束范围**：后续所有设计、代码、Cursor 行为，都应以本文档为最高依据

---

## 一、项目名称（Project Name）

### dhs-atlas

**命名含义**：
- **dhs**：Donhauser System / 东合社系统前缀，代表一整套长期演进的系统家族
- **atlas**：承载、支撑、稳定、不可替代
- 象征本项目并非某一业务工具，而是承载多种业务、AI 行为与工作流的底层系统

**项目定位一句话**：

> dhs-atlas 不是一个 AI 功能集合，而是一套 AI 原生的工作操作系统。

---

## 二、产品开发哲学（Product Philosophy）

### 1. AI 原生，而不是 AI 加持

dhs-atlas 的设计前提不是"给系统加一个 AI"，而是：

> **假设 AI 是系统中的一等执行者（First-Class Operator）。**

因此：
- AI 与人类使用同一套能力接口
- AI 不能绕过系统规则
- AI 不具备"魔法权力"

---

### 2. 原则先于能力（Principles Before Intelligence）

系统遵循以下铁律：

1. 任何 AI 行为，必须可解释、可回放、可审计
2. 任何功能，如果 AI 无法通过系统机制操作，则视为失败设计
3. 宁可限制 AI 的自由度，也不允许产生幻觉式能力

> dhs-atlas 反对"看起来很聪明但无法控制的 AI"。

---

### 3. 系统优先于体验，体验建立在系统之上

- 不为"演示效果"牺牲系统一致性
- 不为"短期好用"破坏长期架构
- 所有体验都来自真实状态与真实执行过程

> **真实感，比"顺滑感"更重要。**

---

## 三、技术栈总览（Technology Stack）

### 1. 语言与运行时

- TypeScript（严格模式）
- Node.js 20+

**核心原则**：
- 强类型不是偏好，而是安全边界
- 运行时校验（Schema）必须存在

---

### 2. 前端技术栈

- Next.js 15
- React 19（RSC First）
- shadcn/ui + Radix UI + Tailwind CSS

**UI 原则（强制）**：
- 禁止自建 UI 体系
- 禁止 Emoji 作为信息或状态表达
- UI 只用于呈现真实系统状态

> AI 不得生成或拼装组件，只能调用已注册的交互原语。

---

### 3. AI 系统核心（AI OS Layer）

dhs-atlas 自研 AI OS 层，包含：

| 组件 | 职责 |
|------|------|
| **Agent** | 规划与调度 |
| **Role** | 行为与权限约束 |
| **Workflow** | 状态机驱动的执行轨道 |
| **Orchestrator** | AI 与 UI 的最终调度裁决者 |
| **Tool Registry** | 唯一能力入口 |

> **LLM 是规划器，不是执行者。执行权永远在系统之内。**

---

### 4. 模型策略

- 多模型架构（Model-Agnostic）
- 支持云端 / 私有 / 本地模型
- 通过 Tool + Schema 统一调用

> 系统不绑定任何单一模型厂商。

---

### 5. 数据与状态

- PostgreSQL（JSONB + 结构化并存）
- 事件日志（Event Log）作为 AI 行为真相源
- 明确区分：
  - 事实数据
  - AI 产物
  - 行为记录

---

## 四、多企业架构（Multi-Tenant by Design）

### 核心结论

> dhs-atlas 在架构层面必须是多企业（Multi-Tenant）。
> 
> **这是安全需求，而不是商业需求。**

---

### 1. Enterprise 是系统的基础坐标系

- Enterprise 不是一个"模块"
- 而是所有数据、权限、行为的物理边界

以下对象必须 100% 绑定 enterprise scope：
- Tool
- Workflow
- Role / Policy
- Artifact / Memory
- AI 行为日志

> **任何未显式绑定 enterprise 的能力，视为架构违规。**

---

### 2. 防止 AI 跨企业污染

AI 系统一旦出现：
- 错用其他企业数据
- 错用其他企业策略
- 混合记忆与行为历史

将直接导致系统信任崩塌。

> **因此，多企业隔离从 Day 1 强制存在。**

---

## 五、单企业先行体验（Single-Enterprise Experience First）

### 设计原则

> **架构多企业，体验单企业。**

---

### Phase 0（初始阶段）

- 系统内存在一个 `default` enterprise
- 用户注册即加入该 enterprise
- UI 不暴露企业切换概念
- 所有 API、Tool、Workflow 已按 multi-tenant 设计

**对用户而言**：这是一个"单企业系统"。

**对系统而言**：这是一个严格的多企业架构。

---

### Phase 1（验证阶段）

- 支持创建多个 enterprise（内部 / 管理用途）
- 用于测试：
  - 数据隔离
  - AI 行为隔离
  - 权限系统完整性

---

### Phase 2（正式多企业体验）

- 开放企业切换 UI
- 企业成员 / 邀请 / 权限管理
- 企业级配置（Policy / Tool / Workflow）

> **无需重构，仅解锁能力。**

---

## 六、结语（不可变声明）

dhs-atlas 是一套为长期演进而设计的系统。

它拒绝短期取巧，
拒绝幻觉式智能，
拒绝无法被 AI 操作的"人类特权功能"。

如果某个功能：
- AI 不能理解
- AI 不能执行
- AI 不能被约束

**那它就不属于 dhs-atlas。**

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2024-12-28 | 初始版本，项目计划立法文件 |

