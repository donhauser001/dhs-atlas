#!/bin/bash

# DHS-Atlas + DB-GPT 启动脚本
# 
# 使用方式:
#   ./scripts/start-with-dbgpt.sh

set -e

echo "============================================================"
echo "🚀 DHS-Atlas + DB-GPT 启动脚本"
echo "============================================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 DB-GPT 是否运行
check_dbgpt() {
    if curl -s http://localhost:5670 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ DB-GPT 服务已运行${NC} (http://localhost:5670)"
        return 0
    else
        echo -e "${YELLOW}⚠ DB-GPT 服务未运行${NC}"
        return 1
    fi
}

# 启动 DB-GPT
start_dbgpt() {
    echo -e "${BLUE}→ 启动 DB-GPT 服务...${NC}"
    
    # 检查 dbgpt-test 分支是否存在
    if ! git show-ref --verify --quiet refs/heads/dbgpt-test; then
        echo "错误: dbgpt-test 分支不存在"
        echo "请先运行: git checkout dbgpt-test"
        exit 1
    fi
    
    # 创建临时目录存放 DB-GPT
    DBGPT_DIR="/tmp/dhs-atlas-dbgpt"
    if [ ! -d "$DBGPT_DIR" ]; then
        echo "正在准备 DB-GPT 环境..."
        git worktree add "$DBGPT_DIR" dbgpt-test 2>/dev/null || true
    fi
    
    # 在后台启动 DB-GPT
    cd "$DBGPT_DIR"
    if [ -d ".venv" ]; then
        source .venv/bin/activate
        nohup dbgpt start webserver --config configs/dbgpt-proxy-lmstudio.toml > /tmp/dbgpt.log 2>&1 &
        echo "DB-GPT 正在启动，日志: /tmp/dbgpt.log"
        sleep 5
    else
        echo "警告: DB-GPT 环境未配置，请手动启动"
    fi
    
    cd - > /dev/null
}

# 启动后端
start_backend() {
    echo -e "${BLUE}→ 启动后端服务 (USE_DBGPT=true)...${NC}"
    
    cd "$(dirname "$0")/../backend"
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        echo "安装后端依赖..."
        npm install
    fi
    
    # 启动后端（启用 DB-GPT）
    export USE_DBGPT=true
    export DBGPT_BASE_URL=http://localhost:5670
    export DBGPT_MODEL=qwen3-coder-30b
    
    echo "环境变量:"
    echo "  USE_DBGPT=$USE_DBGPT"
    echo "  DBGPT_BASE_URL=$DBGPT_BASE_URL"
    echo "  DBGPT_MODEL=$DBGPT_MODEL"
    
    npm run dev &
    
    cd - > /dev/null
}

# 启动前端
start_frontend() {
    echo -e "${BLUE}→ 启动前端服务...${NC}"
    
    cd "$(dirname "$0")/../frontend"
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        echo "安装前端依赖..."
        npm install
    fi
    
    npm run dev &
    
    cd - > /dev/null
}

# 主流程
main() {
    # 检查 DB-GPT
    if ! check_dbgpt; then
        echo ""
        echo -e "${YELLOW}请先启动 DB-GPT 服务:${NC}"
        echo "  1. 打开新终端"
        echo "  2. cd /Users/aiden/Documents/app/dhs-atlas"
        echo "  3. git checkout dbgpt-test"
        echo "  4. source .venv/bin/activate"
        echo "  5. dbgpt start webserver --config configs/dbgpt-proxy-lmstudio.toml"
        echo ""
        echo "或者按 Enter 继续（使用原有 LLM）..."
        read -r
    fi
    
    echo ""
    echo "============================================================"
    echo "正在启动服务..."
    echo "============================================================"
    
    # 启动后端
    start_backend
    
    # 等待后端启动
    sleep 3
    
    # 启动前端
    start_frontend
    
    echo ""
    echo "============================================================"
    echo -e "${GREEN}✓ 服务已启动${NC}"
    echo ""
    echo "访问地址:"
    echo -e "  前端: ${BLUE}http://localhost:3001${NC}"
    echo -e "  后端: ${BLUE}http://localhost:3000${NC}"
    echo -e "  DB-GPT: ${BLUE}http://localhost:5670${NC}"
    echo ""
    echo "按 Ctrl+C 停止所有服务"
    echo "============================================================"
    
    # 等待中断
    wait
}

main "$@"

