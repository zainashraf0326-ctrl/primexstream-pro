'use client';

import { useState } from 'react';
import { Bell, X, Check, Trash2, ArrowRight } from 'lucide-react';
import { useRealtimeNotifications } from '@/lib/useRealtimeNotifications';
import {
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
} from '@/lib/supabase-notifications';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface NotificationButtonProps {
  userId: string | undefined;
}

function getNotificationDate(value: unknown) {
  if (!value) return new Date();
  if (typeof (value as any).toDate === 'function') return (value as any).toDate();
  if (value instanceof Date) return value;
  return new Date(value as string);
}

export function NotificationButton({ userId }: NotificationButtonProps) {
  const { notifications, unreadCount, loading } = useRealtimeNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAsRead = async (notifId: string) => {
    if (userId) {
      await markNotificationAsRead(userId, notifId);
    }
  };

  const handleDelete = async (notifId: string) => {
    if (userId) {
      await deleteNotification(userId, notifId);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (userId) {
      await markAllNotificationsAsRead(userId);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'referral':
        return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500';
      case 'reminder':
        return 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500';
      case 'order_created':
        return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500';
      case 'order_accepted':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-l-emerald-500';
      case 'order_rejected':
        return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500';
      case 'payment':
        return 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-500';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-l-4 border-l-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'referral':
        return '🎯';
      case 'reminder':
        return '📬';
      case 'order_created':
        return '✅';
      case 'order_accepted':
        return '🎉';
      case 'order_rejected':
        return '❌';
      case 'payment':
        return '💳';
      default:
        return '📢';
    }
  };

  return (
    <div className="relative">
      {/* Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Notifications"
      >
        <Bell className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-40">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              title="Close"
            >
              <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-80">
            {loading ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                <div className="inline-block animate-spin">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-opacity-75 transition-all ${getTypeColor(notif.type)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getTypeIcon(notif.type)}</span>
                          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {(() => {
                            const dateValue = getNotificationDate(notif.createdAt);
                            return dateValue.toLocaleDateString();
                          })()} {(() => {
                            const dateValue = getNotificationDate(notif.createdAt);
                            return dateValue.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                          })()}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4 text-green-600 dark:text-green-500" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {unreadCount} unread • {notifications.length} total
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 transition-colors"
                  title="Mark all as read"
                >
                  Mark all
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
