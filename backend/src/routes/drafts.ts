import express from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 保存评分草稿
router.post('/draft', authenticateToken, (req: AuthRequest, res) => {
  const { taskId, draftData } = req.body;
  const userId = req.user!.id;

  if (!taskId || !draftData) {
    return res.status(400).json({ error: '任务ID和草稿数据不能为空' });
  }

  // 检查草稿大小（限制为1MB）
  const draftStr = JSON.stringify(draftData);
  if (draftStr.length > 1024 * 1024) {
    return res.status(400).json({ error: '草稿数据过大' });
  }

  db.run(
    `INSERT OR REPLACE INTO score_drafts (task_id, user_id, draft_data, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    [taskId, userId, draftStr],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '保存草稿失败' });
      }
      res.json({ message: '草稿保存成功' });
    }
  );
});

// 获取评分草稿
router.get('/draft/:taskId', authenticateToken, (req: AuthRequest, res) => {
  const { taskId } = req.params;
  const userId = req.user!.id;

  db.get(
    'SELECT draft_data, updated_at FROM score_drafts WHERE task_id = ? AND user_id = ?',
    [taskId, userId],
    (err, row: any) => {
      if (err) {
        return res.status(500).json({ error: '获取草稿失败' });
      }
      if (!row) {
        return res.json({ draft: null });
      }
      try {
        const draftData = JSON.parse(row.draft_data);
        res.json({ draft: draftData, updatedAt: row.updated_at });
      } catch (e) {
        res.status(500).json({ error: '草稿数据解析失败' });
      }
    }
  );
});

// 删除评分草稿
router.delete('/draft/:taskId', authenticateToken, (req: AuthRequest, res) => {
  const { taskId } = req.params;
  const userId = req.user!.id;

  db.run(
    'DELETE FROM score_drafts WHERE task_id = ? AND user_id = ?',
    [taskId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '删除草稿失败' });
      }
      res.json({ message: '草稿删除成功' });
    }
  );
});

export default router;
