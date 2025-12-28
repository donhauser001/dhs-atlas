#!/bin/bash

# ============================================
# 数据导出脚本 - 导出 MongoDB 数据和 uploads 文件
# ============================================

set -e

PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)
EXPORT_DIR="$PROJECT_DIR/deploy-package"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "============================================"
echo "开始导出数据..."
echo "项目目录: $PROJECT_DIR"
echo "导出目录: $EXPORT_DIR"
echo "============================================"

# 创建导出目录
mkdir -p "$EXPORT_DIR/mongodb-backup"
mkdir -p "$EXPORT_DIR/uploads-backup"

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ 错误: Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

# 检查 MongoDB 容器是否运行
if ! docker ps | grep -q donhauser-mongodb; then
    echo "❌ 错误: MongoDB 容器未运行"
    echo "请先执行: cd $PROJECT_DIR && docker-compose up -d mongodb"
    exit 1
fi

echo ""
echo "📦 步骤 1/3: 导出 MongoDB 数据库..."
echo "============================================"

# 使用 mongodump 导出数据
docker exec donhauser-mongodb mongodump \
    --db=donhauser \
    --out=/data/backup \
    --quiet

# 从容器复制到本地
docker cp donhauser-mongodb:/data/backup/donhauser "$EXPORT_DIR/mongodb-backup/"

# 清理容器内的临时备份
docker exec donhauser-mongodb rm -rf /data/backup

echo "✅ MongoDB 数据导出完成"

echo ""
echo "📁 步骤 2/3: 导出 uploads 文件..."
echo "============================================"

# 获取 uploads volume 的实际路径并复制
UPLOADS_CONTAINER_PATH=$(docker inspect donhauser-backend --format '{{range .Mounts}}{{if eq .Destination "/app/uploads"}}{{.Source}}{{end}}{{end}}')

if [ -n "$UPLOADS_CONTAINER_PATH" ]; then
    # 从容器复制 uploads 目录
    docker cp donhauser-backend:/app/uploads/. "$EXPORT_DIR/uploads-backup/"
    echo "✅ Uploads 文件导出完成"
else
    # 如果容器不存在，尝试从本地复制
    if [ -d "$PROJECT_DIR/backend/uploads" ]; then
        cp -r "$PROJECT_DIR/backend/uploads/"* "$EXPORT_DIR/uploads-backup/" 2>/dev/null || true
        echo "✅ Uploads 文件从本地复制完成"
    else
        echo "⚠️  警告: 未找到 uploads 目录"
    fi
fi

echo ""
echo "📋 步骤 3/3: 复制项目文件..."
echo "============================================"

# 复制必要的项目文件（排除 node_modules 和 backup）
rsync -av --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'backup_*' \
    --exclude 'deploy-package' \
    --exclude '*.log' \
    --exclude '.next' \
    --exclude '.turbo' \
    "$PROJECT_DIR/backend" \
    "$PROJECT_DIR/frontend" \
    "$PROJECT_DIR/docs" \
    "$PROJECT_DIR/docker-compose.lan.yml" \
    "$PROJECT_DIR/README.md" \
    "$PROJECT_DIR/LICENSE" \
    "$EXPORT_DIR/"

# 复制部署脚本
cp "$PROJECT_DIR/scripts/deploy-to-server.sh" "$EXPORT_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR/scripts/server-setup.sh" "$EXPORT_DIR/" 2>/dev/null || true

echo ""
echo "============================================"
echo "✅ 数据导出完成！"
echo "============================================"
echo ""
echo "导出内容:"
echo "  - MongoDB 数据: $EXPORT_DIR/mongodb-backup/"
echo "  - Uploads 文件: $EXPORT_DIR/uploads-backup/"
echo "  - 项目文件: $EXPORT_DIR/"
echo ""
echo "导出目录大小:"
du -sh "$EXPORT_DIR"
echo ""
echo "下一步: 运行 deploy-to-server.sh 将数据部署到服务器"




