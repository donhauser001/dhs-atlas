# dhs-atlas

**An AI-Native Operating System for Work**

---

## 项目定位

dhs-atlas 不是一个 AI 功能集合，而是一套 **AI 原生的工作操作系统**。

| 传统系统 | dhs-atlas |
|---------|-----------|
| 给系统加一个 AI | AI 是系统的一等执行者 |
| AI 是增强模块 | AI 与人使用同一套能力接口 |
| AI 有"魔法权力" | AI 不能绕过系统规则 |

---

## 核心铁律

```
Human-only features are bugs.
If AI cannot operate it, it is not finished.

No fake intelligence.
No fake interaction.
No UI that AI cannot understand.
```

**翻译**：
- 只有人能操作的功能 = Bug
- AI 不能操作 = 功能未完成
- 禁止假智能、假交互、AI 无法理解的 UI

---

## 项目命名

| 前缀 | 含义 |
|------|------|
| **dhs** | Donhauser System / 东合社系统前缀 |
| **atlas** | 承载、支撑、稳定、不可替代 |

本项目是承载多种业务、AI 行为与工作流的**底层系统**，而非某一业务工具。

---

## 技术栈

| 层级 | 技术选型 |
|------|---------|
| **语言** | TypeScript（严格模式） |
| **运行时** | Node.js 20+ |
| **前端** | Next.js 15 + React 19（RSC First） |
| **UI** | shadcn/ui + Radix UI + Tailwind CSS |
| **数据库** | PostgreSQL（JSONB + 结构化并存） |
| **模型** | 多模型架构（Model-Agnostic） |

---

## 架构核心：AI OS Layer

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

## 多企业架构

dhs-atlas 在架构层面是 **Multi-Tenant**（多企业），这是安全需求，而非商业需求。

- Enterprise 是系统的基础坐标系
- 所有数据、权限、行为必须绑定 enterprise scope
- 防止 AI 跨企业污染（错用数据/策略/记忆）

**Phase 0**：架构多企业，体验单企业（用户无感知）

---

## 文档结构

```
docs/
├── README.md                              # 文档中心索引
├── 开发伦理与系统操作宪章-最高指示.md       # 最高级约束规范（必读）
├── AI原生架构升级规划.md                   # AI 原生架构设计
├── AI原生架构实施计划.md                   # 实施路线图
├── AI原生架构违规示例清单.md               # 反模式清单
└── 开发规范/                              # 前端开发标准
    ├── UI样式使用规范.md
    ├── 样式系统设计规范.md
    ├── 组件样式规范.md
    ├── 列表页面布局标准.md
    └── 前端开发指南.md
```

---

## 开发者须知

### 必读文档

1. **[开发伦理与系统操作宪章](./docs/开发伦理与系统操作宪章-最高指示.md)** — 最高级约束，违反即失败
2. **[AI 原生架构升级规划](./docs/AI原生架构升级规划.md)** — 架构设计与协议规范
3. **[AI 原生架构违规示例清单](./docs/AI原生架构违规示例清单.md)** — 35 个反模式

### 强制约束

| 约束 | 说明 |
|------|------|
| **UI 系统** | 只允许 shadcn/ui，禁止魔改、禁止第二套 UI |
| **Emoji** | 全项目禁止，使用 Lucide Icons 替代 |
| **文档命名** | 必须中文（README.md 等技术文件除外） |
| **开发顺序** | 1.定义语义 → 2.实现 AI 可调用能力 → 3.最后 UI 封装 |

### 功能验收标准

每个 PR 必须回答：

> "如果我是 AI，而不是人，我是否能完整、正确、无歧义地使用这个功能？"

**不能 → PR 不允许合并。**

---

## 架构红线

### 红线 1：Interaction Orchestrator 拥有 UI 最终裁决权

```
AI（任何角色）永远不能直接决定 UI 的呈现方式，只能提出请求。
```

### 红线 2：预判指令默认需人确认

```
任何 Predicted Action，默认必须是"需人确认"的。
绝对禁止：AI 看你可能要做 → 就帮你做了。
```

---

## 项目哲学

1. **原则先于能力** — 宁可限制 AI 自由度，也不允许幻觉式能力
2. **系统优先于体验** — 不为演示效果牺牲系统一致性
3. **真实感 > 顺滑感** — 所有体验来自真实状态与真实执行过程

---

## 不可变声明

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

## License

Private / Proprietary

---

**dhs-atlas** · An AI-Native Operating System for Work

