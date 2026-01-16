import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initDatabase } from './db';
import authRoutes from './routes/auth';
import scoreRoutes from './routes/scores';
import adminRoutes from './routes/admin';
import taskRoutes from './routes/tasks';
import draftRoutes from './routes/drafts';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 信任代理（云平台部署时需要，用于正确获取客户端IP）
app.set('trust proxy', 1);

// 安全性配置：添加helmet保护HTTP头
app.use(helmet());

// CORS配置：限制允许的源
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin.split(',').map(origin => origin.trim()),
  credentials: true,
}));

// 通用限流器
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // Increased from 100 to 1000
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录限流器（更严格）
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS || '100'), // Increased from 5 to 100
  message: '登录尝试次数过多，请15分钟后再试',
  skipSuccessfulRequests: true, // 成功的请求不计入限制
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '10mb' })); // 限制请求体大小
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 初始化数据库
initDatabase().then(() => {
  logger.info('数据库初始化完成');
});

// 应用通用限流器
app.use('/api/', generalLimiter);

// 路由
app.use('/api/auth/login', loginLimiter); // 登录接口应用严格限流
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 全局错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack, url: req.url, method: req.method });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message
  });
});

app.listen(PORT, () => {
  logger.info(`服务器运行在端口 ${PORT}`);
  logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`CORS允许的源: ${corsOrigin}`);
});

