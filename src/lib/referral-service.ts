/**
 * Supabase referral reward system.
 */

import { supabase } from '@/lib/supabase-config';
import {
  notifyReferrerNewSignup,
  notifyReferredUserWelcome,
  notifySubscriptionReminder,
} from '@/lib/notification-service';
import { sendNotification } from '@/lib/supabase-service';

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  status: 'signed_up' | 'purchased';
  rewardGiven: boolean;
  rewardAmount?: number;
  createdAt: string;
  purchasedAt?: string;
  referralName?: string;
  referralEmail?: string;
  lastReminderSent?: string;
}

export interface Reward {
  id: string;
  referrerId: string;
  referredUserId: string;
  type: 'signup' | 'purchase';
  amount: number;
  reason: string;
  createdAt: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  totalEarnings: number;
  updatedAt: string;
  pendingBalance?: number;
  confirmedBalance?: number;
  usableBalance?: number;
}

export interface ReferralLevel {
  level: 'Beginner' | 'Pro' | 'Elite';
  minReferrals: number;
  minEarnings: number;
  bonus: number;
}

const REFERRAL_LEVELS: ReferralLevel[] = [
  { level: 'Beginner', minReferrals: 0, minEarnings: 0, bonus: 0 },
  { level: 'Pro', minReferrals: 5, minEarnings: 25, bonus: 5 },
  { level: 'Elite', minReferrals: 15, minEarnings: 100, bonus: 10 },
];

const REWARD_CONFIG = {
  SIGNUP: 5,
  PURCHASE: 5,
};

function mapReferral(row: any): Referral {
  const status = row.status === 'purchased' || row.status === 'claimed' ? 'purchased' : 'signed_up';
  return {
    id: row.id,
    referrerId: row.referrer_uid,
    referredUserId: row.referred_uid,
    status,
    rewardGiven: Boolean(row.reward_claimed),
    rewardAmount: Number(row.reward_amount || REWARD_CONFIG.PURCHASE),
    createdAt: row.joined_at,
    purchasedAt: row.purchased_at,
    referralName: row.referred_name,
    referralEmail: row.referred_email,
    lastReminderSent: row.last_reminder_sent,
  };
}

export async function initializeWallet(userId: string): Promise<Wallet> {
  const now = new Date().toISOString();
  const { data: current } = await supabase
    .from('users')
    .select('wallet_balance, usable_balance, credits')
    .eq('id', userId)
    .maybeSingle();

  if (!current) {
    return {
      userId,
      balance: 0,
      totalEarnings: 0,
      updatedAt: now,
      pendingBalance: 0,
      confirmedBalance: 0,
      usableBalance: 0,
    };
  }

  await supabase
    .from('users')
    .update({
      wallet_balance: Number(current.wallet_balance || 0),
      usable_balance: Number(current.usable_balance || 0),
      credits: Number(current.credits || 0),
    })
    .eq('id', userId);

  return getWallet(userId) as Promise<Wallet>;
}

export async function getWallet(userId: string): Promise<Wallet | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, credits, usable_balance, wallet_balance, updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching wallet:', error);
    return null;
  }

  if (!data) return null;

  const balance = Number(data.wallet_balance || data.usable_balance || data.credits || 0);
  return {
    userId: data.id,
    balance,
    totalEarnings: Number(data.credits || balance),
    updatedAt: data.updated_at,
    pendingBalance: 0,
    confirmedBalance: balance,
    usableBalance: Number(data.usable_balance || balance),
  };
}

export function listenToWallet(userId: string, callback: (wallet: Wallet) => void) {
  const load = async () => {
    const wallet = await getWallet(userId);
    if (wallet) callback(wallet);
  };
  void load();

  const channel = supabase
    .channel(`wallet-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` }, load)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function addToWallet(
  userId: string,
  amount: number,
  reason: string
): Promise<boolean> {
  const wallet = await getWallet(userId);
  if (!wallet) return false;

  const newBalance = wallet.balance + amount;
  const { error } = await supabase
    .from('users')
    .update({
      wallet_balance: newBalance,
      usable_balance: newBalance,
      credits: wallet.totalEarnings + amount,
    })
    .eq('id', userId);

  if (error) {
    console.error('Error adding to wallet:', error);
    return false;
  }

  await supabase.from('wallet_history').insert({
    user_id: userId,
    amount,
    reason,
    description: reason,
    type: 'credit',
    balance_before: wallet.balance,
    balance_after: newBalance,
  });

  return true;
}

