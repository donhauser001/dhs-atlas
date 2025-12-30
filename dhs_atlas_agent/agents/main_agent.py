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


def _load_ai_config() -> dict:
    """从数据库加载 AI 配置"""
    try:
        from dhs_atlas_agent.models import get_db
        db = get_db()
        if db is None:
            return {}
        config = db['ai_configs'].find_one()
        return config or {}
    except Exception as e:
        print(f"[Agent] 加载 AI 配置失败: {e}")
        return {}


def _build_system_prompt(base_prompt: str = None) -> str:
    """构建完整的系统提示词
    
    Args:
        base_prompt: 基础提示词（来自数据库或默认）
    """
    # 默认基础提示词
    if not base_prompt:
        base_prompt = "你是 DHS-Atlas 企业管理系统的 AI 助手「鲁班」，专注于帮助用户处理客户管理、报价、项目等业务问题。"
    
    # 工具相关的提示词（必须有）
    tools_prompt = f"""

## 核心规则

**你必须通过工具获取所有数据，绝对不能凭空回答或说"无法获取"。**

## 可用工具

{_build_tools_description()}

## 工具调用格式（必须严格遵守）

当需要获取数据时，**必须使用工具调用格式**：
```tool_call
{{"tool": "工具名称", "params": {{"参数名": "参数值"}}}}
```

## 工具选择指南

| 用户问题 | 应调用工具 |
|---------|-----------|
| "XX的报价单" | query_client_quotation |
| "XX客户信息" | get_client_detail |
| "有哪些客户" | search_clients |
| "有多少客户" | count_documents |

## 示例

用户: "查询中信出版社的报价单"
助手应回复:
```tool_call
{{"tool": "query_client_quotation", "params": {{"client_name": "中信出版社"}}}}
```

用户: "查看北京出版社的信息"
助手应回复:
```tool_call
{{"tool": "get_client_detail", "params": {{"name": "北京出版社"}}}}
```

## 回答原则

- 使用中文回答
- 使用 Markdown 表格展示结构化数据
- **必须先调用工具获取数据，再基于工具返回的数据回答**
- **禁止说"系统限制"、"无法获取"等，必须尝试调用工具**"""

    return base_prompt + tools_prompt


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
        # 从数据库加载配置
        ai_config = _load_ai_config()
        
        # LLM 配置（优先使用参数，其次数据库，最后环境变量）
        self.llm_base_url = (
            llm_base_url or 
            ai_config.get('llmBaseURL', '').replace('/v1', '') or 
            LLM_BASE_URL
        ).rstrip('/')
        self.model_name = model_name or ai_config.get('llmModel') or LLM_MODEL
        self.api_key = api_key or ai_config.get('llmApiKey') or LLM_API_KEY
        self.temperature = ai_config.get('temperature', 0.7)
        self.max_tokens = ai_config.get('maxTokens', 4096)
        
        # 系统提示词（从数据库加载）
        base_prompt = ai_config.get('systemPrompt')
        self.system_prompt = _build_system_prompt(base_prompt)
        
        # 工具映射
        self._tools = {func.__name__: func for func in ALL_TOOLS}
        
        # 会话存储
        self._sessions: Dict[str, List[ChatMessage]] = {}
        
        print(f"[DHSAtlasAgent] 已初始化")
        print(f"  - LLM: {self.llm_base_url}")
        print(f"  - Model: {self.model_name}")
        print(f"  - Tools: {len(self._tools)}")
        print(f"  - 提示词来源: {'数据库' if base_prompt else '默认'}")
    
    def _filter_think_tags(self, content: str) -> str:
        """过滤 LLM 思考过程标签
        
        qwen3 等模型会输出 <think>...</think> 标签，需要过滤掉
        """
        # 移除 <think>...</think> 标签及其内容
        content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
        # 清理多余的空行
        content = re.sub(r'\n{3,}', '\n\n', content)
        return content.strip()
    
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
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens,
                    # 禁用 qwen3 思考模式，加快响应速度
                    "chat_template_kwargs": {"enable_thinking": False},
                },
            )
            
            if response.status_code != 200:
                raise Exception(f"LLM API 错误: {response.status_code} - {response.text}")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            # 过滤 LLM 思考过程标签 (qwen3 等模型会输出 <think>...</think>)
            content = self._filter_think_tags(content)
            
            return content
    
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
            {"role": "system", "content": self.system_prompt},
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

