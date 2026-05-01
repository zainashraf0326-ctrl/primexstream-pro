import { supabase, isSupabaseConfigured } from '@/lib/supabase-config';
import { markReferralAsPurchased } from '@/lib/supabase-referral-service';

// ===== TYPES =====
export interface User {
  id: string;
  name: string;
  email: string;
  totalReferrals?: number;
  referralCode?: string;
  ordersCount?: number;
  approvedOrders?: number;
  credits?: number;
  [key: string]: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'referral' | 'order' | 'payment' | 'reminder' | 'general';
  isRead: boolean;
  createdAt: string;
  referralFromUserId?: string;
  referralFromUserName?: string;
}

// ===== NOTIFICATIONS =====
export async function sendNotification(
  userId: string,
  notification: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'isRead'>
): Promise<string | null> {
  const { data, error } = await supabase.from('notifications').insert({
    user_id: userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: false,
    deleted: false,
    data: {
      referralFromUserId: notification.referralFromUserId,
      referralFromUserName: notification.referralFromUserName,
    },
  }).select('id').single();
  if (error) {
    console.error('Error sending notification:', error);
    return null;
  }
  return data.id;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((n: any) => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: !!n.read,
    createdAt: n.created_at,
    referralFromUserId: n.data?.referralFromUserId,
    referralFromUserName: n.data?.referralFromUserName,
  }));
}

export function listenToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  const fetchNow = async () => callback(await getNotifications(userId));
  fetchNow();
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, fetchNow)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId).eq('user_id', userId);
  return !error;
}

export async function deleteNotification(userId: string, notificationId: string): Promise<boolean> {
  const { error } = await supabase.from('notifications').update({ deleted: true }).eq('id', notificationId).eq('user_id', userId);
  return !error;
}

// ===== PLANS =====
export async function getPlans() {
  const { data, error } = await supabase.from('plans').select('*').order('created_at', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function createPlan(plan: any) {
  const { data, error } = await supabase.from('plans').insert(plan).select('*').single();
  if (error) throw error;
  return data;
}

export async function updatePlan(planId: string, updates: any) {
  const { error } = await supabase.from('plans').update(updates).eq('id', planId);
  if (error) throw error;
}

export async function deletePlan(planId: string) {
  const { error } = await supabase.from('plans').delete().eq('id', planId);
  if (error) throw error;
}

// ===== ORDERS =====
export async function createOrder(userId: string, order: any) {
  try {
    const orderData = {
      user_id: userId,
      user_email: order.userEmail || order.email || order.guestEmail || null,
      plan: order.plan || order.planName || null,
      plan_id: order.planId || order.plan_id || null,
      plan_name: order.planName || order.plan || null,
      amount: Number(order.amount || order.finalPrice || order.final_price || order.salePrice || order.price || 0),
      final_price: Number(order.finalPrice || order.final_price || order.amount || order.salePrice || 0),
      payment_method: order.paymentMethod || order.payment_method || null,
      transaction_id: order.transactionId || order.transaction_id || null,
      payment_proof_url: order.paymentProof || order.paymentProofUrl || order.payment_proof_url || null,
      payment_proof_path: order.paymentProofPath || order.payment_proof_path || null,
      is_guest: Boolean(order.isGuest || order.is_guest),
      guest_email: order.guestEmail || null,
      guest_name: order.guestName || null,
      username: order.username || null,
      password: order.password || null,
      url: order.url || null,
      expiry_date: order.expiryDate || order.expiry_date || null,
      credentials: order.credentials || null,
      status: 'pending',
    };
    const { data, error } = await supabase.from('orders').insert(orderData).select('*').single();
    if (error) throw error;
    const orderId = data.id;

    // CRITICAL: Mark referral as purchased (if user was referred)
    try {
      if (!orderData.is_guest) {
        await markReferralAsPurchased(userId, order.plan || order.planName || 'Plan');
      }
    } catch (referralError) {
      console.warn('⚠️ Failed to update referral status:', referralError);
    }

    return { id: orderId, ...data };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function getUserOrders(userId: string) {
  const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapOrderRow);
}

export async function updateOrder(userId: string, orderId: string, updates: any) {
  try {
    const { error } = await supabase.from('orders').update(updates).eq('id', orderId).eq('user_id', userId);
    if (error) throw error;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

export function listenToUserOrders(userId: string, callback: (orders: any[]) => void) {
  const fetchNow = async () => callback(await getUserOrders(userId));
  fetchNow();
  const channel = supabase
    .channel(`orders-user-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` }, fetchNow)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getAllOrders() {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapOrderRow);
}

export function listenToAllOrders(callback: (orders: any[]) => void) {
  const fetchNow = async () => callback(await getAllOrders());
  fetchNow();
  const channelName = `orders-all-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchNow)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

// ===== USERS =====
export async function getUserData(userId: string) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (error) return null;
  return data;
}

export async function updateUserData(userId: string, updates: any) {
  const mapped = { ...updates };
  if (mapped.referredBy !== undefined) {
    mapped.referred_by = mapped.referredBy;
    delete mapped.referredBy;
  }
  delete mapped.appliedReferralCode;
  if (mapped.totalReferrals !== undefined) {
    mapped.total_referrals = mapped.totalReferrals;
    delete mapped.totalReferrals;
  }
  const { error } = await supabase.from('users').update(mapped).eq('id', userId);
  if (error) throw error;
}

export async function getAllUsers() {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((u: any) => ({ id: u.id, ...u }));
}

// ===== SUPABASE STORAGE - IMAGE UPLOADS =====
export async function uploadPaymentProof(userId: string, file: File) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Image storage service is not available. Please try again later.');
    }

    const fileName = `${userId}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, file);
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName);
    
    return {
      path: data?.path,
      url: urlData?.publicUrl,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export async function getPaymentProofUrl(path: string) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }

    const { data } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(path);
    return data?.publicUrl;
  } catch (error) {
    console.error('Error getting URL:', error);
    return null;
  }
}

export async function deletePaymentProof(path: string) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase is not configured, skipping file deletion');
      return;
    }

    const { error } = await supabase.storage
      .from('payment-proofs')
      .remove([path]);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

