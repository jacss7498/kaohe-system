# 安装和使用指南

## 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

## 安装步骤

### 1. 安装所有依赖

在项目根目录执行：

```bash
npm run install:all
```

或者分别安装：

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 配置环境变量（可选）

后端默认配置：
- 端口：3001
- JWT密钥：your-secret-key-change-in-production（生产环境请修改）

如需修改，在 `backend` 目录创建 `.env` 文件：

```env
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

### 3. 启动服务

#### 开发模式

**方式一：分别启动（推荐）**

打开两个终端窗口：

```bash
# 终端1：启动后端
npm run dev:backend
# 或
cd backend && npm run dev

# 终端2：启动前端
npm run dev:frontend
# 或
cd frontend && npm run dev
```

**方式二：使用并发工具**

如果安装了 `concurrently`：

```bash
npm install -g concurrently
concurrently "npm run dev:backend" "npm run dev:frontend"
```

#### 生产模式

```bash
# 构建
npm run build:backend
npm run build:frontend

# 启动后端
cd backend
npm start

# 前端构建产物在 frontend/dist 目录，需要部署到Web服务器
```

## 访问系统

- 前端地址：http://localhost:5173
- 后端API：http://localhost:3001

## 默认账号

- **管理员**：用户名 `admin`，密码 `admin123`
- **领导班子成员**：用户名 `pan`, `zhang`, `wang`, `hou`, `li`，密码 `admin123`
- **负责人**：用户名 `manager1` 到 `manager29`，密码 `admin123`

**重要**：首次登录后请及时修改密码！

## 数据库

系统使用 SQLite 数据库，数据库文件位于 `backend/data/kaohe.db`。

首次启动时会自动创建数据库和初始化数据。

## 功能说明

### 管理员功能

1. **用户管理**：创建、管理评分人账号
2. **任务管理**：创建考核任务（科室考核/中队考核），开启/关闭任务
3. **进度监控**：查看各评分人的提交状态
4. **数据统计**：查看考核结果、排名、详细评分记录
5. **数据导出**：导出CSV格式的统计结果

### 评分人功能

1. **查看任务**：查看待完成的评分任务
2. **提交评分**：
   - 为所有被考核对象评分（0-100分整数）
   - 遵守名额限制规则
   - 特殊评分需填写说明
   - 电子签名确认
3. **查看进度**：查看自己的提交状态

## 评分规则

### 科室考核
- 优秀（90-100分）：限选 **1名**
- 良好（80-89分）：限选 **2名**
- 一般（60-79分）：不限
- 其他（0-59分）：不限

### 中队考核
- 优秀（90-100分）：限选 **2名**
- 良好（80-89分）：限选 **5名**
- 一般（60-79分）：不限
- 其他（0-59分）：不限

### 特殊说明要求
- 评分100分或低于60分，必须填写说明理由

## 分数计算规则

### 科室
- 领导班子折合分：最高分40分，其他按比例计算
- 互评折合分：最高分30分，其他按比例计算
- 总分 = 领导班子折合分 + 互评折合分

### 中队
- 领导班子折合分：最高分25分，其他按比例计算
- 互评折合分：最高分15分，其他按比例计算
- 总分 = 领导班子折合分 + 互评折合分

## 常见问题

### 1. 端口被占用

修改 `backend/.env` 中的 `PORT` 或 `frontend/vite.config.ts` 中的端口配置。

### 2. 数据库初始化失败

检查 `backend/data` 目录的写入权限。

### 3. 前端无法连接后端

检查后端是否正常启动，以及 `frontend/vite.config.ts` 中的代理配置。

### 4. 移动端访问

确保手机和电脑在同一网络，使用电脑的IP地址访问，例如：`http://192.168.1.100:5173`

## 技术支持

如遇问题，请检查：
1. Node.js 版本是否符合要求
2. 依赖是否完整安装
3. 端口是否被占用
4. 数据库文件权限










