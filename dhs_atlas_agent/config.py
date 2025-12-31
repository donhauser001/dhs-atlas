"""
配置文件

包含 MongoDB、LLM 等核心配置
"""

import os
from typing import Optional

# MongoDB 配置
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "donhauser")

# LLM 配置
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://192.168.31.177:1234")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen/qwen3-coder-30b")
LLM_API_KEY = os.getenv("LLM_API_KEY", "lm-studio")

# API 配置
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# 调试模式
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# 前端地址（CORS）
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")


def get_mongo_uri() -> str:
    """获取 MongoDB 连接字符串"""
    return MONGO_URI


def get_llm_config() -> dict:
    """获取 LLM 配置"""
    return {
        "base_url": LLM_BASE_URL,
        "model": LLM_MODEL,
        "api_key": LLM_API_KEY,
    }


