'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Role, hasPermission, hasAnyPermission, Permission, PERMISSIONS } from '@/lib/permissions';

// User type
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  agencyId?: string | null;
  agency?: {
    id: string;
    name: string;
    slug: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isAgency: boolean;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  refreshSession: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  isAuthenticated: false,
  isSuperAdmin: false,
  isAdmin: false,
  isAgent: false,
  isAgency: false,
  can: () => false,
  canAny: () => false,
  refreshSession: async () => {},
});

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch session from server (cookie-based)
  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        // Session API returned an error - clear user
        setUser(null);
        return;
      }
      const data = await response.json();

      if (data.authenticated && data.user) {
        // Validate user data has required fields
        if (data.user.id && data.user.email && data.user.role) {
          setUser(data.user as User);
        } else {
          console.error('Invalid user data from session:', data.user);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize auth state from server session
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Login function - called after successful login API call
  const login = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  // Logout function - calls logout API and clears state
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
    }
  }, []);

  // Refresh session from server
  const refreshSession = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  // Computed values
  const isAuthenticated = !!user;
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent';
  const isAgency = user?.role === 'agency';

  // Permission helpers
  const can = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user]);

  const canAny = useCallback((permissions: Permission[]): boolean => {
    if (!user) return false;
    return hasAnyPermission(user.role, permissions);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        isSuperAdmin,
        isAdmin,
        isAgent,
        isAgency,
        can,
        canAny,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth(allowedRoles?: Role[]) {
  const { user, loading, logout, refreshSession, can, canAny } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!user) {
      // Check if this is admin area or agency area
      const isAdminArea = pathname?.startsWith('/admin');
      const loginPath = isAdminArea ? '/admin/connexion' : '/agence/connexion';
      router.replace(loginPath);
      return;
    }

    // Check role-based access
    if (allowedRoles && allowedRoles.length > 0) {
      const hasRole = allowedRoles.includes(user.role);
      if (!hasRole) {
        // Redirect to correct area based on role
        if (['superadmin', 'admin', 'agent'].includes(user.role)) {
          router.replace('/admin/tableau-de-bord');
        } else {
          router.replace('/agence/tableau-de-bord');
        }
      }
    }
  }, [user, loading, allowedRoles, router, pathname]);

  return { user, loading, logout, refreshSession, can, canAny };
}

// Hook for permission-based access
export function useRequirePermission(permission: Permission | Permission[]) {
  const { user, loading, can, canAny, logout, refreshSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!user) {
      const isAdminArea = pathname?.startsWith('/admin');
      router.replace(isAdminArea ? '/admin/connexion' : '/agence/connexion');
      return;
    }

    // Check permission
    const permissions = Array.isArray(permission) ? permission : [permission];
    if (!canAny(permissions)) {
      // Redirect to dashboard if no permission
      if (['superadmin', 'admin', 'agent'].includes(user.role)) {
        router.replace('/admin/tableau-de-bord');
      } else {
        router.replace('/agence/tableau-de-bord');
      }
    }
  }, [user, loading, permission, canAny, router, pathname]);

  return { user, loading, can, canAny, logout, refreshSession };
}

export default AuthContext;
