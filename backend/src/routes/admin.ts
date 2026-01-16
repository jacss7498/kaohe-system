import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { sortDepartments } from '../utils/departmentOrder';
import { getTaskStatistics } from '../utils/statistics';

const router = express.Router();

// 所有路由需要管理员权限
router.use(authenticateToken);
router.use(requireRole('admin'));

// 获取所有用户
router.get('/users', (req: AuthRequest, res) => {
  db.all(
    'SELECT id, username, name, role, created_at FROM users ORDER BY role, id',
    [],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: '查询用户失败' });
      }
      res.json(users);
    }
  );
});

// 创建用户
router.post('/users', (req: AuthRequest, res) => {
  const { username, password, name, role } = req.body;

  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: '所有字段不能为空' });
  }

  if (!['admin', 'leader', 'manager'].includes(role)) {
    return res.status(400).json({ error: '无效的角色' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
    [username, hashedPassword, name, role],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: '用户名已存在' });
        }
        return res.status(500).json({ error: '创建用户失败' });
      }
      res.json({ id: this.lastID, username, name, role });
    }
  );
});

// 更新用户信息 - 必须在DELETE路由之前定义
router.put('/users/:id', (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = parseInt(id);
  const { username, name, role } = req.body;

  console.log('=== 更新用户请求 ===');
  console.log('请求参数:', { id, userId, username, name, role });
  console.log('请求头:', req.headers);
  console.log('用户信息:', req.user);

  if (!username || !name || !role) {
    return res.status(400).json({ error: '用户名、姓名和角色不能为空' });
  }

  if (!['admin', 'leader', 'manager'].includes(role)) {
    return res.status(400).json({ error: '无效的角色' });
  }

  if (isNaN(userId)) {
    return res.status(400).json({ error: '无效的用户ID' });
  }

  // 先检查用户是否存在
  db.get('SELECT id, username, name, role FROM users WHERE id = ?', [userId], (err, existingUser: any) => {
    if (err) {
      console.error('查询用户错误:', err);
      return res.status(500).json({ error: '查询用户失败: ' + err.message });
    }
    if (!existingUser) {
      console.log('用户不存在:', userId);
      return res.status(404).json({ error: '用户不存在' });
    }

    console.log('现有用户信息:', existingUser);

    // 检查是否有任何字段需要更新
    const needsUpdate = 
      existingUser.username !== username || 
      existingUser.name !== name || 
      existingUser.role !== role;

    if (!needsUpdate) {
      return res.status(400).json({ error: '没有需要更新的数据' });
    }

    // 如果用户名改变了，检查新用户名是否已存在
    if (existingUser.username !== username) {
      console.log('检查用户名冲突:', username);
      db.get('SELECT id FROM users WHERE username = ?', [username], (err, conflict: any) => {
        if (err) {
          console.error('检查用户名错误:', err);
          return res.status(500).json({ error: '检查用户名失败: ' + err.message });
        }
        if (conflict && conflict.id !== userId) {
          console.log('用户名冲突:', conflict);
          return res.status(400).json({ error: '用户名已存在' });
        }

        // 执行更新
        performUpdate();
      });
    } else {
      // 用户名没变，直接更新
      performUpdate();
    }
  });

  function performUpdate() {
    console.log('执行更新:', { userId, username, name, role });
    db.run(
      'UPDATE users SET username = ?, name = ?, role = ? WHERE id = ?',
      [username.trim(), name.trim(), role, userId],
      function(err) {
        if (err) {
          console.error('更新用户SQL错误:', err);
          console.error('错误详情:', {
            message: err.message,
            code: (err as any).code,
            errno: (err as any).errno
          });
          
          // SQLite UNIQUE约束错误码是 SQLITE_CONSTRAINT_UNIQUE (2067)
          if (err.message && (
            err.message.includes('UNIQUE') || 
            err.message.includes('unique constraint') ||
            (err as any).code === 'SQLITE_CONSTRAINT' ||
            (err as any).errno === 19
          )) {
            return res.status(400).json({ error: '用户名已存在，请选择其他用户名' });
          }
          
          return res.status(500).json({ 
            error: '更新用户失败: ' + (err.message || '未知错误'),
            details: process.env.NODE_ENV === 'development' ? err.toString() : undefined
          });
        }
        
        console.log('更新成功，影响行数:', this.changes);
        
        // 即使没有变更，也返回成功（因为可能是数据相同）
        res.json({ message: '用户信息更新成功' });
      }
    );
  }
});

