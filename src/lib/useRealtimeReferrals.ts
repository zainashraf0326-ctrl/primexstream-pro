/**
 * REAL-TIME REFERRALS HOOK
 * 
 * Uses Supabase listener to track referral status
 * Instantly updates when purchased/claimed
 * No page refresh needed
 */

'use client';

import { useEffect, useState } from 'react';
import { ReferralRecord, listenToMyReferrals } from '@/lib/supabase-referral-service';

export function useRealtimeReferrals(referrerUid: string | undefined) {
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    joined: 0,
    purchased: 0,
    claimed: 0,
    totalEarnings: 0,
    pendingRewards: 0,
  });

  useEffect(() => {
    if (!referrerUid) {
      setReferrals([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Set up real-time listener to Supabase
    const unsubscribe = listenToMyReferrals(referrerUid, (referrals) => {
      // Update referrals list from Supabase
      setReferrals(referrals);
      setLoading(false);

      // Calculate stats
      const newStats = {
        total: referrals.length,
        joined: referrals.filter((r) => r.status === 'joined').length,
        purchased: referrals.filter((r) => r.status === 'purchased').length,
        claimed: referrals.filter((r) => r.status === 'claimed').length,
        totalEarnings: referrals.filter((r) => r.rewardClaimed).length * 5,
        pendingRewards: referrals.filter((r) => r.purchasedPlan && !r.rewardClaimed).length * 5,
      };

      setStats(newStats);
    });

    // Cleanup: unsubscribe from listener
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [referrerUid]);

  return {
    referrals,
    stats,
    loading,
  };
}
