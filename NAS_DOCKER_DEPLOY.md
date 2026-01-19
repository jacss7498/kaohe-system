# NAS Docker 部署指南

## 准备工作

1. 确保你的 NAS 已安装 Docker 和 Docker Compose
2. 确保 NAS 有公网 IP 或已配置端口映射/内网穿透

## 部署步骤

### 1. 上传项目到 NAS

将整个项目文件夹上传到 NAS，例如 `/volume1/docker/kaohe-system/`

### 2. 创建环境变量文件

在项目根目录创建 `.env` 文件：

```bash
# JWT 密钥（请修改为随机复杂字符串）
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string

# 前端访问地址（替换为你的公网地址或域名）
CORS_ORIGIN=http://你的公网IP:5173
```

### 3. 构建并启动服务

在项目根目录执行：

```bash
# 构建镜像并启动
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 配置端口映射

在路由器/NAS 上开放以下端口：
- **5173** → 前端网页
- **3002** → 后端 API（可选，前端会通过 Nginx 代理）

## 访问系统

- **网页地址**: `http://你的公网IP:5173`
- **默认管理员**: 用户名 `admin`，密码 `admin123`（首次登录需修改）

## 常用命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新代码后重新部署
git pull
docker-compose up -d --build

# 查看后端日志
docker-compose logs -f backend

# 进入后端容器
docker exec -it kaohe-backend sh
```

## 数据备份

数据存储在 Docker 卷中，备份命令：

```bash
# 备份数据库
docker cp kaohe-backend:/app/data ./backup-data

# 恢复数据库
docker cp ./backup-data/. kaohe-backend:/app/data
```

## 使用域名访问（可选）

如果你有域名，可以：
1. 将域名解析到你的公网 IP
2. 使用反向代理（如 Nginx Proxy Manager）配置 SSL
