/**
 * Comprehensive Supabase notification system.
 */

import { supabase } from '@/lib/supabase-config';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'zainashraf0326@gmail.com';

export interface NotificationData {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order_created' | 'order_accepted' | 'order_rejected' | 'referral' | 'reminder' | 'general';
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
  data?: {
    orderId?: string;
    orderAmount?: number;
    orderPlan?: string;
    referrerName?: string;
    referrerId?: string;
    referredName?: string;
    referredId?: string;
    rejectionReason?: string;
    link?: string;
  };
}

export interface AdminConfig {
  email: string;
  name: string;
}

const ADMIN_CONFIG: AdminConfig = {
  email: ADMIN_EMAIL,
  name: 'Admin',
};

function mapNotification(row: any): NotificationData {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    isRead: Boolean(row.read),
    isDeleted: Boolean(row.deleted),
    createdAt: row.created_at,
    data: row.data || {},
  };
}

async function getAdminUserId(): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', ADMIN_EMAIL)
    .maybeSingle();

  if (error) {
    console.error('Error getting admin user ID:', error);
    return null;
  }

  return data?.id || null;
}

async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationData['type'],
  data?: NotificationData['data']
): Promise<string | null> {
  const { data: row, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type,
      read: false,
      deleted: false,
      data: data || {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return row.id;
}

export async function notifyOrderCreated(
  userId: string,
  userName: string,
  orderData: {
    orderId: string;
    planName: string;
    amount: number;
    status: string;
  }
): Promise<string | null> {
  return createNotification(
    userId,
    'Order Created Successfully',
    `Your order for ${orderData.planName} (${orderData.amount}) has been created and is ${orderData.status}. Your order will be processed shortly.`,
    'order_created',
    {
      orderId: orderData.orderId,
      orderAmount: orderData.amount,
      orderPlan: orderData.planName,
    }
  );
}

export async function notifyOrderAccepted(
  userId: string,
  orderData: {
    orderId: string;
    planName: string;
    credentials?: {
      username: string;
      password: string;
      url: string;
      expiryDate: string;
    };
  }
): Promise<string | null> {
  const credentialsText = orderData.credentials
    ? `\nUsername: ${orderData.credentials.username}\nPassword: ${orderData.credentials.password}\nURL: ${orderData.credentials.url}\nExpires: ${orderData.credentials.expiryDate}`
    : '';

  return createNotification(
    userId,
    'Order Approved!',
    `Your order for ${orderData.planName} has been approved!${credentialsText}\n\nYou can now enjoy all services!`,
    'order_accepted',
    {
      orderId: orderData.orderId,
      orderPlan: orderData.planName,
    }
  );
}

export async function notifyOrderRejected(
  userId: string,
  orderData: {
    orderId: string;
    planName: string;
    rejectionReason: string;
  }
): Promise<string | null> {
  return createNotification(
    userId,
    'Order Rejected',
    `Your order for ${orderData.planName} has been rejected.\n\nReason: ${orderData.rejectionReason}\n\nPlease try again or contact support for assistance.`,
    'order_rejected',
    {
      orderId: orderData.orderId,
      orderPlan: orderData.planName,
      rejectionReason: orderData.rejectionReason,
    }
  );
}

export async function notifyReferrerNewSignup(
  referrerId: string,
  referrerName: string,
  referredUserData: {
    referredId: string;
    referredName: string;
    referralCount: number;
  }
): Promise<string | null> {
  return createNotification(
    referrerId,
    'New Referral Signup!',
    `${referredUserData.referredName} is your new referral. Encourage them to buy a subscription so you can earn rewards.\n\nYou now have ${referredUserData.referralCount} referrals total.`,
    'referral',
    {
      referrerId,
      referrerName,
      referredId: referredUserData.referredId,
      referredName: referredUserData.referredName,
    }
  );
}

export async function notifyReferredUserWelcome(
  referredUserId: string,
  referrerName: string,
  subscriptionDiscount: number = 10
): Promise<string | null> {
  return createNotification(
    referredUserId,
    `Welcome to ${referrerName}'s Team!`,
    `Welcome. You've been referred by ${referrerName}.\n\nSpecial Offer: Get ${subscriptionDiscount}% discount on your first subscription.\n\nVisit the Earn section to see your benefits and complete your purchase.`,
    'referral',
    {
      referrerName,
      link: '/earn',
    }
  );
}

export async function notifyAdminNewOrder(orderData: {
  orderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  planName: string;
  amount: number;
}): Promise<string | null> {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) return null;

  return createNotification(
    adminUserId,
    'New Order Received',
    `New order pending approval.\n\nCustomer: ${orderData.userName}\nEmail: ${orderData.userEmail}\nPlan: ${orderData.planName}\nAmount: ${orderData.amount}`,
    'order_created',
    {
      orderId: orderData.orderId,
      orderAmount: orderData.amount,
      orderPlan: orderData.planName,
      link: '/admin/orders',
    }
  );
}

export async function notifySubscriptionReminder(
  userId: string,
  userName: string,
  message: string = 'Buy a subscription to unlock all features.'
): Promise<string | null> {
  return createNotification(userId, 'Subscription Reminder', message, 'reminder', {
    link: '/iptv',
  });
}

export async function getActiveNotifications(userId: string): Promise<NotificationData[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active notifications:', error);
    return [];
  }

  return (data || []).map(mapNotification);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('deleted', false)
    .eq('read', false);

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  return !error;
}

export async function markMultipleAsRead(notificationIds: string[]): Promise<boolean> {
  if (notificationIds.length === 0) return true;
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .in('id', notificationIds);
  return !error;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ deleted: true })
    .eq('id', notificationId);
  return !error;
}

export async function deleteMultipleNotifications(notificationIds: string[]): Promise<boolean> {
  if (notificationIds.length === 0) return true;
  const { error } = await supabase
    .from('notifications')
    .update({ deleted: true })
    .in('id', notificationIds);
  return !error;
}

export function onActiveNotificationsChange(
  userId: string,
  callback: (notifications: NotificationData[]) => void
): () => void {
  const load = async () => callback(await getActiveNotifications(userId));
  void load();

  const channel = supabase
    .channel(`active-notifications-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      load
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function getNotificationStats(userId: string): Promise<{
  total: number;
  unread: number;
  byType: Record<string, number>;
}> {
  const notifications = await getActiveNotifications(userId);
  return {
    total: notifications.length,
    unread: notifications.filter((n) => !n.isRead).length,
    byType: notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

export const NotificationService = {
  notifyOrderCreated,
  notifyOrderAccepted,
  notifyOrderRejected,
  notifyReferrerNewSignup,
  notifyReferredUserWelcome,
  notifyAdminNewOrder,
  notifySubscriptionReminder,
  getActiveNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markMultipleAsRead,
  deleteNotification,
  deleteMultipleNotifications,
  onActiveNotificationsChange,
  getNotificationStats,
};

export { ADMIN_CONFIG };
