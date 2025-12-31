#!/bin/bash

# ============================================
# 前端服务脚本
# ============================================
# 功能：启动/重启/停止前端开发服务器（支持热重载）
# 用法：./scripts/frontend.sh [command]
# 命令：
#   start      启动前端（默认）
#   stop       停止前端
#   restart    重启前端
#   build      构建生产版本
#   install    重新安装依赖
# ============================================

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 默认命令
COMMAND="${1:-start}"
PORT=3001

# 显示帮助
show_help() {
    echo "用法: $0 [command]"
    echo ""
    echo "命令:"
    echo "  start      启动前端开发服务器（默认）"
    echo "  stop       停止前端服务"
    echo "  restart    重启前端服务"
    echo "  build      构建生产版本"
    echo "  install    重新安装依赖后启动"
    echo "  -h, --help 显示帮助信息"
    echo ""
    echo "特性:"
    echo "  • 支持热重载（HMR）"
    echo "  • 代码修改自动更新"
}

# 停止前端
stop_frontend() {
    echo -e "${YELLOW}[停止] 前端服务...${NC}"
    
    # 查找并停止端口上的进程
    local pids=$(lsof -ti :$PORT 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    
    # 停止 next 相关进程
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "next-router-worker" 2>/dev/null || true
    
    echo -e "${GREEN}✓ 已停止${NC}"
}

# 启动前端
start_frontend() {
    # 检查目录
    if [[ ! -d "$FRONTEND_DIR" ]]; then
        echo -e "${RED}❌ 前端目录不存在${NC}"
        exit 1
    fi
    
    cd "$FRONTEND_DIR"
    
    # 检查 node_modules
    if [[ ! -d "node_modules" ]]; then
        echo -e "${YELLOW}[安装] 前端依赖...${NC}"
        npm install
    fi
    
    # 检查后端
    echo ""
    echo -e "${BLUE}[检查] Docker 服务状态...${NC}"
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} 后端 API 正常"
    else
        echo -e "  ${YELLOW}⚠${NC} 后端未运行"
    fi
    if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} AI Agent 正常"
    else
        echo -e "  ${YELLOW}⚠${NC} AI Agent 未运行"
    fi
    
    # 启动
    echo ""
    echo -e "${YELLOW}[启动] Next.js 开发服务器...${NC}"
    echo -e "  📁 目录: ${GREEN}$FRONTEND_DIR${NC}"
    echo -e "  🔌 端口: ${GREEN}$PORT${NC}"
    echo ""
    
    export PORT=$PORT
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
    
    # 检查结果
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
        echo -e "    • 修改代码后页面自动更新"
        echo -e "    • 停止服务: ${CYAN}./scripts/frontend.sh stop${NC}"
        echo -e "    • 或直接按 ${CYAN}Ctrl+C${NC}"
        echo ""
        
        wait $FRONTEND_PID 2>/dev/null || true
    else
        echo -e "${RED}❌ 前端启动失败${NC}"
        echo -e "  手动启动: ${CYAN}cd frontend && npm run dev${NC}"
        exit 1
    fi
}

# 构建生产版本
build_frontend() {
    cd "$FRONTEND_DIR"
    
    echo -e "${YELLOW}[构建] 生产版本...${NC}"
    
    # 检查依赖
    if [[ ! -d "node_modules" ]]; then
        echo -e "${YELLOW}[安装] 前端依赖...${NC}"
        npm install
    fi
    
    npm run build
    
    echo ""
    echo -e "${GREEN}✅ 构建完成${NC}"
    echo -e "  启动生产服务: ${CYAN}cd frontend && npm start${NC}"
}

# 重新安装依赖
reinstall_deps() {
    cd "$FRONTEND_DIR"
    
    echo -e "${YELLOW}[清理] 删除 node_modules...${NC}"
    rm -rf node_modules
    rm -f package-lock.json
    
    echo -e "${YELLOW}[安装] 重新安装依赖...${NC}"
    npm install
    
    echo -e "${GREEN}✓ 依赖安装完成${NC}"
}

# 打印 Banner
echo ""
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}      ${BLUE}前端服务脚本${NC}                    ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# 执行命令
case "$COMMAND" in
    start)
        stop_frontend
        start_frontend
        ;;
    stop)
        stop_frontend
        echo -e "${GREEN}✅ 前端服务已停止${NC}"
        ;;
    restart)
        stop_frontend
        start_frontend
        ;;
    build)
        build_frontend
        ;;
    install)
        reinstall_deps
        stop_frontend
        start_frontend
        ;;
    -h|--help)
        show_help
        ;;
    *)
        echo -e "${RED}未知命令: $COMMAND${NC}"
        show_help
        exit 1
        ;;
esac

