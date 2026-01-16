const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Use local path relative to backend folder
const dbPath = path.join(__dirname, 'data', 'kaohe.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath);

const targetUser = '韩冬';
console.log(`Searching for user: ${targetUser}...\n`);

db.get('SELECT * FROM users WHERE name = ? OR username = ?', [targetUser, targetUser], (err, user) => {
  if (err) {
    console.error('Query failed:', err);
    db.close();
    return;
  }

  if (!user) {
    console.log(`❌ User ${targetUser} not found`);
    
    // Show user count
    db.get('SELECT count(*) as count FROM users', (err, row) => {
        console.log(`Total users in DB: ${row ? row.count : 'unknown'}`);
        db.close();
    });
  } else {
    console.log(`✅ Found user ${targetUser}:`);
    console.log('ID:', user.id);
    console.log('Username:', user.username);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Must Change Password:', user.must_change_password);

    console.log('\nTesting passwords:');
    const passwords = ['123456', 'handong', user.username];
    passwords.forEach(pwd => {
      const match = bcrypt.compareSync(pwd, user.password);
      console.log(`Password '${pwd}': ${match ? '✅ MATCH' : '❌ INCORRECT'}`);
    });

    db.close();
  }
});