// ===== REFERRALS =====
export async function addReferral(userId: string, referredUserId: string) {
  try {
    // Update referred user's referredBy
    await updateUserData(referredUserId, { referredBy: userId });
    
    // Increment user's referredCount
    const userData = await getUserData(userId);
    const currentCount = userData?.referredCount || 0;
    await updateUserData(userId, { referredCount: currentCount + 1 });
    
    // Get referred user's name
    const referredUserData = await getUserData(referredUserId);
    const referredUserName = referredUserData?.name || 'New User';
    
    // Send notification to referrer
    await sendNotification(userId, {
      title: '🎉 New Referral!',
      message: `${referredUserName} signed up using your referral code! You now have ${currentCount + 1} active referrals.`,
      type: 'referral',
      referralFromUserId: referredUserId,
      referralFromUserName: referredUserName,
    });
  } catch (error) {
    console.error('Error adding referral:', error);
    throw error;
  }
}

export async function getUserReferrals(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('referred_by', userId);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      referredBy: row.referred_by,
      referralCode: row.referral_code,
      totalReferrals: row.total_referrals,
      credits: row.credits,
    }));
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return [];
  }
}

function mapOrderRow(o: any) {
  return {
    ...o,
    userId: o.user_id,
    userEmail: o.user_email,
    planId: o.plan_id,
    planName: o.plan_name || o.plan,
    plan: o.plan_name || o.plan,
    finalPrice: Number(o.final_price || o.amount || 0),
    paymentMethod: o.payment_method,
    paymentProof: o.payment_proof_url,
    paymentProofPath: o.payment_proof_path,
    transactionId: o.transaction_id,
    rejectReason: o.reject_reason,
    expiryDate: o.expiry_date,
    isGuest: o.is_guest,
    guestEmail: o.guest_email,
    guestName: o.guest_name,
    createdAt: o.created_at,
  };
}

