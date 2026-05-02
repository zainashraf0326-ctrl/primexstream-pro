'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-config';
import { claimReferralReward } from '@/lib/supabase-referral-service';
import { useApp } from '@/components/providers/app-provider';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DollarSign,
  Wallet as WalletIcon,
  Clock,
  CheckCircle,
  Users,
  Copy,
  Share2,
  AlertCircle,
  Zap,
  Award,
  TrendingUp,
  ArrowUpRight,
  Lock,
  Bell,
} from 'lucide-react';

interface WalletData {
  totalBalance: number;
  pendingBalance: number;
  confirmedBalance: number;
  usableBalance: number;
  lastUpdated: any;
}

function toDisplayDate(value: any) {
  if (!value) return new Date(0);
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
}

interface WalletTransaction {
  id: string;
  type: 'referral_bonus' | 'pending_reward' | 'confirmed_reward' | 'credit_used';
  amount: number;
  description: string;
  status: 'pending' | 'confirmed' | 'used';
  createdAt: any;
  referralId?: string;
}

interface ReferralStats {
  totalReferrals: number;
  successfulPurchases: number;
  pendingReferrals: number;
  totalEarned: number;
}

interface Referral {
  id: string;
  referredUserId: string;
  status: 'signed_up' | 'purchased';
  rewardGiven?: boolean;
  rewardAmount?: number;
  createdAt: any;
  referralName?: string;
  referralEmail?: string;
  lastReminderSent?: any;
}

