"""
客户模型 - 对应原有的 Client.ts
"""

from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime

from .base import get_collection, serialize_doc, to_object_id


@dataclass
class FileItem:
    """文件项"""
    path: str
    original_name: str
    size: int


@dataclass
class Client:
    """客户数据模型"""
    id: Optional[str] = None
    name: str = ""
    address: str = ""
    invoice_type: str = ""  # 增值税专用发票 | 增值税普通发票 | 不开票
    invoice_info: str = ""
    category: str = ""
    quotation_id: Optional[str] = None
    rating: int = 3  # 1-5
    files: List[FileItem] = field(default_factory=list)
    summary: str = ""
    status: str = "active"  # active | inactive
    create_time: Optional[str] = None
    update_time: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "invoiceType": self.invoice_type,
            "invoiceInfo": self.invoice_info,
            "category": self.category,
            "quotationId": self.quotation_id,
            "rating": self.rating,
            "files": [
                {"path": f.path, "originalName": f.original_name, "size": f.size}
                for f in self.files
            ],
            "summary": self.summary,
            "status": self.status,
            "createTime": self.create_time,
            "updateTime": self.update_time,
        }
    
    @classmethod
    def from_doc(cls, doc: Dict[str, Any]) -> "Client":
        """从 MongoDB 文档创建实例"""
        if doc is None:
            return None
        
        files = []
        for f in doc.get("files", []):
            files.append(FileItem(
                path=f.get("path", ""),
                original_name=f.get("originalName", ""),
                size=f.get("size", 0),
            ))
        
        return cls(
            id=str(doc.get("_id", "")),
            name=doc.get("name", ""),
            address=doc.get("address", ""),
            invoice_type=doc.get("invoiceType", ""),
            invoice_info=doc.get("invoiceInfo", ""),
            category=doc.get("category", ""),
            quotation_id=doc.get("quotationId"),
            rating=doc.get("rating", 3),
            files=files,
            summary=doc.get("summary", ""),
            status=doc.get("status", "active"),
            create_time=doc.get("createTime"),
            update_time=doc.get("updateTime"),
        )


class ClientModel:
    """客户数据访问层"""
    
    COLLECTION_NAME = "clients"
    
    @classmethod
    def collection(cls):
        """获取集合"""
        return get_collection(cls.COLLECTION_NAME)
    
    @classmethod
    def find_by_name(cls, name: str) -> Optional[Client]:
        """
        根据名称查找客户
        
        Args:
            name: 客户名称
            
        Returns:
            Client 实例或 None
        """
        doc = cls.collection().find_one({"name": name})
        return Client.from_doc(doc)
    
    @classmethod
    def find_by_id(cls, id: str) -> Optional[Client]:
        """
        根据 ID 查找客户
        
        Args:
            id: 客户 ID
            
        Returns:
            Client 实例或 None
        """
        doc = cls.collection().find_one({"_id": to_object_id(id)})
        return Client.from_doc(doc)
    
    @classmethod
    def search(
        cls,
        keyword: Optional[str] = None,
        category: Optional[str] = None,
        status: str = "active",
        limit: int = 20,
    ) -> List[Client]:
        """
        搜索客户
        
        Args:
            keyword: 搜索关键词（名称/地址）
            category: 分类过滤
            status: 状态过滤
            limit: 返回数量限制
            
        Returns:
            客户列表
        """
        query = {"status": status}
        
        if keyword:
            query["$or"] = [
                {"name": {"$regex": keyword, "$options": "i"}},
                {"address": {"$regex": keyword, "$options": "i"}},
            ]
        
        if category:
            query["category"] = category
        
        cursor = cls.collection().find(query).limit(limit)
        return [Client.from_doc(doc) for doc in cursor]
    
    @classmethod
    def get_categories(cls) -> List[str]:
        """获取所有客户分类"""
        return cls.collection().distinct("category")
    
    @classmethod
    def count(cls, query: Optional[Dict] = None) -> int:
        """统计客户数量"""
        return cls.collection().count_documents(query or {})


