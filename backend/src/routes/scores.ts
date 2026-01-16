import express from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sortDepartments } from '../utils/departmentOrder';

const router = express.Router();

// 获取指定任务的评分表单数据
router.get('/task/:taskId', authenticateToken, (req: AuthRequest, res) => {
  const { taskId } = req.params;
  const userId = req.user!.id;

  // 获取任务信息
  db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task: any) => {
    if (err) {
      return res.status(500).json({ error: '查询任务失败' });
    }
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    // 获取该任务类型的所有被评分对象
    db.all(
      'SELECT * FROM departments WHERE type = ?',
      [task.type],
      (err, targets: any) => {
        if (err) {
          return res.status(500).json({ error: '查询被评分对象失败' });
        }

        // 按照固定顺序排序
        const sortedTargets = sortDepartments(targets, task.type);

        // 获取用户已提交的评分
        db.all(
          'SELECT * FROM scores WHERE task_id = ? AND scorer_id = ?',
          [taskId, userId],
          (err, scores: any) => {
            if (err) {
              return res.status(500).json({ error: '查询评分失败' });
            }

            // 构建评分映射
            const scoreMap: Record<number, any> = {};
            scores.forEach((score: any) => {
              scoreMap[score.target_id] = score;
            });

            // 合并数据
            const formData = sortedTargets.map((target: any) => ({
              id: target.id,
              name: target.name,
              type: target.type,
              score: scoreMap[target.id]?.score ?? null,
              remark: scoreMap[target.id]?.remark ?? null,
              signature: scoreMap[target.id]?.signature ?? null,
              submitted: !!scoreMap[target.id],
            }));

            res.json({
              task,
              targets: formData,
              isSubmitted: scores.length === targets.length && scores.length > 0,
            });
          }
        );
      }
    );
  });
});

// 提交评分
router.post('/submit', authenticateToken, (req: AuthRequest, res) => {
  const { taskId, scores, signature } = req.body;
  const userId = req.user!.id;

  if (!taskId || !scores || !Array.isArray(scores) || !signature) {
    return res.status(400).json({ error: '任务ID、评分数据和签名不能为空' });
  }

  // 验证任务是否存在且为活跃状态
  db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task: any) => {
    if (err) {
      return res.status(500).json({ error: '查询任务失败' });
    }
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }
    if (task.status !== 'active') {
      return res.status(400).json({ error: '任务未激活，无法提交评分' });
    }

    // 获取被评分对象信息用于验证
    db.all(
      'SELECT id, name FROM departments WHERE type = ?',
      [task.type],
      (err, targets: any) => {
        if (err) {
          return res.status(500).json({ error: '查询被评分对象失败' });
        }

        // 按照固定顺序排序（虽然这里只是用于验证，但保持一致性）
        const sortedTargets = sortDepartments(targets, task.type);

        // 构建名称映射
        const nameMap: Record<number, string> = {};
        sortedTargets.forEach((target: any) => {
          nameMap[target.id] = target.name;
        });

        // 验证评分数据
        const validationResult = validateScores(scores, task.type, nameMap);
        if (!validationResult.valid) {
          return res.status(400).json({ error: validationResult.error });
        }

        // 检查是否已提交
        db.all(
          'SELECT target_id FROM scores WHERE task_id = ? AND scorer_id = ?',
          [taskId, userId],
          (err, existingScores: any) => {
            if (err) {
              return res.status(500).json({ error: '查询已有评分失败' });
            }

            if (existingScores.length > 0) {
              return res.status(400).json({ error: '该任务已提交，无法重复提交' });
            }

            // 开始事务提交所有评分 - 使用批量插入优化性能
            db.serialize(() => {
              db.run('BEGIN TRANSACTION', (err) => {
                if (err) {
                  return res.status(500).json({ error: '开始事务失败' });
                }

                // 批量插入优化：构建一个包含所有数据的SQL语句
                const placeholders = scores.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
                const values: any[] = [];
                scores.forEach((item: any) => {
                  values.push(taskId, userId, item.targetId, item.score, item.remark || null, signature);
                });

                db.run(
                  `INSERT INTO scores (task_id, scorer_id, target_id, score, remark, signature)
                   VALUES ${placeholders}`,
                  values,
                  function(err) {
                    if (err) {
                      db.run('ROLLBACK', () => {
                        res.status(500).json({ error: '提交评分失败: ' + err.message });
                      });
                      return;
                    }

                    db.run('COMMIT', (err) => {
                      if (err) {
                        return res.status(500).json({ error: '提交评分失败' });
                      }
                      res.json({ message: '评分提交成功' });
                    });
                  }
                );
              });
            });
          }
        );
      }
    );
  });
});

// 验证评分规则
function validateScores(scores: any[], type: string, nameMap: Record<number, string>): { valid: boolean; error?: string } {
  // 检查每个评分项
  for (const item of scores) {
    if (typeof item.score !== 'number' || item.score < 0 || item.score > 100) {
      return { valid: false, error: '评分必须在0-100之间' };
    }

    // 检查整数
    if (!Number.isInteger(item.score)) {
      return { valid: false, error: '评分必须为整数' };
    }

    // 检查特殊说明（100分或<60分需要说明）
    const targetName = nameMap[item.targetId] || '该对象';
    if ((item.score === 100 || item.score < 60) && !item.remark) {
      return { valid: false, error: `对${targetName}评分${item.score}分，必须填写说明理由` };
    }
  }

  // 检查名额限制
  const excellentScores = scores.filter(s => s.score >= 90 && s.score <= 100);
  const goodScores = scores.filter(s => s.score >= 80 && s.score < 90);

  if (type === 'department') {
    // 科室：优秀1个，良好2个
    if (excellentScores.length > 1) {
      return { valid: false, error: '优秀科室仅限评选1名，请调整评分' };
    }
    if (goodScores.length > 2) {
      return { valid: false, error: '良好科室仅限评选2名，请调整评分' };
    }
  } else if (type === 'squad') {
    // 中队：优秀2个，良好5个
    if (excellentScores.length > 2) {
      return { valid: false, error: '优秀中队仅限评选2名，请调整评分' };
    }
    if (goodScores.length > 5) {
      return { valid: false, error: '良好中队仅限评选5名，请调整评分' };
    }
  }

  return { valid: true };
}

export default router;
