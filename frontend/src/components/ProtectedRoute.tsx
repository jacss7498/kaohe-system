import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 强制修改密码检查 - 如果用户必须修改密码，且当前不在修改密码页面，则强制跳转
  if (user.mustChangePassword && location.pathname !== '/force-change-password') {
    return <Navigate to="/force-change-password" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">权限不足</div>
      </div>
    );
  }

  return <>{children}</>;
}










