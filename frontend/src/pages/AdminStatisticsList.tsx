import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface Task {
  id: number;
  name: string;
  type: string;
  status: string;
  created_at: string;
  progress?: {
    completed: number;
    total: number;
  };
}

export default function AdminStatisticsList() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    
    // 每5秒自动刷新一次，实现实时更新
    const interval = setInterval(() => {
      fetchTasks();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('获取任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="text-blue-600 hover:text-blue-700"
            >
              ← 返回
            </button>
            <h1 className="text-xl font-bold text-gray-800">数据统计</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={logout}
              className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">评分任务列表</h2>
            <p className="text-sm text-gray-600 mt-1">点击任务查看详细的统计结果和排名</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-600">加载中...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-600">暂无任务</div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/statistics/${task.id}`)}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{task.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          {task.type === 'department' ? '科室评分' : '中队评分'}
                        </span>
                        <span className="px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: task.status === 'active' 
                              ? '#DCFCE7' 
                              : task.status === 'closed' 
                              ? '#F3F4F6' 
                              : '#FEF3C7',
                            color: task.status === 'active' 
                              ? '#166534' 
                              : task.status === 'closed' 
                              ? '#374151' 
                              : '#92400E'
                          }}
                        >
                          {task.status === 'active' ? '进行中' : task.status === 'closed' ? '已关闭' : '草稿'}
                        </span>
                        {task.progress && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                            已完成：{task.progress.completed} / {task.progress.total} 人
                            {task.progress.total > 0 && (
                              <span className="ml-1">
                                ({Math.round((task.progress.completed / task.progress.total) * 100)}%)
                              </span>
                            )}
                          </span>
                        )}
                        <span>
                          创建时间：{new Date(task.created_at).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/statistics/${task.id}`);
                      }}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                    >
                      查看统计
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


