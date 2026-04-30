/**
 * REAL-TIME NOTIFICATIONS HOOK
 * 
 * Uses Supabase listener to load and update notifications
 * No local state manipulation
 * Persists across page refreshes
 */

'use client';

import { useEffect, useState } from 'react';
import { NotificationData, listenToNotifications } from '@/lib/supabase-notifications';

export function useRealtimeNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Set up real-time listener to Supabase
    // This returns an unsubscribe function
    const unsubscribe = listenToNotifications(userId, (notifs) => {
      // Notifications come from Supabase in real-time
      setNotifications(notifs);
      setLoading(false);

      // Calculate unread count
      const unreadCount = notifs.filter((n) => !n.read).length;
      setUnreadCount(unreadCount);
    });

    // Cleanup: unsubscribe from listener when component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
  };
}
