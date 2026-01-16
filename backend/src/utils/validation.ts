import { z } from 'zod';

// 用户相关验证
export const registerSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z.string()
    .min(6, '密码至少6位'),
  name: z.string()
    .min(2, '姓名至少2个字符')
    .max(20, '姓名最多20个字符'),
});

export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
  captchaId: z.string().min(1, '请输入验证码'),
  captchaCode: z.string().min(1, '请输入验证码'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '旧密码不能为空'),
  newPassword: z.string()
    .min(6, '新密码至少6位'),
});

// 任务相关验证
export const createTaskSchema = z.object({
  name: z.string().min(1, '任务名称不能为空').max(100, '任务名称最多100个字符'),
  type: z.enum(['department', 'squad']),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'closed']),
});

// 评分相关验证
export const scoreItemSchema = z.object({
  targetId: z.number().int().positive(),
  score: z.number().int().min(0, '评分不能低于0').max(100, '评分不能高于100'),
  remark: z.string().max(500, '说明最多500个字符').optional().nullable(),
});

export const submitScoresSchema = z.object({
  taskId: z.number().int().positive(),
  scores: z.array(scoreItemSchema).min(1, '至少需要一个评分'),
  signature: z.string().min(1, '签名不能为空'),
});

// 管理员相关验证
export const createUserSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z.string()
    .min(6, '密码至少6位'),
  name: z.string()
    .min(2, '姓名至少2个字符')
    .max(20, '姓名最多20个字符'),
  role: z.enum(['admin', 'leader', 'manager']),
});

export const updateUserSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  name: z.string()
    .min(2, '姓名至少2个字符')
    .max(20, '姓名最多20个字符'),
  role: z.enum(['admin', 'leader', 'manager']),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, '密码至少6位'),
});

// 草稿相关验证
export const saveDraftSchema = z.object({
  taskId: z.number().int().positive(),
  draftData: z.record(z.string(), z.any()), // 允许任意JSON对象
});