export async function getReferralDetailsForUser(userId: string): Promise<(User & { ordersCount: number; approvedOrders: number })[]> {
  try {
    const referralsData = await getUserReferrals(userId);
    const detailedReferrals: any[] = [];
    
    for (const referral of referralsData) {
      const userOrders = await getUserOrders(referral.id);
      const approvedOrders = userOrders.filter(o => o.status === 'approved' || o.status === 'active').length;
      
      detailedReferrals.push({
        ...referral,
        ordersCount: userOrders.length,
        approvedOrders,
      });
    }
    
    return detailedReferrals;
  } catch (error) {
    console.error('Error fetching referral details:', error);
    return [];
  }
}

export async function getUserIncomeFromReferrals(userId: string): Promise<number> {
  try {
    const referralsData = await getUserReferrals(userId);
    let totalEarnings = 0;
    
    for (const referral of referralsData) {
      const userOrders = await getUserOrders(referral.id);
      const approvedOrders = userOrders.filter(o => o.status === 'approved' || o.status === 'active');
      
      // Calculate 5% commission on each approved order's final price
      for (const order of approvedOrders) {
        const finalPrice = order.finalPrice || order.price || 0;
        totalEarnings += finalPrice * 0.05; // 5% commission
      }
    }
    
    return totalEarnings;
  } catch (error) {
    console.error('Error calculating referral income:', error);
    return 0;
  }
}

// ===== CONFIG =====
export interface ConfigData {
  // Site Settings
  site: {
    siteName: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    supportEmail: string;
    supportPhone: string;
    currency: string;
  };
  // Order Settings
  orders: {
    minAmount: number;
    maxAmount: number;
    orderTimeout: number; // in hours
    deliveryTime: number; // in days
  };
  // Plan Pricing Settings
  plans: {
    plan1Month: {
      name: string;
      duration: number;
      price: number;
      salePrice: number;
      features: string;
    };
    plan6Month: {
      name: string;
      duration: number;
      price: number;
      salePrice: number;
      features: string;
    };
    plan12Month: {
      name: string;
      duration: number;
      price: number;
      salePrice: number;
      features: string;
    };
    extraDiscount: number; // percentage
  };
  // Referral Settings
  referral: {
    isActive: boolean;
    commissionRate: number; // percentage per referral
    minReferrals: number; // minimum referrals to payout
    bonusAmount: number; // bonus amount per referral
    payoutThreshold: number; // minimum amount to request payout
  };
  // Payment Methods Settings
  paymentMethods: {
    binance: {
      isActive: boolean;
      extraDiscount: number;
      instructions?: string;
      accountInfo?: string;
    };
    remitly: {
      isActive: boolean;
      extraDiscount: number;
      instructions?: string;
      accountInfo?: string;
    };
    paypal: {
      isActive: boolean;
      extraDiscount: number;
      instructions?: string;
      accountInfo?: string;
    };
    cashapp: {
      isActive: boolean;
      extraDiscount: number;
      instructions?: string;
      accountInfo?: string;
    };
  };
  // Home Services
  homeServices?: {
    locksmith?: { name: string; phone: string };
    plumbing?: { name: string; phone: string };
    electrician?: { name: string; phone: string };
    roofing?: { name: string; phone: string };
    treeTrimming?: { name: string; phone: string };
    custom?: { name: string; phone: string };
  };
}

