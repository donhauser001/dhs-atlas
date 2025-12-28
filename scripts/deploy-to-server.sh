#!/bin/bash

# ============================================
# 服务器部署脚本 - 将项目部署到局域网服务器
# ============================================

set -e

# 服务器配置
SERVER_IP="192.168.31.40"
SERVER_USER="aiden"
SERVER_PASSWORD="633234001"
REMOTE_DIR="/Users/mac/donhauser"

PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)
EXPORT_DIR="$PROJECT_DIR/deploy-package"

echo "============================================"
echo "部署到服务器: $SERVER_USER@$SERVER_IP"
echo "远程目录: $REMOTE_DIR"
echo "============================================"

# 检查 export 目录是否存在
if [ ! -d "$EXPORT_DIR" ]; then
    echo "❌ 错误: 导出目录不存在"
    echo "请先运行: ./scripts/export-data.sh"
    exit 1
fi

# 检查是否安装了 sshpass
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass 未安装，将使用交互式密码输入"
    echo "提示: 可以通过 'brew install hudochenkov/sshpass/sshpass' 安装"
    SSH_CMD="ssh"
    SCP_CMD="scp"
    RSYNC_CMD="rsync"
else
    SSH_CMD="sshpass -p '$SERVER_PASSWORD' ssh"
    SCP_CMD="sshpass -p '$SERVER_PASSWORD' scp"
    RSYNC_CMD="sshpass -p '$SERVER_PASSWORD' rsync"
fi

echo ""
echo "📡 步骤 1/5: 测试服务器连接..."
echo "============================================"

# 测试连接
if sshpass -p "$SERVER_PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o PubkeyAuthentication=no "$SERVER_USER@$SERVER_IP" "echo '连接成功'"; then
    echo "✅ 服务器连接成功"
else
    echo "❌ 无法连接到服务器，请检查:"
    echo "   - 服务器 IP: $SERVER_IP"
    echo "   - 用户名: $SERVER_USER"
    echo "   - 密码: $SERVER_PASSWORD"
    echo "   - SSH 服务是否运行"
    exit 1
fi

echo ""
echo "📁 步骤 2/5: 创建远程目录..."
echo "============================================"

sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_DIR"

echo "✅ 远程目录已创建"

echo ""
echo "📦 步骤 3/5: 上传项目文件..."
echo "============================================"

# 使用 rsync 上传项目文件
sshpass -p "$SERVER_PASSWORD" rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    -e "ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no" \
    "$EXPORT_DIR/" \
    "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"

echo "✅ 项目文件上传完成"

echo ""
echo "🔧 步骤 4/5: 配置服务器..."
echo "============================================"

# 上传服务器初始化脚本
cat << 'SETUP_SCRIPT' | sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no "$SERVER_USER@$SERVER_IP" "cat > $REMOTE_DIR/server-setup.sh"
#!/bin/bash
# 服务器初始化脚本

REMOTE_DIR="/Users/mac/donhauser"
cd "$REMOTE_DIR"

# macOS Docker Desktop 路径
export PATH="/usr/local/bin:$PATH"

echo "检查 Docker 安装状态..."

# 检查 Docker 是否可用
if ! docker --version &> /dev/null; then
    echo "❌ Docker 未安装或未运行，请先启动 Docker Desktop"
    exit 1
fi

echo "Docker 版本: $(docker --version)"
echo "Docker Compose 版本: $(docker compose version)"

# 重命名配置文件
if [ -f "docker-compose.lan.yml" ]; then
    cp docker-compose.lan.yml docker-compose.yml
    echo "✅ 已使用局域网配置"
fi

# 停止现有容器
echo "停止现有容器..."
docker compose down 2>/dev/null || true

# 启动 MongoDB
echo "启动 MongoDB..."
docker compose up -d mongodb
sleep 10

# 恢复 MongoDB 数据
if [ -d "mongodb-backup/donhauser" ]; then
    echo "恢复 MongoDB 数据..."
    docker cp mongodb-backup/donhauser donhauser-mongodb:/data/restore
    docker exec donhauser-mongodb mongorestore \
        --db=donhauser \
        --drop \
        /data/restore
    docker exec donhauser-mongodb rm -rf /data/restore
    echo "✅ MongoDB 数据恢复完成"
fi

# 恢复 uploads 文件
if [ -d "uploads-backup" ] && [ "$(ls -A uploads-backup)" ]; then
    echo "恢复 uploads 文件..."
    docker compose up -d backend
    sleep 5
    docker cp uploads-backup/. donhauser-backend:/app/uploads/
    echo "✅ Uploads 文件恢复完成"
fi

# 重新构建并启动所有服务
echo "构建并启动所有服务..."
docker compose build --no-cache
docker compose up -d

echo ""
echo "============================================"
echo "✅ 部署完成！"
echo "============================================"
echo ""
echo "访问地址:"
echo "  - 前端: http://192.168.31.40:3001"
echo "  - 后端API: http://192.168.31.40:3000"
echo "  - MongoDB Express: http://192.168.31.40:8081"
echo "    用户名: aiden"
echo "    密码: 633234001"
echo ""
echo "查看日志: docker compose logs -f"
echo "重启服务: docker compose restart"
echo "停止服务: docker compose down"
SETUP_SCRIPT

echo "✅ 服务器配置脚本已上传"

echo ""
echo "🚀 步骤 5/5: 执行服务器部署..."
echo "============================================"

echo "正在服务器上执行部署脚本..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no "$SERVER_USER@$SERVER_IP" "chmod +x $REMOTE_DIR/server-setup.sh && $REMOTE_DIR/server-setup.sh"

echo ""
echo "============================================"
echo "🎉 部署完成！"
echo "============================================"
echo ""
echo "局域网访问地址:"
echo "  📱 前端页面: http://192.168.31.40:3001"
echo "  🔌 后端 API: http://192.168.31.40:3000"
echo "  🗄️  数据库管理: http://192.168.31.40:8081"
echo ""

