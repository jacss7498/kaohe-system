import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">管理后台</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              返回前台
            </button>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => navigate('/admin/tasks')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">任务管理</h3>
            <p className="text-gray-600 text-sm">创建和管理考核任务</p>
          </div>

          <div
            onClick={() => navigate('/admin/users')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">用户管理</h3>
            <p className="text-gray-600 text-sm">管理评分人账号</p>
          </div>

          <div
            onClick={() => navigate('/admin/statistics')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">数据统计</h3>
            <p className="text-gray-600 text-sm">查看考核结果和排名</p>
          </div>
        </div>
      </main>
    </div>
  );
}
