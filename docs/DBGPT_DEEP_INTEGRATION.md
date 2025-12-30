# DB-GPT 深度整合方案

## 1. 架构对比

### 原有架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              agent-service.ts                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │ callLLM  │  │ AiMap    │  │ toolRegistry     │  │   │
│  │  │          │  │ (MongoDB)│  │ (硬编码+MongoDB) │  │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 深度整合后架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST API / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (FastAPI)                      │
│              统一入口，路由到 DB-GPT Agent                    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DB-GPT Framework                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ToolAssistantAgent                       │   │
│  │  ┌──────────────┐  ┌────────────┐  ┌─────────────┐  │   │
│  │  │ @tool 工具   │  │ AWEL 工作流 │  │ RAG 知识库  │  │   │
│  │  │ (CRM/查询)   │  │ (多步任务)  │  │ (文档增强)  │  │   │
│  │  └──────────────┘  └────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    LLM Client                         │   │
│  │  LMStudio / OpenAI / DeepSeek / Qwen / 本地部署       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     MongoDB (原有数据)                        │
│  clients | quotations | projects | contracts | ...          │
└─────────────────────────────────────────────────────────────┘
```

## 2. 组件映射

| 原有组件 | DB-GPT 对应 | 迁移策略 |
|---------|------------|---------|
| `agent-service.ts` | `ToolAssistantAgent` | 完全替换 |
| `callLLM()` | DB-GPT LLM Client | 自动处理 |
| `AiMap` (MongoDB) | AWEL Workflow | 转换为 Python DAG |
| `toolRegistry` | `@tool` 装饰器 | 逐个迁移 |
| `AiToolkit` (MongoDB) | Python 工具函数 | 转换为代码 |

## 3. 目录结构

```
dhs_atlas_agent/
├── __init__.py
├── config.py                 # 配置（MongoDB、LLM）
│
├── models/                   # 数据模型层
│   ├── __init__.py
│   ├── base.py              # MongoDB 连接
│   ├── client.py            # 客户模型
│   ├── quotation.py         # 报价单模型
│   ├── project.py           # 项目模型
│   └── contract.py          # 合同模型
│
├── tools/                    # AI 工具层（替代 AiToolkit）
│   ├── __init__.py
│   ├── crm/                 # CRM 工具
│   │   ├── __init__.py
│   │   ├── client_tools.py  # 客户查询工具
│   │   ├── contact_tools.py # 联系人工具
│   │   └── project_tools.py # 项目工具
│   ├── finance/             # 财务工具
│   │   ├── __init__.py
│   │   ├── quotation_tools.py
│   │   └── contract_tools.py
│   ├── schema/              # 数据结构工具
│   │   └── schema_tools.py
│   └── database/            # 通用数据库工具
│       └── query_tools.py
│
├── workflows/                # AWEL 工作流（替代 AiMap）
│   ├── __init__.py
│   ├── query_client_quotation.py   # 查询客户报价单
│   ├── create_project.py           # 创建项目流程
│   └── generate_contract.py        # 生成合同流程
│
├── agents/                   # Agent 定义
│   ├── __init__.py
│   ├── crm_agent.py         # CRM 业务 Agent
│   ├── finance_agent.py     # 财务业务 Agent
│   └── main_agent.py        # 主 Agent（路由）
│
├── api/                      # API 层（对接前端）
│   ├── __init__.py
│   ├── server.py            # FastAPI 服务
│   ├── routes/
│   │   ├── chat.py          # 聊天接口
│   │   └── stream.py        # SSE 流式接口
│   └── middleware/
│       └── auth.py          # 认证中间件
│
└── main.py                   # 入口
```

## 4. 工具迁移示例

### 原有工具（TypeScript）

```typescript
// backend/src/ai/tools/crm/client-detail.ts
export const clientDetailTool: ToolDefinition = {
    id: 'crm.client_detail',
    name: '获取客户详情',
    description: '根据客户名称获取完整信息',
    paramsSchema: z.object({
        name: z.string().describe('客户名称'),
    }),
    async execute({ name }, context) {
        const client = await Client.findOne({ name });
        return { success: true, data: client };
    },
};
```

### 迁移后工具（Python）

```python
# dhs_atlas_agent/tools/crm/client_tools.py
from typing import Dict, Any, Optional
from typing_extensions import Annotated, Doc
from dbgpt.agent.resource import tool

