"""
报价单模型 - 对应原有的 Quotation.ts
"""

from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime

from .base import get_collection, serialize_doc, to_object_id


@dataclass
class Quotation:
    """报价单数据模型"""
    id: Optional[str] = None
    name: str = ""
    status: str = "active"  # active | inactive
    valid_until: Optional[datetime] = None
    description: str = ""
    is_default: bool = False
    selected_services: List[str] = field(default_factory=list)
    create_time: Optional[datetime] = None
    update_time: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "name": self.name,
            "status": self.status,
            "validUntil": self.valid_until.isoformat() if self.valid_until else None,
            "description": self.description,
            "isDefault": self.is_default,
            "selectedServices": self.selected_services,
            "createTime": self.create_time.isoformat() if self.create_time else None,
            "updateTime": self.update_time.isoformat() if self.update_time else None,
        }
    
    @classmethod
    def from_doc(cls, doc: Dict[str, Any]) -> "Quotation":
        """从 MongoDB 文档创建实例"""
        if doc is None:
            return None
        
        return cls(
            id=str(doc.get("_id", "")),
            name=doc.get("name", ""),
            status=doc.get("status", "active"),
            valid_until=doc.get("validUntil"),
            description=doc.get("description", ""),
            is_default=doc.get("isDefault", False),
            selected_services=doc.get("selectedServices", []),
            create_time=doc.get("createTime"),
            update_time=doc.get("updateTime"),
        )


class QuotationModel:
    """报价单数据访问层"""
    
    COLLECTION_NAME = "quotations"
    
    @classmethod
    def collection(cls):
        """获取集合"""
        return get_collection(cls.COLLECTION_NAME)
    
    @classmethod
    def find_by_id(cls, id: str) -> Optional[Quotation]:
        """
        根据 ID 查找报价单
        
        Args:
            id: 报价单 ID
            
        Returns:
            Quotation 实例或 None
        """
        doc = cls.collection().find_one({"_id": to_object_id(id)})
        return Quotation.from_doc(doc)
    
    @classmethod
    def find_by_name(cls, name: str) -> Optional[Quotation]:
        """
        根据名称查找报价单
        
        Args:
            name: 报价单名称
            
        Returns:
            Quotation 实例或 None
        """
        doc = cls.collection().find_one({"name": name})
        return Quotation.from_doc(doc)
    
    @classmethod
    def find_default(cls) -> Optional[Quotation]:
        """获取默认报价单"""
        doc = cls.collection().find_one({"isDefault": True, "status": "active"})
        return Quotation.from_doc(doc)
    
    @classmethod
    def list_all(cls, status: str = "active") -> List[Quotation]:
        """获取所有报价单"""
        cursor = cls.collection().find({"status": status})
        return [Quotation.from_doc(doc) for doc in cursor]
    
    @classmethod
    def count(cls, query: Optional[Dict] = None) -> int:
        """统计报价单数量"""
        return cls.collection().count_documents(query or {})


