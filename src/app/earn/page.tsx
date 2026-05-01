'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/components/providers/app-provider';
import { database, isFirebaseConfigured } from '@/services/firebaseClient';
import { get, ref } from 'firebase/database';
import { AppLayout } from '@/components/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Copy,
  Share2,
  Users,
  DollarSign,
  Trophy,
  Zap,
  Gift,
  Youtube,
  Music2,
  Instagram,
  Facebook,
  Mail,
  Send,
  Link2,
  MessageCircle,
  Upload,
  CheckCircle2,
  AlertCircle,
  Bell,
  FileUp,
  X as XIcon,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Users2,
} from 'lucide-react';
import { useRealtimeReferrals } from '@/lib/useRealtimeReferrals';
import { claimReferralReward, applyReferralCode } from '@/lib/firebase-referral-service';
import { getSocialMediaLinks } from '@/lib/supabase-service';
import { ReferralTreeModal } from '@/components/referral-tree-modal';
import { EarnBreakdownModal } from '@/components/earn-breakdown-modal';
import { AdminAppTaskCard } from '@/components/earn/admin-app-task-card';
import { TaskRow } from '@/components/earn/task-row';

/**
 * REAL PRODUCTION EARN PAGE
 * 
 * Uses real-time Supabase listeners:
 * - Referral status updates instantly
 * - Claim button appears when purchasedPlan = true
 * - Claimed state shown when rewardClaimed = true
 */
