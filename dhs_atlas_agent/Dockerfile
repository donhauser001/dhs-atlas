# DHS-Atlas AI Agent Dockerfile
# 基于 Python 3.11

FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件并安装
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 创建模块目录并复制源代码
RUN mkdir -p dhs_atlas_agent
COPY . ./dhs_atlas_agent/

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

# 创建非 root 用户
RUN addgroup --gid 1001 --system agent && \
    adduser --uid 1001 --system --gid 1001 agent && \
    chown -R agent:agent /app

USER agent

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# 启动 API 服务
CMD ["python", "-m", "dhs_atlas_agent.main", "--api"]
