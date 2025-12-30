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
    service_name: str = ""  # serviceName
    alias: str = ""  # 别名
    category_id: str = ""  # categoryId
    category_name: str = ""  # categoryName
    unit_price: float = 0.0  # unitPrice
    unit: str = ""  # 单位：千字、本、次等
    price_description: str = ""  # priceDescription
    status: str = "active"  # status
    pricing_policy_names: List[str] = field(default_factory=list)  # pricingPolicyNames
    additional_config_name: str = ""  # additionalConfigName
    service_process_name: str = ""  # serviceProcessName
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "serviceName": self.service_name,
            "alias": self.alias,
            "categoryId": self.category_id,
            "categoryName": self.category_name,
            "unitPrice": self.unit_price,
            "unit": self.unit,
            "priceDescription": self.price_description,
            "status": self.status,
            "pricingPolicyNames": self.pricing_policy_names,
            "additionalConfigName": self.additional_config_name,
            "serviceProcessName": self.service_process_name,
        }
    
    @classmethod
    def from_doc(cls, doc: Dict[str, Any]) -> "ServicePricing":
        """从 MongoDB 文档创建实例"""
        if doc is None:
            return None
        
        return cls(
            id=str(doc.get("_id", "")),
            service_name=doc.get("serviceName", ""),
            alias=doc.get("alias", ""),
            category_id=doc.get("categoryId", ""),
            category_name=doc.get("categoryName", ""),
            unit_price=doc.get("unitPrice", 0.0),
            unit=doc.get("unit", ""),
            price_description=doc.get("priceDescription", ""),
            status=doc.get("status", "active"),
            pricing_policy_names=doc.get("pricingPolicyNames", []),
            additional_config_name=doc.get("additionalConfigName", ""),
            service_process_name=doc.get("serviceProcessName", ""),
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
    def list_by_category(cls, category_name: str) -> List[ServicePricing]:
        """按分类获取服务定价"""
        cursor = cls.collection().find({"categoryName": category_name, "status": "active"})
        return [ServicePricing.from_doc(doc) for doc in cursor]
    
    @classmethod
    def list_all(cls, active_only: bool = True) -> List[ServicePricing]:
        """获取所有服务定价"""
        query = {"status": "active"} if active_only else {}
        cursor = cls.collection().find(query)
        return [ServicePricing.from_doc(doc) for doc in cursor]
    
    @classmethod
    def get_categories(cls) -> List[str]:
        """获取所有服务分类"""
        return cls.collection().distinct("categoryName")
    
    @classmethod
    def count(cls, query: Optional[Dict] = None) -> int:
        """统计服务定价数量"""
        return cls.collection().count_documents(query or {})

