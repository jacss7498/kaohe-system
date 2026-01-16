import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { LoadingOverlay } from './components/Loading';

// 核心页面 - 同步加载以保证首屏体验
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// 其他页面 - 懒加载
const ScoreForm = lazy(() => import('./pages/ScoreForm'));
const ForceChangePassword = lazy(() => import('./pages/ForceChangePassword'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminTasks = lazy(() => import('./pages/AdminTasks'));
const AdminStatistics = lazy(() => import('./pages/AdminStatistics'));
const AdminStatisticsList = lazy(() => import('./pages/AdminStatisticsList'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingOverlay message="页面加载中..." />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* 强制修改密码页面 - 不需要 ProtectedRoute 包裹，由页面自己处理认证 */}
            <Route path="/force-change-password" element={<ForceChangePassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/score/:taskId"
              element={
                <ProtectedRoute>
                  <ScoreForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tasks"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminTasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/statistics"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminStatisticsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/statistics/:taskId"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminStatistics />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
