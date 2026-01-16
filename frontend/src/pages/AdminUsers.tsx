import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  created_at: string;
}

export default function AdminUsers() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'manager',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('获取用户失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', formData);
      alert('用户创建成功');
      setShowAddForm(false);
      setFormData({ username: '', password: '', name: '', role: 'manager' });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || '创建用户失败');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
    });
    setShowAddForm(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // 验证输入
    if (!formData.username || !formData.username.trim()) {
      alert('用户名不能为空');
      return;
    }
    if (!formData.name || !formData.name.trim()) {
      alert('姓名不能为空');
      return;
    }

    try {
      await api.put(`/admin/users/${editingUser.id}`, {
        username: formData.username.trim(),
        name: formData.name.trim(),
        role: formData.role,
      });
      alert('用户信息更新成功');
      setEditingUser(null);
      setFormData({ username: '', password: '', name: '', role: 'manager' });
      fetchUsers();
    } catch (error: any) {
      console.error('更新用户错误:', error);
      const errorMessage = error.response?.data?.error || error.message || '更新用户失败';
      alert(errorMessage);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`确定要删除用户 "${userName}" 吗？\n\n注意：如果该用户有评分记录，将同时删除所有相关评分记录。\n此操作不可恢复！`)) {
      return;
    }

    try {
      const response = await api.delete(`/admin/users/${userId}`);
      const message = response.data.message || '用户删除成功';
      const deletedScores = response.data.deletedScores || 0;
      
      if (deletedScores > 0) {
        alert(`${message}\n同时删除了 ${deletedScores} 条评分记录`);
      } else {
        alert(message);
      }
      fetchUsers();
    } catch (error: any) {
      console.error('删除用户错误:', error);
      const errorMessage = error.response?.data?.error || error.message || '删除用户失败';
      alert(errorMessage);
    }
  };

  const handleDeleteAllUsers = async () => {
    // 双重确认
    const firstConfirm = confirm(
      '⚠️ 警告：此操作将删除所有非管理员用户！\n\n' +
      '将删除所有领导班子成员和负责人账号，只保留管理员账号。\n' +
      '同时会删除这些用户的所有评分记录。\n\n' +
      '此操作不可恢复，请确认是否继续？'
    );
    
    if (!firstConfirm) {
      return;
    }

    // 要求用户输入确认文字
    const confirmText = prompt(
      '⚠️ 最后确认\n\n' +
      '您确定要删除所有非管理员用户吗？\n' +
      '此操作将永久删除所有用户数据（除管理员外），无法恢复！\n\n' +
      '请输入"确认删除所有用户"以继续：'
    );

    if (confirmText !== '确认删除所有用户') {
      if (confirmText !== null) {
        alert('确认文字不正确，操作已取消');
      }
      return;
    }

    setDeletingAll(true);
    try {
      const response = await api.delete('/admin/users/all');
      alert(response.data.message || '删除成功');
      fetchUsers();
    } catch (error: any) {
      console.error('删除所有用户错误:', error);
      const errorMessage = error.response?.data?.error || error.message || '删除失败';
      alert(errorMessage);
    } finally {
      setDeletingAll(false);
    }
  };

  const handleResetPassword = async (userId: number) => {
    const newPassword = prompt('请输入新密码（至少6位）:');
    if (!newPassword || newPassword.length < 6) {
      alert('密码长度至少6位');
      return;
    }

    try {
      await api.post(`/admin/users/${userId}/reset-password`, { password: newPassword });
      alert('密码重置成功');
    } catch (error: any) {
      alert(error.response?.data?.error || '重置密码失败');
    }
  };

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: '管理员',
      leader: '领导班子',
      manager: '负责人',
    };
    return roleMap[role] || role;
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
            <h1 className="text-xl font-bold text-gray-800">用户管理</h1>
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
        {/* 危险操作区域 */}
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-1">危险操作</h3>
              <p className="text-sm text-red-700">删除所有非管理员用户（只保留管理员账号）</p>
            </div>
            <button
              onClick={handleDeleteAllUsers}
              disabled={deletingAll}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deletingAll ? '删除中...' : '删除所有非管理员用户'}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">用户列表</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showAddForm ? '取消' : '添加用户'}
          </button>
        </div>

        {(showAddForm || editingUser) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingUser ? '编辑用户' : '添加新用户'}
            </h3>
            <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      密码
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                      minLength={6}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    角色
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="leader">领导班子</option>
                    <option value="manager">负责人</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingUser ? '更新用户' : '创建用户'}
                </button>
                {editingUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      setFormData({ username: '', password: '', name: '', role: 'manager' });
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    取消
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-600">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      用户名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      姓名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      角色
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
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'leader'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {getRoleName(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          重置密码
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
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

