# DB-GPT 桥接层

## 概述

这个模块允许你将 DB-GPT 作为 AI 服务后端，替换原有的 LLM 调用。

## 优势

- 🚀 更成熟的 Agent 系统
- 🔧 更好的工具调用能力  
- 📊 支持 AWEL 工作流
- 📚 内置 RAG 能力
- 🔄 渐进式迁移，不影响现有业务

## 启用方式

### 方式 1：仅替换 LLM 后端（推荐）

在 `.env` 或环境变量中设置：

```env
# 启用 DB-GPT 作为 LLM 后端
USE_DBGPT=true

# DB-GPT 服务地址（默认 http://localhost:5670）
DBGPT_BASE_URL=http://localhost:5670

# 使用的模型（默认 qwen3-coder-30b）
DBGPT_MODEL=qwen3-coder-30b
```

这种模式下：
- ✅ 保留原有的工具系统（AiToolkit）
- ✅ 保留原有的地图系统（AiMap）
- ✅ 保留原有的前端界面
- ✅ 仅将 LLM 调用切换到 DB-GPT

### 方式 2：使用 DB-GPT Agent 系统（高级）

```env
USE_DBGPT=true
USE_DBGPT_AGENT=true
DBGPT_BASE_URL=http://localhost:5670
DBGPT_MODEL=qwen3-coder-30b
```

这种模式下：
- ⚡ 使用 DB-GPT 的 Agent 框架
- ⚡ 自动工具选择和调用
- ⚠️ 需要将工具定义同步到 DB-GPT

## 前提条件

确保 DB-GPT 服务正在运行：

```bash
# 在 dbgpt-test 分支启动 DB-GPT
cd /Users/aiden/Documents/app/dhs-atlas
git checkout dbgpt-test
source .venv/bin/activate
dbgpt start webserver --config configs/dbgpt-proxy-lmstudio.toml
```

## 文件说明

```
dbgpt/
├── index.ts          # 模块入口
├── types.ts          # 类型定义
├── config.ts         # 配置管理
├── client.ts         # DB-GPT HTTP 客户端
├── llm-bridge.ts     # LLM 调用桥接（替换原 llm.ts）
├── agent-bridge.ts   # Agent 服务桥接（高级模式）
└── README.md         # 本文档
```

## 架构图

```
原项目架构:
┌─────────────────────────────────────────────┐
│                 Frontend                     │
│              (Next.js 保持不变)               │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│                 Backend                      │
│            (Express.js 保持不变)              │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │           Agent Service              │    │
│  │                                      │    │
│  │  ┌─────────┐    ┌─────────────────┐ │    │
│  │  │ AiMap   │    │ AiToolkit       │ │    │
│  │  │ (保持)  │    │ (保持)          │ │    │
│  │  └─────────┘    └─────────────────┘ │    │
│  │                                      │    │
│  │  ┌─────────────────────────────────┐│    │
│  │  │         LLM 调用层              ││    │
│  │  │  ┌──────────┐ ┌──────────────┐ ││    │
│  │  │  │ 原有模式 │ │ DB-GPT 模式  │ ││    │
│  │  │  │(AiModel) │ │(USE_DBGPT=1) │ ││    │
│  │  │  └──────────┘ └──────┬───────┘ ││    │
│  │  └────────────────────────────────┘│    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
                                │
                                ▼ (当 USE_DBGPT=true)
┌─────────────────────────────────────────────┐
│              DB-GPT Service                  │
│           (http://localhost:5670)            │
│                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │  LLM    │  │  AWEL   │  │  RAG    │     │
│  │ qwen3   │  │ 工作流  │  │ 知识库  │     │
│  └─────────┘  └─────────┘  └─────────┘     │
└─────────────────────────────────────────────┘
```

## 测试

```bash
# 启动后端（启用 DB-GPT）
cd /Users/aiden/Documents/app/dhs-atlas/backend
USE_DBGPT=true npm run dev

# 测试 API
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}'
```


