'use client';

import { useState } from 'react';
import {
  BadgeCheck,
  Bell,
  Check,
  Clock3,
  CreditCard,
  MessageSquare,
  ShoppingCart,
  Trash2,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import { useRealtimeNotifications } from '@/lib/useRealtimeNotifications';
import {
  deleteNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/supabase-notifications';

interface NotificationButtonProps {
  userId: string | undefined;
}

function getNotificationDate(value: unknown) {
  if (!value) return new Date();
  if (typeof (value as any).toDate === 'function') return (value as any).toDate();
  if (value instanceof Date) return value;
  return new Date(value as string);
}

function normalizeNotificationType(type: string) {
  switch (type) {
    case 'order':
      return 'order_created';
    case 'success':
      return 'success';
    case 'reject':
      return 'order_rejected';
    case 'payment':
      return 'payment';
    case 'general':
      return 'general';
    case 'admin':
      return 'admin';
    case 'referral':
      return 'referral';
    case 'reminder':
      return 'reminder';
    case 'order_created':
    case 'order_accepted':
    case 'order_rejected':
      return type;
    default:
      return 'general';
  }
}

function getTypeColor(type: string) {
  switch (normalizeNotificationType(type)) {
    case 'referral':
      return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500';
    case 'reminder':
      return 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-500';
    case 'admin':
      return 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500';
    case 'success':
    case 'order_accepted':
      return 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-l-emerald-500';
    case 'order_created':
      return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500';
    case 'payment':
      return 'bg-violet-50 dark:bg-violet-900/20 border-l-4 border-l-violet-500';
    case 'order_rejected':
      return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500';
    default:
      return 'bg-gray-50 dark:bg-gray-900/20 border-l-4 border-l-gray-500';
  }
}

function getTypeLabel(type: string) {
  switch (normalizeNotificationType(type)) {
    case 'referral':
      return 'Referral';
    case 'reminder':
      return 'Reminder';
    case 'admin':
      return 'Admin';
    case 'success':
    case 'order_accepted':
      return 'Approved';
    case 'order_created':
      return 'Order';
    case 'payment':
      return 'Payment';
    case 'order_rejected':
      return 'Rejected';
    default:
      return 'Update';
  }
}

function getTypeIcon(type: string) {
  const className = 'h-4 w-4';

  switch (normalizeNotificationType(type)) {
    case 'referral':
      return <UserPlus className={className} />;
    case 'reminder':
      return <Clock3 className={className} />;
    case 'admin':
      return <MessageSquare className={className} />;
    case 'success':
    case 'order_accepted':
      return <BadgeCheck className={className} />;
    case 'order_created':
    case 'payment':
      return <ShoppingCart className={className} />;
    case 'order_rejected':
      return <XCircle className={className} />;
    default:
      return <CreditCard className={className} />;
  }
}

export function NotificationButton({ userId }: NotificationButtonProps) {
  const { notifications, unreadCount, loading } = useRealtimeNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);
  const readCount = Math.max(notifications.length - unreadCount, 0);

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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Notifications"
      >
        <Bell className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[22rem] max-h-[32rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Close"
            >
              <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                <div className="inline-block animate-spin">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`border-b border-slate-200 px-4 py-3 transition-all last:border-0 hover:bg-opacity-75 dark:border-slate-700 ${getTypeColor(notif.type)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm dark:bg-slate-900/70 dark:text-slate-200">
                            {getTypeIcon(notif.type)}
                          </span>
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                          )}
                        </div>
                        <div className="mb-2">
                          <span className="inline-flex rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-sm dark:bg-slate-900/70 dark:text-slate-300">
                            {getTypeLabel(notif.type)}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                          {notif.message}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                          {(() => {
                            const dateValue = getNotificationDate(notif.createdAt);
                            return dateValue.toLocaleDateString();
                          })()}{' '}
                          {(() => {
                            const dateValue = getNotificationDate(notif.createdAt);
                            return dateValue.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                          })()}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 gap-1">
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="rounded p-1.5 transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="rounded p-1.5 transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {unreadCount} unread | {readCount} read | {notifications.length} total
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="rounded px-2 py-1 text-xs text-blue-600 transition-colors hover:bg-slate-200 dark:text-blue-400 dark:hover:bg-slate-700"
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
