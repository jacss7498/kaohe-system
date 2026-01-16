const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'data', 'kaohe.db');
const db = new sqlite3.Database(dbPath);

console.log('检查admin账号...\n');

db.get('SELECT id, username, password, role, first_login FROM users WHERE username = ?', ['admin'], (err, row) => {
  if (err) {
    console.error('查询错误:', err);
    db.close();
    return;
  }

  if (!row) {
    console.log('❌ admin账号不存在！');

    // 查看所有用户
    db.all('SELECT id, username, role, first_login FROM users', [], (err, rows) => {
      if (err) {
        console.error('查询所有用户错误:', err);
      } else {
        console.log('\n当前所有用户:');
        console.table(rows);
      }
      db.close();
    });
  } else {
    console.log('✅ admin账号存在');
    console.log('用户信息:', {
      id: row.id,
      username: row.username,
      role: row.role,
      first_login: row.first_login,
      password_hash: row.password.substring(0, 20) + '...'
    });

    // 验证密码
    const bcrypt = require('bcrypt');
    const isPasswordValid = bcrypt.compareSync('admin123', row.password);
    console.log(`\n密码验证: ${isPasswordValid ? '✅ 正确' : '❌ 错误'}`);

    db.close();
  }
});
