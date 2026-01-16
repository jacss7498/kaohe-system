import { useState } from 'react';
import api from '../utils/api';
import Modal from './Modal';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 验证输入
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写所有字段');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('新密码长度至少6位');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      setLoading(false);
      return;
    }

    if (oldPassword === newPassword) {
      setError('新密码不能与旧密码相同');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });

      alert(response.data.message || '密码修改成功');
      
      // 清空表单
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('修改密码失败:', err);
      setError(err.response?.data?.error || '修改密码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="修改密码" showCloseButton={false}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            旧密码
          </label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入当前密码"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            新密码
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入新密码（至少6位）"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            确认新密码
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请再次输入新密码"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? '修改中...' : '确认修改'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

