#!/bin/bash

# ============================================
# 前端本地开发服务器启动脚本
# ============================================
# 功能：启动/重启本地前端开发服务器（支持热重载）
# 用法：./scripts/frontend-restart.sh [options]
# 选项：
#   --kill        仅停止前端服务
#   --install     重新安装依赖后启动
#   --port PORT   指定端口（默认 3001）
# ============================================

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# 切换到项目根目录
cd "$PROJECT_DIR" || exit 1

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 默认选项
KILL_ONLY=false
REINSTALL=false
PORT=3001

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --kill)
            KILL_ONLY=true
            shift
            ;;
        --install)
            REINSTALL=true
            shift
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        -h|--help)
            echo "用法: $0 [options]"
            echo ""
            echo "选项:"
            echo "  --kill        仅停止前端服务"
            echo "  --install     重新安装依赖后启动"
            echo "  --port PORT   指定端口（默认 3001）"
            echo "  -h, --help    显示帮助信息"
            echo ""
            echo "特性:"
            echo "  • 支持热重载（HMR）"
            echo "  • 代码修改自动更新"
            echo "  • 快速启动（~500ms）"
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
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}    ${BLUE}前端本地开发服务器${NC}              ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# 检查前端目录
if [[ ! -d "$FRONTEND_DIR" ]]; then
    echo -e "${RED}❌ 前端目录不存在: $FRONTEND_DIR${NC}"
    exit 1
fi

# 停止现有的前端进程
stop_frontend() {
    echo -e "${YELLOW}[停止] 查找现有前端进程...${NC}"
    
    # 查找运行在指定端口的进程
    local pids=$(lsof -ti :$PORT 2>/dev/null || true)
    
    if [[ -n "$pids" ]]; then
        echo -e "${YELLOW}[停止] 终止端口 $PORT 上的进程...${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✓ 已停止${NC}"
    else
        echo -e "${GREEN}✓ 没有运行中的前端进程${NC}"
    fi
    
    # 同时查找并停止 next dev 进程
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "next-router-worker" 2>/dev/null || true
}

# 停止前端
stop_frontend

# 如果只是停止
if [[ "$KILL_ONLY" == true ]]; then
    echo ""
    echo -e "${GREEN}✅ 前端服务已停止${NC}"
    exit 0
fi

# 切换到前端目录
cd "$FRONTEND_DIR"

# 检查 node_modules
if [[ ! -d "node_modules" ]] || [[ "$REINSTALL" == true ]]; then
    echo ""
    echo -e "${YELLOW}[安装] 安装前端依赖...${NC}"
    npm install
fi

# 检查后端是否运行
echo ""
echo -e "${BLUE}[检查] 后端服务状态...${NC}"
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端 API 正常运行${NC}"
else
    echo -e "${YELLOW}⚠ 后端未运行，API 请求可能失败${NC}"
    echo -e "  ${CYAN}启动后端: docker compose up -d${NC}"
fi

# 启动前端开发服务器
echo ""
echo -e "${YELLOW}[启动] 启动 Next.js 开发服务器...${NC}"
echo -e "  📁 目录: ${GREEN}$FRONTEND_DIR${NC}"
echo -e "  🔌 端口: ${GREEN}$PORT${NC}"
echo ""

# 设置端口环境变量并启动
export PORT=$PORT

# 使用 nohup 在后台运行，但输出到终端
npm run dev &
FRONTEND_PID=$!

# 等待启动
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
for i in {1..30}; do
    if curl -sf http://localhost:$PORT > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✅ 前端服务已启动${NC}"
        break
    fi
    sleep 1
    echo -n "."
done
echo ""

# 检查是否成功启动
if curl -sf http://localhost:$PORT > /dev/null 2>&1; then
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}          ${GREEN}前端已就绪${NC}                  ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  🌐 访问地址: ${GREEN}http://localhost:$PORT${NC}"
    echo -e "  🔥 热重载:   ${GREEN}已启用${NC}"
    echo ""
    echo -e "  ${YELLOW}提示:${NC}"
    echo -e "    • 修改代码后页面会自动更新"
    echo -e "    • 停止服务: ${CYAN}./scripts/frontend-restart.sh --kill${NC}"
    echo -e "    • 或直接按 ${CYAN}Ctrl+C${NC}"
    echo ""
    
    # 等待前端进程
    wait $FRONTEND_PID 2>/dev/null || true
else
    echo -e "${RED}❌ 前端启动失败${NC}"
    echo -e "${YELLOW}请检查错误信息或手动运行:${NC}"
    echo -e "  ${CYAN}cd frontend && npm run dev${NC}"
    exit 1
fi
