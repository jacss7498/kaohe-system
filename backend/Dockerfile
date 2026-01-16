# 后端Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装构建工具（用于编译原生模块）
RUN apk add --no-cache python3 make g++

# 复制package文件
COPY package*.json ./

# 安装所有依赖（包括devDependencies，用于TypeScript编译）
RUN npm ci

# 复制源代码
COPY . .

# 构建TypeScript
RUN npm run build

# 删除开发依赖，只保留生产依赖，并重新构建原生模块
RUN npm prune --production && \
    npm rebuild sqlite3

# 创建数据和日志目录
RUN mkdir -p /app/data /app/logs

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["node", "dist/index.js"]
