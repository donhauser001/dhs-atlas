"""
客户相关工具 - 对应原有的 crm.client_detail, crm.client_list 等

这些工具使用 DB-GPT 的 @tool 装饰器定义
"""

from typing import Dict, Any, Optional, List
from typing_extensions import Annotated, Doc
from dbgpt.agent.resource import tool

from dhs_atlas_agent.models.client import ClientModel


@tool(description="获取客户详情。当用户询问某个客户的具体信息时使用此工具。")
def get_client_detail(
    name: Annotated[str, Doc("客户名称，如'中信出版社'")]
) -> Annotated[Optional[Dict[str, Any]], Doc("客户详情，包含地址、分类、评级、关联报价单ID等")]:
    """
    获取客户详情。
    
    当用户询问"中信出版社的详情"或"查看XX客户信息"时使用此工具。
    返回客户的完整信息，包括：名称、地址、发票类型、分类、评级、关联报价单ID等。
    
    示例用户问题：
    - "查看中信出版社的信息"
    - "中信出版社的详情是什么"
    - "告诉我XX公司的客户资料"
    """
    client = ClientModel.find_by_name(name)
    if client:
        return client.to_dict()
    return None


@tool(description="搜索客户列表。当用户想要查找或列出多个客户时使用此工具。")
def search_clients(
    keyword: Annotated[Optional[str], Doc("搜索关键词，可搜索名称或地址")] = None,
    category: Annotated[Optional[str], Doc("客户分类，如'北京出版社'")] = None,
    limit: Annotated[int, Doc("返回数量限制，默认20")] = 20,
) -> Annotated[List[Dict[str, Any]], Doc("客户列表，每个元素包含客户基本信息")]:
    """
    搜索客户列表。
    
    当用户想要：
    - 列出所有客户
    - 按关键词搜索客户
    - 查看某个分类下的客户
    
    示例用户问题：
    - "列出所有客户"
    - "搜索包含'出版'的客户"
    - "北京出版社分类下有哪些客户"
    """
    clients = ClientModel.search(
        keyword=keyword,
        category=category,
        limit=limit,
    )
    return [c.to_dict() for c in clients]


@tool(description="获取所有客户分类。当用户询问有哪些客户分类时使用此工具。")
def get_client_categories() -> Annotated[List[str], Doc("客户分类列表")]:
    """
    获取所有客户分类。
    
    示例用户问题：
    - "有哪些客户分类"
    - "客户分类有哪些"
    """
    return ClientModel.get_categories()

