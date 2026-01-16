# Zeabur 部署指南

## 第一步：推送代码到 GitHub

### 1.1 在 GitHub 上创建仓库

1. 打开 https://github.com
2. 点击右上角的 **"+"** → **"New repository"**
3. 填写仓库名称（例如 `kaohe-system`）
4. 可以选择 **Private**（私有）或 **Public**（公开）
5. **不要勾选** "Add a README file"（因为我们已经有代码了）
6. 点击 **"Create repository"**
7. 创建完成后，复制页面上显示的仓库地址（类似 `https://github.com/你的用户名/kaohe-system.git`）

### 1.2 在项目文件夹中打开终端

**方法一**：在 VS Code 中按 `` Ctrl+` `` 打开终端

**方法二**：
1. 打开文件资源管理器，进入项目文件夹 `D:\kaohe5\kaohe4`
2. 在地址栏输入 `cmd` 然后按回车

### 1.3 执行 Git 命令

依次复制粘贴执行以下命令（每行一个命令）：

```bash
git init
```
（初始化 Git 仓库，只需执行一次）

```bash
git add .
```
（添加所有文件）

```bash
git commit -m "初始提交"
```
（提交代码）

```bash
git branch -M main
```
（将分支改名为 main）

```bash
git remote add origin https://github.com/你的用户名/仓库名.git
```
⚠️ **注意**：把上面的地址换成你在 1.1 步骤中复制的地址！

```bash
git push -u origin main
```
（推送代码到 GitHub）

如果提示输入用户名和密码：
- 用户名：你的 GitHub 用户名
- 密码：需要使用 **Personal Access Token**（不是 GitHub 登录密码）
  - 在 GitHub → Settings → Developer settings → Personal access tokens → Generate new token 创建

---

## 第二步：在 Zeabur 部署

### 2.1 注册/登录 Zeabur
访问 https://zeabur.com 并用 GitHub 账号登录

### 2.2 创建项目
点击 **"Create Project"** 创建新项目

### 2.3 部署后端服务
1. 点击 **"Add Service"** → **"Deploy from GitHub"**
2. 选择你的仓库
3. **重要**：选择 **`backend`** 目录
4. 等待部署完成
5. 点击 **"Networking"** → **"Generate Domain"** 获取后端域名（如 `xxx-backend.zeabur.app`）

### 2.4 配置后端环境变量
在后端服务的 **"Variables"** 中添加：
| 变量名 | 值 |
|--------|-----|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `随便输入一串复杂的字符` |

### 2.5 部署前端服务
1. 再次点击 **"Add Service"** → **"Deploy from GitHub"**
2. 选择同一个仓库
3. **重要**：选择 **`frontend`** 目录
4. 等待部署完成

### 2.6 配置前端环境变量
在前端服务的 **"Variables"** 中添加：
| 变量名 | 值 |
|--------|-----|
| `VITE_API_URL` | `https://你的后端域名/api`（例如 `https://xxx-backend.zeabur.app/api`）|

### 2.7 生成前端域名
点击前端服务的 **"Networking"** → **"Generate Domain"**

---

## 第三步：更新后端 CORS 配置

部署完成后，在后端服务的 **"Variables"** 中添加/修改：
| 变量名 | 值 |
|--------|-----|
| `CORS_ORIGIN` | `https://你的前端域名`（例如 `https://xxx-frontend.zeabur.app`）|

---

## 完成！

现在访问你的前端域名就可以使用了！

**默认管理员账号**：
- 用户名：`admin`
- 密码：`admin123`（首次登录需修改）
