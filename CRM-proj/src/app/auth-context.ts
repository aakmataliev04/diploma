import { createContext } from 'react';
import type { AuthSession } from '../types';

export interface AuthContextValue {
  session: AuthSession | null;
  signIn: (pin: string) => Promise<AuthSession>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
