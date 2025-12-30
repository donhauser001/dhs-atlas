"""
报价单相关工具 - 对应原有的 query_client_quotation AiMap

这是一个组合工具，实现了原有 AiMap 的多步骤逻辑
"""

from typing import Dict, Any, Optional, List
from typing_extensions import Annotated, Doc
from dbgpt.agent.resource import tool

from dhs_atlas_agent.models.client import ClientModel
from dhs_atlas_agent.models.quotation import QuotationModel
from dhs_atlas_agent.models.service_pricing import ServicePricingModel


@tool(description="获取报价单详情。当用户知道报价单ID或名称时直接查询。")
def get_quotation_detail(
    quotation_id: Annotated[Optional[str], Doc("报价单ID")] = None,
    name: Annotated[Optional[str], Doc("报价单名称")] = None,
) -> Annotated[Optional[Dict[str, Any]], Doc("报价单详情，包含名称、服务列表、有效期等")]:
    """
    获取报价单详情。
    
    当用户直接询问某个报价单时使用。需要提供 quotation_id 或 name 之一。
    
    示例用户问题：
    - "查看报价单 XXX 的详情"
    """
    quotation = None
    
    if quotation_id:
        quotation = QuotationModel.find_by_id(quotation_id)
    elif name:
        quotation = QuotationModel.find_by_name(name)
    
    if quotation:
        return quotation.to_dict()
    return None


@tool(description="查询客户的完整报价单信息。这是一个组合工具，会自动完成：获取客户→获取报价单→获取服务定价。当用户问'XX的报价单'时使用此工具。")
def query_client_quotation(
    client_name: Annotated[str, Doc("客户名称，如'中信出版社'")]
) -> Annotated[Dict[str, Any], Doc("包含客户信息、报价单详情、服务定价的完整结果")]:
    """
    查询客户的完整报价单信息。
    
    这是一个组合工具，实现了原有 AiMap（query_client_quotation）的功能。
    会自动执行以下步骤：
    1. 获取客户详情
    2. 获取关联的报价单
    3. 获取报价单中的服务定价详情
    
    当用户询问"中信出版社的报价单"或"查看XX客户的定价方案"时使用此工具。
    
    示例用户问题：
    - "帮我查查中信出版社的报价单"
    - "中信出版社的服务定价是多少"
    - "查看XX客户的定价方案"
    """
    result = {
        "client": None,
        "quotation": None,
        "services": [],
        "total_services": 0,
        "message": None,
    }
    
    # Step 1: 获取客户信息
    client = ClientModel.find_by_name(client_name)
    if not client:
        result["message"] = f"未找到客户: {client_name}"
        return result
    
    result["client"] = client.to_dict()
    
    # Step 2: 获取报价单
    if not client.quotation_id:
        result["message"] = "该客户没有关联的报价单"
        return result
    
    quotation = QuotationModel.find_by_id(client.quotation_id)
    if not quotation:
        result["message"] = f"报价单不存在 (ID: {client.quotation_id})"
        return result
    
    result["quotation"] = quotation.to_dict()
    
    # Step 3: 获取服务定价
    if quotation.selected_services:
        services = ServicePricingModel.find_by_ids(quotation.selected_services)
        result["services"] = [s.to_dict() for s in services]
        result["total_services"] = len(services)
    
    return result


@tool(description="获取服务定价列表。当用户询问有哪些服务或服务价格时使用。")
def get_service_pricing(
    category: Annotated[Optional[str], Doc("服务分类，如'校对'、'翻译'")] = None,
    service_ids: Annotated[Optional[List[str]], Doc("服务ID列表")] = None,
) -> Annotated[List[Dict[str, Any]], Doc("服务定价列表")]:
    """
    获取服务定价列表。
    
    示例用户问题：
    - "有哪些服务定价"
    - "翻译类服务的价格是多少"
    """
    if service_ids:
        services = ServicePricingModel.find_by_ids(service_ids)
    elif category:
        services = ServicePricingModel.list_by_category(category)
    else:
        services = ServicePricingModel.list_all()
    
    return [s.to_dict() for s in services]

