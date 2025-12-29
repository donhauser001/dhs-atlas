# AI 地图模板规范

## AI Map Template Specification

本文档定义了 AI 地图的设计规范，帮助 AI 在复杂任务中找到正确方向。

---

## 一、AI 地图的本质

### 地图 ≠ 流程

| 流程引擎 | AI 地图 |
|----------|---------|
| 强制按步骤执行 | 提供经验路径 |
| 不允许偏离 | 允许创造性偏离 |
| 确定性逻辑 | 概率性引导 |
| 控制 AI | 辅助 AI |

### 地图的作用

```
用户请求 → 匹配地图 → 获取方向 → AI 自由执行
              ↓
         "通常这样做"
         "推荐用这个工具"
         "结果参考这个模板"
```

---

## 二、地图 Schema 结构

### 完整 Schema

```typescript
interface AiMap {
  // ========== 基础信息 ==========
  mapId: string;          // 唯一标识
  name: string;           // 地图名称
  description: string;    // 功能描述
  
  // ========== 触发条件 ==========
  triggers: string[];     // 触发关键词
  module: string;         // 所属模块
  priority: number;       // 优先级（数字越大越优先）
  
  // ========== 路径定义 ==========
  steps: AiMapStep[];     // 步骤列表
  
  // ========== 示例 ==========
  examples: string;       // 完整对话示例（Markdown）
  
  // ========== 状态 ==========
  enabled: boolean;
}

interface AiMapStep {
  order: number;          // 步骤顺序
  action: string;         // 步骤描述
  toolId?: string;        // 推荐使用的工具
  dataModel?: string;     // 涉及的数据模型
  templateId?: string;    // 推荐的输出模板
  condition?: string;     // 执行条件（可选）
  note?: string;          // 备注（给 AI 的提示）
}
```

---

## 三、触发词设计

### 触发词原则

| 原则 | 说明 | 示例 |
|------|------|------|
| **精准** | 使用明确的业务词汇 | "联系人统计" 而非 "统计" |
| **多样** | 覆盖用户的多种表达 | ["查询客户", "找客户", "搜索客户"] |
| **区分** | 避免不同地图的触发词重叠 | 金额统计用"金额"，项目统计用"项目数" |

### 触发词示例

```javascript
// 查询类
triggers: ['查询', '查一下', '找', '搜索', '看看']

// 统计类
triggers: ['统计', '多少', '有几个', '哪些', '排名']

// 创建类
triggers: ['新建', '创建', '添加', '录入']

// 分析类
triggers: ['分析', '对比', '趋势', '变化']
```

### 优先级设计

```
高优先级（priority: 10）：具体场景
  "中信出版社有哪些联系人" → query_contact_stats

中优先级（priority: 5）：通用场景
  "查一下客户信息" → query_client

低优先级（priority: 0）：兜底场景
  "你好" → general_greeting
```

---

## 四、步骤设计

### 步骤类型

| 类型 | 描述 | toolId | templateId |
|------|------|--------|------------|
| 查询 | 调用查询工具 | ✅ | - |
| 聚合 | 调用统计工具 | ✅ | - |
| 输出 | 使用模板格式化 | - | ✅ |
| 决策 | AI 自行判断 | - | - |

### 步骤示例

```javascript
// 简单查询（2步）
steps: [
  { order: 1, action: '查询客户信息', toolId: 'db.query', dataModel: 'clients' },
  { order: 2, action: '格式化输出', templateId: 'client_detail' },
]

// 统计分析（3步）
steps: [
  { order: 1, action: '调用统计工具', toolId: 'crm.contact_stats' },
  { order: 2, action: 'AI 分析统计结果', note: '找出项目最多的联系人' },
  { order: 3, action: '格式化输出', templateId: 'contact_stats' },
]

// 复杂任务（多步）
steps: [
  { order: 1, action: '查询客户是否存在', toolId: 'crm.search_client' },
  { order: 2, action: '判断是否存在', note: '如果存在，提示用户；如果不存在，继续创建' },
  { order: 3, action: '打开创建表单', toolId: 'ui.open_form', condition: '客户不存在时' },
  { order: 4, action: '帮助填写表单', note: '根据用户提供的信息预填' },
]
```

---

## 五、示例设计

