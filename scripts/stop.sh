#!/bin/bash

# ============================================
# 停止所有服务脚本
# ============================================
# 功能：停止所有服务（Docker + 前端）
# 用法：./scripts/stop.sh
# ============================================

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR" || exit 1

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}      ${BLUE}停止所有服务${NC}                    ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# 停止前端
echo -e "${YELLOW}[停止] 前端服务...${NC}"
lsof -ti :3001 2>/dev/null | xargs -r kill -9 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-router-worker" 2>/dev/null || true
echo -e "${GREEN}✓ 前端已停止${NC}"

# 停止 Docker
echo -e "${YELLOW}[停止] Docker 服务...${NC}"
if command -v docker compose &> /dev/null; then
    docker compose down
else
    docker-compose down
fi
echo -e "${GREEN}✓ Docker 已停止${NC}"

echo ""
echo -e "${GREEN}✅ 所有服务已停止${NC}"
echo ""