export default function WalletPage() {
  const { user, isLoggedIn, isLoading } = useApp();
  const router = useRouter();

  // State
  const [walletData, setWalletData] = useState<WalletData>({
    totalBalance: 0,
    pendingBalance: 0,
    confirmedBalance: 0,
    usableBalance: 0,
    lastUpdated: null,
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    successfulPurchases: 0,
    pendingReferrals: 0,
    totalEarned: 0,
  });
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);

  // Set up real-time Supabase wallet/referral listeners
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadWallet = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('referral_code,total_referrals,credits,usable_balance,wallet_balance,updated_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !active) return;

      const balance = Number(data?.wallet_balance || data?.usable_balance || data?.credits || 0);
      setWalletData({
        totalBalance: balance,
        pendingBalance: 0,
        confirmedBalance: balance,
        usableBalance: Number(data?.usable_balance || balance),
        lastUpdated: data?.updated_at,
      });
      setReferralCode(data?.referral_code || user.referralCode || 'N/A');
    };

    const loadTransactions = async () => {
      const { data, error } = await supabase
        .from('wallet_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !active) return;

      setTransactions(
        (data || []).map((row: any) => ({
          id: row.id,
          type: row.type || 'confirmed_reward',
          amount: Number(row.amount || 0),
          description: row.description || row.reason || 'Wallet activity',
          status: 'confirmed',
          createdAt: row.created_at,
          referralId: row.referral_id,
        }))
      );
    };

    const loadReferrals = async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_uid', user.id)
        .order('created_at', { ascending: false });

      if (error || !active) return;

      const refs: Referral[] = (data || []).map((row: any) => ({
        id: row.id,
        referredUserId: row.referred_uid,
        status: row.purchased_plan || row.status === 'purchased' || row.status === 'claimed' ? 'purchased' : 'signed_up',
        rewardGiven: Boolean(row.reward_claimed),
        rewardAmount: Number(row.reward_amount || 5),
        createdAt: row.created_at || row.joined_at,
        referralName: row.referred_name || 'User',
        referralEmail: row.referred_email || 'Email not available',
        lastReminderSent: row.last_reminder_sent,
      }));

      const purchased = refs.filter((ref) => ref.status === 'purchased').length;
      const totalEarned = refs
        .filter((ref) => ref.rewardGiven)
        .reduce((sum, ref) => sum + Number(ref.rewardAmount || 0), 0);

      setReferrals(refs);
      setReferralStats({
        totalReferrals: refs.length,
        successfulPurchases: purchased,
        pendingReferrals: refs.length - purchased,
        totalEarned,
      });
    };

    const loadAll = async () => {
      try {
        await Promise.all([loadWallet(), loadTransactions(), loadReferrals()]);
      } catch (error) {
        console.error('Error loading wallet data:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadAll();

    const usersChannel = supabase
      .channel(`wallet-user-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, loadWallet)
      .subscribe();
    const historyChannel = supabase
      .channel(`wallet-history-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_history', filter: `user_id=eq.${user.id}` }, loadTransactions)
      .subscribe();
    const referralsChannel = supabase
      .channel(`wallet-referrals-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals', filter: `referrer_uid=eq.${user.id}` }, loadReferrals)
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(usersChannel);
      void supabase.removeChannel(historyChannel);
      void supabase.removeChannel(referralsChannel);
    };
  }, [user?.id, user?.referralCode]);

  // Generate referral link
  useEffect(() => {
    if (referralCode && typeof window !== 'undefined') {
      const link = `${window.location.origin}/login?ref=${referralCode}`;
      setReferralLink(link);
    }
  }, [referralCode]);

  // Copy to clipboard
  const handleCopy = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share
  const handleShare = async () => {
    const text = `Join me on PrimexStream Pro and get $5 bonus! Use my referral code: ${referralCode}\n\n${referralLink}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join PrimexStream Pro',
        text: text,
      });
    } else {
      handleCopy(referralLink);
    }
  };

  // Send reminder to referral
  const handleSendReminder = async (referralId: string) => {
    setSendingReminder(referralId);
    try {
      const { sendReminderToReferral } = await import('@/lib/referral-service');
      const referral = referrals.find(r => r.id === referralId);
      if (referral && user?.name) {
        await sendReminderToReferral(user.id, referralId, user.name);
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
    } finally {
      setSendingReminder(null);
    }
  };

  // Claim reward for purchased referral
  const handleClaimReward = async (referralId: string, rewardAmount: number = 5) => {
    setClaimingReward(referralId);
    try {
      if (!user?.id) return;
      await claimReferralReward(user.id, referralId, rewardAmount);
    } catch (error) {
      console.error('Error claiming reward:', error);
    } finally {
      setClaimingReward(null);
    }
  };

  if (isLoading || loading) {
    return (
      <AppLayout title="Referral Wallet">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading wallet...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Referral Wallet">
      <div className="w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="space-y-12">
            {/* Header */}
            <div className="space-y-3">
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">
                Referral Wallet
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                Earn money by referring friends and use your balance on subscription plans
              </p>
            </div>

            {/* Wallet Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Balance */}
              <Card className="glass bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 hover:scale-105 transition-transform">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                        Total Balance
                      </p>
                      <WalletIcon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${walletData.totalBalance.toFixed(2)}
                    </p>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                      Balance available
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Balance */}
              <Card className="glass bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 hover:scale-105 transition-transform">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-widest">
                        Pending Balance
                      </p>
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      ${walletData.pendingBalance.toFixed(2)}
                    </p>
                    <p className="text-xs text-orange-600/80 dark:text-orange-400/80">
                      Awaiting confirmation
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Confirmed Balance */}
              <Card className="glass bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 hover:scale-105 transition-transform">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-widest">
                        Confirmed Balance
                      </p>
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      ${walletData.confirmedBalance.toFixed(2)}
                    </p>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                      Ready to use
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Usable Balance */}
              <Card className="glass bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 hover:scale-105 transition-transform">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-widest">
                        Usable Balance
                      </p>
                      <DollarSign className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      ${walletData.usableBalance.toFixed(2)}
                    </p>
                    <p className="text-xs text-purple-600/80 dark:text-purple-400/80">
                      For subscriptions
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Important Note */}
            <Card className="glass border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                      ℹ️ Usage Rules
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      Referral rewards can only be used for subscription plans. Credits cannot be withdrawn or transferred to external accounts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral Stats & Invite Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Referral Stats
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Total Referrals */}
                  <Card className="glass">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                          Total Referrals
                        </p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">
                          {referralStats.totalReferrals}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Successful Purchases */}
                  <Card className="glass">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                          Purchased
                        </p>
                        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                          {referralStats.successfulPurchases}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pending Referrals */}
                  <Card className="glass">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                          Pending
                        </p>
                        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                          {referralStats.pendingReferrals}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Total Earned */}
                  <Card className="glass">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                          Total Earned
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          ${referralStats.totalEarned.toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Invite Friends Card */}
              <Card className="glass border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-900/10">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        Invite Friends
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Share your unique code and earn $5 per referral
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={referralCode}
                          readOnly
                          className="text-lg font-mono font-bold"
                        />
                        <Button
                          onClick={() => handleCopy(referralCode)}
                          variant={copied ? 'primary' : 'outline'}
                          className="gap-2"
                        >
                          {copied ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>

                      <Button
                        onClick={handleShare}
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Share2 className="w-4 h-4" />
                        Share with Friends
                      </Button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                      📧 Your friends get $5 bonus, you earn $5 per purchase!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            {transactions.length > 0 && (
              <Card className="glass">
                <CardContent className="pt-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ArrowUpRight className="w-6 h-6 text-emerald-600" />
                        Transaction History
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Recent wallet activity
                      </p>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                tx.status === 'confirmed'
                                  ? 'bg-emerald-100 dark:bg-emerald-900'
                                  : tx.status === 'pending'
                                  ? 'bg-orange-100 dark:bg-orange-900'
                                  : 'bg-blue-100 dark:bg-blue-900'
                              }`}
                            >
                              {tx.status === 'confirmed' && (
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                              )}
                              {tx.status === 'pending' && (
                                <Clock className="w-5 h-5 text-orange-600" />
                              )}
                              {tx.status === 'used' && (
                                <DollarSign className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">
                                {tx.description}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {tx.createdAt ? toDisplayDate(tx.createdAt).toLocaleDateString() : 'Recent'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right pl-4 flex-shrink-0">
                            <p
                              className={`text-lg font-bold ${
                                tx.amount > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {tx.amount > 0 ? '+' : ''} ${Math.abs(tx.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction History */}
            {transactions.length > 0 && (
              <Card className="glass">
                <CardContent className="pt-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ArrowUpRight className="w-6 h-6 text-emerald-600" />
                        Transaction History
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Recent wallet activity
                      </p>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                tx.status === 'confirmed'
                                  ? 'bg-emerald-100 dark:bg-emerald-900'
                                  : tx.status === 'pending'
                                  ? 'bg-orange-100 dark:bg-orange-900'
                                  : 'bg-blue-100 dark:bg-blue-900'
                              }`}
                            >
                              {tx.status === 'confirmed' && (
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                              )}
                              {tx.status === 'pending' && (
                                <Clock className="w-5 h-5 text-orange-600" />
                              )}
                              {tx.status === 'used' && (
                                <DollarSign className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">
                                {tx.description}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {tx.createdAt ? toDisplayDate(tx.createdAt).toLocaleDateString() : 'Recent'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right pl-4 flex-shrink-0">
                            <p
                              className={`text-lg font-bold ${
                                tx.amount > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {tx.amount > 0 ? '+' : ''} ${Math.abs(tx.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Referral Team */}
            {referrals.length > 0 && (
              <Card className="glass">
                <CardContent className="pt-8">
                  <div className="space-y-6">
                    {/* Header with count */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Users className="w-6 h-6 text-blue-600" />
                          Your Referral Team
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {referrals.length} member{referrals.length !== 1 ? 's' : ''} in your team
                        </p>
                      </div>
                      {/* Team Summary */}
                      <div className="flex gap-4 text-right">
                        <div>
                          <p className="text-2xl font-bold text-emerald-600">{referrals.filter(r => r.status === 'purchased').length}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Purchased</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-orange-600">{referrals.filter(r => r.status === 'signed_up').length}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Pending</p>
                        </div>
                      </div>
                    </div>

                    {/* Team Grid/Rows */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {referrals.map((ref) => (
                        <div
                          key={ref.id}
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                        >
                          {/* Left: Status + Name */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm ${
                                ref.status === 'purchased'
                                  ? 'bg-emerald-500'
                                  : 'bg-orange-500'
                              }`}
                            >
                              {ref.referralName?.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">
                                {ref.referralName || 'User'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {ref.referralEmail || 'Email not available'}
                              </p>
                            </div>
                          </div>

                          {/* Right: Status + Action Button */}
                          <div className="flex items-center gap-3 ml-4">
                            {/* Status Badge */}
                            <div className="text-right">
                              {ref.status === 'purchased' && ref.rewardGiven ? (
                                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full whitespace-nowrap">
                                  <CheckCircle className="w-3 h-3" />
                                  Claimed
                                </div>
                              ) : (
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                  {ref.status === 'purchased' ? '💰 Ready to Claim' : '🎁 Just Joined'}
                                </p>
                              )}
                            </div>

                            {/* Action Button */}
                            {ref.status === 'signed_up' ? (
                              // Send Reminder Button
                              <Button
                                onClick={() => handleSendReminder(ref.id)}
                                disabled={sendingReminder === ref.id}
                                variant="outline"
                                size="sm"
                                className="gap-2 flex-shrink-0 whitespace-nowrap"
                              >
                                {sendingReminder === ref.id ? (
                                  <>
                                    <div className="w-3 h-3 rounded-full border-2 border-slate-400 border-t-slate-700 animate-spin"></div>
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Bell className="w-4 h-4" />
                                    Remind
                                  </>
                                )}
                              </Button>
                            ) : ref.status === 'purchased' && !ref.rewardGiven ? (
                              // Claim Reward Button
                              <Button
                                onClick={() => handleClaimReward(ref.id, ref.rewardAmount || 5)}
                                disabled={claimingReward === ref.id}
                                size="sm"
                                className="gap-2 flex-shrink-0 whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                {claimingReward === ref.id ? (
                                  <>
                                    <div className="w-3 h-3 rounded-full border-2 border-white border-t-emerald-600 animate-spin"></div>
                                    Claiming...
                                  </>
                                ) : (
                                  <>
                                    <DollarSign className="w-4 h-4" />
                                    Claim ${ref.rewardAmount || 5}
                                  </>
                                )}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