### 示例的作用

示例是"完成态"的定义，告诉 AI：
- 典型的对话流程
- 工具的调用方式
- 输出的格式标准

### 示例格式

```markdown
**用户**: [用户的典型输入]

**AI**: [AI 的自然语言回复]

**工具调用**:
\`\`\`tool_call
{"toolId": "xxx", "params": {...}}
\`\`\`

**工具返回**:
\`\`\`json
{...真实数据示例...}
\`\`\`

**最终输出**:
[使用模板格式化的输出示例]
```

### 示例要点

| 要点 | 说明 |
|------|------|
| **真实数据** | 使用系统中的真实数据作为示例 |
| **完整流程** | 展示从用户输入到最终输出的全过程 |
| **工具调用** | 明确展示工具调用的格式 |
| **强调约束** | 在关键处标注"直接使用工具返回的数据" |

---

## 六、地图模板库

### 模板 1：简单查询

```javascript
{
  mapId: 'query_{entity}',
  name: '查询{Entity}',
  description: '根据条件查询{Entity}信息',
  triggers: ['查询{entity}', '找{entity}', '{entity}信息'],
  module: '{module}',
  priority: 5,
  steps: [
    {
      order: 1,
      action: '使用 db.query 查询 {collection} 集合',
      toolId: 'db.query',
      dataModel: '{collection}',
    },
    {
      order: 2,
      action: '使用 {entity}_detail 模板格式化输出',
      templateId: '{entity}_detail',
    },
  ],
  examples: `**用户**: 查一下{example_name}的信息

**AI**: 正在为您查询，请稍等。

**工具调用**:
\`\`\`tool_call
{"toolId": "db.query", "params": {"collection": "{collection}", "operation": "find", "query": {"name": {"$regex": "{example_name}", "$options": "i"}}}}
\`\`\`

**输出**:
| 字段 | 内容 |
|------|------|
| 名称 | {example_name} |
| ... | ... |`,
  enabled: true,
}
```

### 模板 2：统计分析

```javascript
{
  mapId: '{entity}_stats',
  name: '{Entity}统计',
  description: '统计{Entity}的{metric}数据',
  triggers: ['{entity}统计', '多少{entity}', '{entity}排名', '哪个{entity}'],
  module: '{module}',
  priority: 8,
  steps: [
    {
      order: 1,
      action: '使用专用统计工具获取聚合数据',
      toolId: '{module}.{entity}_stats',
      note: '该工具会自动完成聚合，返回真实数据',
    },
    {
      order: 2,
      action: '使用 {entity}_stats 模板格式化输出',
      templateId: '{entity}_stats',
    },
  ],
  examples: `**用户**: {example_question}

**AI**: 让我帮您统计一下。

**工具调用**:
\`\`\`tool_call
{"toolId": "{module}.{entity}_stats", "params": {"targetName": "{example_target}"}}
\`\`\`

**工具返回（这是真实数据，直接使用）**:
\`\`\`json
{
  "items": [...],
  "summary": {"top": "...", "total": ...}
}
\`\`\`

**输出**:
| 名称 | 数量 | 详情 |
|------|------|------|
| ... | ... | ... |

**总结**: 共 X 项，最高的是 **XXX**。`,
  enabled: true,
}
```

### 模板 3：创建流程

```javascript
{
  mapId: 'create_{entity}',
  name: '创建{Entity}',
  description: '引导用户创建新的{Entity}',
  triggers: ['新建{entity}', '创建{entity}', '添加{entity}'],
  module: '{module}',
  priority: 5,
  steps: [
    {
      order: 1,
      action: '询问{entity}名称',
      note: '如果用户已提供名称，跳过此步',
    },
    {
      order: 2,
      action: '检查是否已存在',
      toolId: '{module}.search_{entity}',
    },
    {
      order: 3,
      action: '如果存在，提示用户',
      condition: '搜索结果不为空',
      note: '展示已有记录，询问是否查看或编辑',
    },
    {
      order: 4,
      action: '打开创建表单',
      toolId: 'ui.open_form',
      condition: '搜索结果为空或用户确认创建新的',
    },
    {
      order: 5,
      action: '帮助预填信息',
      note: '根据用户提供的信息预填表单',
    },
  ],
  examples: `**用户**: 帮我创建一个新客户

**AI**: 好的，请告诉我客户的名称，我先帮您查查是否已经存在。

**用户**: 中信出版社

**AI**: 让我查一下...

**工具调用**:
\`\`\`tool_call
{"toolId": "crm.search_client", "params": {"keyword": "中信出版社"}}
\`\`\`

**发现已存在**:
找到了"中信出版社"的记录，您是要查看它的信息，还是创建一个新客户？

**或者不存在**:
没有找到"中信出版社"，我已经在左侧打开了新建客户表单，并预填了客户名称。您可以继续填写其他信息，或者告诉我更多信息，我来帮您填写。`,
  enabled: true,
}
```

### 模板 4：关联查询

```javascript
{
  mapId: 'query_{entity}_with_{related}',
  name: '查询{Entity}的{Related}',
  description: '查询{Entity}关联的{Related}信息',
  triggers: ['{entity}的{related}', '{entity}有哪些{related}', '关联{related}'],
  module: '{module}',
  priority: 6,
  steps: [
    {
      order: 1,
      action: '先查询{entity}获取ID',
      toolId: 'db.query',
      dataModel: '{entity_collection}',
      condition: '如果用户只提供了名称',
    },
    {
      order: 2,
      action: '查询关联的{related}',
      toolId: 'db.query',
      dataModel: '{related_collection}',
    },
    {
      order: 3,
      action: '使用 {entity}_{related}_list 模板输出',
      templateId: '{entity}_{related}_list',
    },
  ],
  examples: `**用户**: 查一下中信出版社有哪些项目

**AI**: 让我帮您查询。

**工具调用**:
\`\`\`tool_call
{"toolId": "db.query", "params": {"collection": "projects", "operation": "find", "query": {"clientName": {"$regex": "中信", "$options": "i"}}}}
\`\`\`

**输出**:
### 中信出版社 关联项目

| 项目名称 | 状态 | 创建时间 |
|----------|------|----------|
| 量子金融科技 | 进行中 | 2024-01 |
| ... | ... | ... |

共 X 个项目。`,
  enabled: true,
}
```

---

## 七、地图设计原则

### 1. 入口清晰

```
触发词 → 匹配地图 → 开始执行

