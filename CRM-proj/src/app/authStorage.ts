import type { AuthSession } from '../types';

const AUTH_STORAGE_KEY = 'flora_crm_auth_session';

export const getStoredSession = (): AuthSession | null => {
  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const setStoredSession = (session: AuthSession) => {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearStoredSession = () => {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};
