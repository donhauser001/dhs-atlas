"""
MongoDB 基础连接层
"""

from typing import Optional, Any
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from bson import ObjectId

from dhs_atlas_agent.config import MONGO_URI, DATABASE_NAME

# 全局客户端
_client: Optional[MongoClient] = None
_db: Optional[Database] = None


def connect_db() -> Database:
    """
    连接 MongoDB 数据库
    
    Returns:
        Database: MongoDB 数据库实例
    """
    global _client, _db
    
    if _db is not None:
        return _db
    
    _client = MongoClient(MONGO_URI)
    _db = _client[DATABASE_NAME]
    
    print(f"[MongoDB] 已连接: {MONGO_URI}{DATABASE_NAME}")
    return _db


def get_db() -> Database:
    """
    获取数据库实例（如未连接则自动连接）
    
    Returns:
        Database: MongoDB 数据库实例
    """
    global _db
    if _db is None:
        return connect_db()
    return _db


def get_collection(name: str) -> Collection:
    """
    获取集合实例
    
    Args:
        name: 集合名称
        
    Returns:
        Collection: MongoDB 集合实例
    """
    db = get_db()
    return db[name]


def close_db():
    """关闭数据库连接"""
    global _client, _db
    
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        print("[MongoDB] 连接已关闭")


def to_object_id(id_str: str) -> ObjectId:
    """
    将字符串转换为 ObjectId
    
    Args:
        id_str: ID 字符串
        
    Returns:
        ObjectId 实例
    """
    return ObjectId(id_str)


def serialize_doc(doc: dict) -> dict:
    """
    序列化 MongoDB 文档（将 ObjectId 转换为字符串）
    
    Args:
        doc: MongoDB 文档
        
    Returns:
        序列化后的文档
    """
    if doc is None:
        return None
    
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        elif isinstance(value, list):
            result[key] = [
                serialize_doc(item) if isinstance(item, dict) 
                else str(item) if isinstance(item, ObjectId) 
                else item 
                for item in value
            ]
        else:
            result[key] = value
    
    return result


