import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * 验证中间件工厂函数
 */
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          error: '验证失败',
          details: errors,
        });
      }
      next(error);
    }
  };
}

/**
 * 验证查询参数
 */
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          error: '查询参数验证失败',
          details: errors,
        });
      }
      next(error);
    }
  };
}

/**
 * 验证路径参数
 */
export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          error: '路径参数验证失败',
          details: errors,
        });
      }
      next(error);
    }
  };
}
