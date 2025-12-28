'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

// 需要认证的路径前缀
const protectedPaths = ['/dashboard'];

// 已认证用户不应访问的路径
const authPaths = ['/login', '/register'];

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    // 初始化加载状态
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    if (isLoading) return;

    const isProtectedPath = protectedPaths.some((path) =>
      pathname.startsWith(path)
    );
    const isAuthPath = authPaths.includes(pathname);

    if (isProtectedPath && !isAuthenticated) {
      // 未登录访问受保护页面，重定向到登录
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (isAuthPath && isAuthenticated) {
      // 已登录访问登录/注册页面，重定向到工作台
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return {
    isAuthenticated,
    isLoading,
  };
}

