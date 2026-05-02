/**
 * REAL PRODUCTION REFERRAL SYSTEM
 *
 * Tracks referrals in Supabase with:
 * - Referrer/Referred relationship
 * - Purchase status tracking
 * - Reward claiming system
 * - Real-time listeners
 */

import { supabase } from '@/lib/supabase-config';
import { createNotification } from '@/lib/supabase-notifications';
import { get, ref, update } from 'firebase/database';
import { database, isFirebaseConfigured } from '@/services/firebaseClient';

export interface ReferralRecord {
  id: string;
  referrerUid: string;
  referrerName?: string;
  referrerEmail?: string;
  referredUid: string;
  referredName?: string;
  referredEmail?: string;
  referralCode: string;
  joinedAt: any;
  purchasedPlan: boolean;
  purchasedAt?: any;
  purchasedPlanName?: string;
  rewardAmount: number;
  rewardClaimed: boolean;
  claimedAt?: any;
  status: 'joined' | 'purchased' | 'claimed';
}

type ReferralUserProfile = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  referredBy?: string;
};

function normalizeReferralCode(referralCode: string) {
  return referralCode.trim().toUpperCase();
}

async function getSupabaseUserByReferralCode(
  referralCode: string
): Promise<ReferralUserProfile | null> {
  const { data } = await supabase
    .from('users')
    .select('id,name,email,referral_code,referred_by')
    .eq('referral_code', referralCode)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    name: data.name || 'User',
    email: data.email || '',
    referralCode: data.referral_code || '',
    referredBy: data.referred_by || '',
  };
}

async function getFirebaseUserByReferralCode(
  referralCode: string
): Promise<ReferralUserProfile | null> {
  if (!isFirebaseConfigured || !database) return null;

  try {
    const snapshot = await get(ref(database, 'users'));
    if (!snapshot.exists()) return null;

    const users = snapshot.val() || {};
    const match = Object.entries(users).find(([, value]: any) => {
      return normalizeReferralCode(value?.referralCode || '') === referralCode;
    });

    if (!match) return null;

    const [id, value]: any = match;
    return {
      id,
      name: value?.name || 'User',
      email: value?.email || '',
      referralCode: value?.referralCode || '',
      referredBy: value?.referredBy || '',
    };
  } catch (error) {
    console.warn('Firebase referral lookup skipped:', error);
    return null;
  }
}

async function getUserByReferralCode(
  referralCode: string
): Promise<ReferralUserProfile | null> {
  const supabaseUser = await getSupabaseUserByReferralCode(referralCode);
  if (supabaseUser) return supabaseUser;

  return getFirebaseUserByReferralCode(referralCode);
}

async function getUserProfile(userId: string): Promise<ReferralUserProfile | null> {
  const { data } = await supabase
    .from('users')
    .select('id,name,email,referral_code,referred_by')
    .eq('id', userId)
    .maybeSingle();

  if (data) {
    return {
      id: data.id,
      name: data.name || 'User',
      email: data.email || '',
      referralCode: data.referral_code || '',
      referredBy: data.referred_by || '',
    };
  }

  if (!isFirebaseConfigured || !database) return null;

  const snapshot = await get(ref(database, `users/${userId}`));
  if (!snapshot.exists()) return null;

  const value: any = snapshot.val() || {};
  return {
    id: userId,
    name: value?.name || 'User',
    email: value?.email || '',
    referralCode: value?.referralCode || '',
    referredBy: value?.referredBy || '',
  };
}

