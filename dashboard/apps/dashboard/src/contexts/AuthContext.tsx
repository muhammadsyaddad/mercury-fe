"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { User, LoginCredentials } from "../types";
import { UserRole } from "../types";
import { apiService } from "../services/api";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const isServer = typeof window === "undefined";

  // If rendering on the server side, return a safe stub instead of throwing.
  // Add debug logging to help trace where SSR calls to useAuth originate.
  if (isServer) {
    // Minimal SSR-safe logs (won't expose sensitive data)
    console.debug?.("[AuthContext] useAuth called during SSR - returning server stub");
    console.trace?.("[AuthContext] SSR trace: useAuth called");

    return {
      user: null,
      loading: true,
      login: async () => {
        throw new Error("Auth is not available during server-side rendering");
      },
      logout: () => {},
      hasRole: () => false,
      hasAnyRole: () => false,
      isLoggedIn: false,
    };
  }

  console.debug?.("[AuthContext] useAuth called on client");

  const context = useContext(AuthContext);
  if (context === undefined) {
    // If, on the client, the provider is missing, return a fallback stub
    // and warn so it doesn't hard crash the app. Include a stack trace to help debug.
    console.warn("[AuthContext] useAuth must be used within an AuthProvider; returning fallback stub.");
    console.trace?.("[AuthContext] Client trace: AuthProvider missing - useAuth called");

    return {
      user: null,
      loading: false,
      login: async () => {
        throw new Error("AuthProvider is missing");
      },
      logout: () => {},
      hasRole: () => false,
      hasAnyRole: () => false,
      isLoggedIn: false,
    };
  }

  return context;
};

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, initialUser }) => {
  // Convert server session user to client User type
  const convertSessionUser = (sessionUser: NonNullable<AuthProviderProps['initialUser']>): User => ({
    id: Number(sessionUser.id) || 0,
    username: sessionUser.name,
    email: sessionUser.email,
    full_name: sessionUser.name,
    // Normalize role to lower-case to match UserRole enum values (e.g. 'admin', 'worker')
    role: sessionUser.role.toLowerCase() as UserRole,
    is_active: true,
    created_at: new Date().toISOString(),
  });

  const [user, setUser] = useState<User | null>(
    initialUser ? convertSessionUser(initialUser) : null
  );
  const [loading, setLoading] = useState(!initialUser); // Don't show loading if we have initialUser

  useEffect(() => {
    // If we already have an initialUser from the server session, skip client-side initialization
    if (initialUser) {
      console.debug?.("[AuthContext] Using initialUser from server session");
      setLoading(false);
      return;
    }

    const initializeAuth = async () => {
      console.debug?.("[AuthContext] initializeAuth - fetching current user via /api/auth/me");

      try {
        // Expect server to read zap_session cookie and return user JSON
        const resp = await fetch('/api/auth/me');
        if (!resp.ok) {
          console.debug?.('[AuthContext] /api/auth/me returned non-OK');
          setUser(null);
        } else {
          const currentUser = await resp.json();
          console.debug?.('[AuthContext] fetched current user', { id: currentUser?.id });
          // Convert session user shape to internal User type
          setUser({
            id: Number(currentUser.id) || 0,
            username: currentUser.name,
            email: currentUser.email,
            full_name: currentUser.name,
            role: (currentUser.role || 'worker').toLowerCase() as UserRole,
            is_active: true,
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn?.('[AuthContext] Failed to fetch /api/auth/me', err);
        setUser(null);
      }

      setLoading(false);
      console.debug?.('[AuthContext] initializeAuth complete');
    };

    initializeAuth();
  }, [initialUser]);

  const login = async (credentials: LoginCredentials) => {
    // Avoid logging sensitive fields; only emit non-sensitive identifier for trace.
    console.debug?.("[AuthContext] login called for:", credentials?.username ?? "(no-username)");
    try {
      const response = await apiService.login(credentials);
      const { access_token } = response;

      console.debug?.("[AuthContext] login success - storing token");
      // Store token
      localStorage.setItem("token", access_token);

      // Get user info
      const currentUser = await apiService.getCurrentUser();
      console.debug?.("[AuthContext] fetched current user", { id: currentUser?.id });
      setUser(currentUser);
      localStorage.setItem("user", JSON.stringify(currentUser));

      toast.success("Logged in successfully");
    } catch (error) {
      console.error?.("[AuthContext] login failed", error);
      throw error;
    }
  };

  const logout = () => {
    console.debug?.("[AuthContext] logout called - clearing token & user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out successfully");
    // Sign out from NextAuth session
    signOut({ callbackUrl: "/login" });
  };

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isLoggedIn = !!user;

  // Simple role check - Admin has higher level than Worker
  const isAdmin = (): boolean => {
    return user?.role === UserRole.ADMIN;
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    hasRole,
    hasAnyRole,
    isLoggedIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Higher-order component for role-based access control
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: UserRole[],
) => {
  const WrappedComponent = (props: P) => {
    const { user, loading, hasAnyRole } = useAuth();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
        </div>
      );
    }

    if (!user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Authentication Required
            </h2>
            <p className="text-muted-foreground">Please log in to access this page.</p>
          </div>
        </div>
      );
    }

    if (requiredRoles && !hasAnyRole(requiredRoles)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Access Denied
            </h2>
            <p className="text-muted-foreground">
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
};
