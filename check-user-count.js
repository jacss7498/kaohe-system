const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/app/data/kaohe.db');

console.log('=== 用户账户统计 ===\n');

// 统计各类用户数量
db.all(`
  SELECT
    role,
    COUNT(*) as count
  FROM users
  GROUP BY role
  ORDER BY role
`, (err, rows) => {
  if (err) {
    console.error('查询错误:', err);
    return;
  }

  let total = 0;
  console.log('角色分布：');
  rows.forEach(row => {
    console.log(`  ${row.role}: ${row.count} 人`);
    total += row.count;
  });
  console.log(`\n总用户数: ${total} 人`);

  // 统计活跃评分人（leader和manager）
  db.get(`
    SELECT COUNT(*) as scorer_count
    FROM users
    WHERE role IN ('leader', 'manager') AND username != 'admin'
  `, (err, result) => {
    if (err) {
      console.error('查询错误:', err);
      return;
    }
    console.log(`\n可评分用户数（leader + manager，不含admin）: ${result.scorer_count} 人`);
    console.log('\n这些用户可能会同时在线进行评分操作。');

    db.close();
  });
});
