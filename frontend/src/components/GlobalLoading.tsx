import { useState, useEffect } from 'react';
import api from '../utils/api';

/**
 * 全局加载指示器
 * 自动监听所有 axios 请求，显示加载状态
 */
export default function GlobalLoading() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 请求拦截器 - 请求开始时增加计数
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        setLoading(true);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 请求完成时减少计数
    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        setLoading(false);
        return response;
      },
      (error) => {
        setLoading(false);
        return Promise.reject(error);
      }
    );

    // 清理函数
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50">
      <div className="h-full bg-blue-500 animate-loading-bar"></div>
      <style>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
