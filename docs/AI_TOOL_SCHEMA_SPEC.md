# AI 工具 Schema 规范

## Tool Schema Specification

本文档定义了 AI 工具的设计规范，确保工具符合"结构化自由"哲学。

---

## 一、核心原则

### 工具是"业务语义能力"，不是"技术接口"

| ❌ 技术接口思维 | ✅ 业务语义思维 |
|----------------|----------------|
| `db.find('projects', {clientId: x})` | `crm.getClientProjects(clientName)` |
| `db.aggregate([{$group...}])` | `crm.contact_stats(clientName)` |
| `http.post('/api/clients', data)` | `crm.createClient(name, address)` |

### 工具返回"可直接使用"的数据

```
❌ 错误：返回原始数据，让 AI 自己处理
{
  "projects": [...原始项目数组...],
  "settlements": [...原始结算数组...]
}

✅ 正确：返回已处理的结构化数据
{
  "clientName": "中信出版社",
  "contacts": [
    {"name": "丁媛媛", "projectCount": 2, "totalAmount": 50000}
  ],
  "summary": {
    "topByCount": "丁媛媛（2个项目）",
    "topByAmount": "丁媛媛（¥50000）"
  }
}
```

---

## 二、工具 Schema 结构

### 完整 Schema 定义

```typescript
interface ToolDefinition<TParams> {
  // ========== 基础信息 ==========
  id: string;                    // 唯一标识，格式：{domain}.{action}
  name: string;                  // 中文名称
  description: string;           // 功能描述（给 AI 看）
  category: ToolCategory;        // 分类
  
  // ========== 参数定义 ==========
  paramsSchema: ZodSchema;       // Zod Schema，定义输入参数
  
  // ========== 执行配置 ==========
  requiresConfirmation: boolean; // 是否需要用户确认
  timeout?: number;              // 超时时间（毫秒）
  
  // ========== 执行函数 ==========
  execute: (params: TParams, context: ToolContext) => Promise<ToolResult>;
}
```

### 工具 ID 命名规范

```
{domain}.{action}[_{modifier}]

domain: 业务领域
  - crm      客户关系
  - project  项目管理
  - finance  财务
  - analytics 分析统计
  - ui       界面操作
  - db       数据库（仅限通用查询）
  - ai       AI 自身能力

action: 动作
  - get      获取单个
  - list     获取列表
  - search   搜索
  - create   创建
  - update   更新
  - delete   删除
  - stats    统计

modifier: 修饰（可选）
  - _by_name  按名称
  - _with_amount  包含金额
```

**示例：**

| 工具 ID | 含义 |
|---------|------|
| `crm.search_client` | 搜索客户 |
| `crm.contact_stats` | 联系人统计 |
| `project.list_by_client` | 按客户列出项目 |
| `finance.stats_by_period` | 按时间段统计 |
| `ui.open_form` | 打开表单 |

---

## 三、工具分类与特征

### 分类定义

| 分类 | 特征 | 确认要求 | 示例 |
|------|------|----------|------|
| `query` | 只读查询 | 无需确认 | `crm.search_client` |
| `stats` | 统计聚合 | 无需确认 | `crm.contact_stats` |
| `create` | 创建数据 | 需要确认 | `crm.create_client` |
| `update` | 修改数据 | 需要确认 | `crm.update_client` |
| `delete` | 删除数据 | 需要确认 | `crm.delete_client` |
| `ui` | 界面操作 | 无需确认 | `ui.open_form` |

### 确认机制

```typescript
// 需要确认的工具
{
  id: 'crm.create_client',
  requiresConfirmation: true,  // ← 关键配置
  
  // 前端会显示确认对话框
  // AI 返回 pendingToolCalls，等待用户确认
}

// 无需确认的工具
{
  id: 'crm.search_client',
  requiresConfirmation: false,  // ← 直接执行
}
```

---

## 四、参数 Schema 设计

### 使用 Zod 定义参数