from dhs_atlas_agent.models.client import Client

@tool
def get_client_detail(
    name: Annotated[str, Doc("客户名称")]
) -> Annotated[Optional[Dict[str, Any]], Doc("客户详情，包含地址、分类、评级等")]:
    """
    获取客户详情。
    当用户询问某个客户的具体信息时使用此工具。
    示例：用户问"中信出版社的详情"
    """
    client = Client.find_by_name(name)
    return client.to_dict() if client else None
```

## 5. AiMap → AWEL 工作流转换

### 原有 AiMap（MongoDB）

```json
{
  "mapId": "query_client_quotation",
  "name": "查询客户报价单",
  "steps": [
    {
      "order": 1,
      "name": "获取客户信息",
      "toolId": "crm.client_detail",
      "paramsTemplate": { "name": "{{clientName}}" },
      "outputKey": "clientInfo",
      "nextStepPrompt": "客户 {{clientInfo.name}} 的 quotationId 是 {{clientInfo.quotationId}}"
    },
    {
      "order": 2,
      "name": "获取报价单",
      "toolId": "db.query",
      "paramsTemplate": {
        "collection": "quotations",
        "query": { "_id": "{{clientInfo.quotationId}}" }
      },
      "outputKey": "quotationInfo"
    },
    {
      "order": 3,
      "name": "获取服务定价",
      "toolId": "db.query",
      "paramsTemplate": {
        "collection": "servicepricings",
        "query": { "_id": { "$in": "{{quotationInfo.selectedServices}}" } }
      },
      "outputKey": "services"
    }
  ]
}
```

### 迁移后 AWEL 工作流（Python）

```python
# dhs_atlas_agent/workflows/query_client_quotation.py
from typing import Dict, Any
from typing_extensions import Annotated, Doc
from dbgpt.agent.resource import tool
from dbgpt.core.awel import DAG, MapOperator, BranchOperator

from dhs_atlas_agent.models.client import Client
from dhs_atlas_agent.models.quotation import Quotation
from dhs_atlas_agent.models.base import get_collection

@tool
def query_client_quotation(
    client_name: Annotated[str, Doc("客户名称")]
) -> Annotated[Dict[str, Any], Doc("包含客户信息、报价单详情、服务定价的完整结果")]:
    """
    查询客户的完整报价单信息。
    这是一个组合工具，会自动执行以下步骤：
    1. 获取客户详情
    2. 获取关联的报价单
    3. 获取报价单中的服务定价详情
    
    当用户询问"中信出版社的报价单"时使用此工具。
    """
    result = {
        "client": None,
        "quotation": None,
        "services": [],
        "total_services": 0,
    }
    
    # Step 1: 获取客户信息
    client = Client.find_by_name(client_name)
    if not client:
        result["message"] = f"未找到客户: {client_name}"
        return result
    
    result["client"] = client.to_dict()
    
    # Step 2: 获取报价单
    if not client.quotation_id:
        result["message"] = "该客户没有关联的报价单"
        return result
    
    quotation = Quotation.find_by_id(client.quotation_id)
    if not quotation:
        result["message"] = "报价单不存在"
        return result
    
    result["quotation"] = quotation.to_dict()
    
    # Step 3: 获取服务定价
    if quotation.selected_services:
        service_collection = get_collection("servicepricings")
        services = list(service_collection.find({
            "_id": {"$in": quotation.selected_services}
        }))
        result["services"] = services
        result["total_services"] = len(services)
    
    return result
```

## 6. Agent 配置

### 主 Agent（路由到子 Agent）

```python
# dhs_atlas_agent/agents/main_agent.py
from dbgpt.agent import AgentContext, LLMConfig, UserProxyAgent
from dbgpt.agent.expand.tool_assistant_agent import ToolAssistantAgent
from dbgpt.model.proxy.llms.chatgpt import OpenAILLMClient

from dhs_atlas_agent.tools.crm import (
    get_client_detail,
    search_clients,
    get_client_contacts,
)
from dhs_atlas_agent.tools.finance import (
    query_client_quotation,
    get_quotation_detail,
)
from dhs_atlas_agent.tools.schema import get_collection_schema

