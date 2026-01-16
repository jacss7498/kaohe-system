const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'kaohe.db');
const db = new sqlite3.Database(dbPath);

const targetUser = '韩冬';
const newPassword = '123456';
const hashedPassword = bcrypt.hashSync(newPassword, 10);

console.log(`Resetting password for ${targetUser}...`);

db.run(
    'UPDATE users SET password = ?, must_change_password = 1 WHERE username = ?',
    [hashedPassword, targetUser],
    function (err) {
        if (err) {
            console.error('Reset failed:', err);
        } else {
            console.log(`✅ Password for ${targetUser} has been reset to: ${newPassword}`);
            if (this.changes === 0) {
                console.log('⚠️ Warning: No user found with that username.');
            }
        }
        db.close();
    }
);
