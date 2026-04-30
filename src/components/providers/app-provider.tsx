'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase-config';
import {
  createUser,
  getUser,
  getUserByReferralCode,
  onUserChange,
  recordReferral,
  updateUser as updateUserSupabase,
} from '@/lib/supabase-user-service';
import { signOutUser, subscribeToAuthChanges } from '@/services/authService';
import {
  ensureUserProfile,
  getUserData as getFirebaseUserData,
  subscribeToUserData,
  updateUserProfile,
} from '@/services/dbService';

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseAuthUser, setFirebaseAuthUser] = useState<any>(null);
  const [legacyAuthUser, setLegacyAuthUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribeFirebase = subscribeToAuthChanges((authUser: any) => {
      setFirebaseAuthUser(authUser || null);
    });

    supabase.auth.getSession().then(({ data }) => {
      setLegacyAuthUser(data.session?.user || null);
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLegacyAuthUser(session?.user || null);
    });

    return () => {
      unsubscribeFirebase();
      authSub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => setIsLoading(false), 10000);
    const activeAuthUser = firebaseAuthUser || legacyAuthUser;
    const isFirebaseSession = Boolean(firebaseAuthUser);
    let stopFirebaseUserSubscription = () => {};
    let stopLegacyUserSubscription = () => {};

    const syncLegacyUser = async (uid: string, name: string, email: string) => {
      let legacyUser = await getUser(uid);

      if (!legacyUser) {
        const searchParams =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();
        const refCode = searchParams.get('ref') || searchParams.get('refCode');
        const newUserData: any = {
          name,
          email,
          totalReferrals: 0,
          credits: 0,
        };

        if (refCode) {
          const referrer = await getUserByReferralCode(refCode);
          if (referrer) {
            newUserData.referredBy = referrer.id;
          }
        }

        await createUser(uid, newUserData);

        if (newUserData.referredBy) {
          await recordReferral(newUserData.referredBy, uid);
        }

        legacyUser = await getUser(uid);
      }

      return legacyUser;
    };

    const hydrateAuthUser = async () => {
      if (!activeAuthUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const uid = activeAuthUser.uid || activeAuthUser.id;
        const name =
          activeAuthUser.displayName ||
          activeAuthUser.user_metadata?.full_name ||
          activeAuthUser.user_metadata?.name ||
          'User';
        const email = activeAuthUser.email || '';
        let latestLegacyUser: any = null;

        const mergeUser = (firebaseUserData: any, legacyUserData = latestLegacyUser) => {
          setUser((currentUser) => ({
            id: uid,
            name: firebaseUserData?.name || legacyUserData?.name || name,
            email: firebaseUserData?.email || legacyUserData?.email || email,
            referralCode: legacyUserData?.referralCode || currentUser?.referralCode,
            referredBy: legacyUserData?.referredBy,
            totalReferrals: legacyUserData?.totalReferrals || 0,
            credits: legacyUserData?.credits || 0,
            orders: firebaseUserData?.orders || {},
            notifications: firebaseUserData?.notifications || {},
            adminReplies: firebaseUserData?.adminReplies || {},
          }));
        };

        if (isFirebaseSession) {
          await ensureUserProfile(uid, { name, email });
        }

        latestLegacyUser = await syncLegacyUser(uid, name, email);

        if (isFirebaseSession) {
          const firebaseUserData = await getFirebaseUserData(uid);
          mergeUser(firebaseUserData, latestLegacyUser);

          stopFirebaseUserSubscription = subscribeToUserData(
            uid,
            (firebaseUserDataUpdate: any) => {
              mergeUser(firebaseUserDataUpdate, latestLegacyUser);
            }
          );
        } else {
          mergeUser(
            {
              name,
              email,
              orders: {},
              notifications: {},
              adminReplies: {},
            },
            latestLegacyUser
          );
        }

        stopLegacyUserSubscription = onUserChange(uid, (updatedUser) => {
          latestLegacyUser = updatedUser || latestLegacyUser;
          setUser((currentUser) =>
            currentUser
              ? {
                  ...currentUser,
                  referralCode:
                    latestLegacyUser?.referralCode || currentUser.referralCode,
                  referredBy: latestLegacyUser?.referredBy,
                  totalReferrals: latestLegacyUser?.totalReferrals || 0,
                  credits: latestLegacyUser?.credits || 0,
                }
              : currentUser
          );
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser({
          id: activeAuthUser.uid || activeAuthUser.id,
          name:
            activeAuthUser.displayName ||
            activeAuthUser.user_metadata?.full_name ||
            'User',
          email: activeAuthUser.email || '',
          totalReferrals: 0,
          credits: 0,
          orders: {},
          notifications: {},
          adminReplies: {},
        });
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    hydrateAuthUser();

    return () => {
      clearTimeout(timeoutId);
      stopFirebaseUserSubscription();
      stopLegacyUserSubscription();
    };
  }, [firebaseAuthUser, legacyAuthUser]);

  const logout = async () => {
    try {
      await Promise.allSettled([signOutUser(), supabase.auth.signOut()]);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      setUser({ ...user, ...updates });
      await Promise.allSettled([
        updateUserProfile(user.id, updates),
        updateUserSupabase(user.id, updates),
      ]);
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
