# Docker部署说明

## 快速开始

### 1. 配置环境变量

复制环境变量示例文件并修改：

```bash
cp .env.example .env
```

**重要：** 必须修改 `JWT_SECRET` 为强随机字符串！

生成安全的JWT密钥：
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. 使用Docker Compose启动

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

### 3. 访问应用

- 前端: http://localhost
- 后端API: http://localhost:3001
- 健康检查: http://localhost:3001/api/health

### 4. 默认账号

- 管理员：用户名 `admin`，密码 `admin123`

**首次登录后请立即修改密码！**

## 单独构建镜像

### 后端
```bash
cd backend
docker build -t kaohe-backend .
docker run -p 3001:3001 -e JWT_SECRET=your-secret kaohe-backend
```

### 前端
```bash
cd frontend
docker build -t kaohe-frontend .
docker run -p 80:80 kaohe-frontend
```

## 数据持久化

Docker Compose配置了两个数据卷：
- `backend-data`: 存储SQLite数据库
- `backend-logs`: 存储应用日志

数据卷位置：
```bash
docker volume inspect kaohe_backend-data
docker volume inspect kaohe_backend-logs
```

## 备份数据

```bash
# 备份数据库
docker cp kaohe-backend:/app/data/kaohe.db ./backup-$(date +%Y%m%d).db

# 备份整个数据卷
docker run --rm -v kaohe_backend-data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz -C /data .
```

## 恢复数据

```bash
# 恢复数据库
docker cp ./backup-20240101.db kaohe-backend:/app/data/kaohe.db
docker-compose restart backend
```

## 生产环境建议

1. **使用外部数据库**: 建议使用PostgreSQL或MySQL替代SQLite
2. **配置反向代理**: 使用Nginx或Traefik作为前端代理
3. **启用HTTPS**: 配置SSL证书
4. **设置资源限制**:
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 512M
   ```
5. **监控和日志**: 集成Prometheus、Grafana、ELK等监控工具

## 故障排查

### 查看容器日志
```bash
docker-compose logs backend
docker-compose logs frontend
```

### 进入容器调试
```bash
docker-compose exec backend sh
docker-compose exec frontend sh
```

### 检查容器健康状态
```bash
docker-compose ps
docker inspect kaohe-backend | grep -A 10 Health
```
