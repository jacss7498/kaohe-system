import { useEffect, useState } from 'react';

/**
 * 网络状态检测组件
 * 当网络断开时显示提示
 */
export default function NetworkStatus() {
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setShowOfflineMessage(false);
      console.log('网络已恢复');
    };

    const handleOffline = () => {
      setShowOfflineMessage(true);
      console.log('网络已断开');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初始检查
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineMessage) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-3 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="font-medium">网络连接已断开</span>
        </div>
        <span className="text-sm">请检查您的网络连接</span>
      </div>
    </div>
  );
}
