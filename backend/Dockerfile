# 使用官方的Node.js 18镜像作为基础镜像
FROM node:18-alpine

# 安装Puppeteer所需的Chromium依赖 + Docker CLI（开发工具用）
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-cjk \
    docker-cli \
    docker-cli-compose

# 设置Puppeteer环境变量，使用系统安装的Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖
RUN npm ci

# 复制所有源代码
COPY . .

# docs目录已经通过COPY . .复制了

# 创建上传目录
RUN mkdir -p uploads

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 改变文件所有权
RUN chown -R nodejs:nodejs /app

USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# 以开发模式启动应用（暂时跳过编译）
CMD ["npm", "run", "dev"]
