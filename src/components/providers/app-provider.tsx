'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  ensureUserProfile,
  subscribeToUserData,
  updateUserProfile,
} from '@/services/dbService';
import { signOutUser, subscribeToAuthChanges } from '@/services/authService';

export interface User {
  id: string;
  name: string;
  email: string;
  referralCode?: string;
  referredBy?: string;
  totalReferrals: number;
  credits?: number;
  orders?: Record<string, any>;
  notifications?: Record<string, any>;
  adminReplies?: Record<string, any>;
}

interface AppContextType {
  user: User | null;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function mapUser({
  id,
  name,
  email,
  referralCode,
  referredBy,
  totalReferrals,
  credits,
}: {
  id: string;
  name: string;
  email: string;
  referralCode?: string;
  referredBy?: string;
  totalReferrals?: number;
  credits?: number;
}): User {
  return {
    id,
    name,
    email,
    referralCode,
    referredBy,
    totalReferrals: totalReferrals || 0,
    credits: credits || 0,
    orders: {},
    notifications: {},
    adminReplies: {},
  };
}

function getFallbackName(authUser: any) {
  return (
    authUser?.displayName ||
    authUser?.providerData?.[0]?.displayName ||
    authUser?.email?.split('@')[0] ||
    'User'
  );
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function getPendingSignupProfile(email: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem('primex_pending_signup_profile');

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const storedEmail =
      typeof parsed?.email === 'string'
        ? parsed.email.trim().toLowerCase()
        : '';

    if (!storedEmail || storedEmail !== email.trim().toLowerCase()) {
      return null;
    }

    return {
      email: storedEmail,
      name: typeof parsed?.name === 'string' ? parsed.name.trim() : '',
      appliedReferralCode:
        typeof parsed?.appliedReferralCode === 'string'
          ? parsed.appliedReferralCode.trim().toUpperCase()
          : '',
    };
  } catch {
    return null;
  }
}

function clearPendingSignupProfile(email: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const pending = getPendingSignupProfile(email);

  if (pending) {
    window.localStorage.removeItem('primex_pending_signup_profile');
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let stopUserSubscription = () => {};

    const hydrateUser = async (authUser: any | null) => {
      stopUserSubscription();
      stopUserSubscription = () => {};

      if (!active) {
        return;
      }

      if (!authUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const id = authUser.uid;
      const email = authUser.email || '';
      const pendingSignupProfile = getPendingSignupProfile(email);
      const name = pendingSignupProfile?.name || getFallbackName(authUser);

      try {
        const profile = await ensureUserProfile(id, {
          name,
          email,
        });

        if (!active) {
          return;
        }

        const resolvedUser = mapUser({
          id,
          name: profile?.name || name,
          email: profile?.email || email,
          referralCode: profile?.referralCode,
          referredBy: profile?.referredBy,
          totalReferrals: profile?.totalReferrals,
          credits: profile?.credits,
        });

        setUser(resolvedUser);
        clearPendingSignupProfile(email);

        stopUserSubscription = subscribeToUserData(id, (updatedUser) => {
          if (!active) {
            return;
          }

          setUser(
            mapUser({
              id,
              name: updatedUser?.name || name,
              email: updatedUser?.email || email,
              referralCode: updatedUser?.referralCode,
              referredBy: updatedUser?.referredBy,
              totalReferrals: updatedUser?.totalReferrals,
              credits: updatedUser?.credits,
            })
          );
        });
      } catch (error) {
        console.error('Error hydrating app user:', formatError(error));

        if (!active) {
          return;
        }

        setUser(
          mapUser({
            id,
            name,
            email,
          })
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      void hydrateUser(nextUser);
    });

    return () => {
      active = false;
      stopUserSubscription();
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await signOutUser();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) {
      return;
    }

    try {
      setUser({ ...user, ...updates });
      await updateUserProfile(user.id, updates);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{ user, isLoggedIn: !!user, logout, updateUser, isLoading }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }

  return context;
}
