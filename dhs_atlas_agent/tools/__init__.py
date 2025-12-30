"""
AI 工具层

提供给 DB-GPT Agent 使用的工具函数
"""

from .crm import (
    get_client_detail,
    search_clients,
    get_client_categories,
)
from .finance import (
    get_quotation_detail,
    query_client_quotation,
    get_service_pricing,
)
from .schema import (
    get_collection_schema,
    list_collections,
)
from .database import (
    query_collection,
    count_documents,
)

# 导出所有工具（用于 Agent 注册）
ALL_TOOLS = [
    # CRM 工具
    get_client_detail,
    search_clients,
    get_client_categories,
    # 财务工具
    get_quotation_detail,
    query_client_quotation,
    get_service_pricing,
    # Schema 工具
    get_collection_schema,
    list_collections,
    # 数据库工具
    query_collection,
    count_documents,
]

__all__ = [
    "ALL_TOOLS",
    # CRM
    "get_client_detail",
    "search_clients",
    "get_client_categories",
    # Finance
    "get_quotation_detail",
    "query_client_quotation",
    "get_service_pricing",
    # Schema
    "get_collection_schema",
    "list_collections",
    # Database
    "query_collection",
    "count_documents",
]

