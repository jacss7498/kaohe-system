# 项目问题诊断指南

## 常见问题排查

### 1. 检查服务是否启动

**后端服务检查：**
- 打开浏览器访问：http://localhost:3001/api/health
- 应该看到：`{"status":"ok","message":"服务运行正常"}`

**前端服务检查：**
- 打开浏览器访问：http://localhost:5173
- 应该看到登录页面

### 2. 检查控制台错误

**浏览器控制台（F12）：**
- 查看 Console 标签是否有红色错误
- 查看 Network 标签，检查 API 请求是否失败

**后端控制台：**
- 查看是否有错误信息
- 检查数据库是否初始化成功

### 3. 常见错误及解决方案

#### 错误：无法连接到后端
**症状：** 前端页面显示错误，Network 标签显示请求失败

**解决方案：**
1. 确认后端服务已启动（端口3001）
2. 检查防火墙是否阻止了连接
3. 确认 `frontend/vite.config.ts` 中的代理配置正确

#### 错误：页面空白
**症状：** 浏览器显示空白页面

**解决方案：**
1. 检查浏览器控制台是否有 JavaScript 错误
2. 确认所有依赖已安装：`cd frontend && npm install`
3. 清除浏览器缓存并刷新

#### 错误：路由跳转失败
**症状：** 点击链接后页面无反应或显示404

**解决方案：**
1. 确认 `frontend/src/App.tsx` 中的路由配置正确
2. 检查 `ProtectedRoute` 组件是否正常工作

#### 错误：数据库错误
**症状：** 后端控制台显示数据库相关错误

**解决方案：**
1. 确认 `backend/data/` 目录存在
2. 删除 `backend/data/kaohe.db` 文件，重新启动后端（会自动创建）

### 4. 重新启动服务

如果问题持续，尝试完全重启：

```bash
# 1. 停止所有服务（Ctrl+C）

# 2. 重新安装依赖（如果需要）
cd backend
npm install
cd ../frontend
npm install

# 3. 重新启动
cd ..
npm run dev:backend  # 在一个终端
npm run dev:frontend # 在另一个终端
```

### 5. 检查端口占用

如果端口被占用，可以修改端口：

**后端端口：**
- 修改 `backend/.env` 文件：`PORT=3001`

**前端端口：**
- 修改 `frontend/vite.config.ts`：`port: 5173`

### 6. 清除缓存

```bash
# 清除前端构建缓存
cd frontend
rm -rf node_modules/.vite
rm -rf dist

# 清除后端构建
cd ../backend
rm -rf dist
rm -rf node_modules/.cache
```

## 需要帮助？

如果以上方法都无法解决问题，请提供：
1. 浏览器控制台的错误信息（截图或复制）
2. 后端控制台的错误信息
3. 具体访问的URL和操作步骤
4. 问题发生的具体时间点










