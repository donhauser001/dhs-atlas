"""
DHS-Atlas 主 Agent

使用 DB-GPT ToolAssistantAgent 实现，替代原有的 agent-service.ts
"""

import asyncio
from typing import Optional, Dict, Any, List, AsyncIterator
from dataclasses import dataclass, field

from dbgpt.agent import AgentContext, LLMConfig
from dbgpt.agent.expand.tool_assistant_agent import ToolAssistantAgent
from dbgpt.agent.core.memory import AgentMemory
from dbgpt.agent.core.memory.gpts import GptsMemory
from dbgpt.model.proxy import OpenAILLMClient

from dhs_atlas_agent.config import LLM_BASE_URL, LLM_MODEL, LLM_API_KEY
from dhs_atlas_agent.tools import ALL_TOOLS


# Agent 系统提示词
AGENT_PROFILE = """你是 DHS-Atlas 企业管理系统的 AI 助手「鲁班」。

## 你的能力

你可以帮助用户：
- 查询和管理客户信息
- 查询报价单和定价方案
- 查询项目和合同信息
- 回答关于系统数据的问题

## 工具使用原则

1. **优先使用专门工具**：
   - 查询客户用 `get_client_detail` 或 `search_clients`
   - 查询客户报价单用 `query_client_quotation`（这是组合工具，会自动完成多步查询）
   - 不确定时用 `get_collection_schema` 了解数据结构

2. **避免重复查询**：
   - 如果已经有了客户信息，不要重复查询
   - `query_client_quotation` 会返回完整信息，不需要再单独查询

3. **数据展示**：
   - 使用 Markdown 表格展示结构化数据
   - 简洁明了，突出关键信息
   - 中文回答

## 重要提醒

- 当用户问"XX的报价单"时，直接使用 `query_client_quotation` 工具
- 不要假设数据，所有信息都从工具获取
- 如果查询失败，告知用户原因"""


@dataclass
class ChatMessage:
    """聊天消息"""
    role: str  # user | assistant | system
    content: str
    tool_calls: Optional[List[Dict]] = None
    timestamp: Optional[str] = None


@dataclass
class ChatResponse:
    """聊天响应"""
    content: str
    session_id: str
    tool_results: Optional[List[Dict]] = None
    task_list: Optional[Dict] = None


