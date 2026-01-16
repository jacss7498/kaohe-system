import { db } from '../db';
import { sortDepartments } from './departmentOrder';

export interface StatisticsResult {
  id: number;
  name: string;
  leaderAvg: number;
  leaderCount: number;
  managerAvg: number;
  managerCount: number;
  leaderScore: number;
  managerScore: number;
  totalScore: number;
  rank: number;
}

/**
 * 优化的统计查询 - 使用单个JOIN查询替代嵌套查询
 */
export function getTaskStatistics(taskId: number, taskType: 'department' | 'squad'): Promise<StatisticsResult[]> {
  return new Promise((resolve, reject) => {
    // 使用单个优化的SQL查询
    const query = `
      SELECT
        d.id,
        d.name,
        AVG(CASE WHEN u.role = 'leader' THEN s.score END) as leader_avg,
        COUNT(CASE WHEN u.role = 'leader' THEN 1 END) as leader_count,
        AVG(CASE WHEN u.role = 'manager' THEN s.score END) as manager_avg,
        COUNT(CASE WHEN u.role = 'manager' THEN 1 END) as manager_count
      FROM departments d
      LEFT JOIN scores s ON s.target_id = d.id AND s.task_id = ?
      LEFT JOIN users u ON u.id = s.scorer_id
      WHERE d.type = ?
      GROUP BY d.id, d.name
      ORDER BY d.id
    `;

    db.all(query, [taskId, taskType], (err, rows: any[]) => {
      if (err) {
        reject(err);
        return;
      }

      // 按照固定顺序排序
      const sortedRows = sortDepartments(rows, taskType);

      // 计算折合分
      const maxLeaderAvg = Math.max(...sortedRows.map((r: any) => r.leader_avg || 0), 1);
      const maxManagerAvg = Math.max(...sortedRows.map((r: any) => r.manager_avg || 0), 1);

      const results: StatisticsResult[] = sortedRows.map((r: any) => {
        let leaderScore = 0;
        let managerScore = 0;

        if (taskType === 'department') {
          // 科室：领导班子40分，互评30分
          leaderScore = maxLeaderAvg > 0 ? (r.leader_avg / maxLeaderAvg) * 40 : 0;
          managerScore = maxManagerAvg > 0 ? (r.manager_avg / maxManagerAvg) * 30 : 0;
        } else {
          // 中队：领导班子25分，互评15分
          leaderScore = maxLeaderAvg > 0 ? (r.leader_avg / maxLeaderAvg) * 25 : 0;
          managerScore = maxManagerAvg > 0 ? (r.manager_avg / maxManagerAvg) * 15 : 0;
        }

        return {
          id: r.id,
          name: r.name,
          leaderAvg: Number((r.leader_avg || 0).toFixed(2)),
          leaderCount: r.leader_count || 0,
          managerAvg: Number((r.manager_avg || 0).toFixed(2)),
          managerCount: r.manager_count || 0,
          leaderScore: Number(leaderScore.toFixed(2)),
          managerScore: Number(managerScore.toFixed(2)),
          totalScore: Number((leaderScore + managerScore).toFixed(2)),
          rank: 0, // 排名稍后计算
        };
      });

      // 排序并添加排名 (处理并列情况)
      results.sort((a, b) => b.totalScore - a.totalScore);
      results.forEach((result, index) => {
        if (index > 0 && Math.abs(result.totalScore - results[index - 1].totalScore) < 0.001) {
          // 如果分数相同（考虑浮点数精度），则排名与上一名相同
          result.rank = results[index - 1].rank;
        } else {
          // 否则排名为当前索引 + 1
          result.rank = index + 1;
        }
      });

      resolve(results);
    });
  });
}
