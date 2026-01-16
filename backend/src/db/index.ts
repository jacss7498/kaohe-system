import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/kaohe.db');

// 确保数据目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new sqlite3.Database(DB_PATH);

export function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 用户表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin', 'leader', 'manager')),
          unit TEXT,
          must_change_password INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 科室表
      db.run(`
        CREATE TABLE IF NOT EXISTS departments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('department', 'squad')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 任务表
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('department', 'squad')),
          status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'closed')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 评分表
      db.run(`
        CREATE TABLE IF NOT EXISTS scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          scorer_id INTEGER NOT NULL,
          target_id INTEGER NOT NULL,
          score INTEGER NOT NULL CHECK(score >= 0 AND score <= 100),
          remark TEXT,
          signature TEXT,
          submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id),
          FOREIGN KEY (scorer_id) REFERENCES users(id),
          FOREIGN KEY (target_id) REFERENCES departments(id),
          UNIQUE(task_id, scorer_id, target_id)
        )
      `);

      // 审计日志表
      db.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          username TEXT NOT NULL,
          action TEXT NOT NULL,
          resource TEXT NOT NULL,
          resource_id INTEGER,
          details TEXT,
          ip_address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // 评分草稿表
      db.run(`
        CREATE TABLE IF NOT EXISTS score_drafts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          draft_data TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id),
          FOREIGN KEY (user_id) REFERENCES users(id),
          UNIQUE(task_id, user_id)
        )
      `);

      // 创建索引以提升查询性能
      db.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
      db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
      db.run('CREATE INDEX IF NOT EXISTS idx_departments_type ON departments(type)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type)');
      db.run('CREATE INDEX IF NOT EXISTS idx_scores_task_id ON scores(task_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_scores_scorer_id ON scores(scorer_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_scores_target_id ON scores(target_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_scores_task_scorer ON scores(task_id, scorer_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)');
      db.run('CREATE INDEX IF NOT EXISTS idx_score_drafts_task_user ON score_drafts(task_id, user_id)');

      // 初始化默认数据
      initDefaultData().then(() => resolve()).catch(reject);
    });
  });
}

async function initDefaultData(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 检查是否已有数据
    db.get('SELECT COUNT(*) as count FROM users', (err, row: any) => {
      if (err) {
        reject(err);
        return;
      }

      if (row.count > 0) {
        resolve();
        return;
      }

      const bcrypt = require('bcryptjs');

      // 创建管理员 (admin role, must_change_password=0)
      const adminPassword = bcrypt.hashSync('admin123', 10);
      db.run(
        'INSERT INTO users (username, password, name, role, unit, must_change_password) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin', adminPassword, '系统管理员', 'admin', '系统', 0],
        (err) => {
          if (err) {
            console.error('创建管理员失败:', err);
          }
        }
      );

      // 创建领导班子成员 (leader role, must_change_password=1, password=123456)
      const leaderPassword = bcrypt.hashSync('123456', 10);
      const leaders = [
        { username: '潘庆荣', name: '潘庆荣', unit: '班子' },
        { username: '张建', name: '张建', unit: '班子' },
        { username: '王海龙', name: '王海龙', unit: '班子' },
        { username: '侯绪军', name: '侯绪军', unit: '班子' },
        { username: '李传刚', name: '李传刚', unit: '班子' },
      ];

      leaders.forEach(leader => {
        db.run(
          'INSERT INTO users (username, password, name, role, unit, must_change_password) VALUES (?, ?, ?, ?, ?, ?)',
          [leader.username, leaderPassword, leader.name, 'leader', leader.unit, 1],
          (err) => {
            if (err) console.error(`创建领导 ${leader.name} 失败:`, err);
          }
        );
      });

      // 创建负责人 (manager role, must_change_password=1, password=123456)
      const managerPassword = bcrypt.hashSync('123456', 10);
      const managers = [
        { username: '董军', name: '董军', unit: '园林绿化中心' },
        { username: '陈衍兵', name: '陈衍兵', unit: '环境卫生管理服务中心' },
        { username: '吕凯文', name: '吕凯文', unit: '数字化城市管理指挥中心' },
        { username: '贾同龙', name: '贾同龙', unit: '单位领导' },
        { username: '曹斌', name: '曹斌', unit: '单位领导' },
        { username: '张德峰', name: '张德峰', unit: '单位领导' },
        { username: '秦鲁', name: '秦鲁', unit: '单位领导' },
        { username: '乔壮壮', name: '乔壮壮', unit: '单位领导' },
        { username: '张小龙', name: '张小龙', unit: '综合科' },
        { username: '王大远', name: '王大远', unit: '政工科' },
        { username: '钱盟', name: '钱盟', unit: '法制科' },
        { username: '项磊', name: '项磊', unit: '财务科' },
        { username: '王明生', name: '王明生', unit: '指挥调度科' },
        { username: '李建民', name: '李建民', unit: '管理服务科' },
        { username: '张永杰', name: '张永杰', unit: '直属中队' },
        { username: '韩冬', name: '韩冬', unit: '新城中队' },
        { username: '辛培峰', name: '辛培峰', unit: '老城中队' },
        { username: '王新红', name: '王新红', unit: '潮泉中队' },
        { username: '武保军', name: '武保军', unit: '高新区中队' },
        { username: '李健', name: '李健', unit: '湖屯中队' },
        { username: '楚师伟', name: '楚师伟', unit: '石横中队' },
        { username: '席兆阳', name: '席兆阳', unit: '桃园中队' },
        { username: '潘向前', name: '潘向前', unit: '王庄中队' },
        { username: '汪强', name: '汪强', unit: '仪阳中队' },
        { username: '辛薇', name: '辛薇', unit: '安临站中队（安站中队）' },
        { username: '秦基梁', name: '秦基梁', unit: '孙伯中队' },
        { username: '张月金', name: '张月金', unit: '安驾庄中队（安庄中队）' },
        { username: '李军', name: '李军', unit: '边院中队' },
        { username: '许林林', name: '许林林', unit: '汶阳中队' },
      ];

      managers.forEach(manager => {
        db.run(
          'INSERT INTO users (username, password, name, role, unit, must_change_password) VALUES (?, ?, ?, ?, ?, ?)',
          [manager.username, managerPassword, manager.name, 'manager', manager.unit, 1],
          (err) => {
            if (err) console.error(`创建负责人 ${manager.name} 失败:`, err);
          }
        );
      });

      // 创建科室
      const departments = [
        '综合科', '政工科', '法制科', '财务科', '指挥调度科', '管理服务科'
      ];

      departments.forEach(dept => {
        db.run(
          'INSERT INTO departments (name, type) VALUES (?, ?)',
          [dept, 'department'],
          (err) => {
            if (err) console.error(`创建科室 ${dept} 失败:`, err);
          }
        );
      });

      // 创建中队
      const squads = [
        '直属中队', '新城中队', '高新区中队', '老城中队', '仪阳中队',
        '潮泉中队', '湖屯中队', '桃园中队', '安临站中队', '汶阳中队',
        '石横中队', '王庄中队', '安驾庄中队', '边院中队', '孙伯中队'
      ];

      squads.forEach(squad => {
        db.run(
          'INSERT INTO departments (name, type) VALUES (?, ?)',
          [squad, 'squad'],
          (err) => {
            if (err) console.error(`创建中队 ${squad} 失败:`, err);
          }
        );
      });

      setTimeout(() => resolve(), 500);
    });
  });
}
