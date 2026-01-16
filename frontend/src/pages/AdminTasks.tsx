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

export default function AdminTasks() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'department',
  });

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

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tasks', formData);
      alert('任务创建成功');
      setShowAddForm(false);
      setFormData({ name: '', type: 'department' });
      fetchTasks();
    } catch (error: any) {
      alert(error.response?.data?.error || '创建任务失败');
    }
  };

  const handleStatusChange = async (taskId: number, status: string) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      alert('任务状态更新成功');
      fetchTasks();
    } catch (error: any) {
      alert(error.response?.data?.error || '更新状态失败');
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm('确定要删除这个任务吗？')) {
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}`);
      alert('任务删除成功');
      fetchTasks();
    } catch (error: any) {
      alert(error.response?.data?.error || '删除任务失败');
    }
  };

  const getStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: '草稿',
      active: '进行中',
      closed: '已关闭',
    };
    return statusMap[status] || status;
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
            <h1 className="text-xl font-bold text-gray-800">任务管理</h1>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            退出登录
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">任务列表</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showAddForm ? '取消' : '创建任务'}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">创建新任务</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="例如：2024年度科室评分"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务类型
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="department">科室评分</option>
                  <option value="squad">中队评分</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                创建任务
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-600">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-600">暂无任务</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      任务名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      完成进度
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.type === 'department' ? '科室评分' : '中队评分'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            task.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : task.status === 'closed'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {getStatusName(task.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.progress ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {task.progress.completed} / {task.progress.total}
                            </span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{
                                  width: `${task.progress.total > 0 ? (task.progress.completed / task.progress.total) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {task.progress.total > 0 
                                ? Math.round((task.progress.completed / task.progress.total) * 100) 
                                : 0}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(task.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {task.status !== 'active' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'active')}
                            className="text-green-600 hover:text-green-700"
                          >
                            开启
                          </button>
                        )}
                        {task.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'closed')}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            关闭
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/admin/statistics/${task.id}`)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          统计
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}