class DHSAtlasAgent:
    """
    DHS-Atlas AI Agent
    
    完全基于 DB-GPT 框架实现，替代原有的 TypeScript agent-service
    """
    
    def __init__(
        self,
        llm_base_url: str = None,
        model_name: str = None,
        api_key: str = None,
    ):
        """
        初始化 Agent
        
        Args:
            llm_base_url: LLM API 地址，默认使用配置
            model_name: 模型名称，默认使用配置
            api_key: API Key，默认使用配置
        """
        self.llm_base_url = llm_base_url or LLM_BASE_URL
        self.model_name = model_name or LLM_MODEL
        self.api_key = api_key or LLM_API_KEY
        
        # 初始化 LLM 客户端
        self.llm_client = OpenAILLMClient(
            api_base=self.llm_base_url,
            api_key=self.api_key,
            model_alias=self.model_name,
        )
        
        # 会话存储
        self._sessions: Dict[str, List[ChatMessage]] = {}
        
        print(f"[DHSAtlasAgent] 已初始化")
        print(f"  - LLM: {self.llm_base_url}")
        print(f"  - Model: {self.model_name}")
        print(f"  - Tools: {len(ALL_TOOLS)}")
    
    def _get_agent_context(self, session_id: str) -> AgentContext:
        """创建 Agent 上下文"""
        return AgentContext(
            conv_id=session_id,
            llm_config=LLMConfig(
                llm_client=self.llm_client,
            ),
        )
    
    async def _create_agent(self, session_id: str) -> ToolAssistantAgent:
        """创建工具助手 Agent"""
        context = self._get_agent_context(session_id)
        
        agent = await ToolAssistantAgent.build(
            name="LuBan",
            profile=AGENT_PROFILE,
            tools=ALL_TOOLS,
            context=context,
        )
        
        return agent
    
    async def chat(
        self,
        message: str,
        session_id: str = "default",
        user_id: str = None,
        context: Dict[str, Any] = None,
    ) -> ChatResponse:
        """
        处理用户消息
        
        Args:
            message: 用户消息
            session_id: 会话 ID
            user_id: 用户 ID
            context: 上下文信息（module、pathname 等）
            
        Returns:
            ChatResponse: 响应结果
        """
        print(f"[DHSAtlasAgent] 收到消息: {message[:50]}...")
        
        # 获取或创建会话历史
        if session_id not in self._sessions:
            self._sessions[session_id] = []
        
        history = self._sessions[session_id]
        
        # 记录用户消息
        history.append(ChatMessage(role="user", content=message))
        
        try:
            # 创建 Agent
            agent = await self._create_agent(session_id)
            
            # 调用 Agent
            # 注意：DB-GPT 的 Agent 会自动处理工具调用
            response = await agent.generate_reply(
                message=message,
                sender=None,  # 无发送者（用户直接输入）
            )
            
            # 提取响应内容
            content = response if isinstance(response, str) else str(response)
            
            # 记录 AI 响应
            history.append(ChatMessage(role="assistant", content=content))
            
            # 限制历史长度
            if len(history) > 20:
                self._sessions[session_id] = history[-20:]
            
            return ChatResponse(
                content=content,
                session_id=session_id,
            )
            
        except Exception as e:
            print(f"[DHSAtlasAgent] 错误: {e}")
            import traceback
            traceback.print_exc()
            
            error_msg = f"处理请求时发生错误: {str(e)}"
            history.append(ChatMessage(role="assistant", content=error_msg))
            
            return ChatResponse(
                content=error_msg,
                session_id=session_id,
            )
    
    async def chat_stream(
        self,
        message: str,
        session_id: str = "default",
        user_id: str = None,
        context: Dict[str, Any] = None,
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        流式处理用户消息
        
        Args:
            message: 用户消息
            session_id: 会话 ID
            user_id: 用户 ID
            context: 上下文信息
            
        Yields:
            事件字典，包含 type 和 data
        """
        print(f"[DHSAtlasAgent] 流式请求: {message[:50]}...")
        
        # 发送开始事件
        yield {"type": "start", "data": {"session_id": session_id}}
        
        try:
            # 创建 Agent
            agent = await self._create_agent(session_id)
            
            # TODO: 实现真正的流式响应
            # 目前 DB-GPT 的 ToolAssistantAgent 不直接支持流式
            # 需要自定义实现或等待框架支持
            
            # 暂时使用普通响应
            response = await agent.generate_reply(
                message=message,
                sender=None,
            )
            
            content = response if isinstance(response, str) else str(response)
            
            # 发送内容事件
            yield {"type": "content", "data": {"content": content}}
            
            # 发送完成事件
            yield {"type": "done", "data": {"session_id": session_id}}
            
        except Exception as e:
            print(f"[DHSAtlasAgent] 流式错误: {e}")
            yield {"type": "error", "data": {"error": str(e)}}
    
    def clear_session(self, session_id: str):
        """清除会话历史"""
        if session_id in self._sessions:
            del self._sessions[session_id]
            print(f"[DHSAtlasAgent] 已清除会话: {session_id}")
    
    async def health_check(self) -> Dict[str, Any]:
        """健康检查"""
        try:
            # 尝试简单的 LLM 调用
            # （这里可以添加更详细的检查）
            return {
                "status": "ok",
                "llm_url": self.llm_base_url,
                "model": self.model_name,
                "tools_count": len(ALL_TOOLS),
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
            }


# 全局 Agent 实例
_agent_instance: Optional[DHSAtlasAgent] = None


def get_agent() -> DHSAtlasAgent:
    """获取全局 Agent 实例"""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = DHSAtlasAgent()
    return _agent_instance

