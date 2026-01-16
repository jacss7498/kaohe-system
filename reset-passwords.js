const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = '/app/data/kaohe.db';
const db = new sqlite3.Database(dbPath);

console.log('开始重置所有用户密码...\n');

// admin的密码重置为 admin123 (must_change_password=0)
const adminPassword = bcrypt.hashSync('admin123', 10);
db.run(
  'UPDATE users SET password = ?, must_change_password = 0 WHERE username = ?',
  [adminPassword, 'admin'],
  function(err) {
    if (err) {
      console.error('更新admin密码失败:', err);
    } else {
      console.log('✅ admin密码已重置为: admin123 (无需首次修改)');
    }
  }
);

// 所有leader和manager的密码重置为 123456 (must_change_password=1)
const defaultPassword = bcrypt.hashSync('123456', 10);
db.run(
  'UPDATE users SET password = ?, must_change_password = 1 WHERE role IN (?, ?)',
  [defaultPassword, 'leader', 'manager'],
  function(err) {
    if (err) {
      console.error('更新其他用户密码失败:', err);
    } else {
      console.log(`✅ 已更新 ${this.changes} 个用户的密码为: 123456 (需要首次修改)`);
    }
  }
);

// 列出所有用户
setTimeout(() => {
  db.all('SELECT username, name, role, must_change_password FROM users ORDER BY role, id', (err, rows) => {
    if (err) {
      console.error('查询用户失败:', err);
    } else {
      console.log('\n当前所有用户账号信息:');
      console.log('================================================');
      rows.forEach(row => {
        const pwd = row.role === 'admin' ? 'admin123' : '123456';
        const needChange = row.must_change_password === 1 ? '(首次登录需修改)' : '';
        console.log(`${row.name.padEnd(10)} | 用户名: ${row.username.padEnd(10)} | 角色: ${row.role.padEnd(10)} | 密码: ${pwd} ${needChange}`);
      });
      console.log('================================================');
    }
    db.close();
  });
}, 1000);
