"""
服务定价模型 - 对应原有的 ServicePricing.ts
"""

from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from bson import ObjectId

from .base import get_collection, serialize_doc, to_object_id


@dataclass
class ServicePricing:
    """服务定价数据模型"""
    id: Optional[str] = None
    name: str = ""
    description: str = ""
    unit: str = ""  # 单位：千字、本、次等
    base_price: float = 0.0
    category: str = ""
    is_active: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "unit": self.unit,
            "basePrice": self.base_price,
            "category": self.category,
            "isActive": self.is_active,
        }
    
    @classmethod
    def from_doc(cls, doc: Dict[str, Any]) -> "ServicePricing":
        """从 MongoDB 文档创建实例"""
        if doc is None:
            return None
        
        return cls(
            id=str(doc.get("_id", "")),
            name=doc.get("name", ""),
            description=doc.get("description", ""),
            unit=doc.get("unit", ""),
            base_price=doc.get("basePrice", 0.0),
            category=doc.get("category", ""),
            is_active=doc.get("isActive", True),
        )


class ServicePricingModel:
    """服务定价数据访问层"""
    
    COLLECTION_NAME = "servicepricings"
    
    @classmethod
    def collection(cls):
        """获取集合"""
        return get_collection(cls.COLLECTION_NAME)
    
    @classmethod
    def find_by_id(cls, id: str) -> Optional[ServicePricing]:
        """
        根据 ID 查找服务定价
        
        Args:
            id: 服务定价 ID
            
        Returns:
            ServicePricing 实例或 None
        """
        doc = cls.collection().find_one({"_id": to_object_id(id)})
        return ServicePricing.from_doc(doc)
    
    @classmethod
    def find_by_ids(cls, ids: List[str]) -> List[ServicePricing]:
        """
        根据 ID 列表批量查找服务定价
        
        Args:
            ids: ID 列表
            
        Returns:
            服务定价列表
        """
        object_ids = [to_object_id(id) for id in ids if id]
        cursor = cls.collection().find({"_id": {"$in": object_ids}})
        return [ServicePricing.from_doc(doc) for doc in cursor]
    
    @classmethod
    def list_by_category(cls, category: str) -> List[ServicePricing]:
        """按分类获取服务定价"""
        cursor = cls.collection().find({"category": category, "isActive": True})
        return [ServicePricing.from_doc(doc) for doc in cursor]
    
    @classmethod
    def list_all(cls, active_only: bool = True) -> List[ServicePricing]:
        """获取所有服务定价"""
        query = {"isActive": True} if active_only else {}
        cursor = cls.collection().find(query)
        return [ServicePricing.from_doc(doc) for doc in cursor]
    
    @classmethod
    def get_categories(cls) -> List[str]:
        """获取所有服务分类"""
        return cls.collection().distinct("category")
    
    @classmethod
    def count(cls, query: Optional[Dict] = None) -> int:
        """统计服务定价数量"""
        return cls.collection().count_documents(query or {})

