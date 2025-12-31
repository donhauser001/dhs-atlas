"""
通用数据库查询工具 - 对应原有的 db.query

提供灵活的数据库查询能力
"""

from typing import Dict, Any, List, Optional
from typing_extensions import Annotated, Doc
from dbgpt.agent.resource import tool
from bson import ObjectId

from dhs_atlas_agent.models.base import get_collection, serialize_doc


def _convert_object_ids(query: Dict) -> Dict:
    """
    递归转换查询中的 ObjectId 字符串
    
    处理以下情况：
    - {"_id": "xxx"} -> {"_id": ObjectId("xxx")}
    - {"_id": {"$in": ["xxx", "yyy"]}} -> {"_id": {"$in": [ObjectId("xxx"), ObjectId("yyy")]}}
    """
    if not isinstance(query, dict):
        return query
    
    result = {}
    for key, value in query.items():
        if key == "_id":
            if isinstance(value, str):
                try:
                    result[key] = ObjectId(value)
                except:
                    result[key] = value
            elif isinstance(value, dict) and "$in" in value:
                ids = value["$in"]
                if isinstance(ids, list):
                    result[key] = {"$in": [
                        ObjectId(id) if isinstance(id, str) and len(id) == 24 else id
                        for id in ids
                    ]}
                else:
                    result[key] = value
            else:
                result[key] = value
        elif isinstance(value, dict):
            result[key] = _convert_object_ids(value)
        else:
            result[key] = value
    
    return result


@tool(description="通用数据库查询工具。当没有专门的工具可用时，可以使用此工具直接查询数据库。")
def query_collection(
    collection: Annotated[str, Doc("集合名称")],
    query: Annotated[Optional[Dict[str, Any]], Doc("查询条件，MongoDB 查询语法")] = None,
    projection: Annotated[Optional[Dict[str, Any]], Doc("字段投影，指定返回哪些字段")] = None,
    sort: Annotated[Optional[Dict[str, int]], Doc("排序规则，如 {'createTime': -1}")] = None,
    limit: Annotated[int, Doc("返回数量限制")] = 10,
) -> Annotated[List[Dict[str, Any]], Doc("查询结果列表")]:
    """
    通用数据库查询工具。
    
    当没有专门的 CRM 或财务工具可用时，可以使用此工具直接查询数据库。
    
    注意：
    - 优先使用专门的工具（如 get_client_detail、query_client_quotation）
    - 此工具仅用于灵活的自定义查询
    
    示例：
    - query_collection("clients", {"status": "active"}, limit=5)
    - query_collection("projects", {"clientId": "xxx"})
    """
    coll = get_collection(collection)
    
    # 转换 ObjectId
    mongo_query = _convert_object_ids(query or {})
    
    # 构建游标
    cursor = coll.find(mongo_query, projection)
    
    # 排序
    if sort:
        cursor = cursor.sort(list(sort.items()))
    
    # 限制数量
    cursor = cursor.limit(limit)
    
    # 序列化结果
    return [serialize_doc(doc) for doc in cursor]


@tool(description="统计集合中的文档数量。")
def count_documents(
    collection: Annotated[str, Doc("集合名称")],
    query: Annotated[Optional[Dict[str, Any]], Doc("查询条件")] = None,
) -> Annotated[int, Doc("文档数量")]:
    """
    统计集合中的文档数量。
    
    示例：
    - count_documents("clients")
    - count_documents("clients", {"status": "active"})
    """
    coll = get_collection(collection)
    mongo_query = _convert_object_ids(query or {})
    return coll.count_documents(mongo_query)


