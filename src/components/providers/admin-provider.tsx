'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ensureUserProfile } from '@/services/dbService';
import {
  getAuthErrorMessage,
  signInWithEmailPassword,
  signOutUser,
  subscribeToAuthChanges,
} from '@/services/authService';

const ADMIN_EMAILS = Array.from(
  new Set(
    [
      ...(process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
      'zainashraf0326@gmail.com',
      'admin@primexstream.com',
    ]
  )
);

interface AdminContextType {
  user: any | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

function isAdminEmail(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}

function getAdminDisplayName(user: any) {
  return (
    user?.displayName ||
    user?.providerData?.[0]?.displayName ||
    user?.email?.split('@')[0] ||
    'Admin'
  );
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncAdminProfile = async (u: any | null) => {
      if (!u || !isAdminEmail(u.email)) {
        return null;
      }

      try {
        await ensureUserProfile(u.uid, {
          name: getAdminDisplayName(u),
          email: u.email || '',
        });
      } catch (error) {
        console.warn('Failed to ensure admin profile:', error);
      }

      return u;
    };

    const unsubscribe = subscribeToAuthChanges(async (u) => {
      setUser(await syncAdminProfile(u));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      
      // Check if email is admin email
      if (!isAdminEmail(email)) {
        throw new Error('Unauthorized. Only the admin can access this panel.');
      }

      await signInWithEmailPassword({ email, password });
    } catch (err) {
      const message = getAuthErrorMessage(err, 'Login failed');
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOutUser();
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    }
  };

  return (
    <AdminContext.Provider
      value={{
        user,
        isAdmin: !!user,
        isLoading,
        login,
        logout,
        error,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
