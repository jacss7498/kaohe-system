import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface StatResult {
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

interface StatisticsData {
  task: {
    id: number;
    name: string;
    type: string;
  };
  results: StatResult[];
}

export default function AdminStatistics() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [scoreDetails, setScoreDetails] = useState<any[]>([]);

  useEffect(() => {
    if (taskId) {
      fetchStatistics();
    }
  }, [taskId]);

  const fetchStatistics = async () => {
    try {
      const response = await api.get(`/admin/statistics/${taskId}`);
      setData(response.data);
    } catch (error) {
      console.error('获取统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScoreDetails = async (targetId: number) => {
    try {
      const response = await api.get(`/admin/scores/${taskId}/${targetId}`);
      setScoreDetails(response.data);
      setSelectedTarget(targetId);
    } catch (error) {
      console.error('获取评分详情失败:', error);
    }
  };

  const exportToCSV = () => {
    if (!data) return;

    // 创建HTML表格
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>评分统计结果表</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body { 
            font-family: "Microsoft YaHei", Arial, sans-serif; 
            margin: 20px;
            background: #f5f5f5;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 {
            text-align: center;
            color: #333;
            margin-bottom: 10px;
            font-size: 24px;
          }
          .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 14px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: center;
          }
          th {
            background-color: #2196F3;
            color: white;
            font-weight: bold;
            font-size: 15px;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          tr:hover {
            background-color: #f5f5f5;
          }
          .rank-1 { background-color: #FFD700 !important; font-weight: bold; }
          .rank-2 { background-color: #C0C0C0 !important; }
          .rank-3 { background-color: #CD7F32 !important; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>评分统计结果表</h1>
          <div class="subtitle">任务名称：${data.task.name} | 生成时间：${new Date().toLocaleString('zh-CN')}</div>
          <table>
            <thead>
              <tr>
                <th>排名</th>
                <th>名称</th>
                <th>领导班子平均分</th>
                <th>领导班子评分人数</th>
                <th>互评平均分</th>
                <th>互评评分人数</th>
                <th>领导班子折合分</th>
                <th>互评折合分</th>
                <th>总分</th>
              </tr>
            </thead>
            <tbody>
    `;

    data.results.forEach((r: StatResult) => {
      const rankClass = r.rank <= 3 ? `rank-${r.rank}` : '';
      html += `
        <tr class="${rankClass}">
          <td><strong>${r.rank}</strong></td>
          <td>${r.name}</td>
          <td>${r.leaderAvg.toFixed(2)}</td>
          <td>${r.leaderCount}</td>
          <td>${r.managerAvg.toFixed(2)}</td>
          <td>${r.managerCount}</td>
          <td>${r.leaderScore.toFixed(2)}</td>
          <td>${r.managerScore.toFixed(2)}</td>
          <td><strong>${r.totalScore.toFixed(2)}</strong></td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    // 下载HTML文件
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${data.task.name}_评分统计结果表.html`;
    link.click();
  };

  const exportAllScores = async () => {
    if (!taskId) return;

    try {
      const response = await api.get(`/admin/export-scores/${taskId}`);
      const exportData = response.data;
      
      console.log('=== 开始导出评分表 ===');
      console.log('总评分人数:', exportData.data.length);

      // 创建HTML表格
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>评分用户评分表</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body { 
              font-family: "Microsoft YaHei", Arial, sans-serif; 
              margin: 20px;
              background: #f5f5f5;
            }
            .container {
              max-width: 1400px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
              text-align: center;
              color: #333;
              margin-bottom: 10px;
              font-size: 24px;
            }
            .subtitle {
              text-align: center;
              color: #666;
              margin-bottom: 30px;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 13px;
            }
            th, td {
              border: 1px solid #333;
              padding: 8px;
              text-align: center;
              vertical-align: middle;
            }
            th {
              background-color: #2196F3;
              color: white;
              font-weight: bold;
              font-size: 14px;
            }
            .leader-row {
              background-color: #E3F2FD !important;
            }
            .manager-row {
              background-color: #FFF9C4 !important;
            }
            .submitted {
              background-color: #CCFFCC !important;
            }
            .not-submitted {
              background-color: #FFCCCC !important;
            }
            .signature-cell {
              width: 180px;
              height: 70px;
              padding: 5px;
              text-align: center;
              vertical-align: middle;
              position: relative;
              background-color: white !important;
            }
            .signature-img {
              max-width: 160px;
              max-height: 60px;
              display: block;
              margin: 0 auto;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>评分用户评分表</h1>
            <div class="subtitle">任务名称：${exportData.task.name} | 生成时间：${new Date().toLocaleString('zh-CN')}</div>
            <table>
              <thead>
                <tr>
                  <th rowspan="2">序号</th>
                  <th rowspan="2">评分人</th>
                  <th rowspan="2">角色</th>
                  ${exportData.targets.map((t: any) => `<th>${t.name}</th>`).join('')}
                  <th rowspan="2">签名</th>
                </tr>
                <tr>
                  ${exportData.targets.map(() => '<th>分数</th>').join('')}
                </tr>
              </thead>
              <tbody>
      `;

      exportData.data.forEach((row: any, index: number) => {
        const rowClass = row.scorerRole === 'leader' ? 'leader-row' : 'manager-row';
        html += `<tr class="${rowClass}">`;
        html += `<td>${index + 1}</td>`;
        html += `<td>${row.scorerName}</td>`;
        html += `<td>${row.scorerRole === 'leader' ? '领导班子' : '负责人'}</td>`;
        
        exportData.targets.forEach((target: any) => {
          const scoreInfo = row.scores[target.id];
          const cellClass = scoreInfo.submitted ? 'submitted' : 'not-submitted';
          const scoreText = scoreInfo.submitted ? scoreInfo.score : '未评分';
          html += `<td class="${cellClass}">${scoreText}</td>`;
        });
        
        // 添加签名列
        html += `<td class="signature-cell">`;
        if (row.signature) {
          try {
            let signatureStr = String(row.signature).trim();
            if (signatureStr && signatureStr !== '' && signatureStr !== 'null' && signatureStr !== 'undefined') {
              let signatureData = signatureStr;
              if (!signatureData.startsWith('data:image')) {
                signatureData = `data:image/png;base64,${signatureData}`;
              }
              // 转义HTML特殊字符
              const escapedSignature = signatureData.replace(/"/g, '&quot;');
              html += `<img src="${escapedSignature}" alt="${row.scorerName}的签名" class="signature-img" />`;
              console.log(`✓ 评分人 ${row.scorerName}: 签名图片已添加`);
            } else {
              html += '<span style="color: #999;">未签名</span>';
            }
          } catch (error) {
            html += '<span style="color: red;">签名处理错误</span>';
            console.error(`✗ 评分人 ${row.scorerName}: 处理签名出错`, error);
          }
        } else {
          html += '<span style="color: #999;">未签名</span>';
        }
        html += `</td>`;
        
        html += `</tr>`;
      });

      html += `
              </tbody>
            </table>
            <div style="margin-top: 20px; font-size: 12px; color: #666;">
              <p><strong>说明：</strong></p>
              <p><span style="background-color: #CCFFCC; padding: 2px 5px;">绿色</span> = 已评分</p>
              <p><span style="background-color: #FFCCCC; padding: 2px 5px;">红色</span> = 未评分（请假或其他原因）</p>
              <p><span style="background-color: #E3F2FD; padding: 2px 5px;">蓝色行</span> = 领导班子成员</p>
              <p><span style="background-color: #FFF9C4; padding: 2px 5px;">黄色行</span> = 负责人</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // 下载HTML文件
      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${exportData.task.name}_评分用户评分表.html`;
      link.click();

      console.log('✓ HTML文件导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试: ' + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">加载失败</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          {/* 移动端：垂直布局 */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="text-blue-600 hover:text-blue-700 text-sm sm:text-base px-2 sm:px-0"
              >
                ← 返回
              </button>
              <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">
                {data.task.name} - 统计结果
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={exportToCSV}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors min-w-[100px] sm:min-w-0"
              >
                导出统计结果
              </button>
              <button
                onClick={exportAllScores}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-w-[100px] sm:min-w-0"
              >
                导出评分表
              </button>
              <button
                onClick={logout}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors min-w-[100px] sm:min-w-0"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">评分结果排名</h2>
            <p className="text-sm text-gray-600 mt-1">
              {data.task.type === 'department'
                ? '科室评分（领导班子40分 + 互评30分）'
                : '中队评分（领导班子25分 + 互评15分）'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    排名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    领导班子平均分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    互评平均分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    领导班子折合分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    互评折合分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    总分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-lg font-bold ${
                          result.rank === 1
                            ? 'text-yellow-600'
                            : result.rank === 2
                            ? 'text-gray-600'
                            : result.rank === 3
                            ? 'text-orange-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {result.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.leaderAvg.toFixed(2)} ({result.leaderCount}人)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.managerAvg.toFixed(2)} ({result.managerCount}人)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.leaderScore.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.managerScore.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-blue-600">
                        {result.totalScore.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => fetchScoreDetails(result.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedTarget !== null && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">评分详情</h2>
              <button
                onClick={() => setSelectedTarget(null)}
                className="text-gray-600 hover:text-gray-700"
              >
                关闭
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        评分人
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        角色
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        评分
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        说明
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        提交时间
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {scoreDetails.map((score: any) => (
                      <tr key={score.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {score.scorer_name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {score.scorer_role === 'leader' ? '领导班子' : '负责人'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                          {score.score}分
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {score.remark || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {new Date(score.submitted_at).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

