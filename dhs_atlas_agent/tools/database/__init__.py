"""通用数据库工具模块"""

from .query_tools import (
    query_collection,
    count_documents,
)

__all__ = [
    "query_collection",
    "count_documents",
]


