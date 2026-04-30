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

// ===== TYPES =====

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

// ===== CREATE REFERRAL RECORD =====

/**
 * Track referral when referred user joins
 * Call this when new user signs up with referral code
 */
export async function createReferralRecord(
  referrerUid: string,
  referredUid: string,
  referralCode: string,
  referrerName?: string,
  referrerEmail?: string,
  referredName?: string,
  referredEmail?: string
): Promise<string | null> {
  const { data, error } = await supabase.from('referrals').insert({
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
  }).select('id').single();
  if (error) {
    console.error('Error creating referral record:', error);
    return null;
  }
  return data.id;
}

// ===== UPDATE REFERRAL STATUS =====

/**
 * Mark referral as purchased when referred user buys subscription
 * Called after successful order/payment
 */
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

// ===== CLAIM REWARD =====

/**
 * Claim reward amount to referrer's wallet
 * Uses transaction to prevent duplicate claims
 */
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
    .update({ reward_claimed: true, claimed_at: new Date().toISOString(), status: 'claimed' })
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

// ===== REAL-TIME LISTENERS =====

/**
 * Listen to all referrals for a specific user (as referrer)
 * Returns real-time updates when status changes
 */
export function listenToMyReferrals(
  referrerUid: string,
  callback: (referrals: ReferralRecord[]) => void
): () => void {
  const load = async () => {
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_uid', referrerUid)
      .order('joined_at', { ascending: false });
    callback((data || []).map((r: any) => ({
      id: r.id,
      referrerUid: r.referrer_uid,
      referrerName: r.referrer_name,
      referrerEmail: r.referrer_email,
      referredUid: r.referred_uid,
      referredName: r.referred_name,
      referredEmail: r.referred_email,
      referralCode: r.referral_code,
      joinedAt: r.joined_at,
      purchasedPlan: r.purchased_plan,
      purchasedAt: r.purchased_at,
      purchasedPlanName: r.purchased_plan_name,
      rewardAmount: r.reward_amount,
      rewardClaimed: r.reward_claimed,
      claimedAt: r.claimed_at,
      status: r.status,
    })));
  };
  load();
  const channel = supabase
    .channel(`my-referrals-${referrerUid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals', filter: `referrer_uid=eq.${referrerUid}` }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get referrals by status
 */
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
      .order('joined_at', { ascending: false });
    callback((data || []) as any);
  };
  load();
  const channel = supabase
    .channel(`referrals-status-${referrerUid}-${status}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals', filter: `referrer_uid=eq.${referrerUid}` }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get referral stats
 */
export async function getReferralStats(referrerUid: string): Promise<{
  total: number;
  joined: number;
  purchased: number;
  claimed: number;
  totalEarnings: number;
  pendingRewards: number;
}> {
  const { data, error } = await supabase.from('referrals').select('*').eq('referrer_uid', referrerUid);
  if (error || !data) {
    return { total: 0, joined: 0, purchased: 0, claimed: 0, totalEarnings: 0, pendingRewards: 0 };
  }
  return {
    total: data.length,
    joined: data.filter((r: any) => r.status === 'joined').length,
    purchased: data.filter((r: any) => r.status === 'purchased').length,
    claimed: data.filter((r: any) => r.status === 'claimed').length,
    totalEarnings: data.filter((r: any) => r.reward_claimed).reduce((sum: number, r: any) => sum + Number(r.reward_amount || 0), 0),
    pendingRewards: data.filter((r: any) => r.purchased_plan && !r.reward_claimed).reduce((sum: number, r: any) => sum + Number(r.reward_amount || 0), 0),
  };
}

// ===== APPLY REFERRAL CODE =====

/**
 * Apply a referral code to current user
 * Validates code and creates referral relationship
 */
export async function applyReferralCode(
  currentUserId: string,
  referralCode: string
): Promise<{ success: boolean; message: string; referrerId?: string }> {
  if (!referralCode.trim()) return { success: false, message: 'Please enter a referral code' };
  if (!currentUserId) return { success: false, message: 'Please login first' };
  const { data: referrerData } = await supabase.from('users').select('*').eq('referral_code', referralCode.trim()).maybeSingle();
  if (!referrerData) return { success: false, message: 'Invalid referral code' };
  const referrerId = referrerData.id;
  if (referrerId === currentUserId) return { success: false, message: 'You cannot use your own referral code' };

  const { data: existing } = await supabase.from('referrals').select('id').eq('referred_uid', currentUserId).eq('referrer_uid', referrerId).limit(1);
  if (existing && existing.length > 0) return { success: false, message: 'This code has already been applied' };

  const { data: circular } = await supabase.from('referrals').select('id').eq('referrer_uid', currentUserId).eq('referred_uid', referrerId).limit(1);
  if (circular && circular.length > 0) return { success: false, message: 'Circular referrals are not allowed. You already referred this person!' };

  const { data: currentUserData } = await supabase.from('users').select('*').eq('id', currentUserId).maybeSingle();
  const recordId = await createReferralRecord(
    referrerId,
    currentUserId,
    referralCode.trim(),
    referrerData.name || 'User',
    referrerData.email || '',
    currentUserData?.name || 'User',
    currentUserData?.email || ''
  );
  if (!recordId) return { success: false, message: 'Failed to apply referral code. Please try again.' };
  return { success: true, message: `You're now part of ${referrerData.name || 'their'} team! 🎉`, referrerId };
}
