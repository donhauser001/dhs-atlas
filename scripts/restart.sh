#!/bin/bash

# ============================================
# Docker 容器重启脚本
# ============================================
# 功能：重启所有 Docker 容器（MongoDB + 后端 + AI Agent）
# 用法：./scripts/restart.sh [options]
# 选项：
#   --backend     仅重启后端
#   --agent       仅重启 AI Agent
#   --db          仅重启 MongoDB
#   --all         重启所有（默认）
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
RESTART_TARGET="all"

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend)
            RESTART_TARGET="backend"
            shift
            ;;
        --agent)
            RESTART_TARGET="agent"
            shift
            ;;
        --db)
            RESTART_TARGET="mongodb"
            shift
            ;;
        --all)
            RESTART_TARGET="all"
            shift
            ;;
        -h|--help)
            echo "用法: $0 [options]"
            echo ""
            echo "选项:"
            echo "  --backend    仅重启后端"
            echo "  --agent      仅重启 AI Agent"
            echo "  --db         仅重启 MongoDB"
            echo "  --all        重启所有容器（默认）"
            echo "  -h, --help   显示帮助信息"
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
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}      ${BLUE}Docker 容器重启脚本${NC}               ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# 检查 Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行${NC}"
    exit 1
fi

# 确定 compose 命令
if command -v docker compose &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# 重启服务
if [[ "$RESTART_TARGET" == "all" ]]; then
    echo -e "${YELLOW}[重启] 所有容器...${NC}"
    $COMPOSE_CMD restart
else
    echo -e "${YELLOW}[重启] $RESTART_TARGET...${NC}"
    $COMPOSE_CMD restart "$RESTART_TARGET"
fi

# 等待启动
echo ""
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
sleep 5

# 状态检查
echo ""
echo -e "${BLUE}[状态]${NC}"
$COMPOSE_CMD ps

# 健康检查
echo ""
echo -e "${BLUE}[健康检查]${NC}"

# MongoDB
if docker exec donhauser-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} MongoDB"
else
    echo -e "  ${YELLOW}⏳${NC} MongoDB 启动中..."
fi

# 后端
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} 后端 API"
else
    echo -e "  ${YELLOW}⏳${NC} 后端启动中..."
fi

# AI Agent
if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} AI Agent"
else
    echo -e "  ${YELLOW}⏳${NC} Agent 启动中..."
fi

# 前端（本地）
if curl -sf http://localhost:3001 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} 前端 (本地)"
else
    echo -e "  ${YELLOW}ℹ${NC} 前端未运行 (./scripts/frontend.sh)"
fi

echo ""
echo -e "${GREEN}✅ 重启完成${NC}"
echo ""