```typescript
import { z } from 'zod';

// 简单参数
const searchClientParams = z.object({
  keyword: z.string().describe('搜索关键词'),
  limit: z.number().default(10).describe('返回数量限制'),
});

// 复杂参数
const contactStatsParams = z.object({
  clientName: z.string().describe('客户名称（支持模糊匹配）'),
  includeAmount: z.boolean().default(false).describe('是否包含金额统计'),
  dateRange: z.object({
    start: z.string().optional().describe('开始日期 YYYY-MM-DD'),
    end: z.string().optional().describe('结束日期 YYYY-MM-DD'),
  }).optional().describe('时间范围'),
});
```

### 参数设计原则

| 原则 | 说明 | 示例 |
|------|------|------|
| **业务化** | 使用业务术语，不用技术术语 | `clientName` 而非 `query.name.$regex` |
| **默认值** | 提供合理默认值 | `limit: 10`, `includeAmount: false` |
| **描述清晰** | 每个参数有 `.describe()` | 帮助 AI 理解参数用途 |
| **类型严格** | 使用 Zod 类型校验 | 防止参数错误 |

---

## 五、返回值 Schema 设计

### 标准返回结构

```typescript
interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### 返回值设计原则

#### 1. 扁平化结构

```typescript
// ❌ 错误：嵌套过深
{
  result: {
    data: {
      contacts: {
        list: [...]
      }
    }
  }
}

// ✅ 正确：扁平结构
{
  contacts: [...],
  summary: {...}
}
```

#### 2. 预计算聚合

```typescript
// ❌ 错误：返回原始数据让 AI 计算
{
  projects: [
    {contact: '张三', amount: 100},
    {contact: '张三', amount: 200},
    {contact: '李四', amount: 150}
  ]
}
// AI 需要自己计算：张三总额 300，李四总额 150

// ✅ 正确：返回已计算的结果
{
  contacts: [
    {name: '张三', totalAmount: 300, projectCount: 2},
    {name: '李四', totalAmount: 150, projectCount: 1}
  ],
  summary: {
    topByAmount: '张三（¥300）'
  }
}
```

#### 3. 包含"总结"字段

```typescript
// 每个统计类工具都应包含 summary
{
  data: [...],
  summary: {
    total: 100,
    topItem: '...',
    insight: '...'  // 可选：预生成的洞察
  }
}
```

---

## 六、工具模板

### 查询类工具模板

```typescript
import { z } from 'zod';
import type { ToolDefinition, ToolContext, ToolResult } from '../types';

const paramsSchema = z.object({
  keyword: z.string().describe('搜索关键词'),
  limit: z.number().default(10).describe('返回数量'),
});

type Params = z.infer<typeof paramsSchema>;

export const searchXxxTool: ToolDefinition<Params> = {
  id: 'domain.search_xxx',
  name: '搜索XXX',
  description: '根据关键词搜索XXX，返回匹配的列表',
  category: 'query',
  requiresConfirmation: false,
  paramsSchema,

  async execute(params: Params, context: ToolContext): Promise<ToolResult> {
    try {
      // 1. 查询数据库
      const results = await db.collection('xxx').find({
        name: { $regex: params.keyword, $options: 'i' }
      }).limit(params.limit).toArray();

      // 2. 返回结构化结果
      return {
        success: true,
        data: {
          items: results.map(r => ({
            id: r._id.toString(),
            name: r.name,
            // ... 其他字段
          })),
          total: results.length,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: error instanceof Error ? error.message : '查询失败',
        }
      };
    }
  },
};
```

### 统计类工具模板

```typescript
import { z } from 'zod';
import type { ToolDefinition, ToolContext, ToolResult } from '../types';

const paramsSchema = z.object({
  targetId: z.string().describe('目标对象ID或名称'),
  includeDetails: z.boolean().default(false).describe('是否包含详情'),
});

type Params = z.infer<typeof paramsSchema>;

