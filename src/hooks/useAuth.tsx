import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { login, logout } from '../api';
import { clearTokens, getAccessToken } from '../api/tokenStorage';
import type { ApiResponse, LoginRequest, MessageResponse, TokenResponse } from '../types';

interface AuthContextValue {
  isAuthenticated: boolean;
  signIn: (request: LoginRequest) => Promise<ApiResponse<TokenResponse>>;
  signOut: () => Promise<ApiResponse<MessageResponse> | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

// localStorage의 JWT 토큰을 기준으로 앱의 인증 상태를 관리합니다.
export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAccessToken()));

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      signIn: async (request) => {
        const result = await login(request);

        if (result.success) {
          setIsAuthenticated(true);
        }

        return result;
      },
      signOut: async () => {
        try {
          const result = await logout();
          setIsAuthenticated(false);
          return result;
        } catch {
          clearTokens();
          setIsAuthenticated(false);
          return null;
        }
      },
    }),
    [isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 컴포넌트에서 인증 상태와 로그인/로그아웃 동작을 사용할 때 호출합니다.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.');
  }

  return context;
}
