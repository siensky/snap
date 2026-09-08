import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { ApiError, setAccessToken } from '@/lib/api';

const TOKEN_KEY = 'accessToken';

type AuthContextValue = {
  session: string | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}

// 401 "You are not authorized" → logga ut → login.
// Andra fel (inkl. login-401 "Invalid password!") returneras som text att visa.
export function useHandleApiError() {
  const { signOut } = useAuth();

  return useCallback(async (e: unknown): Promise<string | null> => {
    if (
      e instanceof ApiError &&
      e.code === 401 &&
      e.message === 'You are not authorized'
    ) {
      await signOut();
      return null;
    }
    return e instanceof ApiError ? e.message : 'Something went wrong';
  }, [signOut]);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        setAccessToken(token);
        setSession(token);
      }
      setIsLoading(false);
    })();
  }, []);

  const signIn = useCallback(async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAccessToken(token);
    setSession(token);
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAccessToken(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