const DEFAULT_CONFIG: ConfigData = {
  site: {
    siteName: 'PrimexStream Pro',
    maintenanceMode: false,
    maintenanceMessage: '',
    supportEmail: 'support@primexstream.com',
    supportPhone: '+1234567890',
    currency: 'USD'
  },
  orders: {
    minAmount: 5,
    maxAmount: 10000,
    orderTimeout: 24,
    deliveryTime: 1
  },
  plans: {
    plan1Month: {
      name: '1 Month IPTV',
      duration: 1,
      price: 20,
      salePrice: 20,
      features: 'Full HD, 1000+ channels'
    },
    plan6Month: {
      name: '6 Months IPTV',
      duration: 6,
      price: 100,
      salePrice: 65,
      features: 'Full HD, 1000+ channels'
    },
    plan12Month: {
      name: '12 Months IPTV',
      duration: 12,
      price: 200,
      salePrice: 95,
      features: 'Full HD, 1000+ channels'
    },
    extraDiscount: 30
  },
  referral: {
    isActive: true,
    commissionRate: 10,
    minReferrals: 1,
    bonusAmount: 2,
    payoutThreshold: 10
  },
  paymentMethods: {
    binance: {
      isActive: true,
      extraDiscount: 30,
      instructions: 'Send payment to Binance wallet address',
      accountInfo: ''
    },
    remitly: {
      isActive: true,
      extraDiscount: 30,
      instructions: 'Use Remitly app to send payment',
      accountInfo: ''
    },
    paypal: {
      isActive: true,
      extraDiscount: 0,
      instructions: 'PayPal payment instructions',
      accountInfo: ''
    },
    cashapp: {
      isActive: true,
      extraDiscount: 0,
      instructions: 'Cash App payment instructions',
      accountInfo: ''
    }
  },
  homeServices: {
    locksmith: { name: 'Locksmith', phone: '' },
    plumbing: { name: 'Plumbing', phone: '' },
    electrician: { name: 'Electrician', phone: '' },
    roofing: { name: 'Roofing', phone: '' },
    treeTrimming: { name: 'Tree Trimming', phone: '' },
    custom: { name: 'Custom Service', phone: '' }
  }
};

export async function initializeConfig(): Promise<ConfigData> {
  const { error } = await supabase.from('app_config').upsert({ id: 'main', value: DEFAULT_CONFIG });
  if (error) {
    return DEFAULT_CONFIG;
  }
  return DEFAULT_CONFIG;
}

export async function getConfig(): Promise<ConfigData> {
  const { data, error } = await supabase.from('app_config').select('value').eq('id', 'main').maybeSingle();
  if (error || !data?.value) return DEFAULT_CONFIG;
  return data.value as ConfigData;
}

export async function updateConfig(configData: ConfigData): Promise<boolean> {
  const { error } = await supabase.from('app_config').upsert({ id: 'main', value: configData });
  return !error;
}