// 重置用户密码
router.post('/users/:id/reset-password', (req: AuthRequest, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: '新密码不能为空' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'UPDATE users SET password = ? WHERE id = ?',
    [hashedPassword, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '重置密码失败' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json({ message: '密码重置成功' });
    }
  );
});

// 删除所有非管理员用户
router.delete('/users/all', (req: AuthRequest, res) => {
  console.log('=== 删除所有非管理员用户请求 ===');
  console.log('操作人:', req.user!.name);

  // 使用事务删除所有非管理员用户及其评分记录
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (beginErr) => {
      if (beginErr) {
        console.error('开始事务错误:', beginErr);
        return res.status(500).json({ error: '开始事务失败: ' + beginErr.message });
      }

      // 先获取所有非管理员用户的ID
      db.all('SELECT id FROM users WHERE role != ?', ['admin'], (err, users: any) => {
        if (err) {
          console.error('查询用户错误:', err);
          db.run('ROLLBACK', () => {
            return res.status(500).json({ error: '查询用户失败: ' + err.message });
          });
          return;
        }

        const userIds = users.map((u: any) => u.id);
        console.log('找到非管理员用户数:', userIds.length, '用户ID:', userIds);

        if (userIds.length === 0) {
          db.run('ROLLBACK', () => {
            return res.json({ message: '没有需要删除的用户', deletedUsers: 0, deletedScores: 0 });
          });
          return;
        }

        // 删除这些用户的所有评分记录
        const placeholders = userIds.map(() => '?').join(',');
        db.run(`DELETE FROM scores WHERE scorer_id IN (${placeholders})`, userIds, function(scoreErr) {
          if (scoreErr) {
            console.error('删除评分记录错误:', scoreErr);
            db.run('ROLLBACK', () => {
              return res.status(500).json({ error: '删除评分记录失败: ' + scoreErr.message });
            });
            return;
          }

          const deletedScores = this.changes;
          console.log('已删除评分记录数:', deletedScores);

          // 删除所有非管理员用户
          db.run('DELETE FROM users WHERE role != ?', ['admin'], function(userErr) {
            if (userErr) {
              console.error('删除用户错误:', userErr);
              db.run('ROLLBACK', () => {
                return res.status(500).json({ error: '删除用户失败: ' + userErr.message });
              });
              return;
            }

            const deletedUsers = this.changes;
            console.log('已删除用户数:', deletedUsers);

            // 提交事务
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                console.error('提交事务错误:', commitErr);
                return res.status(500).json({ error: '提交事务失败: ' + commitErr.message });
              }

              console.log('删除成功');
              res.json({ 
                message: `成功删除 ${deletedUsers} 个用户${deletedScores > 0 ? `，同时删除了 ${deletedScores} 条评分记录` : ''}`,
                deletedUsers: deletedUsers,
                deletedScores: deletedScores
              });
            });
          });
        });
      });
    });
  });
});

