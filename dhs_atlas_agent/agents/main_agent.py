"""
DHS-Atlas 主 Agent

直接使用 httpx 调用 OpenAI 兼容 API
"""

import asyncio
import json
import re
import httpx
from typing import Optional, Dict, Any, List, AsyncIterator
from dataclasses import dataclass

from dhs_atlas_agent.config import LLM_BASE_URL, LLM_MODEL, LLM_API_KEY
from dhs_atlas_agent.tools import ALL_TOOLS


# 构建工具描述
def _build_tools_description() -> str:
    """构建工具描述文本"""
    lines = []
    for tool_func in ALL_TOOLS:
        name = tool_func.__name__
        desc = getattr(tool_func, '_tool_description', '') or tool_func.__doc__ or ''
        # 只取第一行作为简短描述
        short_desc = desc.split('\n')[0].strip()
        lines.append(f"- **{name}**: {short_desc}")
    return '\n'.join(lines)


# Agent 系统提示词
SYSTEM_PROMPT = f"""你是 DHS-Atlas 企业管理系统的 AI 助手「鲁班」。

## 可用工具

{_build_tools_description()}

## 工具调用格式

当需要调用工具时，使用以下 JSON 格式：
```tool_call
{{"tool": "工具名称", "params": {{"参数名": "参数值"}}}}
```

## 工具使用原则

1. 查询客户用 `get_client_detail` 或 `search_clients`
2. 查询客户报价单用 `query_client_quotation`（组合工具，自动完成多步查询）
3. 不确定数据结构时用 `get_collection_schema`

## 回答原则

- 使用中文回答
- 使用 Markdown 表格展示结构化数据
- 简洁明了，突出关键信息
- 不要假设数据，所有信息都从工具获取"""


@dataclass
class ChatMessage:
    """聊天消息"""
    role: str
    content: str


@dataclass 
class ChatResponse:
    """聊天响应"""
    content: str
    session_id: str
    tool_results: Optional[List[Dict]] = None
    task_list: Optional[Dict] = None


class DHSAtlasAgent:
    """DHS-Atlas AI Agent - 简化版实现"""
    
    def __init__(
        self,
        llm_base_url: str = None,
        model_name: str = None,
        api_key: str = None,
    ):
        self.llm_base_url = (llm_base_url or LLM_BASE_URL).rstrip('/')
        self.model_name = model_name or LLM_MODEL
        self.api_key = api_key or LLM_API_KEY
        
        # 工具映射
        self._tools = {func.__name__: func for func in ALL_TOOLS}
        
        # 会话存储
        self._sessions: Dict[str, List[ChatMessage]] = {}
        
        print(f"[DHSAtlasAgent] 已初始化")
        print(f"  - LLM: {self.llm_base_url}")
        print(f"  - Model: {self.model_name}")
        print(f"  - Tools: {len(self._tools)}")
    
    def _parse_tool_calls(self, response: str) -> List[Dict]:
        """解析工具调用"""
        pattern = r'```tool_call\s*\n?(.*?)\n?```'
        matches = re.findall(pattern, response, re.DOTALL)
        
        calls = []
        for match in matches:
            try:
                call = json.loads(match.strip())
                if 'tool' in call:
                    calls.append(call)
            except json.JSONDecodeError:
                continue
        
        return calls
    
    def _execute_tool(self, tool_name: str, params: Dict) -> Dict:
        """执行工具"""
        if tool_name not in self._tools:
            return {"error": f"工具不存在: {tool_name}"}
        
        try:
            result = self._tools[tool_name](**params)
            return {"success": True, "data": result}
        except Exception as e:
            return {"error": str(e)}
    
    async def _call_llm(self, messages: List[Dict]) -> str:
        """调用 LLM (OpenAI 兼容 API)"""
        url = f"{self.llm_base_url}/v1/chat/completions"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                },
                json={
                    "model": self.model_name,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 4096,
                },
            )
            
            if response.status_code != 200:
                raise Exception(f"LLM API 错误: {response.status_code} - {response.text}")
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    async def chat(
        self,
        message: str,
        session_id: str = "default",
        user_id: str = None,
        context: Dict[str, Any] = None,
    ) -> ChatResponse:
        """处理用户消息"""
        print(f"[DHSAtlasAgent] 收到消息: {message[:50]}...")
        
        # 构建消息 (OpenAI 格式)
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message},
        ]
        
        tool_results = []
        max_rounds = 5
        
        for round_num in range(max_rounds):
            # 调用 LLM
            response = await self._call_llm(messages)
            print(f"[DHSAtlasAgent] 第 {round_num + 1} 轮响应: {response[:200]}...")
            
            # 解析工具调用
            tool_calls = self._parse_tool_calls(response)
            
            if not tool_calls:
                # 没有工具调用，返回结果
                return ChatResponse(
                    content=response,
                    session_id=session_id,
                    tool_results=tool_results if tool_results else None,
                )
            
            # 执行工具
            tool_results_text = []
            for call in tool_calls:
                tool_name = call.get('tool')
                params = call.get('params', {})
                
                print(f"[DHSAtlasAgent] 执行工具: {tool_name}({params})")
                result = self._execute_tool(tool_name, params)
                tool_results.append({"tool": tool_name, "result": result})
                
                # 格式化结果
                if result.get("error"):
                    tool_results_text.append(f"工具 {tool_name} 错误: {result['error']}")
                else:
                    data = result.get("data")
                    # 截断过长的数据
                    data_str = json.dumps(data, ensure_ascii=False, default=str)
                    if len(data_str) > 2000:
                        data_str = data_str[:2000] + "...(已截断)"
                    tool_results_text.append(f"工具 {tool_name} 结果:\n{data_str}")
            
            # 添加工具结果到消息
            messages.append({"role": "assistant", "content": response})
            messages.append({
                "role": "user",
                "content": f"工具执行结果:\n\n" + "\n\n".join(tool_results_text) + "\n\n请根据结果用中文回答用户问题，使用 Markdown 表格展示数据。"
            })
        
        # 达到最大轮数
        return ChatResponse(
            content="处理超时，请简化问题后重试。",
            session_id=session_id,
            tool_results=tool_results,
        )
    
    async def chat_stream(
        self,
        message: str,
        session_id: str = "default",
        user_id: str = None,
        context: Dict[str, Any] = None,
    ) -> AsyncIterator[Dict[str, Any]]:
        """流式处理"""
        yield {"type": "start", "data": {"session_id": session_id}}
        
        try:
            response = await self.chat(message, session_id, user_id, context)
            yield {"type": "content", "data": {"content": response.content}}
            yield {"type": "done", "data": {"session_id": session_id}}
        except Exception as e:
            yield {"type": "error", "data": {"error": str(e)}}
    
    def clear_session(self, session_id: str):
        """清除会话"""
        if session_id in self._sessions:
            del self._sessions[session_id]
    
    async def health_check(self) -> Dict[str, Any]:
        """健康检查"""
        return {
            "status": "ok",
            "llm_url": self.llm_base_url,
            "model": self.model_name,
            "tools_count": len(self._tools),
        }


# 全局实例
_agent_instance: Optional[DHSAtlasAgent] = None


def get_agent() -> DHSAtlasAgent:
    """获取全局 Agent 实例"""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = DHSAtlasAgent()
    return _agent_instance