async function ensureSupabaseUserRecord(
  profile: ReferralUserProfile | null
): Promise<boolean> {
  if (!profile?.id) return false;

  try {
    const referralCode =
      profile.referralCode ||
      `REF${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const { error } = await supabase.from('users').upsert(
      {
        id: profile.id,
        name: profile.name || 'User',
        email: profile.email || '',
        referral_code: referralCode,
        referred_by: profile.referredBy || null,
      },
      {
        onConflict: 'id',
      }
    );

    if (error) {
      console.warn('Could not upsert Supabase user record:', profile.id, error);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Error ensuring Supabase user record:', err);
    return false;
  }
}

async function setUserReferredBy(userId: string, referrerId: string) {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (data?.id) {
    const { error } = await supabase
      .from('users')
      .update({ referred_by: referrerId })
      .eq('id', userId);

    if (error) {
      console.warn('Could not update Supabase referred_by:', error);
    }
  }

  if (isFirebaseConfigured && database) {
    await update(ref(database, `users/${userId}`), {
      referredBy: referrerId,
    });
  }
}

async function syncReferrerTotals(referrerId: string) {
  const { count } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_uid', referrerId);

  const totalReferrals = Number(count || 0);

  await supabase
    .from('users')
    .update({ total_referrals: totalReferrals })
    .eq('id', referrerId);

  if (isFirebaseConfigured && database) {
    await update(ref(database, `users/${referrerId}`), {
      totalReferrals,
    });
  }
}

export async function createReferralRecord(
  referrerUid: string,
  referredUid: string,
  referralCode: string,
  referrerName?: string,
  referrerEmail?: string,
  referredName?: string,
  referredEmail?: string
): Promise<{ id: string | null; error?: string }> {
  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_uid: referrerUid,
      referrer_name: referrerName || null,
      referrer_email: referrerEmail || null,
      referred_uid: referredUid,
      referred_name: referredName || null,
      referred_email: referredEmail || null,
      referral_code: referralCode,
      purchased_plan: false,
      purchased_plan_name: null,
      reward_amount: 5,
      reward_claimed: false,
      status: 'joined',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating referral record:', error, {
      referrerUid,
      referredUid,
      referralCode,
    });
    return {
      id: null,
      error: error.message || 'Could not create referral record.',
    };
  }

  return { id: data.id };
}

export async function markReferralAsPurchased(
  referredUid: string,
  planName: string
): Promise<void> {
  const { error } = await supabase
    .from('referrals')
    .update({
      purchased_plan: true,
      purchased_at: new Date().toISOString(),
      purchased_plan_name: planName,
      status: 'purchased',
    })
    .eq('referred_uid', referredUid)
    .eq('purchased_plan', false);

  if (error) console.error('Error marking referral as purchased:', error);
}

export async function claimReferralReward(
  referrerUid: string,
  referralId: string,
  rewardAmount: number
): Promise<boolean> {
  const { data: referral, error: referralErr } = await supabase
    .from('referrals')
    .select('*')
    .eq('id', referralId)
    .maybeSingle();
  if (referralErr || !referral) return false;
  if (!referral.purchased_plan || referral.reward_claimed) return false;

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('usable_balance,wallet_balance,credits')
    .eq('id', referrerUid)
    .maybeSingle();
  if (userErr || !user) return false;

  const currentBalance = Number(user.usable_balance || user.wallet_balance || 0);
  const { error: referralUpdateErr } = await supabase
    .from('referrals')
    .update({
      reward_claimed: true,
      claimed_at: new Date().toISOString(),
      status: 'claimed',
    })
    .eq('id', referralId);
  if (referralUpdateErr) return false;

  const { error: userUpdateErr } = await supabase
    .from('users')
    .update({
      usable_balance: currentBalance + rewardAmount,
      wallet_balance: currentBalance + rewardAmount,
      credits: Number(user.credits || 0) + rewardAmount,
    })
    .eq('id', referrerUid);
  if (userUpdateErr) return false;

  await supabase.from('wallet_history').insert({
    user_id: referrerUid,
    type: 'referral_reward',
    amount: rewardAmount,
    description: `Referral reward from ${referral.referred_name || 'User'} purchase`,
    referral_id: referralId,
    balance_before: currentBalance,
    balance_after: currentBalance + rewardAmount,
  });

  return true;
}

export function listenToMyReferrals(
  referrerUid: string,
  callback: (referrals: ReferralRecord[]) => void
): () => void {
  const load = async () => {
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_uid', referrerUid)
      .order('created_at', { ascending: false });

    callback(
      (data || []).map((r: any) => ({
        id: r.id,
        referrerUid: r.referrer_uid,
        referrerName: r.referrer_name,
        referrerEmail: r.referrer_email,
        referredUid: r.referred_uid,
        referredName: r.referred_name,
        referredEmail: r.referred_email,
        referralCode: r.referral_code,
        joinedAt: r.created_at || r.joined_at,
        purchasedPlan: r.purchased_plan,
        purchasedAt: r.purchased_at,
        purchasedPlanName: r.purchased_plan_name,
        rewardAmount: r.reward_amount,
        rewardClaimed: r.reward_claimed,
        claimedAt: r.claimed_at,
        status: r.status,
      }))
    );
  };

  void load();

  const channel = supabase
    .channel(`my-referrals-${referrerUid}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'referrals', filter: `referrer_uid=eq.${referrerUid}` },
      load
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function listenToReferralsByStatus(
  referrerUid: string,
  status: 'joined' | 'purchased' | 'claimed',
  callback: (referrals: ReferralRecord[]) => void
): () => void {
  const load = async () => {
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_uid', referrerUid)
      .eq('status', status)
      .order('created_at', { ascending: false });

    callback((data || []) as any);
  };

  void load();

  const channel = supabase
    .channel(`referrals-status-${referrerUid}-${status}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'referrals', filter: `referrer_uid=eq.${referrerUid}` },
      load
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getReferralStats(referrerUid: string): Promise<{
  total: number;
  joined: number;
  purchased: number;
  claimed: number;
  totalEarnings: number;
  pendingRewards: number;
}> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_uid', referrerUid);

  if (error || !data) {
    return {
      total: 0,
      joined: 0,
      purchased: 0,
      claimed: 0,
      totalEarnings: 0,
      pendingRewards: 0,
    };
  }

  return {
    total: data.length,
    joined: data.filter((r: any) => r.status === 'joined').length,
    purchased: data.filter((r: any) => r.status === 'purchased').length,
    claimed: data.filter((r: any) => r.status === 'claimed').length,
    totalEarnings: data
      .filter((r: any) => r.reward_claimed)
      .reduce((sum: number, r: any) => sum + Number(r.reward_amount || 0), 0),
    pendingRewards: data
      .filter((r: any) => r.purchased_plan && !r.reward_claimed)
      .reduce((sum: number, r: any) => sum + Number(r.reward_amount || 0), 0),
  };
}

export async function applyReferralCode(
  currentUserId: string,
  referralCode: string
): Promise<{ success: boolean; message: string; referrerId?: string }> {
  try {
    const normalizedCode = normalizeReferralCode(referralCode);

    if (!normalizedCode) {
      return { success: false, message: 'Please enter a referral code' };
    }

    if (!currentUserId) {
      return { success: false, message: 'Please login first' };
    }

    const referrerData = await getUserByReferralCode(normalizedCode);
    if (!referrerData) {
      return { success: false, message: 'Invalid referral code' };
    }

    const referrerId = referrerData.id;
    if (referrerId === currentUserId) {
      return { success: false, message: 'You cannot use your own referral code' };
    }

    const currentUserData = await getUserProfile(currentUserId);
    if (!currentUserData) {
      return {
        success: false,
        message: 'Could not load your profile. Please log in again and retry.',
      };
    }

    const { data: existingAny } = await supabase
      .from('referrals')
      .select('id, referrer_uid')
      .eq('referred_uid', currentUserId)
      .limit(1);

    if (existingAny && existingAny.length > 0) {
      return {
        success: false,
        message: 'A referral code has already been applied to this account',
      };
    }

    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_uid', currentUserId)
      .eq('referrer_uid', referrerId)
      .limit(1);

    if (existing && existing.length > 0) {
      return { success: false, message: 'This code has already been applied' };
    }

    const { data: circular } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_uid', currentUserId)
      .eq('referred_uid', referrerId)
      .limit(1);

    if (circular && circular.length > 0) {
      return {
        success: false,
        message: 'Circular referrals are not allowed. You already referred this person!',
      };
    }

    const ensuredReferrer = await ensureSupabaseUserRecord(referrerData);
    const ensuredCurrentUser = await ensureSupabaseUserRecord(currentUserData);

    if (!ensuredReferrer || !ensuredCurrentUser) {
      return {
        success: false,
        message: 'Could not prepare referral accounts. Please try again.',
      };
    }

    await setUserReferredBy(currentUserId, referrerId);

    const referralRecord = await createReferralRecord(
      referrerId,
      currentUserId,
      normalizedCode,
      referrerData.name || 'User',
      referrerData.email || '',
      currentUserData.name || 'User',
      currentUserData.email || ''
    );

    if (!referralRecord.id) {
      return {
        success: false,
        message:
          referralRecord.error ||
          'Failed to apply referral code. Please try again.',
      };
    }

    try {
      await syncReferrerTotals(referrerId);

      await createNotification(
        referrerId,
        'referral',
        'New Referral',
        `${currentUserData.name || 'A new user'} joined using your referral code.`,
        {
          referrerId,
          referredName: currentUserData.name || 'User',
        },
        '/earn'
      );

      await createNotification(
        currentUserId,
        'referral',
        'Referral Code Applied',
        `Your account is now linked to ${referrerData.name || 'your referrer'}. Referral updates will appear here.`,
        {
          referrerId,
        },
        '/earn'
      );
    } catch (sideEffectError) {
      console.warn('Referral side effects failed:', sideEffectError);
    }

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