// 删除用户
router.delete('/users/:id', (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  console.log('=== 删除用户请求 ===');
  console.log('请求参数:', { id, userId });
  console.log('当前登录用户ID:', req.user!.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: '无效的用户ID' });
  }

  // 检查是否是当前登录用户
  if (req.user!.id === userId) {
    return res.status(400).json({ error: '不能删除当前登录的用户' });
  }

  // 先检查用户是否存在
  db.get('SELECT id, username, name FROM users WHERE id = ?', [userId], (err, user: any) => {
    if (err) {
      console.error('查询用户错误:', err);
      return res.status(500).json({ error: '查询用户失败: ' + err.message });
    }
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    console.log('找到用户:', user);

    // 直接删除用户及其评分记录（使用事务确保数据一致性）
    // 无论是否有评分记录，都执行删除操作
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (beginErr) => {
        if (beginErr) {
          console.error('开始事务错误:', beginErr);
          return res.status(500).json({ error: '开始事务失败: ' + beginErr.message });
        }

        // 先删除该用户的所有评分记录（无论是否存在）
        db.run('DELETE FROM scores WHERE scorer_id = ?', [userId], function(scoreErr) {
          if (scoreErr) {
            console.error('删除评分记录错误:', scoreErr);
            db.run('ROLLBACK', () => {
              return res.status(500).json({ error: '删除评分记录失败: ' + scoreErr.message });
            });
            return;
          }

          const deletedScores = this.changes;
          console.log('已删除评分记录数:', deletedScores);

          // 删除用户
          db.run('DELETE FROM users WHERE id = ?', [userId], function(userErr) {
            if (userErr) {
              console.error('删除用户SQL错误:', userErr);
              console.error('错误详情:', {
                message: userErr.message,
                code: (userErr as any).code,
                errno: (userErr as any).errno
              });
              db.run('ROLLBACK', () => {
                return res.status(500).json({ 
                  error: '删除用户失败: ' + (userErr.message || '未知错误'),
                  details: process.env.NODE_ENV === 'development' ? userErr.toString() : undefined
                });
              });
              return;
            }

            if (this.changes === 0) {
              db.run('ROLLBACK', () => {
                return res.status(404).json({ error: '用户不存在' });
              });
              return;
            }

            console.log('删除用户成功，影响行数:', this.changes);

            // 提交事务
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                console.error('提交事务错误:', commitErr);
                return res.status(500).json({ error: '提交事务失败: ' + commitErr.message });
              }

              console.log('删除成功，删除评分记录数:', deletedScores);
              res.json({ 
                message: '用户删除成功' + (deletedScores > 0 ? `，同时删除了 ${deletedScores} 条评分记录` : ''),
                deletedScores: deletedScores
              });
            });
          });
        });
      });
    });
  });
});

// 获取评分进度
router.get('/progress/:taskId', (req: AuthRequest, res) => {
  const { taskId } = req.params;

  // 获取任务信息
  db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task: any) => {
    if (err) {
      return res.status(500).json({ error: '查询任务失败' });
    }
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    // 获取所有评分人
    db.all(
      `SELECT u.id, u.name, u.role,
        (SELECT COUNT(*) FROM scores WHERE task_id = ? AND scorer_id = u.id) as submitted_count,
        (SELECT COUNT(*) FROM departments WHERE type = ?) as total_count
       FROM users u
       WHERE u.role IN ('leader', 'manager') AND u.username != 'admin'
       ORDER BY u.role, u.id`,
      [taskId, task.type],
      (err, users: any) => {
        if (err) {
          return res.status(500).json({ error: '查询进度失败' });
        }

        const progress = users.map((user: any) => ({
          id: user.id,
          name: user.name,
          role: user.role,
          submitted: user.submitted_count === user.total_count,
          progress: {
            submitted: user.submitted_count,
            total: user.total_count,
          },
        }));

        res.json({ task, progress });
      }
    );
  });
});

// 计算并获取统计结果 - 使用优化的查询
router.get('/statistics/:taskId', (req: AuthRequest, res) => {
  const { taskId } = req.params;

  db.get('SELECT * FROM tasks WHERE id = ?', [taskId], async (err, task: any) => {
    if (err) {
      return res.status(500).json({ error: '查询任务失败' });
    }
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    try {
      const results = await getTaskStatistics(parseInt(taskId), task.type);
      res.json({
        task,
        results,
      });
    } catch (error) {
      console.error('计算统计失败:', error);
      res.status(500).json({ error: '计算统计失败' });
    }
  });
});

// 获取详细评分记录
router.get('/scores/:taskId/:targetId', (req: AuthRequest, res) => {
  const { taskId, targetId } = req.params;

  db.all(
    `SELECT s.*, u.name as scorer_name, u.role as scorer_role
     FROM scores s
     JOIN users u ON s.scorer_id = u.id
     WHERE s.task_id = ? AND s.target_id = ?
     ORDER BY u.role, u.id`,
    [taskId, targetId],
    (err, scores) => {
      if (err) {
        return res.status(500).json({ error: '查询评分记录失败' });
      }
      res.json(scores);
    }
  );
});

