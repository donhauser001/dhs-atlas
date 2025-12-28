import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 员工档案
export interface EmployeeProfile {
  enterpriseId?: string;
  departmentId?: string;
  position?: string;
  employeeNo?: string;
  status?: 'active' | 'left' | 'suspended';
}

// 客户联系人档案
export interface ClientContactProfile {
  clientId?: string;
  clientDepartmentName?: string;
  title?: string;
  isPrimary?: boolean;
  portalRole?: 'owner' | 'member' | 'finance';
}

export interface User {
  _id: string;
  id?: string;
  username?: string;
  name: string;
  realName?: string;
  email: string;
  phone?: string;
  avatar?: string;
  avatarUrl?: string;

  // 新字段
  userTypes?: ('employee' | 'client_contact')[];
  roles?: string[];
  employeeProfile?: EmployeeProfile;
  clientContactProfile?: ClientContactProfile;

  // 旧字段（兼容）
  role: string;
  department?: string;
  enterpriseId?: string;
  enterpriseName?: string;
  departmentId?: string;
  departmentName?: string;
  position?: string;
  permissions?: string[];
  permissionGroups?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: (user, token) => {
        localStorage.setItem('token', token);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ========== 辅助函数（独立导出） ==========

/**
 * 判断用户是否为员工
 */
export function isEmployee(user: User | null): boolean {
  if (!user) return false;
  return (
    user.userTypes?.includes('employee') ||
    ['超级管理员', '项目经理', '设计师', '员工'].includes(user.role)
  );
}

/**
 * 判断用户是否为客户联系人
 */
export function isClientContact(user: User | null): boolean {
  if (!user) return false;
  return (
    user.userTypes?.includes('client_contact') ||
    user.role === '客户'
  );
}

/**
 * 检查用户是否有指定角色
 */
export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false;

  // 检查新 roles 数组
  if (user.roles?.includes(role)) return true;

  // 兼容旧角色映射
  const legacyRoleMapping: Record<string, string[]> = {
    '超级管理员': ['owner', 'admin'],
    '项目经理': ['pm'],
    '设计师': ['designer'],
    '员工': ['designer'],
    '客户': ['client_portal'],
  };
  const mappedRoles = legacyRoleMapping[user.role] || [];
  return mappedRoles.includes(role);
}

/**
 * 判断用户是否有客户门户权限
 */
export function hasClientPortalAccess(user: User | null): boolean {
  if (!user) return false;
  return (
    hasRole(user, 'client_portal') ||
    user.role === '客户'
  );
}

/**
 * 获取用户的门户角色
 */
export function getPortalRole(user: User | null): string | undefined {
  return user?.clientContactProfile?.portalRole;
}

/**
 * 获取用户关联的客户ID
 */
export function getClientId(user: User | null): string | undefined {
  return user?.clientContactProfile?.clientId;
}
