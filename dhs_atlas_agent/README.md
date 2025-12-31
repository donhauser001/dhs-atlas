# DHS-Atlas Agent - DB-GPT 深度整合版

## 概述

这是 DHS-Atlas 企业管理系统的 AI Agent 模块，基于 DB-GPT 框架完全重构。

### 与原有系统的对比

| 特性 | 原有系统 (TypeScript) | 深度整合版 (Python) |
|------|----------------------|---------------------|
| Agent 框架 | 自研 agent-service | DB-GPT ToolAssistantAgent |
| 工具定义 | Zod Schema + 手动执行 | @tool 装饰器 |
| 多步任务 | AiMap (MongoDB) | 组合工具函数 |
| LLM 调用 | 手动 HTTP | DB-GPT LLM Client |
| 流式响应 | 手动 SSE | FastAPI StreamingResponse |

### 核心优势

1. **更成熟的框架**：使用经过验证的 DB-GPT 框架
2. **更简洁的代码**：工具定义从数百行简化到几十行
3. **更好的可维护性**：Python 生态更丰富
4. **原生支持 RAG**：可扩展知识库功能

## 目录结构

```
dhs_atlas_agent/
├── config.py              # 配置
├── models/                # 数据模型
│   ├── base.py           # MongoDB 连接
│   ├── client.py         # 客户模型
│   ├── quotation.py      # 报价单模型
│   └── service_pricing.py # 服务定价模型
├── tools/                 # AI 工具
│   ├── crm/              # CRM 工具
│   ├── finance/          # 财务工具
│   ├── schema/           # 数据结构工具
│   └── database/         # 通用数据库工具
├── agents/               # Agent 定义
│   └── main_agent.py     # 主 Agent
├── api/                  # API 层
│   └── server.py         # FastAPI 服务
└── main.py               # 入口
```

## 快速开始

### 1. 安装依赖

```bash
# 创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate

# 安装依赖
pip install -r dhs_atlas_agent/requirements.txt
```

### 2. 配置环境变量

```bash
export MONGO_URI="mongodb://localhost:27017/"
export DATABASE_NAME="donhauser"
export LLM_BASE_URL="http://192.168.31.177:1234"
export LLM_MODEL="qwen/qwen3-coder-30b"
```

### 3. 运行测试

```bash
# 测试数据库连接和工具
python -m dhs_atlas_agent.main --test
```

### 4. 启动服务

```bash
# 启动 API 服务
python -m dhs_atlas_agent.main --api

# 或使用启动脚本
./scripts/start-agent.sh api
```

### 5. 命令行测试

```bash
python -m dhs_atlas_agent.main --cli
```

## API 接口

### 健康检查

```bash
GET /api/health
```

### AI 对话

```bash
POST /api/agent/chat
Content-Type: application/json

{
  "message": "帮我查查中信出版社的报价单",
  "sessionId": "xxx"
}
```

### 流式对话

```bash
POST /api/agent/stream
Content-Type: application/json

{
  "message": "帮我查查中信出版社的报价单",
  "sessionId": "xxx"
}
```

## 工具列表

### CRM 工具

- `get_client_detail` - 获取客户详情
- `search_clients` - 搜索客户
- `get_client_categories` - 获取客户分类

### 财务工具

- `query_client_quotation` - **组合工具**：查询客户完整报价单
- `get_quotation_detail` - 获取报价单详情
- `get_service_pricing` - 获取服务定价

### Schema 工具

- `get_collection_schema` - 获取集合结构
- `list_collections` - 列出所有集合

### 数据库工具

- `query_collection` - 通用数据库查询
- `count_documents` - 统计文档数量

## 前端对接

前端只需修改 API 地址即可：

```typescript
// 原有
const API_BASE = 'http://localhost:3000/api/agent';

// 深度整合版
const API_BASE = process.env.NEXT_PUBLIC_AGENT_API || 'http://localhost:8000/api/agent';
```

接口格式保持兼容，无需修改其他代码。

## 扩展开发

### 添加新工具

```python
# dhs_atlas_agent/tools/your_module/your_tools.py
from dbgpt.agent.resource import tool
from typing_extensions import Annotated, Doc

@tool(description="你的工具描述")
def your_tool(
    param: Annotated[str, Doc("参数说明")]
) -> Annotated[dict, Doc("返回值说明")]:
    """
    详细的工具说明，帮助 AI 理解何时使用此工具。
    """
    # 实现逻辑
    return {"result": "xxx"}
```

然后在 `tools/__init__.py` 中导出：

```python
from .your_module import your_tool

ALL_TOOLS = [
    # ...existing tools...
    your_tool,
]
```

### 添加 AWEL 工作流

对于复杂的多步骤任务，可以使用 AWEL：

```python
from dbgpt.core.awel import DAG, MapOperator

with DAG("your_workflow") as dag:
    # 定义工作流节点
    pass
```

## 注意事项

1. **MongoDB 连接**：确保 MongoDB 服务正在运行
2. **LLM 服务**：确保 LMStudio 或其他 LLM 服务可用
3. **端口冲突**：默认使用 8000 端口，可通过 API_PORT 环境变量修改


