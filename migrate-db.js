const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const dbPath = '/app/data/kaohe.db';
const db = new sqlite3.Database(dbPath);

console.log('开始数据库迁移和用户初始化...\n');

// 步骤1: 添加缺失的列
console.log('步骤1: 添加缺失的列...');
db.serialize(() => {
  // 添加 unit 列
  db.run('ALTER TABLE users ADD COLUMN unit TEXT', (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('添加unit列失败:', err.message);
    } else if (!err) {
      console.log('✅ 添加unit列成功');
    } else {
      console.log('ℹ️  unit列已存在');
    }
  });

  // 添加 must_change_password 列
  db.run('ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 1', (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('添加must_change_password列失败:', err.message);
    } else if (!err) {
      console.log('✅ 添加must_change_password列成功');
    } else {
      console.log('ℹ️  must_change_password列已存在');
    }
  });

  // 等待列添加完成
  setTimeout(() => {
    console.log('\n步骤2: 清理旧用户数据...');

    // 删除除admin外的所有用户
    db.run("DELETE FROM users WHERE username != 'admin'", function(err) {
      if (err) {
        console.error('清理用户失败:', err);
      } else {
        console.log(`✅ 已删除 ${this.changes} 个旧用户`);
      }
    });

    // 更新admin账号
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.run(
      'UPDATE users SET password = ?, must_change_password = 0, unit = ? WHERE username = ?',
      [adminPassword, '系统', 'admin'],
      (err) => {
        if (err) {
          console.error('更新admin失败:', err);
        } else {
          console.log('✅ admin账号已更新');
        }
      }
    );

    setTimeout(() => {
      console.log('\n步骤3: 创建新用户...');

      const password = bcrypt.hashSync('123456', 10);

      // 领导班子成员
      const leaders = [
        { username: '潘庆荣', name: '潘庆荣', role: 'leader', unit: '班子' },
        { username: '张建', name: '张建', role: 'leader', unit: '班子' },
        { username: '王海龙', name: '王海龙', role: 'leader', unit: '班子' },
        { username: '侯绪军', name: '侯绪军', role: 'leader', unit: '班子' },
        { username: '李传刚', name: '李传刚', role: 'leader', unit: '班子' },
      ];

      // 负责人
      const managers = [
        { username: '董军', name: '董军', role: 'manager', unit: '园林绿化中心' },
        { username: '陈衍兵', name: '陈衍兵', role: 'manager', unit: '环境卫生管理服务中心' },
        { username: '吕凯文', name: '吕凯文', role: 'manager', unit: '数字化城市管理指挥中心' },
        { username: '贾同龙', name: '贾同龙', role: 'manager', unit: '单位领导' },
        { username: '曹斌', name: '曹斌', role: 'manager', unit: '单位领导' },
        { username: '张德峰', name: '张德峰', role: 'manager', unit: '单位领导' },
        { username: '秦鲁', name: '秦鲁', role: 'manager', unit: '单位领导' },
        { username: '乔壮壮', name: '乔壮壮', role: 'manager', unit: '单位领导' },
        { username: '张小龙', name: '张小龙', role: 'manager', unit: '综合科' },
        { username: '王大远', name: '王大远', role: 'manager', unit: '政工科' },
        { username: '钱盟', name: '钱盟', role: 'manager', unit: '法制科' },
        { username: '项磊', name: '项磊', role: 'manager', unit: '财务科' },
        { username: '王明生', name: '王明生', role: 'manager', unit: '指挥调度科' },
        { username: '李建民', name: '李建民', role: 'manager', unit: '管理服务科' },
        { username: '张永杰', name: '张永杰', role: 'manager', unit: '直属中队' },
        { username: '韩冬', name: '韩冬', role: 'manager', unit: '新城中队' },
        { username: '辛培峰', name: '辛培峰', role: 'manager', unit: '老城中队' },
        { username: '王新红', name: '王新红', role: 'manager', unit: '潮泉中队' },
        { username: '武保军', name: '武保军', role: 'manager', unit: '高新区中队' },
        { username: '李健', name: '李健', role: 'manager', unit: '湖屯中队' },
        { username: '楚师伟', name: '楚师伟', role: 'manager', unit: '石横中队' },
        { username: '席兆阳', name: '席兆阳', role: 'manager', unit: '桃园中队' },
        { username: '潘向前', name: '潘向前', role: 'manager', unit: '王庄中队' },
        { username: '汪强', name: '汪强', role: 'manager', unit: '仪阳中队' },
        { username: '辛薇', name: '辛薇', role: 'manager', unit: '安临站中队（安站中队）' },
        { username: '秦基梁', name: '秦基梁', role: 'manager', unit: '孙伯中队' },
        { username: '张月金', name: '张月金', role: 'manager', unit: '安驾庄中队（安庄中队）' },
        { username: '李军', name: '李军', role: 'manager', unit: '边院中队' },
        { username: '许林林', name: '许林林', role: 'manager', unit: '汶阳中队' },
      ];

      const allUsers = [...leaders, ...managers];
      let created = 0;
      let failed = 0;

      allUsers.forEach((user, index) => {
        db.run(
          'INSERT INTO users (username, password, name, role, unit, must_change_password) VALUES (?, ?, ?, ?, ?, 1)',
          [user.username, password, user.name, user.role, user.unit],
          function(err) {
            if (err) {
              console.error(`❌ 创建用户 ${user.name} 失败:`, err.message);
              failed++;
            } else {
              created++;
              console.log(`✅ 创建用户: ${user.name} (${user.role} - ${user.unit})`);
            }

            // 最后一个用户处理完后显示统计
            if (index === allUsers.length - 1) {
              setTimeout(() => {
                console.log(`\n步骤4: 统计结果`);
                console.log(`成功创建: ${created} 个用户`);
                console.log(`创建失败: ${failed} 个用户`);

                // 显示所有用户
                db.all('SELECT id, username, name, role, unit, must_change_password FROM users ORDER BY role, id', (err, rows) => {
                  if (!err) {
                    console.log('\n当前所有用户:');
                    console.log('='.repeat(100));
                    console.log('ID'.padEnd(5) + '用户名'.padEnd(12) + '姓名'.padEnd(12) + '角色'.padEnd(15) + '单位'.padEnd(30) + '需修改密码');
                    console.log('='.repeat(100));
                    rows.forEach(row => {
                      const needChange = row.must_change_password === 1 ? '是' : '否';
                      console.log(
                        String(row.id).padEnd(5) +
                        row.username.padEnd(12) +
                        row.name.padEnd(12) +
                        row.role.padEnd(15) +
                        (row.unit || '').padEnd(30) +
                        needChange
                      );
                    });
                    console.log('='.repeat(100));
                    console.log(`\n总计: ${rows.length} 个用户`);
                  }
                  db.close();
                });
              }, 500);
            }
          }
        );
      });
    }, 1000);
  }, 500);
});
