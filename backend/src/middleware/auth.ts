import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 生产环境必须设置自定义JWT密钥
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'your-secret-key-change-in-production') {
  throw new Error('生产环境必须设置自定义JWT密钥！请在.env文件中设置JWT_SECRET环境变量');
}

export function generateToken(user: { id: number; username: string; name: string; role: string }): string {
  return jwt.sign(
    { id: user.id, username: user.username, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: '无效的认证令牌' });
    }
    req.user = user;
    next();
  });
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}










