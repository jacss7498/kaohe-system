# 快速升级指南

## 升级前准备

### 1. 备份数据
```bash
# 备份数据库
cp backend/data/kaohe.db backend/data/kaohe.db.backup

# 或使用完整备份
tar -czf backup-$(date +%Y%m%d).tar.gz backend/data/
```

### 2. 检查Node.js版本
```bash
node -v  # 确保 >= 16.0.0
npm -v   # 确保 >= 7.0.0
```

## 升级步骤

### 1. 安装新依赖
```bash
cd backend
npm install express-rate-limit helmet winston winston-daily-rotate-file zod

cd ../frontend
# 前端无需新依赖
```

### 2. 配置环境变量
```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，**必须修改**：
```bash
# 生成强随机密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 将生成的密钥填入JWT_SECRET
JWT_SECRET=<生成的密钥>
```

### 3. 重启服务
```bash
# 停止现有服务
# Ctrl+C 或 kill相应进程

# 重新启动
cd backend
npm run dev  # 开发环境

# 或
npm run build && npm start  # 生产环境
```

### 4. 数据库自动迁移
首次启动时会自动：
- 创建 `audit_logs` 表
- 创建 `score_drafts` 表
- 添加所有索引

无需手动操作，日志会显示"数据库初始化完成"。

## 密码策略变更

### 新密码要求
- 最少8位（原6位）
- 必须包含字母
- 必须包含数字

### 处理现有用户
方式一：管理员批量重置
```bash
# 登录管理后台
# 进入用户管理
# 为每个用户重置密码为符合新策略的密码
```

方式二：通知用户修改
- 用户登录后会在修改密码页面收到提示
- 引导用户修改为符合新策略的密码

## Docker部署（可选）

如果想使用Docker部署：

### 1. 创建环境文件
```bash
cp .env.example .env
# 编辑.env，设置JWT_SECRET
```

### 2. 启动容器
```bash
docker-compose up -d
```

### 3. 查看日志
```bash
docker-compose logs -f
```

### 4. 访问应用
- 前端: http://localhost
- 后端API: http://localhost:3001

## 验证升级

### 1. 检查服务状态
```bash
# 访问健康检查端点
curl http://localhost:3001/api/health

# 预期响应
{"status":"ok","message":"服务运行正常"}
```

### 2. 检查日志系统
```bash
# 查看日志目录
ls backend/logs/

# 应该看到类似文件
# combined-2024-12-23.log
# error-2024-12-23.log
```

### 3. 测试新功能
- 登录系统（验证登录限流）
- 创建评分草稿（验证草稿功能）
- 查看日志文件（验证日志系统）

## 常见问题

### Q1: "生产环境必须设置自定义JWT密钥"错误
A: 在 `.env` 文件中设置 `JWT_SECRET` 为强随机字符串

### Q2: 密码不符合新策略
A: 新密码必须至少8位且包含字母和数字

### Q3: 端口被占用
A: 修改 `.env` 中的 `PORT`，或停止占用端口的进程

### Q4: 找不到日志文件
A: 检查 `backend/logs/` 目录，确保有写入权限

### Q5: Docker容器无法启动
A:
1. 检查 `.env` 文件是否正确配置
2. 运行 `docker-compose logs` 查看错误
3. 确保端口80和3001未被占用

## 回滚方案

如果升级出现问题，可以回滚：

### 1. 停止新版本
```bash
# Ctrl+C 停止服务
# 或
docker-compose down  # Docker部署
```

### 2. 恢复代码
```bash
git checkout <previous-commit>
```

### 3. 恢复数据库
```bash
cp backend/data/kaohe.db.backup backend/data/kaohe.db
```

### 4. 重启旧版本
```bash
cd backend
npm run dev
```

## 性能监控

### 查看日志统计
```bash
# 统计错误日志数量
grep -c "ERROR" backend/logs/error-*.log

# 查看最新错误
tail -f backend/logs/error-*.log
```

### 监控数据库性能
```bash
# 进入SQLite
sqlite3 backend/data/kaohe.db

# 查看索引
.indexes

# 查看表结构
.schema scores
```

## 后续优化建议

1. **定期备份**：设置cron任务自动备份数据库
2. **监控日志**：定期检查error日志
3. **性能测试**：使用ab或wrk进行压力测试
4. **安全审计**：定期查看审计日志
5. **数据库升级**：生产环境考虑迁移到PostgreSQL

## 需要帮助？

检查以下文档：
- [README.md](README.md) - 完整项目文档
- [DOCKER.md](DOCKER.md) - Docker部署指南
- [IMPROVEMENTS.md](IMPROVEMENTS.md) - 改进详情
