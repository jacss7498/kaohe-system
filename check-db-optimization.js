const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/app/data/kaohe.db');

console.log('=== 检查数据库优化配置 ===\n');

const checks = [
  { name: 'journal_mode', expected: 'wal', description: 'WAL模式（并发优化）' },
  { name: 'synchronous', expected: '1', description: '同步模式' },
  { name: 'cache_size', expected: '-8000', description: '缓存大小（8MB）' },
  { name: 'temp_store', expected: '2', description: '临时存储（内存）' },
  { name: 'locking_mode', expected: 'normal', description: '锁定模式' }
];

let allPassed = true;

function checkPragma(index) {
  if (index >= checks.length) {
    console.log('\n=== 检查完成 ===');
    if (allPassed) {
      console.log('✅ 所有数据库优化配置已正确启用！');
    } else {
      console.log('⚠️  部分配置未生效，可能需要检查。');
    }
    db.close();
    return;
  }

  const check = checks[index];
  db.get(`PRAGMA ${check.name}`, (err, row) => {
    if (err) {
      console.error(`❌ 检查 ${check.name} 失败:`, err.message);
      allPassed = false;
    } else {
      const value = row[check.name];
      const passed = value.toString().toLowerCase() === check.expected.toLowerCase();
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${check.description}: ${value} ${passed ? '' : `(期望: ${check.expected})`}`);
      if (!passed) allPassed = false;
    }
    checkPragma(index + 1);
  });
}

checkPragma(0);