export async function getWalletHistory(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('wallet_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching wallet history:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    type: row.type,
    amount: Number(row.amount || 0),
    description: row.description || row.reason || '',
    status: 'confirmed',
    createdAt: row.created_at,
    referralId: row.referral_id,
  }));
}

export async function recordNewReferral(
  referrerId: string,
  referredUserId: string
): Promise<Referral | null> {
  const { data: existing } = await supabase
    .from('referrals')
    .select('id')
    .eq('referrer_uid', referrerId)
    .eq('referred_uid', referredUserId)
    .limit(1);
  if (existing && existing.length > 0) return null;

  const { data: circular } = await supabase
    .from('referrals')
    .select('id')
    .eq('referrer_uid', referredUserId)
    .eq('referred_uid', referrerId)
    .limit(1);
  if (circular && circular.length > 0) return null;

  const [{ data: referrer }, { data: referred }] = await Promise.all([
    supabase.from('users').select('*').eq('id', referrerId).maybeSingle(),
    supabase.from('users').select('*').eq('id', referredUserId).maybeSingle(),
  ]);

  const { data: row, error } = await supabase
    .from('referrals')
    .insert({
      referrer_uid: referrerId,
      referrer_name: referrer?.name || 'Your Friend',
      referrer_email: referrer?.email || '',
      referred_uid: referredUserId,
      referred_name: referred?.name || 'New User',
      referred_email: referred?.email || '',
      referral_code: referrer?.referral_code || '',
      reward_amount: REWARD_CONFIG.SIGNUP,
      reward_claimed: false,
      purchased_plan: false,
      status: 'joined',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error recording referral:', error);
    throw error;
  }

  await addToWallet(referrerId, REWARD_CONFIG.SIGNUP, 'Referral signup bonus');
  await notifyReferrerNewSignup(referrerId, referrer?.name || 'User', {
    referredId: referredUserId,
    referredName: referred?.name || 'New User',
    referralCount: Number(referrer?.total_referrals || 0) + 1,
  });
  await notifyReferredUserWelcome(referredUserId, referrer?.name || 'Your friend', 10);

  return mapReferral(row);
}

export async function rewardReferralPurchase(referredUserId: string): Promise<boolean> {
  const { data: referral, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_uid', referredUserId)
    .eq('reward_claimed', false)
    .in('status', ['joined', 'purchased'])
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !referral) return false;

  const referrerId = referral.referrer_uid;
  const referrerLevel = await getUserReferralLevel(referrerId);
  const baseReward = REWARD_CONFIG.PURCHASE;
  const totalReward = Math.round(baseReward * (1 + referrerLevel.bonus / 100) * 100) / 100;

  const wallet = await getWallet(referrerId);
  const currentBalance = wallet?.balance || 0;
  const newBalance = currentBalance + totalReward;

  const referralUpdate = await supabase
    .from('referrals')
    .update({
      status: 'claimed',
      purchased_plan: true,
      purchased_at: new Date().toISOString(),
      reward_claimed: true,
      reward_amount: totalReward,
      claimed_at: new Date().toISOString(),
    })
    .eq('id', referral.id);

  if (referralUpdate.error) return false;

  await supabase
    .from('users')
    .update({
      wallet_balance: newBalance,
      usable_balance: newBalance,
      credits: Number(wallet?.totalEarnings || 0) + totalReward,
    })
    .eq('id', referrerId);

  await supabase.from('wallet_history').insert({
    user_id: referrerId,
    type: 'referral_reward',
    amount: totalReward,
    description: `Referral purchase reward${referrerLevel.bonus > 0 ? ` (${referrerLevel.level} +${referrerLevel.bonus}%)` : ''}`,
    reason: 'Referral purchase reward',
    referral_id: referral.id,
    balance_before: currentBalance,
    balance_after: newBalance,
  });

  await supabase.from('rewards').insert({
    referrer_id: referrerId,
    referred_user_id: referredUserId,
    type: 'purchase',
    amount: totalReward,
    reason: 'Referral purchase reward',
  });

  await sendNotification(referrerId, {
    title: 'Reward Earned!',
    message: `${referral.referred_name || 'A user'} made a purchase. You earned $${totalReward.toFixed(2)}.`,
    type: 'referral',
  }).catch((notifyError) => {
    console.warn('Failed to send purchase reward notification:', notifyError);
  });

  return true;
}

export async function sendReminderToReferral(
  referrerId: string,
  referralId: string,
  referrerName: string
): Promise<boolean> {
  const { data: referral, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('id', referralId)
    .eq('referrer_uid', referrerId)
    .maybeSingle();

  if (error || !referral) return false;

  await notifySubscriptionReminder(
    referral.referred_uid,
    referrerName,
    `${referrerName} sent you a reminder.\n\nComplete your subscription purchase and help them earn rewards.\n\nVisit the IPTV section to buy now and get your discount.`
  );

  await supabase
    .from('referrals')
    .update({
      last_reminder_sent: new Date().toISOString(),
      reminder_count: Number(referral.reminder_count || 0) + 1,
    })
    .eq('id', referralId);

  return true;
}

export async function getReferralsForUser(referrerId: string): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_uid', referrerId)
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('Error fetching referrals:', error);
    return [];
  }

  return (data || []).map(mapReferral);
}

