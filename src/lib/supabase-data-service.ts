'use server';

import { supabase } from './supabase-config';

// ============ USERS SERVICE ============

export async function createUser(email: string, name: string, phone?: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          name,
          phone: phone || null,
          referral_code: generateReferralCode(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: (error as any).message };
  }
}

export async function getUserById(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { success: false, error: (error as any).message };
  }
}

export async function updateUserProfile(userId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: (error as any).message };
  }
}

export async function updateWalletBalance(userId: string, amount: number, type: 'credit' | 'debit') {
  try {
    // Get current balance
    const { data: user } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', userId)
      .single();

    if (!user) throw new Error('User not found');

    const newBalance = type === 'credit' 
      ? user.wallet_balance + amount 
      : user.wallet_balance - amount;

    if (newBalance < 0) throw new Error('Insufficient wallet balance');

    // Update balance
    await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', userId);

    // Log transaction
    await supabase
      .from('wallet_transactions')
      .insert([
        {
          user_id: userId,
          amount,
          transaction_type: type === 'credit' ? 'credit' : 'debit',
          balance_before: user.wallet_balance,
          balance_after: newBalance,
        },
      ]);

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error updating wallet:', error);
    return { success: false, error: (error as any).message };
  }
}

// ============ ORDERS SERVICE ============

export async function createOrder(userId: string, orderData: {
  order_type: string;
  service_name: string;
  amount: number;
  duration_days?: number;
  payment_method?: string;
  metadata?: any;
}) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          status: 'pending',
          ...orderData,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Create notification
    await createNotification(userId, {
      title: 'Order Created',
      message: `Your order for ${orderData.service_name} has been created`,
      type: 'order',
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: (error as any).message };
  }
}

export async function getUserOrders(userId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, error: (error as any).message };
  }
}

export async function updateOrderStatus(orderId: string, newStatus: string, notes?: string) {
  try {
    // Get old status
    const { data: order } = await supabase
      .from('orders')
      .select('status, user_id')
      .eq('id', orderId)
      .single();

    if (!order) throw new Error('Order not found');

    // Update order
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    // Log history
    await supabase
      .from('order_history')
      .insert([
        {
          order_id: orderId,
          user_id: order.user_id,
          action: 'status_changed',
          old_status: order.status,
          new_status: newStatus,
          notes: notes || null,
        },
      ]);

    // Create notification
    const messages: { [key: string]: string } = {
      completed: 'Your order has been approved and is ready!',
      failed: 'Your order could not be processed.',
      expired: 'Your order has expired.',
    };

    if (messages[newStatus]) {
      await createNotification(order.user_id, {
        title: `Order ${newStatus}`,
        message: messages[newStatus],
        type: newStatus === 'completed' ? 'success' : 'warning',
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating order:', error);
    return { success: false, error: (error as any).message };
  }
}

// ============ NOTIFICATIONS SERVICE ============

export async function createNotification(userId: string, notifData: {
  title: string;
  message: string;
  type?: string;
  action_url?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          ...notifData,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: (error as any).message };
  }
}

export async function getUserNotifications(userId: string, unreadOnly = false) {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: (error as any).message };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: (error as any).message };
  }
}

// ============ WALLET SERVICE ============

export async function getWalletTransactions(userId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    return { success: false, error: (error as any).message };
  }
}

// ============ REFERRAL SERVICE ============

export async function createReferral(referrerId: string, referredUserId: string) {
  try {
    const referrerCode = await generateReferralCode();

    const { data, error } = await supabase
      .from('referrals')
      .insert([
        {
          referrer_id: referrerId,
          referred_user_id: referredUserId,
          referral_code: referrerCode,
          status: 'joined',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating referral:', error);
    return { success: false, error: (error as any).message };
  }
}

export async function getReferrals(userId: string) {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return { success: false, error: (error as any).message };
  }
}

export async function claimReferralReward(referrerId: string, referralId: string, amount: number) {
  try {
    // Update referral
    await supabase
      .from('referrals')
      .update({
        reward_claimed: true,
        claim_date: new Date().toISOString(),
        status: 'reward_claimed',
      })
      .eq('id', referralId);

    // Add credit to wallet
    await updateWalletBalance(referrerId, amount, 'credit');

    // Create notification
    await createNotification(referrerId, {
      title: 'Referral Reward Claimed',
      message: `You earned ₹${amount} from a referral!`,
      type: 'referral',
    });

    return { success: true };
  } catch (error) {
    console.error('Error claiming referral reward:', error);
    return { success: false, error: (error as any).message };
  }
}

// ============ SOCIAL MEDIA TASKS ============

export async function submitSocialMediaTask(userId: string, taskData: {
  platform: string;
  username: string;
  proof_image_url?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('social_media_tasks')
      .insert([
        {
          user_id: userId,
          status: 'pending',
          ...taskData,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Create notification
    await createNotification(userId, {
      title: 'Task Submitted',
      message: `Your ${taskData.platform} social media task has been submitted for review`,
      type: 'info',
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error submitting social task:', error);
    return { success: false, error: (error as any).message };
  }
}

export async function getSocialMediaTasks(userId: string) {
  try {
    const { data, error } = await supabase
      .from('social_media_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching social tasks:', error);
    return { success: false, error: (error as any).message };
  }
}

// ============ SUPPORT TICKETS ============

export async function createSupportTicket(userId: string, ticketData: {
  subject: string;
  message: string;
  attachment_url?: string;
  priority?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert([
        {
          user_id: userId,
          status: 'open',
          ...ticketData,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await createNotification(userId, {
      title: 'Support Ticket Created',
      message: 'Your support ticket has been created. We will respond soon.',
      type: 'info',
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return { success: false, error: (error as any).message };
  }
}

// ============ HELPER FUNCTIONS ============

function generateReferralCode(): string {
  return 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Error getting notification count:', error);
    return { success: false, error: (error as any).message };
  }
}
