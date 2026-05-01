/**
 * FIREBASE REFERRAL SYSTEM
 * 
 * Complete referral system using Firebase Realtime Database:
 * - User referral code lookup and generation
 * - Referral code application between users
 * - Reward tracking and claiming
 * - Real-time referral listening
 */

import { get, ref, set, update, onValue } from 'firebase/database';
import { database, isFirebaseConfigured } from '@/services/firebaseClient';

export interface ReferralRecord {
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  joinedAt: string;
  purchasedPlan: boolean;
  purchasedAt?: string;
  purchasedPlanName?: string;
  rewardAmount: number;
  rewardClaimed: boolean;
  claimedAt?: string;
  status: 'joined' | 'purchased' | 'claimed';
}

/**
 * Get user profile by referral code
 */
export async function getUserByReferralCode(
  referralCode: string
): Promise<any | null> {
  if (!isFirebaseConfigured || !database) return null;

  try {
    const normalizedCode = referralCode.trim().toUpperCase();
    const snapshot = await get(ref(database, 'users'));
    
    if (!snapshot.exists()) return null;

    const users = snapshot.val() || {};
    
    // Find user by referral code
    for (const [userId, userData] of Object.entries(users)) {
      const userRefCode = (userData as any)?.referralCode?.trim().toUpperCase();
      if (userRefCode === normalizedCode) {
        return {
          id: userId,
          name: (userData as any)?.name || 'User',
          email: (userData as any)?.email || '',
          referralCode: (userData as any)?.referralCode || '',
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting user by referral code:', error);
    return null;
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<any | null> {
  if (!isFirebaseConfigured || !database) return null;

  try {
    const snapshot = await get(ref(database, `users/${userId}`));
    
    if (!snapshot.exists()) return null;

    const userData = snapshot.val() || {};
    return {
      id: userId,
      name: userData.name || 'User',
      email: userData.email || '',
      referralCode: userData.referralCode || '',
      referredBy: userData.referredBy || '',
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Check if user has already applied a referral code
 */
export async function hasUserAppliedReferral(userId: string): Promise<boolean> {
  if (!isFirebaseConfigured || !database) return false;

  try {
    const snapshot = await get(ref(database, `users/${userId}/referredBy`));
    return snapshot.exists() && Boolean(snapshot.val());
  } catch (error) {
    console.error('Error checking applied referral:', error);
    return false;
  }
}

/**
 * Apply referral code to user account
 */
export async function applyReferralCode(
  currentUserId: string,
  referralCode: string
): Promise<{ success: boolean; message: string; referrerId?: string }> {
  if (!isFirebaseConfigured || !database) {
    return { success: false, message: 'Firebase not configured' };
  }

  try {
    const normalizedCode = referralCode.trim().toUpperCase();

    // Validation 1: Code is not empty
    if (!normalizedCode) {
      return { success: false, message: 'Please enter a referral code' };
    }

    // Validation 2: User is logged in
    if (!currentUserId) {
      return { success: false, message: 'Please login first' };
    }

    // Validation 3: Find referrer by code
    const referrerData = await getUserByReferralCode(normalizedCode);
    if (!referrerData) {
      return { success: false, message: 'Invalid referral code' };
    }

    const referrerId = referrerData.id;

    // Validation 4: Can't use own referral code
    if (referrerId === currentUserId) {
      return {
        success: false,
        message: 'You cannot use your own referral code',
      };
    }

    // Validation 5: Get current user profile
    const currentUserData = await getUserProfile(currentUserId);
    if (!currentUserData) {
      return {
        success: false,
        message: 'Could not load your profile. Please log in again.',
      };
    }

    // Validation 6: Check if user already applied a referral code
    const hasApplied = await hasUserAppliedReferral(currentUserId);
    if (hasApplied) {
      return {
        success: false,
        message: 'A referral code has already been applied to this account',
      };
    }

    // Validation 7: Check for circular referrals
    const isCircular = await hasUserAppliedReferral(referrerId);
    if (isCircular) {
      const referrerOfReferrer = await get(ref(database, `users/${referrerId}/referredBy`));
      if (referrerOfReferrer.exists() && referrerOfReferrer.val() === currentUserId) {
        return {
          success: false,
          message: 'Circular referrals are not allowed. You already referred this person!',
        };
      }
    }

    // All validations passed - apply referral code
    const referralRecord: ReferralRecord = {
      referrerId,
      referredUserId: currentUserId,
      referralCode: normalizedCode,
      joinedAt: new Date().toISOString(),
      purchasedPlan: false,
      rewardAmount: 5,
      rewardClaimed: false,
      status: 'joined',
    };

    // 1. Update current user's referredBy field
    await update(ref(database, `users/${currentUserId}`), {
      referredBy: referrerId,
    });

    // 2. Create referral record
    await set(
      ref(database, `referrals/${referrerId}/${currentUserId}`),
      referralRecord
    );

    // 3. Increment referrer's total referrals
    const referrerProfile = await getUserProfile(referrerId);
    const currentTotal = Number(referrerProfile?.totalReferrals || 0);
    
    await update(ref(database, `users/${referrerId}`), {
      totalReferrals: currentTotal + 1,
    });

    return {
      success: true,
      message: `You're now part of ${referrerData.name || 'their'} team!`,
      referrerId,
    };
  } catch (error) {
    console.error('Error applying referral code:', error);
    return {
      success: false,
      message: 'Failed to apply referral code. Please try again.',
    };
  }
}

/**
 * Get all referrals for a user (people who used their code)
 */
export async function getUserReferrals(
  referrerId: string
): Promise<ReferralRecord[]> {
  if (!isFirebaseConfigured || !database) return [];

  try {
    const snapshot = await get(ref(database, `referrals/${referrerId}`));
    
    if (!snapshot.exists()) return [];

    const referrals = snapshot.val() || {};
    return Object.values(referrals) as ReferralRecord[];
  } catch (error) {
    console.error('Error getting user referrals:', error);
    return [];
  }
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(referrerId: string): Promise<{
  total: number;
  joined: number;
  purchased: number;
  claimed: number;
  totalEarnings: number;
  pendingRewards: number;
}> {
  const referrals = await getUserReferrals(referrerId);

  return {
    total: referrals.length,
    joined: referrals.filter((r) => r.status === 'joined').length,
    purchased: referrals.filter((r) => r.status === 'purchased').length,
    claimed: referrals.filter((r) => r.status === 'claimed').length,
    totalEarnings: referrals
      .filter((r) => r.rewardClaimed)
      .reduce((sum, r) => sum + Number(r.rewardAmount || 0), 0),
    pendingRewards: referrals
      .filter((r) => r.purchasedPlan && !r.rewardClaimed)
      .reduce((sum, r) => sum + Number(r.rewardAmount || 0), 0),
  };
}

/**
 * Mark referral as purchased
 */
export async function markReferralAsPurchased(
  referrerId: string,
  referredUserId: string,
  planName: string
): Promise<void> {
  if (!isFirebaseConfigured || !database) return;

  try {
    await update(
      ref(database, `referrals/${referrerId}/${referredUserId}`),
      {
        purchasedPlan: true,
        purchasedAt: new Date().toISOString(),
        purchasedPlanName: planName,
        status: 'purchased',
      }
    );
  } catch (error) {
    console.error('Error marking referral as purchased:', error);
  }
}

/**
 * Claim referral reward
 */
export async function claimReferralReward(
  referrerId: string,
  referredUserId: string,
  rewardAmount: number
): Promise<boolean> {
  if (!isFirebaseConfigured || !database) return false;

  try {
    const referralRef = ref(
      database,
      `referrals/${referrerId}/${referredUserId}`
    );
    const referralSnapshot = await get(referralRef);

    if (!referralSnapshot.exists()) return false;

    const referral = referralSnapshot.val() as ReferralRecord;

    // Check if already claimed or not purchased
    if (referral.rewardClaimed || !referral.purchasedPlan) {
      return false;
    }

    // Get current user balance
    const userRef = ref(database, `users/${referrerId}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) return false;

    const user = userSnapshot.val() || {};
    const currentBalance = Number(user.usableBalance || user.walletBalance || 0);

    // Mark reward as claimed and update balance
    await update(referralRef, {
      rewardClaimed: true,
      claimedAt: new Date().toISOString(),
      status: 'claimed',
    });

    await update(userRef, {
      usableBalance: currentBalance + rewardAmount,
      walletBalance: currentBalance + rewardAmount,
      credits: Number(user.credits || 0) + rewardAmount,
    });

    return true;
  } catch (error) {
    console.error('Error claiming referral reward:', error);
    return false;
  }
}

/**
 * Listen to referral changes in real-time
 */
export function listenToMyReferrals(
  referrerId: string,
  callback: (referrals: ReferralRecord[]) => void
): () => void {
  if (!isFirebaseConfigured || !database) {
    return () => {};
  }

  const referralsRef = ref(database, `referrals/${referrerId}`);

  const unsubscribe = onValue(referralsRef, (snapshot) => {
    if (snapshot.exists()) {
      const referrals = Object.values(snapshot.val()) as ReferralRecord[];
      callback(referrals);
    } else {
      callback([]);
    }
  });

  return () => unsubscribe();
}

/**
 * Listen to specific referral status changes
 */
export function listenToReferralsByStatus(
  referrerId: string,
  status: 'joined' | 'purchased' | 'claimed',
  callback: (referrals: ReferralRecord[]) => void
): () => void {
  if (!isFirebaseConfigured || !database) {
    return () => {};
  }

  const referralsRef = ref(database, `referrals/${referrerId}`);

  const unsubscribe = onValue(referralsRef, (snapshot) => {
    if (snapshot.exists()) {
      const allReferrals = Object.values(snapshot.val()) as ReferralRecord[];
      const filtered = allReferrals.filter((r) => r.status === status);
      callback(filtered);
    } else {
      callback([]);
    }
  });

  return () => unsubscribe();
}
