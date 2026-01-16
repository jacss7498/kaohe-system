# Docker部署成功

## 部署信息

**部署时间**: 2025-12-26
**服务器IP**: 192.168.0.110
**部署方式**: Docker Compose

## 服务访问地址

- **前端地址**: http://192.168.0.110:5173
- **后端API地址**: http://192.168.0.110:3002/api
- **健康检查**: http://192.168.0.110:3002/api/health

## 容器状态

| 容器名称 | 镜像 | 端口映射 | 状态 |
|---------|------|---------|------|
| kaohe-frontend | kaohe4-frontend | 5173:80 | 运行中 |
| kaohe-backend | kaohe4-backend | 3002:3001 | 运行中 |

## 常用管理命令

### 查看容器状态
```bash
echo "Sun123456789" | sudo -S docker ps
```

### 查看日志
```bash
# 查看后端日志
echo "Sun123456789" | sudo -S docker compose logs -f backend

# 查看前端日志
echo "Sun123456789" | sudo -S docker compose logs -f frontend

# 查看所有日志
echo "Sun123456789" | sudo -S docker compose logs -f
```

### 重启服务
```bash
# 重启所有服务
echo "Sun123456789" | sudo -S docker compose restart

# 重启单个服务
echo "Sun123456789" | sudo -S docker compose restart backend
echo "Sun123456789" | sudo -S docker compose restart frontend
```

### 停止服务
```bash
echo "Sun123456789" | sudo -S docker compose down
```

### 重新构建并启动
```bash
echo "Sun123456789" | sudo -S docker compose up -d --build
```

### 更新代码后重新部署
```bash
# 1. 停止现有服务
echo "Sun123456789" | sudo -S docker compose down

# 2. 重新构建并启动
echo "Sun123456789" | sudo -S docker compose up -d --build

# 3. 查看日志确认启动成功
echo "Sun123456789" | sudo -S docker compose logs -f
```

## 数据持久化

数据存储在Docker卷中:
- `backend-data`: 数据库文件 (/app/data)
- `backend-logs`: 应用日志 (/app/logs)

### 备份数据
```bash
# 备份数据库
echo "Sun123456789" | sudo -S docker cp kaohe-backend:/app/data ./backup/

# 查看卷位置
echo "Sun123456789" | sudo -S docker volume inspect kaohe4_backend-data
```

## 默认账号

- **管理员账号**: admin
- **默认密码**: admin123 (首次登录后需修改)

## 测试API

```bash
# 健康检查
curl http://192.168.0.110:3002/api/health

# 获取验证码
curl http://192.168.0.110:3002/api/auth/captcha

# 测试登录
curl -X POST http://192.168.0.110:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","captchaId":"test","captchaCode":"1234"}'
```

## 注意事项

1. **首次登录**: 使用 admin/admin123 登录后,系统会强制要求修改密码
2. **网络访问**: 确保服务器防火墙允许 5173 和 3002 端口访问
3. **数据备份**: 定期备份 backend-data 卷中的数据库文件
4. **日志监控**: 定期查看日志,监控系统运行状态
5. **安全性**:
   - JWT_SECRET 已配置强随机密钥
   - 生产环境建议配置HTTPS
   - 建议修改默认密码策略

## 故障排查

### 容器无法启动
```bash
# 查看详细日志
echo "Sun123456789" | sudo -S docker compose logs

# 检查容器状态
echo "Sun123456789" | sudo -S docker ps -a

# 重新构建
echo "Sun123456789" | sudo -S docker compose up -d --build --force-recreate
```

### 无法访问服务
1. 检查容器是否运行: `sudo docker ps`
2. 检查端口是否被占用: `netstat -tlnp | grep -E '5173|3002'`
3. 检查防火墙规则
4. 查看容器日志定位问题

### 数据库问题
```bash
# 进入后端容器
echo "Sun123456789" | sudo -S docker exec -it kaohe-backend sh

# 检查数据库文件
ls -la /app/data/
```

## 性能优化建议

1. **生产环境配置**:
   - 配置nginx缓存策略
   - 启用gzip压缩(已配置)
   - 配置CDN加速静态资源

2. **数据库优化**:
   - 定期清理过期日志
   - 优化查询索引
   - 监控数据库大小

3. **监控告警**:
   - 配置容器健康检查
   - 设置日志告警规则
   - 监控资源使用情况

## 更新记录

- 2025-12-26: 初始部署完成,服务运行正常
