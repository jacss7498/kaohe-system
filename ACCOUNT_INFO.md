# 系统账号信息说明

## 登录问题已解决

**问题原因**:
- `/auth/me` 接口查询了数据库中不存在的 `unit` 和 `must_change_password` 列
- 导致登录后获取用户信息失败(500错误)，前端误以为未登录而跳回登录页

**解决方案**:
- 修复了 `/auth/me` 接口，只查询实际存在的列
- 修复了 `/login` 接口的返回数据
- 修复了 `/first-change-password` 接口
- 重新构建并重启了后端容器

## 重要说明

### 用户名和密码规则

**数据库中的用户名和显示名称是分开的：**
- `username`: 用于登录的用户名（可能是手机号或其他标识）
- `name`: 用户的真实姓名（用于显示）

### 韩冬账号示例

- **显示姓名**: 韩冬
- **登录用户名**: `15339906679` (手机号)
- **登录密码**: `15339906679`

**登录时必须使用 `username` 字段的值，而不是 `name` 字段！**

## 管理员账号

- **用户名**: admin
- **密码**: admin123
- **角色**: 管理员
- **无需首次修改密码**

## 如何查看其他用户的登录信息

由于用户的 `username` 可能与 `name` 不同，建议管理员创建一个查询脚本或界面来查看所有用户的登录凭据。

### 查询脚本示例

```javascript
// 在容器内运行
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/app/data/kaohe.db');

db.all('SELECT id, username, name, role FROM users ORDER BY role, id', (err, rows) => {
  if (!err) {
    console.log('所有用户账号信息:');
    console.table(rows);
  }
  db.close();
});
```

### 使用Docker命令查询

```bash
# 进入容器
echo "Sun123456789" | sudo -S docker exec -it kaohe-backend sh

# 然后在容器内运行Node脚本查询用户
```

## 测试登录

已验证韩冬账号可以正常登录：

```bash
用户名: 15339906679
密码: 15339906679
✅ 登录成功
```

## 建议

1. **创建用户查询接口**: 建议为管理员创建一个界面，可以查看所有用户的 `username` 和 `name`
2. **密码重置功能**: 建议添加管理员重置用户密码的功能
3. **用户管理**: 建议完善用户管理功能，包括查看、编辑、删除用户

## 数据库当前状态

数据库表结构（users表）：
- `id` - 用户ID
- `username` - 登录用户名（可能是手机号、工号等）
- `password` - 密码哈希
- `name` - 真实姓名
- `role` - 角色 (admin/leader/manager)
- `created_at` - 创建时间

**注意**: 数据库中缺少以下列（代码中有引用但表中不存在）：
- `unit` - 单位
- `must_change_password` - 是否需要强制修改密码

这些缺失的列已在代码中做了兼容处理，不影响正常使用。如需完整功能，建议添加数据库迁移脚本。
