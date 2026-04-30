/**
 * Supabase-backed persistent notifications.
 */

import { supabase } from '@/lib/supabase-config';

export interface NotificationData {
  id: string;
  userId: string;
  type: 'order' | 'referral' | 'admin' | 'success' | 'reject' | 'reminder' | 'order_created' | 'order_accepted' | 'order_rejected';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  deleted: boolean;
  createdAt: string;
  data?: {
    orderId?: string;
    orderAmount?: number;
    orderPlan?: string;
    referrerId?: string;
    referredName?: string;
    rejectionReason?: string;
  };
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'zainashraf0326@gmail.com';

function mapNotification(row: any): NotificationData {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link || row.data?.link,
    read: Boolean(row.read),
    deleted: Boolean(row.deleted),
    createdAt: row.created_at,
    data: row.data || {},
  };
}

export async function getAdminUserId(): Promise<string | null> {
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

export async function createNotification(
  userId: string,
  type: NotificationData['type'],
  title: string,
  message: string,
  data?: NotificationData['data'],
  link?: string
): Promise<string | null> {
  const { data: row, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      link,
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
  }
): Promise<void> {
  await createNotification(
    userId,
    'order',
    'Order Created',
    `Your order for ${orderData.planName} (${orderData.amount}) has been created. Awaiting admin approval.`,
    {
      orderId: orderData.orderId,
      orderAmount: orderData.amount,
      orderPlan: orderData.planName,
    },
    `/orders/${orderData.orderId}`
  );

  const adminId = await getAdminUserId();
  if (adminId) {
    await createNotification(
      adminId,
      'admin',
      'New Order',
      `${userName} ordered ${orderData.planName} for ${orderData.amount}`,
      {
        orderId: orderData.orderId,
        orderAmount: orderData.amount,
        orderPlan: orderData.planName,
      },
      '/admin'
    );
  }
}

export async function notifyOrderApproved(
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
): Promise<void> {
  const credText = orderData.credentials
    ? `\nUser: ${orderData.credentials.username}\nPass: ${orderData.credentials.password}\nURL: ${orderData.credentials.url}\nValid: ${orderData.credentials.expiryDate}`
    : '';

  await createNotification(
    userId,
    'success',
    'Order Approved!',
    `Your order for ${orderData.planName} has been approved and is ready to use.${credText}`,
    {
      orderId: orderData.orderId,
      orderPlan: orderData.planName,
    },
    `/orders/${orderData.orderId}`
  );
}

export async function notifyOrderRejected(
  userId: string,
  orderData: {
    orderId: string;
    reason: string;
  }
): Promise<void> {
  await createNotification(
    userId,
    'reject',
    'Order Rejected',
    `Your order has been rejected.\n\nReason: ${orderData.reason}`,
    {
      orderId: orderData.orderId,
      rejectionReason: orderData.reason,
    },
    `/orders/${orderData.orderId}`
  );
}

export async function notifyReferralJoined(referrerUid: string, referredName: string): Promise<void> {
  await createNotification(
    referrerUid,
    'referral',
    'New Referral',
    `${referredName} joined using your referral code. They will earn you rewards when they purchase.`,
    { referredName },
    '/earn'
  );
}

export async function notifyReferralPurchased(
  referrerUid: string,
  referredName: string,
  rewardAmount: number
): Promise<void> {
  await createNotification(
    referrerUid,
    'success',
    'Reward Earned',
    `${referredName} made a purchase. You earned ${rewardAmount} commission.`,
    { referredName },
    '/earn'
  );
}

export async function notifySocialTaskApproved(
  userId: string,
  taskData: {
    platforms: string[];
    walletCredit: number;
    freeAccess: string;
  }
): Promise<void> {
  await createNotification(
    userId,
    'success',
    'Social Task Approved',
    `Your social task (${taskData.platforms.join(', ')}) has been approved.\n\nWallet Credit: ${taskData.walletCredit}\nFree Access: ${taskData.freeAccess}`,
    {},
    '/earn'
  );
}

export async function notifySocialTaskRejected(
  userId: string,
  taskData: {
    platforms: string[];
    reason: string;
  }
): Promise<void> {
  await createNotification(
    userId,
    'reject',
    'Social Task Rejected',
    `Your social task (${taskData.platforms.join(', ')}) was not approved.\n\nReason: ${taskData.reason || 'No specific reason provided. Please contact support.'}`,
    {},
    '/earn'
  );
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);
  if (error) console.error('Error marking notification as read:', error);
}

export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ deleted: true })
    .eq('id', notificationId)
    .eq('user_id', userId);
  if (error) console.error('Error deleting notification:', error);
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('deleted', false)
    .eq('read', false);
  if (error) console.error('Error marking all notifications as read:', error);
}

export function listenToNotifications(
  userId: string,
  callback: (notifications: NotificationData[]) => void
): () => void {
  const load = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listening to notifications:', error);
      return;
    }

    callback((data || []).map(mapNotification));
  };

  void load();
  const channel = supabase
    .channel(`notifications-${userId}`)
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

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('deleted', false)
    .eq('read', false);

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }

  return count || 0;
}

export async function addWalletCredit(
  userId: string,
  amount: number,
  reason: string,
  sourceId?: string
): Promise<boolean> {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('usable_balance, wallet_balance, credits')
    .eq('id', userId)
    .maybeSingle();

  if (userError || !user) {
    console.error('User not found for wallet credit:', userError);
    return false;
  }

  const currentUsable = Number(user.usable_balance || user.wallet_balance || user.credits || 0);
  const newBalance = currentUsable + amount;

  const { error: updateError } = await supabase
    .from('users')
    .update({
      usable_balance: newBalance,
      wallet_balance: newBalance,
      credits: Number(user.credits || 0) + amount,
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Error adding wallet credit:', updateError);
    return false;
  }

  await supabase.from('wallet_history').insert({
    user_id: userId,
    type: 'credit',
    amount,
    reason,
    description: reason,
    source_id: sourceId,
    balance_before: currentUsable,
    balance_after: newBalance,
  });

  return true;
}
