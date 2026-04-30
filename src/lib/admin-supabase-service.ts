import { supabase } from '@/lib/supabase-config';
import {
  addAdminReply,
  getAllOrders,
  getOrderById,
  subscribeToAllOrders,
  updateOrder,
} from '@/services/dbService';

// ============ TYPES ============

export interface Plan {
  id: string;
  name: string;
  price: number;
  discount?: number;
  durationDays: number;
  isActive: boolean;
  createdAt: any;
}

export interface Credentials {
  username: string;
  password: string;
  url: string;
  expiryDate: string;
}

export interface Order {
  id: string;
  userId?: string;
  userEmail: string;
  planId: string;
  planName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: string;
  paymentProof?: string;
  credentials?: Credentials;
  rejectReason?: string;
  createdAt: any;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  swiftCode?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  instructions: string;
  icon?: string;
  isActive: boolean;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: string;
  order: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price?: number;
  features?: string[];
  icon?: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  hours?: string;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  whatsapp?: string;
  telegram?: string;
  youtube?: string;
}

export interface Settings {
  id: string;
  paymentInstructions: string;
  bankAccounts: BankAccount[];
  accountCreationLimit: number;
  maintenanceMode: boolean;

  // Website General Settings
  siteName: string;
  siteDescription: string;
  siteUrl: string;

  // Home/Hero Section
  homeTitle: string;
  homeSubtitle: string;
  homeDescription: string;
  homeCta?: string;
  homeCtaLink?: string;

  // Contact Information
  contactInfo?: ContactInfo;

  // Payment Methods
  paymentMethods?: PaymentMethod[];

  // Features List
  features?: Feature[];

  // Services
  services?: Service[];

  // Social Links
  socialLinks?: SocialLinks;

  // SEO Settings
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

// ============ PLANS ============

export async function createPlan(data: Omit<Plan, 'id' | 'createdAt'>) {
  const { data: row, error } = await supabase.from('plans').insert({
    name: data.name,
    price: data.price,
    discount: data.discount || 0,
    duration_days: data.durationDays,
    is_active: data.isActive,
  }).select('id').single();
  if (error) throw error;
  return row.id;
}

export async function updatePlan(planId: string, data: Partial<Plan>) {
  const payload: any = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.price !== undefined) payload.price = data.price;
  if (data.discount !== undefined) payload.discount = data.discount;
  if (data.durationDays !== undefined) payload.duration_days = data.durationDays;
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  const { error } = await supabase.from('plans').update(payload).eq('id', planId);
  if (error) throw error;
}

export async function deletePlan(planId: string) {
  const { error } = await supabase.from('plans').delete().eq('id', planId);
  if (error) throw error;
}

export function listenToPlans(callback: (plans: Plan[]) => void) {
  const load = async () => {
    const { data } = await supabase.from('plans').select('*').order('created_at', { ascending: true });
    callback((data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      discount: p.discount,
      durationDays: p.duration_days,
      isActive: p.is_active,
      createdAt: p.created_at,
    })));
  };
  load();
  const channel = supabase
    .channel('admin-plans-watch')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, load)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function getActivePlans(): Promise<Plan[]> {
  const { data } = await supabase.from('plans').select('*').eq('is_active', true);
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    discount: p.discount,
    durationDays: p.duration_days,
    isActive: p.is_active,
    createdAt: p.created_at,
  }));
}

// ============ ORDERS ============

export async function updateOrderStatus(
  orderId: string,
  status: 'approved' | 'rejected' | 'pending',
  additionalData?: Partial<Order>,
  userId?: string
) {
  const existingOrder = await getOrderById(orderId, userId);
  const targetUserId = userId || existingOrder?.userId;

  if (!targetUserId) {
    throw new Error('Could not determine the order owner for this update.');
  }

  const credentials = additionalData?.credentials || {
    username: (additionalData as any)?.username || existingOrder?.username || '',
    password: (additionalData as any)?.password || existingOrder?.password || '',
    url: (additionalData as any)?.url || existingOrder?.url || '',
    expiryDate:
      (additionalData as any)?.expiryDate || existingOrder?.expiryDate || '',
  };

  const payload: Record<string, any> = {
    status,
    credentials,
    username: credentials.username || '',
    password: credentials.password || '',
    url: credentials.url || '',
    expiryDate: credentials.expiryDate || '',
  };

  if (additionalData?.rejectReason) {
    payload.rejectReason = additionalData.rejectReason;
  }

  await updateOrder(targetUserId, orderId, payload);

  const adminMessage =
    status === 'approved'
      ? 'Your order has been approved and your credentials are ready.'
      : status === 'rejected'
      ? additionalData?.rejectReason || 'Your order was rejected by the admin team.'
      : 'Your order has been updated by the admin team.';

  await addAdminReply(targetUserId, {
    title:
      status === 'approved'
        ? 'Order approved'
        : status === 'rejected'
        ? 'Order rejected'
        : 'Order updated',
    message: adminMessage,
    status,
    orderId,
  });
}