// 获取所有用户的评分详情（用于导出）
router.get('/export-scores/:taskId', (req: AuthRequest, res) => {
  const { taskId } = req.params;

  // 获取任务信息
  db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task: any) => {
    if (err) {
      return res.status(500).json({ error: '查询任务失败' });
    }
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    // 获取所有被评分对象
    db.all(
      'SELECT * FROM departments WHERE type = ?',
      [task.type],
      (err, targets: any) => {
        if (err) {
          return res.status(500).json({ error: '查询被评分对象失败' });
        }

        // 按照固定顺序排序
        const sortedTargets = sortDepartments(targets, task.type);

        // 获取所有评分人
        db.all(
          `SELECT u.id, u.name, u.role
           FROM users u
           WHERE u.role IN ('leader', 'manager') AND u.username != 'admin'
           ORDER BY u.role, u.id`,
          [],
          (err, scorers: any) => {
            if (err) {
              return res.status(500).json({ error: '查询评分人失败' });
            }

            // 获取所有评分记录，明确指定signature字段
            db.all(
              `SELECT s.id, s.task_id, s.scorer_id, s.target_id, s.score, s.remark, s.signature, s.submitted_at,
                      u.name as scorer_name, u.role as scorer_role
               FROM scores s
               JOIN users u ON s.scorer_id = u.id
               WHERE s.task_id = ?
               ORDER BY s.scorer_id, s.target_id`,
              [taskId],
              (err, scores: any) => {
                if (err) {
                  console.error('查询评分记录失败:', err);
                  return res.status(500).json({ error: '查询评分记录失败' });
                }

                // 构建评分映射
                const scoreMap: Record<string, any> = {};
                // 构建签名映射（每个评分人的签名，从任意一条评分记录中获取）
                const signatureMap: Record<number, string | null> = {};
                
                console.log('=== 导出评分数据调试 ===');
                console.log('评分记录总数:', scores.length);
                if (scores.length > 0) {
                  console.log('第一条评分记录示例:', {
                    scorer_id: scores[0].scorer_id,
                    scorer_name: scores[0].scorer_name,
                    has_signature: !!scores[0].signature,
                    signature_type: typeof scores[0].signature,
                    signature_length: scores[0].signature ? scores[0].signature.length : 0,
                    signature_preview: scores[0].signature ? scores[0].signature.substring(0, 50) : 'null'
                  });
                }
                
                scores.forEach((score: any) => {
                  const key = `${score.scorer_id}_${score.target_id}`;
                  scoreMap[key] = score;
                  
                  // 如果该评分人还没有签名记录，则保存签名
                  if (!signatureMap[score.scorer_id]) {
                    // 直接获取signature字段，不做过多验证
                    const sig = score.signature;
                    
                    // 检查签名是否存在
                    if (sig != null && sig !== '' && sig !== 'null' && sig !== 'undefined') {
                      const sigStr = String(sig).trim();
                      // 只要长度大于0就保存（因为可能是完整的data URI）
                      if (sigStr.length > 0) {
                        signatureMap[score.scorer_id] = sigStr;
                        console.log(`✓ 找到评分人 ${score.scorer_id} (${score.scorer_name}) 的签名，长度: ${sigStr.length}, 前30字符: ${sigStr.substring(0, 30)}`);
                      }
                    }
                  }
                });
                
                console.log('签名映射统计:', {
                  totalScorers: scorers.length,
                  signaturesFound: Object.keys(signatureMap).length,
                  signatureMap: Object.keys(signatureMap).map(id => ({ 
                    scorerId: id, 
                    hasSignature: !!signatureMap[parseInt(id)],
                    signatureLength: signatureMap[parseInt(id)]?.length || 0
                  }))
                });

                // 构建导出数据
                const exportData = scorers.map((scorer: any) => {
                  const signature = signatureMap[scorer.id] || null;
                  console.log(`评分人 ${scorer.name} (ID: ${scorer.id}) 的签名:`, signature ? `存在，长度 ${signature.length}` : '不存在');
                  
                  const row: any = {
                    scorerId: scorer.id,
                    scorerName: scorer.name,
                    scorerRole: scorer.role,
                    signature: signature, // 添加签名信息
                    scores: {},
                  };

                  sortedTargets.forEach((target: any) => {
                    const key = `${scorer.id}_${target.id}`;
                    const score = scoreMap[key];
                    row.scores[target.id] = score
                      ? {
                          score: score.score,
                          remark: score.remark,
                          submitted: true,
                        }
                      : {
                          score: null,
                          remark: null,
                          submitted: false,
                        };
                  });

                  return row;
                });

                res.json({
                  task,
                  targets: sortedTargets,
                  scorers,
                  data: exportData,
                });
              }
            );
          }
        );
      }
    );
  });
});

export default router;

