#!/bin/bash

# ============================================
# Docker 后端服务重构启动脚本
# ============================================
# 功能：停止、清理、重构并启动 Docker 后端服务
# 注意：前端已移至本地运行，使用 frontend-restart.sh 启动
# 用法：./scripts/docker-rebuild.sh [options]
# 选项：
#   --no-cache    完全无缓存重构（更慢但更彻底）
#   --quick       快速重启（不重构，仅重启）
#   --with-frontend  同时启动本地前端服务
# ============================================

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 切换到项目根目录
cd "$PROJECT_DIR" || exit 1

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 默认选项
NO_CACHE=false
QUICK_MODE=false
WITH_FRONTEND=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --quick)
            QUICK_MODE=true
            shift
            ;;
        --with-frontend)
            WITH_FRONTEND=true
            shift
            ;;
        -h|--help)
            echo "用法: $0 [options]"
            echo ""
            echo "选项:"
            echo "  --no-cache       完全无缓存重构（更慢但更彻底）"
            echo "  --quick          快速重启（不重构，仅重启容器）"
            echo "  --with-frontend  同时启动本地前端服务"
            echo "  -h, --help       显示帮助信息"
            echo ""
            echo "说明:"
            echo "  前端已移至本地运行以支持热重载"
            echo "  单独启动前端: ./scripts/frontend-restart.sh"
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
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}         ${BLUE}DHS-Atlas Docker 后端重构脚本${NC}               ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "📍 项目目录: ${GREEN}$PROJECT_DIR${NC}"
echo -e "🔧 模式: ${YELLOW}$( [[ "$QUICK_MODE" == true ]] && echo "快速重启" || echo "重构启动" )${NC}"
[[ "$NO_CACHE" == true ]] && echo -e "🗑️  无缓存: ${YELLOW}是${NC}"
[[ "$WITH_FRONTEND" == true ]] && echo -e "🌐 前端: ${YELLOW}同时启动${NC}"
echo ""

# 检查 Docker 是否运行
echo -e "${BLUE}[检查] Docker 环境...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker Desktop${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker 运行正常${NC}"

# 检查 docker compose 是否可用
if command -v docker compose &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}❌ docker compose 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 使用: $COMPOSE_CMD${NC}"
echo ""

# 快速模式：仅重启
if [[ "$QUICK_MODE" == true ]]; then
    echo -e "${YELLOW}[1/2] 停止容器...${NC}"
    $COMPOSE_CMD down
    
    echo -e "${YELLOW}[2/2] 启动容器...${NC}"
    $COMPOSE_CMD up -d
else
    # 完整重构模式
    TOTAL_STEPS=5
    CURRENT_STEP=0
    
    # 步骤 1: 停止所有容器
    ((CURRENT_STEP++))
    echo -e "${YELLOW}[$CURRENT_STEP/$TOTAL_STEPS] 停止所有容器...${NC}"
    $COMPOSE_CMD down --remove-orphans
    
    # 步骤 2: 删除容器
    ((CURRENT_STEP++))
    echo -e "${YELLOW}[$CURRENT_STEP/$TOTAL_STEPS] 删除旧容器...${NC}"
    $COMPOSE_CMD rm -f 2>/dev/null || true
    
    # 步骤 3: 清理系统缓存
    ((CURRENT_STEP++))
    echo -e "${YELLOW}[$CURRENT_STEP/$TOTAL_STEPS] 清理 Docker 缓存...${NC}"
    docker system prune -f
    
    # 构建选项
    BUILD_OPTS=""
    [[ "$NO_CACHE" == true ]] && BUILD_OPTS="--no-cache"
    
    # 步骤 4: 重构后端
    ((CURRENT_STEP++))
    echo -e "${YELLOW}[$CURRENT_STEP/$TOTAL_STEPS] 构建后端镜像...${NC}"
    $COMPOSE_CMD build $BUILD_OPTS backend
    
    # 步骤 5: 启动服务
    ((CURRENT_STEP++))
    echo -e "${YELLOW}[$CURRENT_STEP/$TOTAL_STEPS] 启动 Docker 服务...${NC}"
    $COMPOSE_CMD up -d
fi

# 等待服务启动
echo ""
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
sleep 8

# 检查服务状态
echo ""
echo -e "${BLUE}[状态] Docker 容器运行情况:${NC}"
$COMPOSE_CMD ps

# 健康检查
echo ""
echo -e "${BLUE}[健康检查]${NC}"

# 检查 MongoDB
if docker exec donhauser-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} MongoDB 正常"
else
    echo -e "  ${YELLOW}⚠${NC} MongoDB 启动中..."
fi

# 检查后端
sleep 2
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Backend API 正常"
else
    echo -e "  ${YELLOW}⚠${NC} Backend 启动中..."
fi

# 如果需要同时启动前端
if [[ "$WITH_FRONTEND" == true ]]; then
    echo ""
    echo -e "${YELLOW}[启动] 本地前端服务...${NC}"
    "$SCRIPT_DIR/frontend-restart.sh" &
    sleep 3
fi

# 检查前端状态
echo ""
if curl -sf http://localhost:3001 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Frontend 正常 (本地运行)"
else
    echo -e "  ${YELLOW}ℹ${NC} Frontend 未运行"
    echo -e "    ${CYAN}启动命令: ./scripts/frontend-restart.sh${NC}"
fi

# 完成信息
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}                    ${GREEN}重构完成${NC}                          ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Docker 服务:${NC}"
echo -e "    🔧 后端 API:      ${GREEN}http://localhost:3000${NC}"
echo -e "    🗄️  MongoDB:       ${GREEN}mongodb://localhost:27017${NC}"
echo -e "    📊 Mongo Express: ${GREEN}http://localhost:8081${NC}"
echo ""
echo -e "  ${BLUE}本地服务:${NC}"
echo -e "    🌐 前端地址:      ${GREEN}http://localhost:3001${NC}"
if ! curl -sf http://localhost:3001 > /dev/null 2>&1; then
    echo -e "       ${YELLOW}(需手动启动: ./scripts/frontend-restart.sh)${NC}"
fi
echo ""
echo -e "  📝 查看后端日志: ${CYAN}$COMPOSE_CMD logs -f backend${NC}"
echo -e "  🛑 停止 Docker:  ${CYAN}$COMPOSE_CMD down${NC}"
echo ""
