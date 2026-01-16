const sqlite3 = require('sqlite3').verbose();
const dbPath = '/app/data/kaohe.db';
const db = new sqlite3.Database(dbPath);

console.log('检查users表结构...\n');

db.all("PRAGMA table_info(users)", (err, columns) => {
  if (err) {
    console.error('查询表结构失败:', err);
    return;
  }

  console.log('users表的列:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });

  // 查询几个用户
  console.log('\n查询用户示例:');
  db.all('SELECT * FROM users LIMIT 3', (err, users) => {
    if (err) {
      console.error('查询用户失败:', err);
    } else {
      console.log(users);
    }
    db.close();
  });
});
