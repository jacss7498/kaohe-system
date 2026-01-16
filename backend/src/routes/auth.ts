import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';
import { createCaptcha, verifyCaptcha } from '../utils/captcha';

const router = express.Router();

// 测试路由（用于调试）
router.get('/test', (req, res) => {
  res.json({ message: 'Auth路由正常工作' });
});

// 用户注册
router.post('/register', (req, res) => {
  const { username, password, name, role } = req.body;

  // 验证输入
  if (!username || !password || !name) {
    return res.status(400).json({ error: '用户名、密码和姓名不能为空' });
  }

  // 去除首尾空格
  const trimmedUsername = username.trim();
  const trimmedName = name.trim();
  const trimmedPassword = password.trim();
  const trimmedRole = role ? role.trim() : 'manager';

  if (!trimmedUsername || !trimmedPassword || !trimmedName) {
    return res.status(400).json({ error: '用户名、密码和姓名不能为空' });
  }

  // 验证角色值
  if (trimmedRole && !['leader', 'manager'].includes(trimmedRole)) {
    return res.status(400).json({ error: '无效的角色类型' });
  }

  // 密码策略：至少6位
  if (trimmedPassword.length < 6) {
    return res.status(400).json({ error: '密码长度至少6位' });
  }

  // 检查用户名是否已存在
  db.get('SELECT id, username FROM users WHERE username = ?', [trimmedUsername], (err, existing: any) => {
    if (err) {
      return res.status(500).json({ error: '数据库查询错误: ' + err.message });
    }

    if (existing) {
      return res.status(400).json({ error: '用户名已存在，请选择其他用户名' });
    }

    // 创建新用户
    const hashedPassword = bcrypt.hashSync(trimmedPassword, 10);

    db.run(
      'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
      [trimmedUsername, hashedPassword, trimmedName, trimmedRole],
      function (err) {
        if (err) {
          if (err.message && err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: '用户名已存在，请选择其他用户名' });
          }

          return res.status(500).json({
            error: '注册失败: ' + (err.message || '未知错误'),
            details: process.env.NODE_ENV === 'development' ? err.toString() : undefined
          });
        }

        res.json({
          message: '注册成功，请登录',
          userId: this.lastID
        });
      }
    );
  });
});

// 获取验证码
router.get('/captcha', (req, res) => {
  const { id, code } = createCaptcha();
  res.json({ id, code });
});

// 登录
router.post('/login', (req, res) => {
  const { username, password, captchaId, captchaCode } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  // 验证验证码
  if (!captchaId || !captchaCode) {
    return res.status(400).json({ error: '请输入验证码' });
  }

  if (!verifyCaptcha(captchaId, captchaCode)) {
    return res.status(400).json({ error: '验证码错误或已过期，请刷新后重试' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    (err, user: any) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      if (!user) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      bcrypt.compare(password, user.password, (err, match) => {
        if (err) {
          return res.status(500).json({ error: '密码验证错误' });
        }

        if (!match) {
          return res.status(401).json({ error: '用户名或密码错误' });
        }

        const token = generateToken({
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        });

        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            unit: user.unit,
            mustChangePassword: user.must_change_password === 1,
          },
        });
      });
    }
  );
});

// 获取当前用户信息
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  // 从数据库获取完整用户信息，包括must_change_password字段
  db.get(
    'SELECT id, username, name, role, unit, must_change_password FROM users WHERE id = ?',
    [req.user!.id],
    (err, user: any) => {
      if (err || !user) {
        return res.status(500).json({ error: '获取用户信息失败' });
      }
      res.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          unit: user.unit,
          mustChangePassword: user.must_change_password === 1,
        }
      });
    }
  );
});

// 首次登录修改密码（不需要验证旧密码）
router.post('/first-change-password', authenticateToken, (req: AuthRequest, res) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: '新密码不能为空' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度至少6位' });
  }

  // 检查用户是否需要强制修改密码
  db.get(
    'SELECT must_change_password FROM users WHERE id = ?',
    [req.user!.id],
    (err, user: any) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      if (user.must_change_password !== 1) {
        return res.status(400).json({ error: '您的账户不需要强制修改密码' });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      db.run(
        'UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?',
        [hashedPassword, req.user!.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: '修改密码失败' });
          }
          res.json({ message: '密码修改成功' });
        }
      );
    }
  );
});

// 修改密码（需要验证旧密码）
router.post('/change-password', authenticateToken, (req: AuthRequest, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '旧密码和新密码不能为空' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度至少6位' });
  }

  db.get(
    'SELECT password FROM users WHERE id = ?',
    [req.user!.id],
    (err, user: any) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      bcrypt.compare(oldPassword, user.password, (err, match) => {
        if (err || !match) {
          return res.status(401).json({ error: '旧密码错误' });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        db.run(
          'UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?',
          [hashedPassword, req.user!.id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: '修改密码失败' });
            }
            res.json({ message: '密码修改成功' });
          }
        );
      });
    }
  );
});

export default router;

