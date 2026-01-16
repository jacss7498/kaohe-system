# 强制修改密码功能说明

## 更新时间
2025-12-26

## 功能状态
✅ **后端已修复并验证通过**
✅ **前端已重新构建**
✅ **功能已启用**

## 测试验证结果

### 后端API测试

```
测试账号: 韩冬
初始密码: 123456

登录响应:
- mustChangePassword: ✅ 是 (true)

/auth/me响应:
- mustChangePassword: ✅ 是 (true)

结论: ✅ 后端返回正确
```

### 前端状态

- ✅ 前端已使用 `--no-cache` 重新构建
- ✅ 前端容器已重启
- ✅ 登录页面包含跳转逻辑
- ✅ 强制修改密码页面存在

## 如何验证功能

### 方法1: 浏览器测试（推荐）

1. **清除浏览器缓存**（重要！）
   - Chrome/Edge: 按 `Ctrl+Shift+Delete`，选择"缓存的图片和文件"
   - 或者使用无痕/隐私模式: `Ctrl+Shift+N`

2. **访问登录页面**
   ```
   http://192.168.0.110:5173/login
   ```

3. **使用测试账号登录**
   - 用户名: `韩冬`（或任何其他非管理员账号）
   - 密码: `123456`
   - 填写验证码

4. **预期结果**
   - ✅ 登录成功后，应该自动跳转到 `/force-change-password` 页面
   - ✅ 页面要求输入新密码（至少6位）
   - ✅ 修改密码成功后，跳转到 `/dashboard`

### 方法2: 开发者工具检查

如果仍然没有跳转，请按以下步骤检查：

1. **打开浏览器开发者工具**
   - 按 `F12` 或 `Ctrl+Shift+I`

2. **切换到Console（控制台）标签**

3. **登录后查看日志**
   - 应该能看到登录请求的响应
   - 检查 `user.mustChangePassword` 的值

4. **切换到Network（网络）标签**
   - 刷新页面并重新登录
   - 找到 `/auth/login` 请求
   - 查看Response（响应）
   - 确认 `user.mustChangePassword` 是否为 `true`

### 方法3: 强制刷新页面

如果浏览器缓存了旧的JavaScript文件：

1. **清除网站数据**
   - Chrome/Edge: `F12` → Application → Storage → Clear site data

2. **硬刷新**
   - Windows: `Ctrl+F5` 或 `Ctrl+Shift+R`
   - Mac: `Cmd+Shift+R`

3. **重新登录测试**

## 可能的问题

### 问题1: 浏览器缓存

**症状**: 登录后直接跳转到dashboard，没有要求修改密码

**原因**: 浏览器缓存了旧版本的前端代码

**解决方案**:
1. 清除浏览器缓存
2. 使用无痕/隐私模式
3. 硬刷新页面 (`Ctrl+F5`)

### 问题2: 前端容器未更新

**症状**: 清除缓存后仍然没有跳转

**解决方案**:
```bash
# 强制重新构建并重启前端
echo "Sun123456789" | sudo -S docker compose build --no-cache frontend
echo "Sun123456789" | sudo -S docker compose up -d frontend
```

### 问题3: 后端数据不同步

**症状**: 登录成功但 mustChangePassword 为 false

**解决方案**:
```bash
# 检查数据库中的 must_change_password 字段
echo "Sun123456789" | sudo -S docker exec kaohe-backend node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/app/data/kaohe.db');
db.get('SELECT username, must_change_password FROM users WHERE username = ?',
  ['韩冬'],
  (err, row) => {
    if (!err && row) {
      console.log('用户:', row.username);
      console.log('must_change_password:', row.must_change_password);
    }
    db.close();
  }
);
"
```

## 已完成的修复

1. ✅ 添加了数据库缺失的 `must_change_password` 列
2. ✅ 修复了 `/auth/login` 接口返回值
3. ✅ 修复了 `/auth/me` 接口返回值
4. ✅ 修复了 `/first-change-password` 接口
5. ✅ 初始化了所有用户的 `must_change_password = 1`
6. ✅ 重新构建了后端容器
7. ✅ 重新构建了前端容器（无缓存）

## 管理员账号特殊说明

**管理员账号不需要强制修改密码**：
- 用户名: `admin`
- 密码: `admin123`
- `must_change_password = 0`
- 登录后直接进入dashboard

## 验证命令

### 快速验证后端

```bash
node test-full-login.js
```

### 查看所有用户的 must_change_password 状态

```bash
echo "Sun123456789" | sudo -S docker exec kaohe-backend node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/app/data/kaohe.db');
db.all('SELECT username, name, must_change_password FROM users ORDER BY id LIMIT 10',
  (err, rows) => {
    if (!err) console.table(rows);
    db.close();
  }
);
"
```

## 下一步

如果清除浏览器缓存后仍然不能强制修改密码，请：

1. 提供浏览器控制台的日志截图
2. 提供Network标签中 `/auth/login` 响应的截图
3. 确认访问的URL是否正确

## 技术细节

### 登录流程

1. 用户输入用户名、密码、验证码
2. 调用 `POST /api/auth/login`
3. 后端验证成功，返回 token 和 user 对象
4. 前端保存 token 到 localStorage
5. 前端延迟100ms后调用 `GET /api/auth/me`
6. 检查 `user.mustChangePassword`
7. 如果为 true，跳转到 `/force-change-password`
8. 如果为 false，跳转到 `/dashboard`

### 强制修改密码页面

- 路径: `/force-change-password`
- 组件: `ForceChangePassword.tsx`
- API: `POST /api/auth/first-change-password`
- 成功后: 设置 `must_change_password = 0`，跳转到 `/dashboard`
