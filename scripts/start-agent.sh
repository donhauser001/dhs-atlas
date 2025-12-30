#!/bin/bash
#
# 启动 DHS-Atlas Agent 服务
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "======================================"
echo "DHS-Atlas Agent - 深度整合版"
echo "======================================"

# 切换到项目目录
cd "$PROJECT_DIR"

# 检查虚拟环境
if [ ! -d ".venv" ]; then
    echo "[Setup] 创建虚拟环境..."
    python3 -m venv .venv
fi

# 激活虚拟环境
source .venv/bin/activate

# 安装依赖
echo "[Setup] 安装依赖..."
pip install -q -r dhs_atlas_agent/requirements.txt

# 设置环境变量
export MONGO_URI=${MONGO_URI:-"mongodb://localhost:27017/"}
export DATABASE_NAME=${DATABASE_NAME:-"donhauser"}
export LLM_BASE_URL=${LLM_BASE_URL:-"http://192.168.31.177:1234"}
export LLM_MODEL=${LLM_MODEL:-"qwen/qwen3-coder-30b"}
export LLM_API_KEY=${LLM_API_KEY:-"lm-studio"}
export API_PORT=${API_PORT:-8000}

echo ""
echo "[Config] MongoDB: $MONGO_URI$DATABASE_NAME"
echo "[Config] LLM: $LLM_BASE_URL ($LLM_MODEL)"
echo "[Config] API: http://localhost:$API_PORT"
echo ""

# 启动服务
case "${1:-api}" in
    cli)
        echo "[Start] 命令行模式..."
        python -m dhs_atlas_agent.main --cli
        ;;
    test)
        echo "[Start] 测试模式..."
        python -m dhs_atlas_agent.main --test
        ;;
    api|*)
        echo "[Start] API 服务..."
        python -m dhs_atlas_agent.main --api
        ;;
esac

