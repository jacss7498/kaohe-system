const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const dbPath = '/app/data/kaohe.db';
const db = new sqlite3.Database(dbPath);

console.log('查找韩冬用户...\n');

db.get('SELECT * FROM users WHERE name = ? OR username = ?', ['韩冬', '韩冬'], (err, user) => {
  if (err) {
    console.error('查询失败:', err);
    db.close();
    return;
  }

  if (!user) {
    console.log('❌ 找不到韩冬用户');

    // 显示所有用户
    console.log('\n当前所有用户:');
    db.all('SELECT id, username, name, role FROM users ORDER BY id', (err, users) => {
      if (err) {
        console.error('查询用户列表失败:', err);
      } else {
        users.forEach(u => {
          console.log(`ID: ${u.id}, 用户名: ${u.username}, 姓名: ${u.name}, 角色: ${u.role}`);
        });
      }
      db.close();
    });
  } else {
    console.log('✅ 找到韩冬用户:');
    console.log('ID:', user.id);
    console.log('用户名:', user.username);
    console.log('姓名:', user.name);
    console.log('角色:', user.role);

    //  测试密码
    console.log('\n测试密码:');
    const passwords = ['123456', '15339906679', 'handong', user.username];
    passwords.forEach(pwd => {
      const match = bcrypt.compareSync(pwd, user.password);
      console.log(`${pwd}: ${match ? '✅ 正确' : '❌ 错误'}`);
    });

    db.close();
  }
});
