/**
 * Hook for managing notifications in real-time
 * Uses the new Supabase-based notification system
 */

'use client';

import { useEffect, useState } from 'react';
import { NotificationData, onActiveNotificationsChange, getUnreadCount } from '@/lib/notification-service';

export function useNotifications(userId: string | undefined) {
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

    // Set up real-time listener for active notifications
    const unsubscribe = onActiveNotificationsChange(userId, async (notifs) => {
      setNotifications(notifs);
      setLoading(false);

      // Update unread count
      const count = notifs.filter((n) => !n.isRead).length;
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
  };
}
