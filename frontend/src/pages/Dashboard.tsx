import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import ChangePasswordModal from '../components/ChangePasswordModal';

interface Task {
  id: number;
  name: string;
  type: string;
  status: string;
  isCompleted: boolean;
  progress: {
    submitted: number;
    total: number;
  };
  votingProgress?: {
    completed: number;
    total: number;
  };
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const prevLocationRef = useRef<string>('');

  const fetchTasks = async (forceRefresh = false) => {
    try {
      // 添加强制刷新参数，避免缓存
      const url = forceRefresh 
        ? `/tasks/my-tasks?t=${Date.now()}` 
        : '/tasks/my-tasks';
      
      const response = await api.get(url);
      console.log('获取任务数据响应:', response.data);
      const tasksData = response.data || [];
      
      // 确保每个任务都有投票进度数据
      const tasksWithProgress = tasksData.map((task: any) => {
        if (!task.votingProgress) {
          console.warn(`任务 ${task.id} 缺少投票进度数据`);
          return {
            ...task,
            votingProgress: {
              completed: 0,
              total: 0,
            },
          };
        }
        console.log(`任务 ${task.id} (${task.name}): 投票进度=${task.votingProgress.completed}/${task.votingProgress.total}`);
        return task;
      });
      
      setTasks(tasksWithProgress);
    } catch (error) {
      console.error('获取任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 首次加载
    fetchTasks(false);
    
    // 每3秒自动刷新一次，实现实时更新（缩短间隔以便更快看到更新）
    const interval = setInterval(() => {
      fetchTasks(false);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // 监听路由变化和状态，如果从评分页面返回，立即刷新
  useEffect(() => {
    const currentPath = location.pathname;
    const locationState = location.state as { refresh?: boolean; taskId?: number; timestamp?: number } | null;
    
    // 如果路由状态中有刷新标志，立即刷新
    if (currentPath === '/dashboard' && locationState?.refresh) {
      console.log('检测到刷新标志，准备刷新投票进度...', locationState);
      
      // 立即强制刷新一次（带时间戳避免缓存）
      fetchTasks(true);
      
      // 延迟刷新，确保后端数据已更新
      const refreshTimeout1 = setTimeout(() => {
        console.log('第一次延迟刷新投票进度数据...');
        fetchTasks(true);
      }, 1000);
      
      // 再次延迟刷新，确保数据完全更新
      const refreshTimeout2 = setTimeout(() => {
        console.log('第二次延迟刷新投票进度数据...');
        fetchTasks(true);
      }, 2500);
      
      // 清除状态，避免重复刷新
      window.history.replaceState({}, '', '/dashboard');
      
      return () => {
        clearTimeout(refreshTimeout1);
        clearTimeout(refreshTimeout2);
      };
    }
    
    // 如果从评分页面返回，也刷新
    const prevPath = prevLocationRef.current;
    if (currentPath === '/dashboard' && prevPath && prevPath.startsWith('/score/') && !locationState?.refresh) {
      console.log('从评分页面返回，准备刷新投票进度...');
      fetchTasks(true);
      setTimeout(() => {
        fetchTasks(true);
      }, 1500);
    }
    
    prevLocationRef.current = currentPath;
  }, [location.pathname, location.state]);

  // 监听页面可见性变化，当页面变为可见时刷新
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTasks(true);
      }
    };

    // 监听窗口焦点，当窗口获得焦点时刷新
    const handleFocus = () => {
      fetchTasks(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleTaskClick = (taskId: number) => {
    navigate(`/score/${taskId}`);
  };



  // 管理员看到的界面
  if (user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">评分系统 - 管理后台</h1>
              <p className="text-sm text-gray-600">欢迎，{user?.name}（管理员）</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowChangePasswordModal(true)} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">修改密码</button>
              <button onClick={logout} className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200">退出登录</button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 mb-6 text-white">
            <h2 className="text-3xl font-bold mb-2">管理员控制台</h2>
            <p className="text-blue-100">您可以创建任务、管理用户、查看评分进度和导出结果</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button onClick={() => navigate('/admin/tasks')} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all text-left">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4"><span className="text-2xl">📋</span></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">任务管理</h3>
              <p className="text-sm text-gray-600">创建、发布和管理评分任务</p>
            </button>
            <button onClick={() => navigate('/admin/users')} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all text-left">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4"><span className="text-2xl">👥</span></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">用户管理</h3>
              <p className="text-sm text-gray-600">添加、编辑和管理系统用户</p>
            </button>
            <button onClick={() => navigate('/admin/statistics')} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all text-left">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4"><span className="text-2xl">📊</span></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">评分统计</h3>
              <p className="text-sm text-gray-600">查看评分进度和详细结果</p>
            </button>
          </div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">任务概览</h2>
            {loading ? (
              <div className="text-center py-12"><div className="text-gray-600">加载中...</div></div>
            ) : tasks.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-600 mb-4">暂无活跃的评分任务</p>
                <button onClick={() => navigate('/admin/tasks')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">创建第一个任务</button>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{task.name}</h3>
                        <p className="text-sm text-gray-600">{task.type === 'department' ? '科室评分' : '中队评分'}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">进行中</span>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-600 font-medium">投票进度</span>
                        <span className="font-bold text-gray-900">
                          {task.votingProgress ? (<><span className="text-blue-600">{task.votingProgress.completed}</span><span className="text-gray-400 mx-1">/</span><span className="text-gray-600">{task.votingProgress.total}</span></>) : (<span className="text-gray-400">0 / 0</span>)}
                          <span className="text-gray-500 text-xs ml-2 font-normal">人已完成</span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${task.votingProgress && task.votingProgress.total > 0 ? Math.round((task.votingProgress.completed / task.votingProgress.total) * 100) : 0}%` }} />
                      </div>
                      {task.votingProgress && task.votingProgress.total > 0 && (<div className="text-xs text-gray-500 mt-1 text-right">完成率: {Math.round((task.votingProgress.completed / task.votingProgress.total) * 100)}%</div>)}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate('/admin/statistics')} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700">查看详情</button>
                      <button onClick={() => navigate('/admin/statistics')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">导出结果</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        <ChangePasswordModal isOpen={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} onSuccess={() => { console.log('密码修改成功'); }} />
      </div>
    );
  }

  // 普通用户看到的界面
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">评分系统</h1>
            <p className="text-sm text-gray-600">欢迎，{user?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              修改密码
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                管理后台
              </button>
            )}
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">我的任务</h2>
          <p className="text-gray-600">请完成以下评分任务</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">加载中...</div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">暂无待完成的任务</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {task.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {task.type === 'department' ? '科室评分' : '中队评分'}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      task.isCompleted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {task.isCompleted ? '已完成' : '待完成'}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600 font-medium">投票进度</span>
                    <span className="font-bold text-gray-900 text-base">
                      {task.votingProgress ? (
                        <span className="text-blue-600">{task.votingProgress.completed}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                      <span className="text-gray-500 text-xs ml-1 font-normal">人已完成投票</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${task.votingProgress && task.votingProgress.total > 0 
                          ? Math.round((task.votingProgress.completed / task.votingProgress.total) * 100) 
                          : 0}%`,
                      }}
                    />
                  </div>
                  {task.votingProgress && task.votingProgress.total > 0 && (
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      完成率: {Math.round((task.votingProgress.completed / task.votingProgress.total) * 100)}%
                    </div>
                  )}
                </div>

                {!task.isCompleted && (
                  <button
                    onClick={() => handleTaskClick(task.id)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    开始评分
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          // 密码修改成功后的回调
          console.log('密码修改成功');
        }}
      />
    </div>
  );
}



