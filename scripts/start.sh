#!/bin/bash

# ============================================
# 一键启动脚本
# ============================================
# 功能：启动所有服务（Docker + 前端）
# 用法：./scripts/start.sh [options]
# 选项：
#   --docker-only   仅启动 Docker（不启动前端）
#   --rebuild       重新构建后启动
# ============================================

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR" || exit 1

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 默认选项
DOCKER_ONLY=false
REBUILD=false

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --docker-only)
            DOCKER_ONLY=true
            shift
            ;;
        --rebuild)
            REBUILD=true
            shift
            ;;
        -h|--help)
            echo "用法: $0 [options]"
            echo ""
            echo "选项:"
            echo "  --docker-only   仅启动 Docker（不启动前端）"
            echo "  --rebuild       重新构建后启动"
            echo "  -h, --help      显示帮助信息"
            exit 0
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            exit 1
            ;;
    esac
done

# 打印 Banner
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}              ${BLUE}DHS-Atlas 一键启动${NC}                       ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查 Docker
echo -e "${BLUE}[检查] Docker 环境...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker 运行正常${NC}"

# 确定 compose 命令
if command -v docker compose &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# 启动 Docker 服务
echo ""
if [[ "$REBUILD" == true ]]; then
    echo -e "${YELLOW}[Docker] 重新构建并启动...${NC}"
    $COMPOSE_CMD up --build -d
else
    echo -e "${YELLOW}[Docker] 启动服务...${NC}"
    $COMPOSE_CMD up -d
fi

# 等待 Docker 服务启动
echo ""
echo -e "${BLUE}⏳ 等待 Docker 服务启动...${NC}"
sleep 8

# Docker 状态
echo ""
echo -e "${BLUE}[Docker 状态]${NC}"
$COMPOSE_CMD ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || $COMPOSE_CMD ps

# 健康检查
echo ""
echo -e "${BLUE}[健康检查]${NC}"

# MongoDB
if docker exec donhauser-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} MongoDB      :27017"
else
    echo -e "  ${YELLOW}⏳${NC} MongoDB      启动中..."
fi

# 后端
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} 后端 API    :3000"
else
    echo -e "  ${YELLOW}⏳${NC} 后端 API    启动中..."
fi

# AI Agent
if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} AI Agent    :8000"
else
    echo -e "  ${YELLOW}⏳${NC} AI Agent    启动中..."
fi

# 启动前端
if [[ "$DOCKER_ONLY" == false ]]; then
    echo ""
    echo -e "${YELLOW}[前端] 启动本地开发服务器...${NC}"
    echo ""
    
    # 调用前端脚本
    "$SCRIPT_DIR/frontend.sh" start
else
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}              ${GREEN}Docker 服务已启动${NC}                        ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BLUE}服务地址:${NC}"
    echo -e "    🔧 后端 API:      ${GREEN}http://localhost:3000${NC}"
    echo -e "    🤖 AI Agent:      ${GREEN}http://localhost:8000${NC}"
    echo -e "    📊 Mongo Express: ${GREEN}http://localhost:8081${NC}"
    echo ""
    echo -e "  ${YELLOW}启动前端:${NC}"
    echo -e "    ${CYAN}./scripts/frontend.sh${NC}"
    echo ""
fi

