"""
数据结构工具 - 对应原有的 schema.search

用于让 AI 了解数据库结构
"""

from typing import Dict, Any, List, Optional
from typing_extensions import Annotated, Doc
from dbgpt.agent.resource import tool

from dhs_atlas_agent.models.base import get_db, get_collection


@tool(description="获取集合的数据结构。当AI不确定某个集合有哪些字段时使用此工具。")
def get_collection_schema(
    collection_name: Annotated[str, Doc("集合名称，如'clients'、'quotations'")]
) -> Annotated[Dict[str, Any], Doc("集合的字段结构和示例数据")]:
    """
    获取集合的数据结构。
    
    通过采样文档推断集合的字段结构，帮助 AI 了解数据库结构。
    
    示例用户问题（AI 内部使用）：
    - "clients 集合有哪些字段"
    - "报价单的数据结构是什么"
    """
    collection = get_collection(collection_name)
    
    # 采样一个文档
    sample = collection.find_one()
    
    if not sample:
        return {
            "collection": collection_name,
            "fields": [],
            "sample": None,
            "count": 0,
        }
    
    # 推断字段结构
    fields = []
    for key, value in sample.items():
        field_info = {
            "name": key,
            "type": type(value).__name__,
        }
        
        # 添加示例值（截断长文本）
        if isinstance(value, str) and len(value) > 100:
            field_info["example"] = value[:100] + "..."
        elif isinstance(value, list):
            field_info["example"] = f"[array with {len(value)} items]"
        elif isinstance(value, dict):
            field_info["example"] = f"{{object with {len(value)} keys}}"
        else:
            field_info["example"] = str(value)
        
        fields.append(field_info)
    
    return {
        "collection": collection_name,
        "fields": fields,
        "count": collection.count_documents({}),
    }


@tool(description="列出数据库中所有集合。当AI需要了解数据库有哪些数据表时使用。")
def list_collections() -> Annotated[List[Dict[str, Any]], Doc("集合列表，包含名称和文档数量")]:
    """
    列出数据库中所有集合。
    
    帮助 AI 了解系统有哪些数据表。
    
    示例用户问题：
    - "系统有哪些数据表"
    - "数据库里有什么"
    """
    db = get_db()
    collection_names = db.list_collection_names()
    
    result = []
    for name in collection_names:
        # 跳过系统集合
        if name.startswith("system."):
            continue
        
        count = db[name].count_documents({})
        result.append({
            "name": name,
            "count": count,
        })
    
    # 按文档数量排序
    result.sort(key=lambda x: x["count"], reverse=True)
    
    return result

