'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

// 需要认证的路径前缀
const protectedPaths = ['/dashboard'];

// 已认证用户不应访问的路径
const authPaths = ['/login', '/register'];

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    // 初始化完成
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    if (isLoading) return;

    const isProtectedPath = protectedPaths.some((path) =>
      pathname.startsWith(path)
    );
    const isAuthPath = authPaths.includes(pathname);

    if (isProtectedPath && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (isAuthPath && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return <>{children}</>;
}