class DHSAtlasAgent:
    """DHS-Atlas 业务 Agent"""
    
    def __init__(self, llm_base_url: str, model_name: str):
        self.llm_client = OpenAILLMClient(
            api_base=llm_base_url,
            api_key="lm-studio",
            model_alias=model_name,
        )
        
        self.context = AgentContext(
            conv_id="dhs_atlas_main",
            llm_config=LLMConfig(
                llm_client=self.llm_client,
                model=model_name,
            ),
        )
        
        # 注册所有工具
        self.tools = [
            # CRM 工具
            get_client_detail,
            search_clients,
            get_client_contacts,
            # 财务工具
            query_client_quotation,
            get_quotation_detail,
            # 结构工具
            get_collection_schema,
        ]
        
        # 创建 Agent
        self.agent = ToolAssistantAgent(
            name="LuBan",
            profile="""你是 DHS-Atlas 企业管理系统的 AI 助手「鲁班」。
            
你可以帮助用户：
- 查询和管理客户信息
- 查询报价单和定价方案
- 查询项目和合同信息
- 回答关于系统数据的问题

使用工具时：
- 优先使用专门的 CRM 工具（get_client_detail、search_clients）
- 复杂查询使用组合工具（query_client_quotation）
- 不确定时使用 get_collection_schema 了解数据结构

回答格式：
- 使用 Markdown 表格展示结构化数据
- 简洁明了，突出关键信息""",
            tools=self.tools,
            context=self.context,
        )
        
        self.user_proxy = UserProxyAgent(context=self.context)
    
    async def chat(self, message: str) -> str:
        """处理用户消息"""
        response = await self.user_proxy.initiate_chat(
            self.agent,
            message,
        )
        return response
```

## 7. API 层（对接前端）

```python
# dhs_atlas_agent/api/server.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import asyncio

from dhs_atlas_agent.agents.main_agent import DHSAtlasAgent
from dhs_atlas_agent.config import LLM_BASE_URL, LLM_MODEL

app = FastAPI(title="DHS-Atlas AI Agent API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # 前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局 Agent 实例
agent = DHSAtlasAgent(LLM_BASE_URL, LLM_MODEL)

class ChatRequest(BaseModel):
    message: str
    user_id: str
    session_id: Optional[str] = None
    context: Optional[dict] = None

class ChatResponse(BaseModel):
    content: str
    session_id: str
    tool_results: Optional[List[dict]] = None

@app.post("/api/agent/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """AI 对话接口"""
    try:
        response = await agent.chat(request.message)
        return ChatResponse(
            content=response,
            session_id=request.session_id or "default",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health():
    return {"status": "ok", "agent": "dhs-atlas-dbgpt"}
```

## 8. 迁移步骤

### Phase 1: 基础设施（1-2 天）
- [x] 创建 `dhs_atlas_agent` 目录结构
- [ ] 实现 MongoDB 连接层 (`models/base.py`)
- [ ] 迁移 Pydantic 数据模型

### Phase 2: 工具迁移（2-3 天）
- [ ] 迁移 CRM 工具（client、contact、project）
- [ ] 迁移财务工具（quotation、contract）
- [ ] 迁移 schema 工具
- [ ] 迁移通用 db.query 工具

### Phase 3: 工作流迁移（2-3 天）
- [ ] 转换 `query_client_quotation` AiMap
- [ ] 转换其他 AiMap
- [ ] 测试多步骤执行

### Phase 4: Agent 集成（1-2 天）
- [ ] 配置 ToolAssistantAgent
- [ ] 实现 API 层
- [ ] 对接前端

### Phase 5: 测试与优化（2-3 天）
- [ ] 端到端测试
- [ ] 性能优化
- [ ] 文档更新

## 9. 关键配置

```python
# dhs_atlas_agent/config.py
import os

# MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "donhauser")

# LLM
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://192.168.31.177:1234")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen/qwen3-coder-30b")
LLM_API_KEY = os.getenv("LLM_API_KEY", "lm-studio")

# API
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
```

## 10. 前端对接

前端只需要修改 API 调用地址：

```typescript
// frontend/src/api/agent.ts

// 原有
const API_BASE = 'http://localhost:3000/api/agent';

// 深度整合后
const API_BASE = process.env.NEXT_PUBLIC_AGENT_API || 'http://localhost:8000/api/agent';
```

其他前端代码基本不变，因为 API 接口保持兼容。