export function listenToReferrals(
  referrerId: string,
  callback: (referrals: Referral[]) => void
) {
  const load = async () => callback(await getReferralsForUser(referrerId));
  void load();

  const channel = supabase
    .channel(`legacy-referrals-${referrerId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals', filter: `referrer_uid=eq.${referrerId}` }, load)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function getUserReferralLevel(userId: string): Promise<ReferralLevel> {
  const referrals = await getReferralsForUser(userId);
  const purchaseCount = referrals.filter((r) => r.status === 'purchased').length;
  const wallet = await getWallet(userId);
  const earnings = wallet?.totalEarnings || 0;

  return (
    [...REFERRAL_LEVELS]
      .reverse()
      .find((level) => purchaseCount >= level.minReferrals && earnings >= level.minEarnings) ||
    REFERRAL_LEVELS[0]
  );
}

export async function getReferralLevelProgress(userId: string): Promise<{
  currentLevel: ReferralLevel;
  nextLevel: ReferralLevel | null;
  progress: number;
  referralCount: number;
  earnings: number;
}> {
  const currentLevel = await getUserReferralLevel(userId);
  const referrals = await getReferralsForUser(userId);
  const purchaseCount = referrals.filter((r) => r.status === 'purchased').length;
  const wallet = await getWallet(userId);
  const earnings = wallet?.totalEarnings || 0;

  const currentIndex = REFERRAL_LEVELS.findIndex((l) => l.level === currentLevel.level);
  const nextLevel = currentIndex < REFERRAL_LEVELS.length - 1 ? REFERRAL_LEVELS[currentIndex + 1] : null;

  const progress = nextLevel
    ? Math.min((purchaseCount / nextLevel.minReferrals) * 100, (earnings / nextLevel.minEarnings) * 100, 100)
    : 100;

  return {
    currentLevel,
    nextLevel,
    progress,
    referralCount: purchaseCount,
    earnings,
  };
}

export async function getRewardHistory(userId: string): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('wallet_history')
    .select('*')
    .eq('user_id', userId)
    .in('type', ['referral_reward', 'credit'])
    .order('created_at', { ascending: false });

  if (error) return [];

  return (data || []).map((row: any) => ({
    id: row.id,
    referrerId: row.user_id,
    referredUserId: '',
    type: row.type === 'referral_reward' ? 'purchase' : 'signup',
    amount: Number(row.amount || 0),
    reason: row.reason || row.description || '',
    createdAt: row.created_at,
  }));
}

export async function getReferralStats(userId: string): Promise<{
  totalReferrals: number;
  activeReferrals: number;
  completedPurchases: number;
  totalRewards: number;
}> {
  const referrals = await getReferralsForUser(userId);
  const wallet = await getWallet(userId);

  return {
    totalReferrals: referrals.length,
    activeReferrals: referrals.filter((r) => r.status === 'signed_up').length,
    completedPurchases: referrals.filter((r) => r.status === 'purchased').length,
    totalRewards: wallet?.totalEarnings || 0,
  };
}