export default function EarnPage() {
  const { user, isLoading } = useApp();

  // Real-time referrals from Supabase
  const { referrals, stats, loading } = useRealtimeReferrals(user?.id || '');

  // Local state
  const [copied, setCopied] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState(user?.referralCode || '');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [applyingCode, setApplyingCode] = useState(false);
  const [codeMessage, setCodeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [socialLinks, setSocialLinks] = useState<any>(null);
  const [referralLink, setReferralLink] = useState('');
  const [socialTaskForms, setSocialTaskForms] = useState<{
    [key: string]: { id: string; username: string; proof: File | null }
  }>({
    youtube: { id: 'youtube', username: '', proof: null },
    instagram: { id: 'instagram', username: '', proof: null },
    tiktok: { id: 'tiktok', username: '', proof: null },
    facebook: { id: 'facebook', username: '', proof: null },
    x: { id: 'x', username: '', proof: null },
    telegram: { id: 'telegram', username: '', proof: null },
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [submittingSocialTask, setSubmittingSocialTask] = useState(false);
  const [socialTaskMessage, setSocialTaskMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [socialTaskSubmitted, setSocialTaskSubmitted] = useState(false);
  const [activeTask, setActiveTask] = useState<'install-app' | 'social-media' | null>(null);
  const [activeReferralFilter, setActiveReferralFilter] = useState<'total' | 'joined' | 'purchased' | 'earned'>('total');
  const [showReferralTree, setShowReferralTree] = useState(false);
  const [showEarnBreakdown, setShowEarnBreakdown] = useState(false);
  const [remindingUser, setRemindingUser] = useState<string | null>(null);

  const getErrorMessage = (error: unknown, fallbackMessage: string) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const nextMessage = (error as { message?: unknown }).message;
      if (typeof nextMessage === 'string' && nextMessage.trim()) {
        return nextMessage;
      }
    }

    return fallbackMessage;
  };

  const filteredReferrals = referrals.filter((referral) => {
    if (activeReferralFilter === 'joined') return !referral.purchasedPlan;
    if (activeReferralFilter === 'purchased') return referral.purchasedPlan;
    if (activeReferralFilter === 'earned') return referral.rewardClaimed;
    return true;
  });

  useEffect(() => {
    let active = true;

    const loadReferralCode = async () => {
      const fallbackCode = user?.referralCode || '';

      if (fallbackCode) {
        if (active) {
          setReferralCode(fallbackCode);
        }
        return;
      }

      if (!user?.id) {
        if (active) {
          setReferralCode(fallbackCode);
        }
        return;
      }
      
      // Load referral code from Firebase
      if (!isFirebaseConfigured || !database) {
        setReferralCode(fallbackCode);
        return;
      }

      try {
        const snapshot = await get(ref(database, `users/${user.id}/referralCode`));
        if (!active) return;
        
        const code = snapshot.val() || fallbackCode;
        setReferralCode(code);
      } catch (error) {
        if (active) {
          setReferralCode(fallbackCode);
          console.warn(
            'Referral code lookup fallback used:',
            getErrorMessage(error, 'Could not fetch referral code from Firebase.')
          );
        }
      }
    };

    void loadReferralCode();

    return () => {
      active = false;
    };
  }, [user?.id, user?.referralCode]);

  // Generate referral link
  useEffect(() => {
    if (referralCode) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      setReferralLink(`${baseUrl}/login?ref=${referralCode}`);
      return;
    }

    setReferralLink('');
  }, [referralCode]);

  // Fetch social media links
  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const links = await getSocialMediaLinks();
        setSocialLinks(links);
      } catch (error) {
        console.error('Error fetching social media links:', error);
      }
    };
    fetchSocialLinks();
  }, []);

  // Copy referral code to clipboard
  const handleCopy = async (text: string, id: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Error copying text:', error);
    }
  };

  // Claim referral reward
  const handleClaimReward = async (referralId: string, rewardAmount: number) => {
    if (!user?.id) return;

    setClaiming(referralId);
    try {
      const success = await claimReferralReward(user.id, referralId, rewardAmount);
      if (success) {
        console.log('✅ Reward claimed successfully');
        // Referral listener will automatically update the UI
      } else {
        console.error('Failed to claim reward');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    } finally {
      setClaiming(null);
    }
  };

  // Send reminder to referral user
  const handleSendReminder = async (referredUserId: string, referralName: string) => {
    if (!user?.id) return;

    setRemindingUser(referredUserId);
    try {
      const message = `Your referrer ${user.name || 'A user'} is reminding you: Use $5 to buy a subscription and they'll make a reward!`;
      const { error } = await supabase.from('notifications').insert({
        user_id: referredUserId,
        title: 'Referral Reminder',
        type: 'reminder',
        message,
        read: false,
        deleted: false,
        data: {
          link: '/iptv',
          referrerId: user.id,
          referrerName: user.name || 'A user',
        },
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Show success message
      console.log('✅ Reminder sent to', referralName);
    } catch (error) {
      console.error('Error sending reminder:', error);
    } finally {
      setRemindingUser(null);
    }
  };

  // Apply referral code
  const handleApplyReferralCode = async () => {
    if (!user?.id) {
      setCodeMessage({ type: 'error', text: 'Please login first' });
      return;
    }

    setApplyingCode(true);
    setCodeMessage(null);

    const result = await applyReferralCode(user.id, referralCodeInput);

    if (result.success) {
      setCodeMessage({ type: 'success', text: result.message });
      setReferralCodeInput('');
      // The referral listener will auto-update the UI
    } else {
      setCodeMessage({ type: 'error', text: result.message });
    }

    setApplyingCode(false);
  };

  const getSocialMediaLink = (platform: string): string => {
    const links: { [key: string]: string } = {
      youtube: socialLinks?.youtube || 'https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw',
      instagram: socialLinks?.instagram || 'https://www.instagram.com/',
      tiktok: socialLinks?.tiktok || 'https://www.tiktok.com',
      facebook: socialLinks?.facebook || 'https://www.facebook.com/',
      x: socialLinks?.x || 'https://x.com/home',
      telegram: socialLinks?.telegram || 'https://t.me',
    };

    return links[platform];
  };

  const handleSocialFormChange = (
    platform: string,
    field: 'username' | 'proof',
    value: any
  ) => {
    setSocialTaskForms((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }));
  };

  const togglePlatformSelection = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((entry) => entry !== platform)
        : [...prev, platform]
    );
  };

  const handleOpenSocialMedia = (e: React.MouseEvent, platform: string) => {
    e.stopPropagation();
    const link = getSocialMediaLink(platform);
    if (link) {
      window.open(link, '_blank');
      setTimeout(() => {
        togglePlatformSelection(platform);
      }, 100);
    }
  };

  const handleSubmitSocialTask = async () => {
    setSubmittingSocialTask(true);
    setSocialTaskMessage({
      type: 'error',
      text: 'The old social task flow has been replaced by the new admin app task.',
    });
    setSubmittingSocialTask(false);
  };

  /*

        text: '✅ Social task submitted! Admin will review your proof and approve within 24-48 hours.' 
      });
 
  */
  if (isLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-4 border-slate-300 border-t-emerald-600 animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading referral data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="relative max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent">
            Earn Rewards
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Share your referral code and earn ₹5 per purchase
          </p>
        </div>

        <div className="flex gap-6 relative">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Referrals - Opens Tree Modal */}
              <Card
                className="p-4 text-center glass glass-light dark:glass cursor-pointer transition-all hover:ring-2 hover:ring-emerald-500/70 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20"
                onClick={() => setShowReferralTree(true)}
              >
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.total}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Referrals</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Click to view tree</p>
              </Card>

              {/* Just Joined - Shows Reminder Button */}
              <Card
                className="p-4 text-center glass glass-light dark:glass cursor-pointer transition-all hover:ring-2 hover:ring-blue-500/70 hover:bg-blue-50/60 dark:hover:bg-blue-900/20"
                onClick={() => setActiveReferralFilter('joined')}
              >
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.joined}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Just Joined</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Click to remind</p>
              </Card>

              {/* Purchased - Shows Claim Button */}
              <Card
                className="p-4 text-center glass glass-light dark:glass cursor-pointer transition-all hover:ring-2 hover:ring-orange-500/70 hover:bg-orange-50/60 dark:hover:bg-orange-900/20"
                onClick={() => setActiveReferralFilter('purchased')}
              >
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.purchased}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Purchased</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Click to claim</p>
              </Card>

              {/* Earned - Opens Breakdown Modal */}
              <Card
                className="p-4 text-center glass glass-light dark:glass cursor-pointer transition-all hover:ring-2 hover:ring-green-500/70 hover:bg-green-50/60 dark:hover:bg-green-900/20"
                onClick={() => setShowEarnBreakdown(true)}
              >
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ₹{stats.totalEarnings}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Earned</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Click for details</p>
              </Card>
            </div>

            <div className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-2 items-start">
            {/* Your Unique Referral Code Section */}
            {referralCode && (
              <Card className="order-1 h-full p-4 md:p-5 glass glass-light dark:glass animate-fade-in-up bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/30 dark:to-blue-900/30 border-2 border-emerald-200 dark:border-emerald-700 overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex-shrink-0">
                      <Users2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                    <h3 className="text-sm uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300 font-bold mb-2">Your Unique Referral Code</h3>
                    <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-4 md:p-5 border-2 border-emerald-300 dark:border-emerald-600 backdrop-blur overflow-hidden shadow-sm">
                      <p className="break-all text-xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-[0.16em] md:tracking-[0.24em] text-center">
                        {referralCode}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
                      📌 This is YOUR unique code. Each user has a different code!
                    </p>
                  </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleCopy(referralCode, 'code')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full"
                    >
                      <Copy className="w-4 h-4" />
                      {copied === 'code' ? 'Copied!' : 'Copy Code'}
                    </Button>

                    <Button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Join PrimexStream Pro',
                            text: `Use my referral code ${referralCode} and get discounts!`,
                            url: referralLink || window.location.href,
                          });
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full"
                    >
                      <Share2 className="w-4 h-4" />
                      Share Code
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Referral Link Section */}
            {referralLink && (
              <Card className="order-3 md:col-span-2 p-6 glass glass-light dark:glass animate-fade-in-up bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                      <Link2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Unique Referral Link
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Share this link - referral code auto-fills for new users
                      </p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0 flex-1 rounded-md bg-slate-50 dark:bg-slate-800/70 px-3 py-2">
                        <p className="break-all text-sm text-slate-600 dark:text-slate-400 font-mono">
                          {referralLink}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleCopy(referralLink, 'link')}
                        variant="outline"
                        size="sm"
                        className="gap-2 flex-shrink-0 self-start"
                      >
                        <Copy className="w-4 h-4" />
                        {copied === 'link' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Join my IPTV service',
                            text: `Use this link to sign up and get the referral discount!`,
                            url: referralLink,
                          });
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share Link
                    </Button>

                    <Button
                      onClick={() => {
                        const whatsappLink = `https://wa.me/?text=${encodeURIComponent(`Join my IPTV service! ${referralLink}`)}`;
                        window.open(whatsappLink, '_blank');
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded p-2">
                    💡 <strong>Tip:</strong> When someone clicks this link and signs up, the referral code will automatically be applied!
                  </div>
                </div>
              </Card>
            )}

            {/* Apply Referral Code Section */}
            <Card className="order-2 h-full p-4 md:p-5 glass glass-light dark:glass animate-fade-in-up border border-orange-200/80 dark:border-orange-800/70 bg-white/85 dark:bg-slate-900/70">
              <div className="flex items-start gap-3 mb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 flex-shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                    Apply Referral Code
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Missed the referral link? Enter your friend&apos;s code below.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Referral Code
                  </label>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <Input
                      type="text"
                      placeholder="Enter referral code"
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                      disabled={applyingCode}
                      className="flex-1 rounded-2xl px-5 py-3 text-sm md:text-base uppercase tracking-[0.16em]"
                    />
                    <Button
                      onClick={handleApplyReferralCode}
                      disabled={applyingCode || !referralCodeInput.trim()}
                      className="bg-orange-600 hover:bg-orange-700 text-white gap-2 md:min-w-[170px]"
                    >
                      {applyingCode ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-orange-700 animate-spin"></div>
                          Applying...
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4" />
                          Apply Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {codeMessage && (
                  <div
                    className={`p-3 rounded-lg text-sm font-medium ${
                      codeMessage.type === 'success'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {codeMessage.type === 'success' ? '✅ ' : '❌ '}
                    {codeMessage.text}
                  </div>
                )}
              </div>
            </Card>
            </div>

            {/* Tasks Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white px-2">Available Tasks</h2>

              {/* Task 1: App Installer */}
              <TaskRow
                title="Install Our Mobile App"
                description="Download and install the PrimexStream Pro app on your mobile device"
                icon={<Smartphone className="w-6 h-6" />}
                status="available"
                reward="5 Free Days + ₹50 Wallet Credit"
                isExpanded={activeTask === 'install-app'}
                onToggle={() => setActiveTask((current) => current === 'install-app' ? null : 'install-app')}
              >
                <AdminAppTaskCard
                  userId={user?.id}
                  userName={user?.name}
                  userEmail={user?.email}
                />
              </TaskRow>

              {/* Task 2: Social Media Followers */}
              <TaskRow
                title="Follow us on Social Media"
                description="Follow PrimexStream Pro on social media platforms and earn rewards"
                icon={<Users2 className="w-6 h-6" />}
                status="available"
                reward="1 Month Free + ₹20 Wallet Credit"
                isExpanded={activeTask === 'social-media'}
                onToggle={() => setActiveTask((current) => current === 'social-media' ? null : 'social-media')}
              >
                <div className="space-y-6">
                  <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4 text-sm">
                    <p className="font-semibold text-slate-900 dark:text-white mb-2">How it works:</p>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-xs">
                      <li>✓ Select at least <strong>3 platforms</strong> you want to follow</li>
                      <li>✓ Enter your account username/ID for each platform</li>
                      <li>✓ Upload a screenshot as proof</li>
                      <li>✓ Submit for admin verification</li>
                      <li>✓ Get 1 month free access + ₹20 wallet credit when approved</li>
                    </ul>
                  </div>

                  {/* Platform Selection Grid */}
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-900 dark:text-white">Select Platforms <span className="text-xs text-slate-600 dark:text-slate-400">(minimum 3)</span></p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* YouTube */}
                      <div className="border-2 rounded-lg p-4 transition-all hover:shadow-md"
                        style={{
                          borderColor: selectedPlatforms.includes('youtube') ? '#ef4444' : '#e5e7eb',
                          backgroundColor: selectedPlatforms.includes('youtube') ? '#fef2f2' : 'transparent',
                        }}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Youtube className="w-5 h-5 text-red-600" />
                            <span className="font-semibold text-slate-900 dark:text-white">YouTube</span>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 ${selectedPlatforms.includes('youtube') ? 'bg-red-600 border-red-600' : 'border-slate-300 dark:border-slate-600'}`} />
                        </div>

                        {/* Progress Bar */}
                        {selectedPlatforms.includes('youtube') && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Progress</span>
                              <span className="text-xs text-red-600 font-semibold">
                                {socialTaskForms.youtube.username && socialTaskForms.youtube.proof ? '100%' : socialTaskForms.youtube.username ? '67%' : '33%'}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-600 transition-all duration-300"
                                style={{
                                  width: socialTaskForms.youtube.username && socialTaskForms.youtube.proof ? '100%' : socialTaskForms.youtube.username ? '67%' : '33%'
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Steps */}
                        <div className="space-y-3">
                          {/* Step 1: Subscribe */}
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedPlatforms.includes('youtube')}
                              readOnly
                              className="w-5 h-5 rounded border-2 border-red-400 bg-white dark:bg-slate-800 cursor-default mt-0.5 accent-red-600"
                            />
                            <div className="flex-1 min-w-0">
                              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Step 1: Subscribe to Channel</label>
                              {!selectedPlatforms.includes('youtube') ? (
                                <Button
                                  onClick={(e) => handleOpenSocialMedia(e, 'youtube')}
                                  className="w-full bg-red-600 hover:bg-red-700 text-white text-xs gap-2"
                                >
                                  <Youtube className="w-4 h-4" />
                                  Open & Subscribe
                                </Button>
                              ) : (
                                <div className="text-xs text-red-700 dark:text-red-300 font-medium">✓ Subscribed!</div>
                              )}
                            </div>
                          </div>

                          {/* Step 2: Username */}
                          {selectedPlatforms.includes('youtube') && (
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={!!socialTaskForms.youtube.username}
                                readOnly
                                className="w-5 h-5 rounded border-2 border-red-400 bg-white dark:bg-slate-800 cursor-default mt-0.5 accent-red-600"
                              />
                              <div className="flex-1 min-w-0">
                                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Step 2: Enter Your Username/ID</label>
                                <input
                                  type="text"
                                  placeholder="e.g., @yourprofile"
                                  value={socialTaskForms.youtube.username}
                                  onChange={(e) => handleSocialFormChange('youtube', 'username', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-red-500"
                                />
                              </div>
                            </div>
                          )}

                          {/* Step 3: Upload Proof */}
                          {socialTaskForms.youtube.username && (
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={!!socialTaskForms.youtube.proof}
                                readOnly
                                className="w-5 h-5 rounded border-2 border-red-400 bg-white dark:bg-slate-800 cursor-default mt-0.5 accent-red-600"
                              />
                              <div className="flex-1 min-w-0">
                                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Step 3: Upload Proof Screenshot</label>
                                <div className="relative">
                                  <input
                                    type="file"
                                    onChange={(e) => handleSocialFormChange('youtube', 'proof', e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="youtube-proof"
                                    accept="image/*"
                                  />
                                  <label htmlFor="youtube-proof" className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-red-300 rounded cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs">
                                    <FileUp className="w-4 h-4 text-red-600" />
                                    {socialTaskForms.youtube.proof?.name || 'Choose image'}
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Cancel Button */}
                          {selectedPlatforms.includes('youtube') && (
                            socialTaskForms.youtube.username && socialTaskForms.youtube.proof ? (
                              <Button
                                onClick={handleSubmitSocialTask}
                                disabled={submittingSocialTask}
                                className="w-full text-xs mt-2 bg-emerald-600 hover:bg-emerald-700 text-white claim-button-glow"
                              >
                                Submit
                              </Button>
                            ) : (
                              <Button
                                onClick={() => {
                                  togglePlatformSelection('youtube');
                                  handleSocialFormChange('youtube', 'username', '');
                                  handleSocialFormChange('youtube', 'proof', null);
                                }}
                                variant="outline"
                                className="w-full text-xs mt-2"
                              >
                                Start Over
                              </Button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Instagram */}
                      <div className="border-2 rounded-lg p-4 transition-all hover:shadow-md"
                        style={{
                          borderColor: selectedPlatforms.includes('instagram') ? '#ec4899' : '#e5e7eb',
                          backgroundColor: selectedPlatforms.includes('instagram') ? '#fdf2f8' : 'transparent',
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Instagram className="w-5 h-5 text-pink-600" />
                            <span className="font-semibold text-slate-900 dark:text-white">Instagram</span>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 ${selectedPlatforms.includes('instagram') ? 'bg-pink-600 border-pink-600' : 'border-slate-300 dark:border-slate-600'}`} />
                        </div>
                        
                        {!selectedPlatforms.includes('instagram') ? (
                          <Button
                            onClick={(e) => handleOpenSocialMedia(e, 'instagram')}
                            className="w-full bg-pink-600 hover:bg-pink-700 text-white text-sm gap-2"
                          >
                            <Instagram className="w-4 h-4" />
                            Follow Account
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-pink-50 dark:bg-pink-900/20 p-2 rounded text-xs text-pink-700 dark:text-pink-300 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>Account followed! Now upload your proof.</span>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Follower ID / Username</label>
                              <input
                                type="text"
                                placeholder="e.g., @yourprofile"
                                value={socialTaskForms.instagram.username}
                                onChange={(e) => handleSocialFormChange('instagram', 'username', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-pink-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Upload Screenshot Proof</label>
                              <div className="relative">
                                <input
                                  type="file"
                                  onChange={(e) => handleSocialFormChange('instagram', 'proof', e.target.files?.[0] || null)}
                                  className="hidden"
                                  id="instagram-proof"
                                  accept="image/*"
                                />
                                <label htmlFor="instagram-proof" className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-pink-300 rounded cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors text-xs">
                                  <FileUp className="w-4 h-4 text-pink-600" />
                                  {socialTaskForms.instagram.proof?.name || 'Choose image'}
                                </label>
                              </div>
                            </div>
                            <Button
                              onClick={
                                socialTaskForms.instagram.username && socialTaskForms.instagram.proof
                                  ? handleSubmitSocialTask
                                  : () => togglePlatformSelection('instagram')
                              }
                              variant="outline"
                              className={`w-full text-xs ${
                                socialTaskForms.instagram.username && socialTaskForms.instagram.proof
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white claim-button-glow border-emerald-600'
                                  : ''
                              }`}
                            >
                              {socialTaskForms.instagram.username && socialTaskForms.instagram.proof ? 'Submit' : 'Start Over'}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* TikTok */}
                      <div className="border-2 rounded-lg p-4 transition-all hover:shadow-md"
                        style={{
                          borderColor: selectedPlatforms.includes('tiktok') ? '#000000' : '#e5e7eb',
                          backgroundColor: selectedPlatforms.includes('tiktok') ? '#f3f4f6' : 'transparent',
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Music2 className="w-5 h-5 text-slate-900 dark:text-white" />
                            <span className="font-semibold text-slate-900 dark:text-white">TikTok</span>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 ${selectedPlatforms.includes('tiktok') ? 'bg-slate-900 border-slate-900' : 'border-slate-300 dark:border-slate-600'}`} />
                        </div>
                        
                        {!selectedPlatforms.includes('tiktok') ? (
                          <Button
                            onClick={(e) => handleOpenSocialMedia(e, 'tiktok')}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm gap-2"
                          >
                            <Music2 className="w-4 h-4" />
                            Follow Account
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>Account followed! Now upload your proof.</span>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Follower ID / Username</label>
                              <input
                                type="text"
                                placeholder="e.g., @yourprofile"
                                value={socialTaskForms.tiktok.username}
                                onChange={(e) => handleSocialFormChange('tiktok', 'username', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-slate-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Upload Screenshot Proof</label>
                              <div className="relative">
                                <input
                                  type="file"
                                  onChange={(e) => handleSocialFormChange('tiktok', 'proof', e.target.files?.[0] || null)}
                                  className="hidden"
                                  id="tiktok-proof"
                                  accept="image/*"
                                />
                                <label htmlFor="tiktok-proof" className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 rounded cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs">
                                  <FileUp className="w-4 h-4 text-slate-600" />
                                  {socialTaskForms.tiktok.proof?.name || 'Choose image'}
                                </label>
                              </div>
                            </div>
                            <Button
                              onClick={
                                socialTaskForms.tiktok.username && socialTaskForms.tiktok.proof
                                  ? handleSubmitSocialTask
                                  : () => togglePlatformSelection('tiktok')
                              }
                              variant="outline"
                              className={`w-full text-xs ${
                                socialTaskForms.tiktok.username && socialTaskForms.tiktok.proof
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white claim-button-glow border-emerald-600'
                                  : ''
                              }`}
                            >
                              {socialTaskForms.tiktok.username && socialTaskForms.tiktok.proof ? 'Submit' : 'Start Over'}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Facebook */}
                      <div className="border-2 rounded-lg p-4 transition-all hover:shadow-md"
                        style={{
                          borderColor: selectedPlatforms.includes('facebook') ? '#1f2937' : '#e5e7eb',
                          backgroundColor: selectedPlatforms.includes('facebook') ? '#f0f4f8' : 'transparent',
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Facebook className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-slate-900 dark:text-white">Facebook</span>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 ${selectedPlatforms.includes('facebook') ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'}`} />
                        </div>
                        
                        {!selectedPlatforms.includes('facebook') ? (
                          <Button
                            onClick={(e) => handleOpenSocialMedia(e, 'facebook')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm gap-2"
                          >
                            <Facebook className="w-4 h-4" />
                            Follow Page
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>Page followed! Now upload your proof.</span>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Follower ID / Username</label>
                              <input
                                type="text"
                                placeholder="e.g., yourprofile"
                                value={socialTaskForms.facebook.username}
                                onChange={(e) => handleSocialFormChange('facebook', 'username', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Upload Screenshot Proof</label>
                              <div className="relative">
                                <input
                                  type="file"
                                  onChange={(e) => handleSocialFormChange('facebook', 'proof', e.target.files?.[0] || null)}
                                  className="hidden"
                                  id="facebook-proof"
                                  accept="image/*"
                                />
                                <label htmlFor="facebook-proof" className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-blue-300 rounded cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-xs">
                                  <FileUp className="w-4 h-4 text-blue-600" />
                                  {socialTaskForms.facebook.proof?.name || 'Choose image'}
                                </label>
                              </div>
                            </div>
                            <Button
                              onClick={
                                socialTaskForms.facebook.username && socialTaskForms.facebook.proof
                                  ? handleSubmitSocialTask
                                  : () => togglePlatformSelection('facebook')
                              }
                              variant="outline"
                              className={`w-full text-xs ${
                                socialTaskForms.facebook.username && socialTaskForms.facebook.proof
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white claim-button-glow border-emerald-600'
                                  : ''
                              }`}
                            >
                              {socialTaskForms.facebook.username && socialTaskForms.facebook.proof ? 'Submit' : 'Start Over'}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* X (Twitter) */}
                      <div className="border-2 rounded-lg p-4 transition-all hover:shadow-md"
                        style={{
                          borderColor: selectedPlatforms.includes('x') ? '#0ea5e9' : '#e5e7eb',
                          backgroundColor: selectedPlatforms.includes('x') ? '#f0f9ff' : 'transparent',
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-sky-600" />
                            <span className="font-semibold text-slate-900 dark:text-white">X (Twitter)</span>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 ${selectedPlatforms.includes('x') ? 'bg-sky-600 border-sky-600' : 'border-slate-300 dark:border-slate-600'}`} />
                        </div>
                        
                        {!selectedPlatforms.includes('x') ? (
                          <Button
                            onClick={(e) => handleOpenSocialMedia(e, 'x')}
                            className="w-full bg-sky-600 hover:bg-sky-700 text-white text-sm gap-2"
                          >
                            <Mail className="w-4 h-4" />
                            Follow Account
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-sky-50 dark:bg-sky-900/20 p-2 rounded text-xs text-sky-700 dark:text-sky-300 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>Account followed! Now upload your proof.</span>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Follower ID / Username</label>
                              <input
                                type="text"
                                placeholder="e.g., @yourhandle"
                                value={socialTaskForms.x.username}
                                onChange={(e) => handleSocialFormChange('x', 'username', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-sky-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Upload Screenshot Proof</label>
                              <div className="relative">
                                <input
                                  type="file"
                                  onChange={(e) => handleSocialFormChange('x', 'proof', e.target.files?.[0] || null)}
                                  className="hidden"
                                  id="x-proof"
                                  accept="image/*"
                                />
                                <label htmlFor="x-proof" className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-sky-300 rounded cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors text-xs">
                                  <FileUp className="w-4 h-4 text-sky-600" />
                                  {socialTaskForms.x.proof?.name || 'Choose image'}
                                </label>
                              </div>
                            </div>
                            <Button
                              onClick={
                                socialTaskForms.x.username && socialTaskForms.x.proof
                                  ? handleSubmitSocialTask
                                  : () => togglePlatformSelection('x')
                              }
                              variant="outline"
                              className={`w-full text-xs ${
                                socialTaskForms.x.username && socialTaskForms.x.proof
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white claim-button-glow border-emerald-600'
                                  : ''
                              }`}
                            >
                              {socialTaskForms.x.username && socialTaskForms.x.proof ? 'Submit' : 'Start Over'}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Telegram */}
                      <div className="border-2 rounded-lg p-4 transition-all hover:shadow-md"
                        style={{
                          borderColor: selectedPlatforms.includes('telegram') ? '#06b6d4' : '#e5e7eb',
                          backgroundColor: selectedPlatforms.includes('telegram') ? '#f0fdfa' : 'transparent',
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Send className="w-5 h-5 text-cyan-600" />
                            <span className="font-semibold text-slate-900 dark:text-white">Telegram</span>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 ${selectedPlatforms.includes('telegram') ? 'bg-cyan-600 border-cyan-600' : 'border-slate-300 dark:border-slate-600'}`} />
                        </div>
                        
                        {!selectedPlatforms.includes('telegram') ? (
                          <Button
                            onClick={(e) => handleOpenSocialMedia(e, 'telegram')}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-sm gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Join Channel
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-cyan-50 dark:bg-cyan-900/20 p-2 rounded text-xs text-cyan-700 dark:text-cyan-300 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>Channel joined! Now upload your proof.</span>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Follower ID / Username</label>
                              <input
                                type="text"
                                placeholder="e.g., @yourid"
                                value={socialTaskForms.telegram.username}
                                onChange={(e) => handleSocialFormChange('telegram', 'username', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-cyan-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Upload Screenshot Proof</label>
                              <div className="relative">
                                <input
                                  type="file"
                                  onChange={(e) => handleSocialFormChange('telegram', 'proof', e.target.files?.[0] || null)}
                                  className="hidden"
                                  id="telegram-proof"
                                  accept="image/*"
                                />
                                <label htmlFor="telegram-proof" className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-cyan-300 rounded cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors text-xs">
                                  <FileUp className="w-4 h-4 text-cyan-600" />
                                  {socialTaskForms.telegram.proof?.name || 'Choose image'}
                                </label>
                              </div>
                            </div>
                            <Button
                              onClick={
                                socialTaskForms.telegram.username && socialTaskForms.telegram.proof
                                  ? handleSubmitSocialTask
                                  : () => togglePlatformSelection('telegram')
                              }
                              variant="outline"
                              className={`w-full text-xs ${
                                socialTaskForms.telegram.username && socialTaskForms.telegram.proof
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white claim-button-glow border-emerald-600'
                                  : ''
                              }`}
                            >
                              {socialTaskForms.telegram.username && socialTaskForms.telegram.proof ? 'Submit' : 'Start Over'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {socialTaskMessage && (
                    <div
                      className={`p-3 rounded-lg text-sm font-medium flex items-start gap-2 ${
                        socialTaskMessage?.type === 'success'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {socialTaskMessage?.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      )}
                      <span>{socialTaskMessage?.text}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Selected: <span className="font-bold text-slate-900 dark:text-white">{selectedPlatforms.length}</span> platform(s)
                    </p>
                    <Button
                      onClick={handleSubmitSocialTask}
                      disabled={submittingSocialTask || selectedPlatforms.length < 3}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2"
                    >
                      {submittingSocialTask ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Submit ({selectedPlatforms.length}/3+)
                        </>
                      )}
                    </Button>
                  </div>

                  {socialTaskMessage && (
                    <div
                      className={`p-3 rounded-lg text-sm font-medium flex items-start gap-2 ${
                        socialTaskMessage?.type === 'success'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {socialTaskMessage?.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      )}
                      <span>{socialTaskMessage?.text}</span>
                    </div>
                  )}
                </div>
              </TaskRow>
            </div>

            {/* Social Task Submitted Message */}
            {false && socialTaskSubmitted && (
              <Card className="p-6 glass glass-light dark:glass bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 animate-fade-in-up">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      Submission Successful!
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Your social task submission has been sent to admin for review. You&apos;ll receive your reward once approved within 24-48 hours.
                    </p>
                  </div>
                  <Button
                    onClick={() => setSocialTaskSubmitted(false)}
                    variant="outline"
                    className="gap-2"
                  >
                    Submit Another Task
                  </Button>
                </div>
              </Card>
            )}

            {/* Referrals List - Filtered View */}
            {activeReferralFilter !== 'total' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                    {activeReferralFilter === 'joined' && '👥 Users who just joined - send them a reminder!'}
                    {activeReferralFilter === 'purchased' && '✅ Users who purchased - claim your rewards!'}
                    {activeReferralFilter === 'earned' && '💰 Referrals with claimed rewards'}
                  </p>
                </div>

                {filteredReferrals.length === 0 ? (
                  <Card className="p-12 glass glass-light dark:glass text-center">
                    <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-500 dark:text-slate-400">
                      No referrals found for this filter.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredReferrals.map((referral) => {
                      // Status from Supabase data
                    const isPending = !referral.purchasedPlan;
                    const isPurchased = referral.purchasedPlan && !referral.rewardClaimed;
                    const isClaimed = referral.purchasedPlan && referral.rewardClaimed;
                    const isClaimingThis = claiming === referral.id;

                    return (
                      <div
                        key={referral.id}
                        className={`p-4 rounded-lg border transition-all ${
                          isPurchased
                            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                            : isClaimed
                              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Referral Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {referral.referredName || 'User'}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                              {referral.referredEmail || 'No email'}
                            </p>

                            {/* Status messaging */}
                            <div className="mt-2">
                              {isPending && (
                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                  ⏳ Waiting for purchase...
                                </p>
                              )}
                              {isPurchased && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                  ✅ Purchased! Claim your reward
                                </p>
                              )}
                              {isClaimed && (
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  ✓ Reward claimed
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Reward Amount */}
                          <div className="flex flex-col items-end gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                +₹{referral.rewardAmount}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">Reward</p>
                            </div>

                            {/* Action Button */}
                            {isPending && (
                              <Button
                                onClick={() =>
                                  handleSendReminder(
                                    referral.referredUid,
                                    referral.referredName || 'User'
                                  )
                                }
                                disabled={remindingUser === referral.referredUid}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm gap-2"
                              >
                                {remindingUser === referral.referredUid ? (
                                  <>
                                    <div className="w-3 h-3 rounded-full border-2 border-white border-t-blue-700 animate-spin"></div>
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Bell className="w-4 h-4" />
                                    Remind
                                  </>
                                )}
                              </Button>
                            )}

                            {isPurchased && (
                              <Button
                                onClick={() => handleClaimReward(referral.id, referral.rewardAmount)}
                                disabled={isClaimingThis}
                                className={`bg-emerald-600 hover:bg-emerald-700 text-white text-sm gap-2 ${isClaimingThis ? 'claim-button-rainbow' : ''}`}
                              >
                                {isClaimingThis ? (
                                  <>
                                    <div className="w-3 h-3 rounded-full border-2 border-white border-t-emerald-700 animate-spin"></div>
                                    Claiming...
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-4 h-4" />
                                    Claim ₹5
                                  </>
                                )}
                              </Button>
                            )}

                            {isClaimed && (
                              <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded text-xs font-semibold text-green-700 dark:text-green-300 whitespace-nowrap">
                                Claimed
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Timestamp */}
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            Joined{' '}
                            {(() => {
                              const joinDate = typeof referral.joinedAt === 'object' && referral.joinedAt?.toDate
                                ? referral.joinedAt.toDate()
                                : referral.joinedAt instanceof Date ? referral.joinedAt : new Date();
                              return joinDate.toLocaleDateString();
                            })()}
                            {referral.purchasedAt &&
                              ` • Purchased ${(() => {
                                const purDate = typeof referral.purchasedAt === 'object' && referral.purchasedAt?.toDate
                                  ? referral.purchasedAt.toDate()
                                  : referral.purchasedAt instanceof Date ? referral.purchasedAt : new Date();
                                return purDate.toLocaleDateString();
                              })()}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            )}

            {/* Pending Rewards Card */}
            {stats.pendingRewards > 0 && (
              <Card className="p-6 glass glass-light dark:glass border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold">
                      Pending Rewards Available
                    </p>
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-300 mt-1">
                      ₹{stats.pendingRewards}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                      From referrals that purchased - scroll up to claim!
                    </p>
                  </div>
                  <Gift className="w-12 h-12 text-orange-600 dark:text-orange-400 opacity-80" />
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar - Social Media Links */}
          {socialLinks && Object.values(socialLinks).some((link: any) => link) && (
            <div className="hidden lg:block w-32 flex-shrink-0">
              <div className="sticky top-24 space-y-3">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-2 mb-4">
                  Follow Us
                </div>

                {socialLinks.youtube && (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="YouTube"
                    className="flex items-center justify-center w-full h-12 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all group border border-red-200 dark:border-red-800"
                  >
                    <Youtube className="w-6 h-6 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
                  </a>
                )}

                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Instagram"
                    className="flex items-center justify-center w-full h-12 rounded-lg bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-all group border border-pink-200 dark:border-pink-800"
                  >
                    <Instagram className="w-6 h-6 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform" />
                  </a>
                )}

                {socialLinks.tiktok && (
                  <a
                    href={socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="TikTok"
                    className="flex items-center justify-center w-full h-12 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group border border-slate-200 dark:border-slate-700"
                  >
                    <Music2 className="w-6 h-6 text-slate-900 dark:text-white group-hover:scale-110 transition-transform" />
                  </a>
                )}

                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Facebook"
                    className="flex items-center justify-center w-full h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all group border border-blue-200 dark:border-blue-800"
                  >
                    <Facebook className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  </a>
                )}

                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="X (Twitter)"
                    className="flex items-center justify-center w-full h-12 rounded-lg bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-all group border border-sky-200 dark:border-sky-800"
                  >
                    <Mail className="w-6 h-6 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
                  </a>
                )}

                {socialLinks.telegram && (
                  <a
                    href={socialLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Telegram"
                    className="flex items-center justify-center w-full h-12 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-all group border border-cyan-200 dark:border-cyan-800"
                  >
                    <Send className="w-6 h-6 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <ReferralTreeModal 
          isOpen={showReferralTree} 
          onClose={() => setShowReferralTree(false)}
          referrals={referrals}
          userStats={stats}
        />

        <EarnBreakdownModal
          isOpen={showEarnBreakdown}
          onClose={() => setShowEarnBreakdown(false)}
          referralEarnings={Math.round(stats.totalEarnings * 0.7)} // Estimate 70% from referrals
          taskEarnings={Math.round(stats.totalEarnings * 0.2)} // Estimate 20% from tasks
          orderEarnings={Math.round(stats.totalEarnings * 0.1)} // Estimate 10% from orders
        />
      </div>
    </AppLayout>
  );
}