export const statsXxxTool: ToolDefinition<Params> = {
  id: 'domain.xxx_stats',
  name: 'XXX统计',
  description: '统计XXX的相关数据，返回聚合结果',
  category: 'stats',
  requiresConfirmation: false,
  paramsSchema,

  async execute(params: Params, context: ToolContext): Promise<ToolResult> {
    try {
      // 1. 查询原始数据
      const rawData = await db.collection('xxx').find({...}).toArray();

      // 2. 在工具层完成聚合（关键！）
      const aggregated = new Map();
      for (const item of rawData) {
        // ... 聚合逻辑
      }

      // 3. 计算总结
      const items = Array.from(aggregated.values());
      const top = items.reduce((a, b) => a.value > b.value ? a : b);

      // 4. 返回已处理的数据
      return {
        success: true,
        data: {
          items: items,
          summary: {
            total: items.length,
            topItem: `${top.name}（${top.value}）`,
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'STATS_ERROR', message: '统计失败' }
      };
    }
  },
};
```

### 创建类工具模板

```typescript
import { z } from 'zod';
import type { ToolDefinition, ToolContext, ToolResult } from '../types';

const paramsSchema = z.object({
  name: z.string().min(1).describe('名称（必填）'),
  // ... 其他字段
});

type Params = z.infer<typeof paramsSchema>;

export const createXxxTool: ToolDefinition<Params> = {
  id: 'domain.create_xxx',
  name: '创建XXX',
  description: '创建新的XXX记录',
  category: 'create',
  requiresConfirmation: true,  // ← 需要确认
  paramsSchema,

  async execute(params: Params, context: ToolContext): Promise<ToolResult> {
    try {
      // 1. 数据校验（可选，Zod 已校验）
      
      // 2. 创建记录
      const result = await db.collection('xxx').insertOne({
        ...params,
        createdAt: new Date(),
        createdBy: context.userId,
      });

      // 3. 返回创建结果
      return {
        success: true,
        data: {
          id: result.insertedId.toString(),
          message: `成功创建：${params.name}`,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'CREATE_ERROR', message: '创建失败' }
      };
    }
  },
};
```

---

## 七、工具注册

### 注册流程

```typescript
// backend/src/ai/tools/index.ts

import { toolRegistry } from './registry';
import { searchClientTool, contactStatsTool } from './crm';
import { dbQueryTool } from './db';

export function registerAllTools(): void {
  // 按分类注册
  toolRegistry.register(searchClientTool);
  toolRegistry.register(contactStatsTool);
  toolRegistry.register(dbQueryTool);
  
  console.log(`[Tool Registry] 共注册 ${toolRegistry.getAll().length} 个工具`);
}
```

### 数据库同步

工具定义后，需同步到 `aitools` 集合，供 AI 查询能力：

```typescript
// backend/src/scripts/initAiConfig.ts

const tools = [
  {
    toolId: 'crm.contact_stats',
    name: '联系人项目统计',
    description: '统计某客户下各联系人的项目数量和金额',
    usage: '```tool_call\n{"toolId": "crm.contact_stats", "params": {"clientName": "xxx"}}\n```',
    examples: '...',
    category: 'crm',
    enabled: true,
  },
  // ...
];
```

---

## 八、检查清单

创建新工具时，使用此清单检查：

- [ ] **ID 规范**：符合 `{domain}.{action}` 格式
- [ ] **参数语义化**：使用业务术语，不暴露技术细节
- [ ] **默认值**：关键参数有合理默认值
- [ ] **描述完整**：每个参数有 `.describe()`
- [ ] **返回扁平**：避免嵌套过深
- [ ] **预计算**：统计/聚合在工具层完成
- [ ] **包含总结**：统计类工具有 `summary` 字段
- [ ] **确认配置**：写操作设置 `requiresConfirmation: true`
- [ ] **错误处理**：返回标准错误格式
- [ ] **数据库同步**：添加到 `initAiConfig.ts`

---

*文档版本：v1.0*
*最后更新：2024年12月*

