# 使用 Node.js 20 镜像（Next.js 16 要求）
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 构建参数 - 支持自定义 API URL
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1

# 根据 NODE_ENV 决定构建或开发模式
# 默认为开发模式
ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV

# 暴露端口
EXPOSE 3001

# 启动命令：开发模式使用 dev，生产模式使用 start
# 使用 shell 形式以支持环境变量条件判断
CMD if [ "$NODE_ENV" = "production" ]; then npm run build && npm run start -- -p 3001; else npm run dev -- -p 3001; fi

