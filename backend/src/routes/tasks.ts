import express from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();

// 获取所有任务（带完成人数统计）
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  db.all(
    `SELECT t.*,
      (SELECT COUNT(*) 
       FROM users u
       WHERE u.role IN ('leader', 'manager') AND u.username != 'admin'
       AND (SELECT COUNT(*) FROM scores WHERE task_id = t.id AND scorer_id = u.id) = 
           (SELECT COUNT(*) FROM departments WHERE type = t.type)) as completed_count,
      (SELECT COUNT(*) 
       FROM users 
       WHERE role IN ('leader', 'manager') AND username != 'admin') as total_count
     FROM tasks t 
     ORDER BY t.created_at DESC`,
    [],
    (err, tasks: any) => {
      if (err) {
        return res.status(500).json({ error: '查询任务失败' });
      }
      
      // 格式化任务数据，添加完成人数统计
      const formattedTasks = tasks.map((task: any) => ({
        id: task.id,
        name: task.name,
        type: task.type,
        status: task.status,
        created_at: task.created_at,
        updated_at: task.updated_at,
        progress: {
          completed: task.completed_count || 0,
          total: task.total_count || 0,
        },
      }));
      
      res.json(formattedTasks);
    }
  );
});

// 获取当前用户的任务列表（根据角色显示可评分任务）
router.get('/my-tasks', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const role = req.user!.role;

  // 获取所有活跃任务
  db.all(
    `SELECT t.*, 
      (SELECT COUNT(*) FROM scores WHERE task_id = t.id AND scorer_id = ?) as submitted_count,
      (SELECT COUNT(*) FROM departments WHERE type = t.type) as total_count
     FROM tasks t 
     WHERE t.status = 'active'
     ORDER BY t.created_at DESC`,
    [userId],
    (err, tasks: any) => {
      if (err) {
        return res.status(500).json({ error: '查询任务失败' });
      }

      if (tasks.length === 0) {
        return res.json([]);
      }

      // 为每个任务查询投票进度
      const taskPromises = tasks.map((task: any) => {
        return new Promise((resolve, reject) => {
          // 获取该任务类型的所有被评分对象数量
          db.get(
            'SELECT COUNT(*) as count FROM departments WHERE type = ?',
            [task.type],
            (err, deptResult: any) => {
              if (err) {
                reject(err);
                return;
              }
              
              const targetCount = deptResult.count || 0;
              
              // 获取总投票人数（所有评分人，排除管理员）
              db.get(
                `SELECT COUNT(*) as count
                 FROM users
                 WHERE role IN ('leader', 'manager') AND username != 'admin'`,
                [],
                (err, voterResult: any) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  
                  const totalVoters = voterResult.count || 0;
                  
                  // 统计完成投票的人数：每个评分人的评分数量等于目标数量（排除管理员）
                  db.all(
                    `SELECT u.id,
                      (SELECT COUNT(*) FROM scores WHERE task_id = ? AND scorer_id = u.id) as score_count
                     FROM users u
                     WHERE u.role IN ('leader', 'manager') AND u.username != 'admin'`,
                    [task.id],
                    (err, voterScores: any) => {
                      if (err) {
                        reject(err);
                        return;
                      }
                      
                      // 统计完成投票的人数
                      const completedVoters = voterScores.filter((v: any) => 
                        v.score_count === targetCount && targetCount > 0
                      ).length;
                      
                      console.log(`任务 ${task.id} (${task.name}): 已完成投票=${completedVoters}, 总投票人数=${totalVoters}, 目标数量=${targetCount}`);
                      
                      resolve({
                        id: task.id,
                        name: task.name,
                        type: task.type,
                        status: task.status,
                        isCompleted: task.submitted_count === targetCount,
                        progress: {
                          submitted: task.submitted_count,
                          total: targetCount,
                        },
                        votingProgress: {
                          completed: completedVoters,
                          total: totalVoters,
                        },
                      });
                    }
                  );
                }
              );
            }
          );
        });
      });

      Promise.all(taskPromises)
        .then((formattedTasks: any) => {
          console.log('返回任务列表，投票进度:', formattedTasks.map((t: any) => ({
            id: t.id,
            name: t.name,
            voting: `${t.votingProgress.completed}/${t.votingProgress.total}`
          })));
          res.json(formattedTasks);
        })
        .catch((err) => {
          console.error('处理任务数据失败:', err);
          res.status(500).json({ error: '处理任务数据失败' });
        });
    }
  );
});

// 创建任务（仅管理员）
router.post('/', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  const { name, type } = req.body;

  if (!name || !type || !['department', 'squad'].includes(type)) {
    return res.status(400).json({ error: '任务名称和类型不能为空，类型必须是department或squad' });
  }

  db.run(
    'INSERT INTO tasks (name, type, status) VALUES (?, ?, ?)',
    [name, type, 'draft'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '创建任务失败' });
      }
      res.json({ id: this.lastID, name, type, status: 'draft' });
    }
  );
});

// 更新任务状态（仅管理员）
router.patch('/:id/status', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['draft', 'active', 'closed'].includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }

  db.run(
    'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '更新任务状态失败' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: '任务不存在' });
      }
      res.json({ message: '任务状态更新成功' });
    }
  );
});

// 删除任务（仅管理员）
router.delete('/:id', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const taskId = parseInt(id);

  if (isNaN(taskId)) {
    return res.status(400).json({ error: '无效的任务ID' });
  }

  // 使用事务删除任务及其评分记录
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (beginErr) => {
      if (beginErr) {
        return res.status(500).json({ error: '开始事务失败: ' + beginErr.message });
      }

      // 先删除该任务的所有评分记录
      db.run('DELETE FROM scores WHERE task_id = ?', [taskId], function(scoreErr) {
        if (scoreErr) {
          db.run('ROLLBACK', () => {
            return res.status(500).json({ error: '删除评分记录失败: ' + scoreErr.message });
          });
          return;
        }

        const deletedScores = this.changes;

        // 删除任务
        db.run('DELETE FROM tasks WHERE id = ?', [taskId], function(taskErr) {
          if (taskErr) {
            db.run('ROLLBACK', () => {
              return res.status(500).json({ error: '删除任务失败: ' + taskErr.message });
            });
            return;
          }

          if (this.changes === 0) {
            db.run('ROLLBACK', () => {
              return res.status(404).json({ error: '任务不存在' });
            });
            return;
          }

          // 提交事务
          db.run('COMMIT', (commitErr) => {
            if (commitErr) {
              return res.status(500).json({ error: '提交事务失败: ' + commitErr.message });
            }
            res.json({ 
              message: '任务删除成功' + (deletedScores > 0 ? `，同时删除了 ${deletedScores} 条评分记录` : ''),
              deletedScores: deletedScores
            });
          });
        });
      });
    });
  });
});

export default router;