export function onConfigChange(callback: (config: ConfigData) => void) {
  const load = async () => callback(await getConfig());
  load();
  const channel = supabase
    .channel('config-watch')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config', filter: 'id=eq.main' }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ===== ADMIN SETTINGS - PAYMENT =====
export interface AdminSettings {
  payment?: {
    methodName?: string;
    instructions?: string;
    accountInfo?: string;
    extraDiscount?: number;
  };
  socialMedia?: {
    youtube?: string;
    tiktok?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    telegram?: string;
  };
}

export async function getAdminSettings(): Promise<AdminSettings | null> {
  const { data, error } = await supabase.from('admin_settings').select('value').eq('id', 'main').maybeSingle();
  if (error || !data?.value) return null;
  return data.value as AdminSettings;
}

export function onAdminSettingsChange(callback: (settings: AdminSettings | null) => void) {
  const load = async () => callback(await getAdminSettings());
  load();
  const channel = supabase
    .channel('admin-settings-watch')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_settings', filter: 'id=eq.main' }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function updateAdminSettings(updates: Partial<AdminSettings>) {
  const current = (await getAdminSettings()) || {};
  const merged = { ...current, ...updates };
  const { error } = await supabase.from('admin_settings').upsert({ id: 'main', value: merged });
  if (error) throw error;
}

// ===== SOCIAL MEDIA MANAGEMENT =====

export async function getSocialMediaLinks(): Promise<AdminSettings['socialMedia'] | null> {
  try {
    const settings = await getAdminSettings();
    return settings?.socialMedia || null;
  } catch (error) {
    console.error('Error fetching social media links:', error);
    return null;
  }
}

export async function updateSocialMediaLinks(links: AdminSettings['socialMedia']): Promise<void> {
  await updateAdminSettings({ socialMedia: links });
}

export function onSocialMediaChange(callback: (links: AdminSettings['socialMedia'] | null) => void) {
  return onAdminSettingsChange((settings) => callback(settings?.socialMedia || null));
}

// ===== ORDER APPROVAL SYSTEM =====
export interface OrderApprovalData {
  status: 'pending' | 'approved' | 'rejected';
  credentials?: {
    username: string;
    password: string;
    url: string;
    expiryDate: string;
  };
  rejectionReason?: string;
  approvedAt?: string;
  decisionMadeBy?: string;
}

export async function approveOrder(
  userId: string, 
  orderId: string, 
  credentials: { username: string; password: string; url: string; expiryDate: string }
): Promise<boolean> {
  const { error } = await supabase.from('orders').update({
    status: 'approved',
    credentials,
    username: credentials.username,
    password: credentials.password,
    url: credentials.url,
    expiry_date: credentials.expiryDate,
    updated_at: new Date().toISOString(),
  }).eq('id', orderId).eq('user_id', userId);
  return !error;
}

export async function rejectOrder(
  userId: string, 
  orderId: string, 
  rejectionReason: string
): Promise<boolean> {
  const { error } = await supabase.from('orders').update({
    status: 'rejected',
    reject_reason: rejectionReason,
    updated_at: new Date().toISOString(),
  }).eq('id', orderId).eq('user_id', userId);
  return !error;
}

export async function getAllPendingOrders(): Promise<Array<any>> {
  const { data, error } = await supabase.from('orders').select('*').eq('status', 'pending').order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((o: any) => ({ ...o, userId: o.user_id }));
}

// ===== REFERRAL VALIDATION =====
// Find a user by their referral code
export async function getUserByReferralCode(referralCode: string): Promise<string | null> {
  const { data, error } = await supabase.from('users').select('id').eq('referral_code', referralCode).maybeSingle();
  if (error || !data) return null;
  return data.id;
}

export async function validateReferral(
  referringUserId: string, 
  referralCode: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    // Check 1: Self-referral prevention
    if (referringUserId === referralCode) {
      return { valid: false, reason: 'You cannot refer yourself' };
    }

    // Check 2: Find the user who owns the referral code
    const codeOwnerUserId = await getUserByReferralCode(referralCode);
    if (!codeOwnerUserId) {
      return { valid: false, reason: 'Referral code does not exist' };
    }

    // Check 3: Self-referral prevention (using actual user ID)
    if (referringUserId === codeOwnerUserId) {
      return { valid: false, reason: 'You cannot refer yourself' };
    }

    // Check 4: Circular referral prevention
    // Check if the referral code owner has already referred the current user
    const { data: circular, error: circularError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_uid', referringUserId)
      .eq('referred_uid', codeOwnerUserId)
      .limit(1);
    if (!circularError && circular && circular.length > 0) {
      return { valid: false, reason: 'Circular referral not allowed. This user has already referred you.' };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating referral:', error);
    return { valid: false, reason: 'Error validating referral' };
  }
}

// Apply a valid referral code to a user
export async function applyReferralCode(userId: string, referralCode: string): Promise<{ success: boolean; newReferralCount?: number; error?: string }> {
  try {
    // First validate the referral code
    const validation = await validateReferral(userId, referralCode);
    if (!validation.valid) {
      return { success: false, error: validation.reason || 'Invalid referral code' };
    }

    // Find the user who owns the referral code
    const codeOwnerId = await getUserByReferralCode(referralCode);
    if (!codeOwnerId) {
      return { success: false, error: 'Referral code does not exist' };
    }

    const currentUserData = await getUserData(userId);
    const currentUserName = currentUserData?.name || 'User';

    await updateUserData(userId, {
      referredBy: codeOwnerId,
    });

    const referrerData = await getUserData(codeOwnerId);
    const { error: referralInsertError } = await supabase.from('referrals').insert({
      referrer_uid: codeOwnerId,
      referred_uid: userId,
      referral_code: referralCode,
      referrer_name: referrerData?.name || 'User',
      referrer_email: referrerData?.email || '',
      referred_name: currentUserName,
      referred_email: currentUserData?.email || '',
      status: 'joined',
      purchased_plan: false,
      reward_claimed: false,
      reward_amount: 5,
    });
    if (referralInsertError) throw referralInsertError;

    await sendNotification(codeOwnerId, {
      title: 'New Referral!',
      message: `${currentUserName} signed up using your referral code. Encourage them to buy a subscription!`,
      type: 'referral',
      referralFromUserId: userId,
      referralFromUserName: currentUserName
    });

    return { success: true, newReferralCount: (referrerData?.total_referrals || 0) + 1 };
  } catch (error) {
    console.error('Error applying referral code:', error);
    return { success: false, error: 'Error applying referral code' };
  }
}

// Send reminder notification to a referred user
export async function sendReminderToReferral(
  referrerId: string,
  referredUserId: string,
  referrerName: string
): Promise<boolean> {
  try {
    await sendNotification(referredUserId, {
      title: 'Special Offer from Your Referrer!',
      message: `${referrerName} is inviting you to buy a subscription! Get 30% discount or $5 cash back!`,
      type: 'reminder'
    });

    await supabase
      .from('referrals')
      .update({ status: 'joined' })
      .eq('referrer_uid', referrerId)
      .eq('referred_uid', referredUserId);

    return true;
  } catch (error) {
    console.error('Error sending reminder:', error);
    return false;
  }
}

// Mark referral reward as claimed
export async function markReferralAsClaimed(
  referrerId: string,
  referredUserId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('referrals')
    .update({ status: 'claimed', reward_claimed: true, claimed_at: new Date().toISOString() })
    .eq('referrer_uid', referrerId)
    .eq('referred_uid', referredUserId);
  return !error;
}

// Get referral list for user with real-time updates
export function listenToUserReferralList(
  userId: string,
  callback: (referrals: any[]) => void
) {
  const load = async () => callback(await getUserReferralList(userId));
  load();
  const channel = supabase
    .channel(`ref-list-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals', filter: `referrer_uid=eq.${userId}` }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// Get referral list for user (single fetch)
export async function getUserReferralList(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_uid', userId)
    .order('joined_at', { ascending: false });
  if (error) return [];
  return data || [];
}

// ===== ADMIN CONTENT MANAGEMENT =====
export interface AdminContent {
  homeServices?: {
    locksmith?: { name: string; phone: string };
    treeTrimming?: { name: string; phone: string };
    roofing?: { name: string; phone: string };
    plumbing?: { name: string; phone: string };
    electrician?: { name: string; phone: string };
    custom?: { name: string; phone: string };
  };
  paymentMethods?: {
    remitly?: { isActive: boolean; instructions: string; accountInfo: string; discount: number };
    binance?: { isActive: boolean; instructions: string; accountInfo: string; discount: number };
    paypal?: { isActive: boolean; instructions: string; accountInfo: string; discount: number };
    cashapp?: { isActive: boolean; instructions: string; accountInfo: string; discount: number };
  };
  discounts?: {
    generalDiscount: number;
    referralBonus: number;
  };
}

export async function getAdminContent(): Promise<AdminContent | null> {
  const { data, error } = await supabase.from('admin_content').select('value').eq('id', 'main').maybeSingle();
  if (error || !data?.value) return null;
  return data.value as AdminContent;
}

export async function updateAdminContent(updates: Partial<AdminContent>): Promise<boolean> {
  const current = (await getAdminContent()) || {};
  const merged = { ...current, ...updates };
  const { error } = await supabase.from('admin_content').upsert({ id: 'main', value: merged });
  return !error;
}

export function onAdminContentChange(callback: (content: AdminContent | null) => void) {
  const load = async () => callback(await getAdminContent());
  load();
  const channel = supabase
    .channel('admin-content-watch')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_content', filter: 'id=eq.main' }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
