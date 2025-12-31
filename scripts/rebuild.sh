#!/bin/bash

# ============================================
# Docker 服务重建脚本
# ============================================
# 功能：清理缓存、重新构建并启动 Docker 服务
# 用法：./scripts/rebuild.sh [options]
# 选项：
#   --no-cache    完全无缓存重建（更慢但更彻底）
#   --backend     仅重建后端
#   --agent       仅重建 AI Agent
#   --all         重建所有服务（默认）
#   --clean       深度清理（删除数据卷、镜像缓存）
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
NO_CACHE=false
BUILD_TARGET="all"
DEEP_CLEAN=false

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --backend)
            BUILD_TARGET="backend"
            shift
            ;;
        --agent)
            BUILD_TARGET="agent"
            shift
            ;;
        --all)
            BUILD_TARGET="all"
            shift
            ;;
        --clean)
            DEEP_CLEAN=true
            shift
            ;;
        -h|--help)
            echo "用法: $0 [options]"
            echo ""
            echo "选项:"
            echo "  --no-cache   完全无缓存重建"
            echo "  --backend    仅重建后端"
            echo "  --agent      仅重建 AI Agent"
            echo "  --all        重建所有服务（默认）"
            echo "  --clean      深度清理（删除镜像缓存）"
            echo "  -h, --help   显示帮助信息"
            echo ""
            echo "示例:"
            echo "  $0                  # 重建所有"
            echo "  $0 --backend        # 仅重建后端"
            echo "  $0 --no-cache       # 无缓存重建"
            echo "  $0 --clean --all    # 深度清理后重建"
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
echo -e "${CYAN}║${NC}      ${BLUE}Docker 服务重建脚本${NC}               ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "📍 项目目录: ${GREEN}$PROJECT_DIR${NC}"
echo -e "🎯 重建目标: ${YELLOW}$BUILD_TARGET${NC}"
[[ "$NO_CACHE" == true ]] && echo -e "🗑️  无缓存: ${YELLOW}是${NC}"
[[ "$DEEP_CLEAN" == true ]] && echo -e "🧹 深度清理: ${YELLOW}是${NC}"
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
echo -e "${GREEN}✓ 使用: $COMPOSE_CMD${NC}"
echo ""

# 计算步骤数
TOTAL_STEPS=4
[[ "$DEEP_CLEAN" == true ]] && TOTAL_STEPS=5
CURRENT_STEP=0

# 步骤 1: 停止容器
((CURRENT_STEP++))
echo -e "${YELLOW}[$CURRENT_STEP/$TOTAL_STEPS] 停止容器...${NC}"
$COMPOSE_CMD down --remove-orphans

# 步骤 2: 深度清理（可选）
if [[ "$DEEP_CLEAN" == true ]]; then
    ((CURRENT_STEP++))
    echo -e "${YELLOW}[$CURRENT_STEP/$TOTAL_STEPS] 深度清理...${NC}"
    
    # 删除项目相关的镜像
    echo "  清理项目镜像..."
    docker images | grep -E "dhs-atlas|donhauser" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
    
    # 清理悬空镜像
    echo "  清理悬空镜像..."
    docker image prune -f
    
    # 清理构建缓存
    echo "  清理构建缓存..."
    docker builder prune -f
    
    echo -e "${GREEN}✓ 清理完成${NC}"
fi

# 步骤 3: 构建镜像
((CURRENT_STEP++))
echo -e "${YELLOW}[$CURRENT_STEP/$TOTAL_STEPS] 构建镜像...${NC}"

BUILD_OPTS=""
[[ "$NO_CACHE" == true ]] && BUILD_OPTS="--no-cache"

if [[ "$BUILD_TARGET" == "all" ]]; then
    echo "  构建后端..."
    $COMPOSE_CMD build $BUILD_OPTS backend
    echo "  构建 AI Agent..."
    $COMPOSE_CMD build $BUILD_OPTS agent
else
    echo "  构建 $BUILD_TARGET..."
    $COMPOSE_CMD build $BUILD_OPTS "$BUILD_TARGET"
fi

# 步骤 4: 启动服务
((CURRENT_STEP++))
echo -e "${YELLOW}[$CURRENT_STEP/$TOTAL_STEPS] 启动服务...${NC}"
$COMPOSE_CMD up -d

# 等待启动
echo ""
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
sleep 10

# 状态检查
echo ""
echo -e "${BLUE}[状态]${NC}"
$COMPOSE_CMD ps

# 健康检查
echo ""
echo -e "${BLUE}[健康检查]${NC}"

check_service() {
    local name=$1
    local url=$2
    local max_attempts=10
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} $name"
            return 0
        fi
        ((attempt++))
        sleep 2
    done
    echo -e "  ${YELLOW}⏳${NC} $name (启动中...)"
    return 1
}

# MongoDB
if docker exec donhauser-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} MongoDB"
else
    echo -e "  ${YELLOW}⏳${NC} MongoDB 启动中..."
fi

# 后端
check_service "后端 API" "http://localhost:3000/health"

# AI Agent
check_service "AI Agent" "http://localhost:8000/api/health"

# 完成信息
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}            ${GREEN}重建完成${NC}                     ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Docker 服务:${NC}"
echo -e "    🔧 后端 API:      ${GREEN}http://localhost:3000${NC}"
echo -e "    🤖 AI Agent:      ${GREEN}http://localhost:8000${NC}"
echo -e "    🗄️  MongoDB:       ${GREEN}mongodb://localhost:27017${NC}"
echo -e "    📊 Mongo Express: ${GREEN}http://localhost:8081${NC}"
echo ""
echo -e "  ${BLUE}前端（本地运行）:${NC}"
if curl -sf http://localhost:3001 > /dev/null 2>&1; then
    echo -e "    🌐 前端地址:      ${GREEN}http://localhost:3001${NC}"
else
    echo -e "    🌐 前端未运行    ${YELLOW}./scripts/frontend.sh${NC}"
fi
echo ""
echo -e "  📝 查看日志:"
echo -e "     后端:  ${CYAN}$COMPOSE_CMD logs -f backend${NC}"
echo -e "     Agent: ${CYAN}$COMPOSE_CMD logs -f agent${NC}"
echo -e "     全部:  ${CYAN}$COMPOSE_CMD logs -f${NC}"
echo ""

