import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { axiosApi, setAxiosAuthToken } from '../axiosApi';
import { clearStoredSession, getStoredSession, setStoredSession } from './authStorage';
import type { AuthSession } from '../types';
import { AuthContext, type AuthContextValue } from './auth-context';

interface LoginResponse {
  token: string;
  user: AuthSession['user'];
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const storedSession = getStoredSession();

    // После refresh сразу возвращаем токен в axios до первого запроса страницы.
    setAxiosAuthToken(storedSession?.token ?? null);

    return storedSession;
  });

  useEffect(() => {
    setAxiosAuthToken(session?.token ?? null);
  }, [session]);

  const signIn = async (pin: string) => {
    const { data } = await axiosApi.post<LoginResponse>('/auth/login', { pin });
    const nextSession: AuthSession = {
      token: data.token,
      user: data.user,
    };

    setSession(nextSession);
    setStoredSession(nextSession);

    return nextSession;
  };

  const signOut = () => {
    setSession(null);
    clearStoredSession();
    setAxiosAuthToken(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      signIn,
      signOut,
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
