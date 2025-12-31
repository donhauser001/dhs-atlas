"""
FastAPI 服务器

提供 REST API 和 SSE 流式接口，对接前端
"""

import asyncio
import json
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from dhs_atlas_agent.config import API_HOST, API_PORT, FRONTEND_URL
from dhs_atlas_agent.models import connect_db, close_db
from dhs_atlas_agent.agents import DHSAtlasAgent


# 全局 Agent 实例
agent: Optional[DHSAtlasAgent] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    global agent
    
    # 启动时
    print("[API] 正在初始化...")
    
    # 连接数据库
    connect_db()
    
    # 创建 Agent
    agent = DHSAtlasAgent()
    
    print("[API] 初始化完成")
    
    yield
    
    # 关闭时
    print("[API] 正在关闭...")
    close_db()


def create_app() -> FastAPI:
    """创建 FastAPI 应用"""
    app = FastAPI(
        title="DHS-Atlas AI Agent API",
        description="基于 DB-GPT 的深度整合 AI Agent 服务",
        version="1.0.0",
        lifespan=lifespan,
    )
    
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[FRONTEND_URL, "http://localhost:3001", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    return app


app = create_app()


# ========== 请求/响应模型 ==========

class ChatRequest(BaseModel):
    """聊天请求"""
    message: str
    userId: Optional[str] = None
    sessionId: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    history: Optional[List[Dict[str, Any]]] = None


class ChatResponse(BaseModel):
    """聊天响应"""
    content: str
    sessionId: str
    toolResults: Optional[List[Dict[str, Any]]] = None
    taskList: Optional[Dict[str, Any]] = None
    uiSpec: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str
    agent: str
    llm_url: Optional[str] = None
    model: Optional[str] = None
    tools_count: Optional[int] = None


# ========== API 路由 ==========

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """健康检查"""
    if agent is None:
        return HealthResponse(status="initializing", agent="dhs-atlas-dbgpt")
    
    health = await agent.health_check()
    return HealthResponse(
        status=health.get("status", "ok"),
        agent="dhs-atlas-dbgpt",
        llm_url=health.get("llm_url"),
        model=health.get("model"),
        tools_count=health.get("tools_count"),
    )


@app.post("/api/agent/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI 对话接口（非流式）
    
    与原有接口保持兼容
    """
    if agent is None:
        raise HTTPException(status_code=503, detail="Agent 未初始化")
    
    try:
        response = await agent.chat(
            message=request.message,
            session_id=request.sessionId or "default",
            user_id=request.userId,
            context=request.context,
        )
        
        return ChatResponse(
            content=response.content,
            sessionId=response.session_id,
            toolResults=response.tool_results,
            taskList=response.task_list,
        )
    
    except Exception as e:
        print(f"[API] 聊天错误: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/agent/stream")
async def chat_stream(request: ChatRequest):
    """
    AI 对话接口（SSE 流式）
    
    返回 Server-Sent Events 流
    """
    if agent is None:
        raise HTTPException(status_code=503, detail="Agent 未初始化")
    
    async def event_generator():
        """生成 SSE 事件"""
        try:
            async for event in agent.chat_stream(
                message=request.message,
                session_id=request.sessionId or "default",
                user_id=request.userId,
                context=request.context,
            ):
                event_type = event.get("type", "message")
                event_data = json.dumps(event.get("data", {}), ensure_ascii=False)
                
                yield f"event: {event_type}\ndata: {event_data}\n\n"
                
                # 确保立即刷新
                await asyncio.sleep(0)
        
        except Exception as e:
            print(f"[API] 流式错误: {e}")
            error_data = json.dumps({"error": str(e)}, ensure_ascii=False)
            yield f"event: error\ndata: {error_data}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Encoding": "identity",
            "X-Accel-Buffering": "no",
        },
    )


@app.delete("/api/agent/session/{session_id}")
async def clear_session(session_id: str):
    """清除会话"""
    if agent is None:
        raise HTTPException(status_code=503, detail="Agent 未初始化")
    
    agent.clear_session(session_id)
    return {"status": "ok", "message": f"会话 {session_id} 已清除"}


# ========== 业务 API（可选，用于直接调用） ==========

@app.get("/api/clients")
async def list_clients(
    keyword: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 20,
):
    """获取客户列表"""
    from dhs_atlas_agent.models import ClientModel
    
    clients = ClientModel.search(keyword=keyword, category=category, limit=limit)
    return {"data": [c.to_dict() for c in clients], "total": len(clients)}


@app.get("/api/clients/{name}")
async def get_client(name: str):
    """获取客户详情"""
    from dhs_atlas_agent.models import ClientModel
    
    client = ClientModel.find_by_name(name)
    if not client:
        raise HTTPException(status_code=404, detail=f"客户不存在: {name}")
    
    return {"data": client.to_dict()}


@app.get("/api/quotations/{client_name}")
async def get_client_quotation(client_name: str):
    """获取客户报价单"""
    from dhs_atlas_agent.tools.finance import query_client_quotation
    
    result = query_client_quotation(client_name)
    
    if result.get("message"):
        raise HTTPException(status_code=404, detail=result["message"])
    
    return {"data": result}


# ========== 入口 ==========

def main():
    """启动服务器"""
    import uvicorn
    
    print(f"[API] 启动服务器: http://{API_HOST}:{API_PORT}")
    uvicorn.run(
        "dhs_atlas_agent.api.server:app",
        host=API_HOST,
        port=API_PORT,
        reload=True,
    )


if __name__ == "__main__":
    main()


