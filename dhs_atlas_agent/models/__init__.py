"""
数据模型层

提供 MongoDB 连接和数据模型
"""

from .base import (
    get_db,
    get_collection,
    connect_db,
    close_db,
)
from .client import Client, ClientModel
from .quotation import Quotation, QuotationModel
from .service_pricing import ServicePricing, ServicePricingModel

__all__ = [
    "get_db",
    "get_collection",
    "connect_db",
    "close_db",
    "Client",
    "ClientModel",
    "Quotation",
    "QuotationModel",
    "ServicePricing",
    "ServicePricingModel",
]

