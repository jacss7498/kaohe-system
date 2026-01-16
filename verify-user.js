const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = '/app/data/kaohe.db';
const db = new sqlite3.Database(dbPath);

console.log('检查韩冬账号...\n');

db.get('SELECT id, username, password, role, first_login, name FROM users WHERE name = ?', ['韩冬'], (err, row) => {
  if (err) {
    console.error('查询错误:', err);
    db.close();
    return;
  }

  if (!row) {
    console.log('❌ 韩冬账号不存在！');
    db.close();
    return;
  }

  console.log('✅ 韩冬账号存在');
  console.log('用户信息:', {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    first_login: row.first_login
  });

  // 验证密码
  const testPassword = '15339906679';
  const isPasswordValid = bcrypt.compareSync(testPassword, row.password);
  console.log(`\n密码验证 (${testPassword}): ${isPasswordValid ? '✅ 正确' : '❌ 错误'}`);

  if (!isPasswordValid) {
    console.log('\n尝试其他可能的密码...');
    const otherPasswords = ['123456', 'handong', row.username];
    otherPasswords.forEach(pwd => {
      const valid = bcrypt.compareSync(pwd, row.password);
      if (valid) {
        console.log(`✅ 密码是: ${pwd}`);
      }
    });
  }

  db.close();
});
