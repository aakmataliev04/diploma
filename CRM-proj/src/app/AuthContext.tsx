import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { axiosApi, setAxiosAuthToken, setAxiosUnauthorizedHandler } from '../axiosApi';
import { clearStoredSession, getStoredSession, setStoredSession } from './authStorage';
import type { AuthSession } from '../types';
import { AuthContext, type AuthContextValue } from './auth-context';

interface LoginResponse {
  token: string;
  user: AuthSession['user'];
}

const decodeJwtExpiration = (token: string) => {
  try {
    const [, payload] = token.split('.');

    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = window.atob(normalizedPayload);
    const parsedPayload = JSON.parse(decodedPayload) as { exp?: number };

    return typeof parsedPayload.exp === 'number' ? parsedPayload.exp * 1000 : null;
  } catch {
    return null;
  }
};

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

  useEffect(() => {
    setAxiosUnauthorizedHandler(() => {
      signOut();
    });

    return () => {
      setAxiosUnauthorizedHandler(null);
    };
  }, [session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const expirationTimestamp = decodeJwtExpiration(session.token);

    if (!expirationTimestamp) {
      return;
    }

    const timeoutMs = expirationTimestamp - Date.now();

    if (timeoutMs <= 0) {
      const expiredTokenTimeout = window.setTimeout(() => {
        signOut();
      }, 0);

      return () => {
        window.clearTimeout(expiredTokenTimeout);
      };
    }

    const expirationTimeout = window.setTimeout(() => {
      signOut();
    }, timeoutMs);

    return () => {
      window.clearTimeout(expirationTimeout);
    };
  }, [session]);

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
