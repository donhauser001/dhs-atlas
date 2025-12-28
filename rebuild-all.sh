#!/bin/bash

# 完整重构脚本 - 清理缓存并重新构建所有服务
# 无论从哪个目录运行都能正常工作

# 获取脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 切换到项目根目录
cd "$SCRIPT_DIR" || exit 1

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo -e "${BLUE}🚀 完整重构脚本（前端 + 后端）${NC}"
echo "=========================================="
echo "📍 项目目录: $SCRIPT_DIR"
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker Desktop${NC}"
    exit 1
fi

# 检查 docker-compose 是否可用
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose 未安装，请先安装 Docker Compose${NC}"
    exit 1
fi

# 步骤 1: 停止所有容器
echo -e "${YELLOW}[1/7] 停止所有容器...${NC}"
docker-compose down

# 步骤 2: 删除所有容器
echo ""
echo -e "${YELLOW}[2/7] 删除所有容器...${NC}"
docker-compose rm -f

# 步骤 3: 清理 Docker 系统缓存
echo ""
echo -e "${YELLOW}[3/7] 清理 Docker 系统缓存...${NC}"
docker system prune -f

# 步骤 4: 强制重新构建前端（无缓存）
echo ""
echo -e "${YELLOW}[4/7] 强制重新构建前端（无缓存）...${NC}"
docker-compose build --no-cache frontend

# 步骤 5: 强制重新构建后端（无缓存）
echo ""
echo -e "${YELLOW}[5/7] 强制重新构建后端（无缓存）...${NC}"
docker-compose build --no-cache backend

# 步骤 6: 启动所有服务
echo ""
echo -e "${YELLOW}[6/7] 启动所有服务...${NC}"
docker-compose up -d

# 等待服务启动
echo ""
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
sleep 10

# 检查服务状态
echo ""
echo -e "${YELLOW}[7/7] 检查服务状态...${NC}"
docker-compose ps

# 检查后端健康状态
echo ""
echo -e "${BLUE}🏥 检查后端健康状态...${NC}"
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务正常运行${NC}"
else
    echo -e "${YELLOW}⚠️  后端服务可能还在启动中，请稍等片刻${NC}"
fi

# 检查前端
echo ""
echo -e "${BLUE}🌐 检查前端服务...${NC}"
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端服务正常运行${NC}"
else
    echo -e "${YELLOW}⚠️  前端服务可能还在启动中，请稍等片刻${NC}"
fi

# 输出完成信息
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 完整重构完成！${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}📱 前端地址: http://localhost:3001${NC}"
echo -e "${GREEN}🔧 后端API: http://localhost:3000${NC}"
echo -e "${GREEN}🗄️  数据库: mongodb://localhost:27017${NC}"
echo -e "${GREEN}📊 Mongo Express: http://localhost:8081${NC}"
echo ""
echo "📝 查看所有日志: docker-compose logs -f"
echo "📝 查看后端日志: docker-compose logs -f backend"
echo "📝 查看前端日志: docker-compose logs -f frontend"
echo "🛑 停止服务: docker-compose down"
echo ""

