import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function ForceChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // 检查用户是否已登录，如果未登录则跳转到登录页
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    // 如果用户不需要修改密码，跳转到 dashboard
    if (!user.mustChangePassword) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // 防止用户通过浏览器刷新或关闭页面离开
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '您必须修改密码后才能继续使用系统，确定要离开吗？';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleLogout = () => {
    if (confirm('您还没有修改密码，退出后需要重新登录并修改密码。确定要退出吗？')) {
      logout();
      navigate('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }

    if (newPassword.length < 6) {
      setError('新密码长度至少6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/first-change-password', {
        newPassword,
      });

      // 更新用户状态
      if (user) {
        updateUser({ ...user, mustChangePassword: false });
      }

      alert('密码修改成功！');
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || '密码修改失败，请重试';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 如果没有用户信息，显示加载中
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 右上角退出按钮 */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              退出登录
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">强制修改密码</h1>
            <p className="text-gray-600">这是您首次登录，必须修改密码后才能使用系统</p>
          </div>

          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
            <p className="text-sm text-red-800">
              <strong>重要提示：</strong>修改密码前无法使用系统其他功能。请设置一个强密码（至少6位）并妥善保管。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                新密码 <span className="text-red-500">*</span>
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="请输入新密码（至少6位）"
                required
                minLength={6}
                autoComplete="new-password"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                确认新密码 <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="请再次输入新密码"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '修改中...' : '修改密码'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>修改密码后将自动跳转到主页面</p>
          </div>
        </div>
      </div>
    </div>
  );
}
