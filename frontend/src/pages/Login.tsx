import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaDisplay, setCaptchaDisplay] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // 获取验证码
  const fetchCaptcha = async () => {
    try {
      const response = await api.get('/auth/captcha');
      setCaptchaId(response.data.id);
      setCaptchaDisplay(response.data.code);
      setCaptchaCode(''); // 清空输入
    } catch (error) {
      console.error('获取验证码失败:', error);
    }
  };

  // 组件加载时获取验证码
  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 登录逻辑
      if (!captchaId || !captchaCode) {
        setError('请输入验证码');
        setLoading(false);
        return;
      }

      try {
        // 使用 useAuth 的 login 函数来更新全局状态
        await login(username.trim(), password.trim(), captchaId, captchaCode.trim());

        // login 成功后，获取最新用户信息判断是否需要强制修改密码
        const response = await api.get('/auth/me');
        if (response.data.user.mustChangePassword) {
          navigate('/force-change-password');
        } else {
          navigate('/dashboard');
        }
      } catch (loginError: any) {
        // 登录失败，刷新验证码
        fetchCaptcha();
        throw loginError;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || '登录失败，请检查用户名和密码';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">评分系统</h1>
            <p className="text-gray-600">请登录您的账号</p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <p className="text-sm text-yellow-800">
              <strong>重要提示：</strong>不按要求填写表格（如名额超限、未签字、应说明未说明）的，取消本次评定资格并予以通报。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                用户名 <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="请输入用户名"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码 <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="请输入密码"
                required
                autoComplete="current-password"
              />
            </div>

            <div>
              <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 mb-2">
                验证码 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="captcha"
                  type="text"
                  value={captchaCode}
                  onChange={(e) => setCaptchaCode(e.target.value)}
                  className="w-32 sm:w-40 px-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base h-[42px] sm:h-[48px]"
                  placeholder="验证码"
                  required
                  maxLength={4}
                  autoComplete="off"
                />
                <div
                  onClick={fetchCaptcha}
                  className="flex-shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg font-mono text-lg sm:text-xl font-bold text-blue-600 tracking-widest min-w-[90px] sm:min-w-[110px] text-center select-none shadow-sm cursor-pointer hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-100 hover:shadow-md active:scale-95 transition-all h-[42px] sm:h-[48px] flex items-center justify-center"
                  title="点击刷新验证码"
                >
                  {captchaDisplay}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