触发词要：
- 覆盖用户的多种表达方式
- 与其他地图区分开
- 优先级设置合理
```

### 2. 路径可选

```
地图提供的是"推荐路径"，不是"强制流程"。

AI 可以：
- 跳过某些步骤
- 组合多个工具
- 创造性地解决问题

地图只是说："通常这样做效果最好"
```

### 3. 出口明确

```
每个地图都应该有明确的"完成态"：

- 查询类：输出格式化的数据表格
- 统计类：输出统计结果和总结
- 创建类：表单已打开或记录已创建
- 分析类：输出分析结论和建议
```

### 4. 示例真实

```
示例必须使用真实数据，不能虚构。

原因：
- AI 会学习示例中的模式
- 虚构的示例会导致 AI 产生幻觉
- 真实示例帮助 AI 理解正确的输出格式
```

---

## 八、检查清单

创建新地图时，使用此清单检查：

- [ ] **ID 唯一**：`mapId` 在系统中唯一
- [ ] **触发词全面**：覆盖用户的多种表达
- [ ] **触发词精准**：不与其他地图冲突
- [ ] **优先级合理**：具体场景高于通用场景
- [ ] **步骤完整**：从触发到完成的全流程
- [ ] **工具明确**：每个查询/操作步骤指定工具
- [ ] **模板指定**：输出步骤指定模板
- [ ] **示例真实**：使用真实数据
- [ ] **示例完整**：展示完整对话流程
- [ ] **模块正确**：`module` 与前端页面对应

---

## 九、地图与其他组件的关系

```
┌─────────────────────────────────────────────────────────┐
│                     用户请求                             │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    AI 地图                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 触发词匹配 → 选择地图 → 获取步骤和示例            │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    工具集                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 地图告诉 AI 用什么工具 → 工具返回真实数据         │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   样例模板                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 地图告诉 AI 用什么模板 → 模板定义输出格式         │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    最终输出                              │
└─────────────────────────────────────────────────────────┘
```

---

*文档版本：v1.0*
*最后更新：2024年12月*