export function listenToOrders(callback: (orders: Order[]) => void) {
  return subscribeToAllOrders((orders: Order[]) => {
    callback(
      orders.map((order: any) => ({
        id: order.id,
        userId: order.userId,
        userEmail: order.userEmail,
        planId: order.planId || order.plan,
        planName: order.planName || order.plan,
        amount: order.amount || order.finalPrice || 0,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentProof: order.paymentProof,
        credentials: order.credentials || {
          username: order.username,
          password: order.password,
          url: order.url,
          expiryDate: order.expiryDate,
        },
        rejectReason: order.rejectReason,
        createdAt: {
          seconds: Math.floor(new Date(order.createdAt).getTime() / 1000),
        } as any,
      }))
    );
  });
}

export function listenToOrdersByStatus(
  status: string,
  callback: (orders: Order[]) => void
) {
  return listenToOrders((orders) => {
    callback(orders.filter((order) => order.status === status));
  });
}

export async function getUserOrdersByEmail(email: string): Promise<Order[]> {
  const orders = await getAllOrders();
  return orders.filter((order: any) => order.userEmail === email) as any;
}

// ============ SETTINGS ============

export const defaultSettings: Settings = {
  id: 'general',
  maintenanceMode: false,
  paymentInstructions: 'Send payment to the account details provided',
  bankAccounts: [],
  accountCreationLimit: 5,
  siteName: 'PrimexStream Pro',
  siteDescription: 'Premium IPTV Streaming Service',
  siteUrl: 'https://primexstream.pro',
  homeTitle: 'Premium IPTV Streaming',
  homeSubtitle: 'Watch Your Favorite Shows Anytime, Anywhere',
  homeDescription: 'Experience unlimited streaming with our premium IPTV service',
  homeCta: 'Get Started',
  homeCtaLink: '#pricing',
  contactInfo: {
    phone: '+1 (555) 123-4567',
    email: 'support@primexstream.pro',
    whatsapp: '+1 (555) 123-4567',
    address: '123 Main Street, City, State',
    hours: 'Mon - Fri: 9AM - 6PM',
  },
  paymentMethods: [],
  features: [],
  services: [],
  socialLinks: {
    facebook: 'https://facebook.com/primexstream',
    twitter: 'https://twitter.com/primexstream',
    instagram: 'https://instagram.com/primexstream',
    whatsapp: 'https://wa.me/1234567890',
    telegram: 'https://t.me/primexstream',
    youtube: 'https://youtube.com/@primexstream',
  },
  seoTitle: 'PrimexStream Pro - Premium IPTV Streaming',
  seoDescription: 'Watch unlimited IPTV channels with PrimexStream Pro',
  seoKeywords: 'IPTV, streaming, premium, channels',
};

export async function getSettings(): Promise<Settings> {
  const { data } = await supabase.from('admin_settings').select('value').eq('id', 'general').maybeSingle();
  return data?.value ? ({ ...defaultSettings, ...(data.value as any), id: 'general' }) : defaultSettings;
}

export function listenToSettings(callback: (settings: Settings) => void) {
  const load = async () => callback(await getSettings());
  load();
  const channel = supabase
    .channel('admin-general-settings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_settings', filter: 'id=eq.general' }, load)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function updateSettings(data: Partial<Settings>) {
  const current = await getSettings();
  const merged = { ...current, ...data };
  const { error } = await supabase.from('admin_settings').upsert({ id: 'general', value: merged });
  if (error) throw error;
}

// ============ USERS ============

export function listenToUsers(callback: (users: any[]) => void) {
  const load = async () => {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    callback((data || []).map((u: any) => ({ id: u.id, ...u })));
  };
  load();
  const channel = supabase
    .channel('admin-users-watch')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, load)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

// ============ DASHBOARD STATS ============

export function listenToDashboardStats(
  callback: (stats: {
    totalOrders: number;
    pendingOrders: number;
    approvedOrders: number;
    rejectedOrders: number;
    totalRevenue: number;
    totalMembers?: number;
    totalSales?: number;
  }) => void
) {
  const load = async () => {
    const [allOrders, usersCountResponse] = await Promise.all([
      getAllOrders(),
      supabase.from('users').select('*', { count: 'exact', head: true }),
    ]);
    const approved = allOrders.filter((o: any) => o.status === 'approved');
    const totalSales = approved.reduce(
      (sum: number, o: any) => sum + Number(o.amount || o.finalPrice || 0),
      0
    );
    callback({
      totalOrders: allOrders.length,
      pendingOrders: allOrders.filter((o: any) => o.status === 'pending').length,
      approvedOrders: approved.length,
      rejectedOrders: allOrders.filter((o: any) => o.status === 'rejected').length,
      totalRevenue: totalSales,
      totalMembers: usersCountResponse.count || 0,
      totalSales,
    });
  };
  load();
  const stopOrdersSubscription = subscribeToAllOrders(() => {
    void load();
  });
  const usersChannel = supabase
    .channel('dashboard-users-watch')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, load)
    .subscribe();
  return () => {
    stopOrdersSubscription();
    supabase.removeChannel(usersChannel);
  };
}
