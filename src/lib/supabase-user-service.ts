import { supabase } from '@/lib/supabase-config';

export interface User {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  referredBy?: string;
  totalReferrals: number;
  createdAt?: string;
  credits?: number;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  createdAt?: string;
}

interface EnsureUserResult {
  created: boolean;
  user: User | null;
}

function makeReferralCode() {
  return `REF${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    referralCode: row.referral_code,
    referredBy: row.referred_by || undefined,
    totalReferrals: row.total_referrals || 0,
    credits: Number(row.credits || 0),
    createdAt: row.created_at,
  };
}

export async function createUser(userId: string, userData: Partial<User>) {
  const { error } = await supabase.from('users').insert({
    id: userId,
    name: userData.name || 'User',
    email: userData.email || '',
    referral_code: userData.referralCode || makeReferralCode(),
    referred_by: userData.referredBy || null,
    total_referrals: 0,
    credits: userData.credits || 0,
  });
  if (error) throw error;
}

export async function ensureUser(
  userId: string,
  userData: Partial<User> = {}
): Promise<EnsureUserResult> {
  const existing = await getUser(userId);

  if (!existing) {
    await createUser(userId, userData);
    return {
      created: true,
      user: await getUser(userId),
    };
  }

  const updates: Partial<User> = {};

  if (userData.name && existing.name !== userData.name) {
    updates.name = userData.name;
  }

  if (userData.email && existing.email !== userData.email) {
    updates.email = userData.email;
  }

  if (userData.referredBy && !existing.referredBy) {
    updates.referredBy = userData.referredBy;
  }

  if (Object.keys(updates).length > 0) {
    await updateUser(userId, updates);
    return {
      created: false,
      user: {
        ...existing,
        ...updates,
      },
    };
  }

  return {
    created: false,
    user: existing,
  };
}

export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return mapUser(data);
}

export async function updateUser(userId: string, updates: Partial<User>) {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.referralCode !== undefined) payload.referral_code = updates.referralCode;
  if (updates.referredBy !== undefined) payload.referred_by = updates.referredBy;
  if (updates.totalReferrals !== undefined) payload.total_referrals = updates.totalReferrals;
  if (updates.credits !== undefined) payload.credits = updates.credits;
  const { error } = await supabase.from('users').update(payload).eq('id', userId);
  if (error) throw error;
}

export function onUserChange(userId: string, callback: (user: User | null) => void) {
  let active = true;
  const fetchNow = async () => {
    const user = await getUser(userId);
    if (active) callback(user);
  };
  fetchNow();
  const channel = supabase
    .channel(`users-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` }, fetchNow)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export async function recordReferral(referrerId: string, referredUserId: string) {
  const referrer = await getUser(referrerId);
  const referred = await getUser(referredUserId);
  const { error } = await supabase.from('referrals').insert({
    referrer_uid: referrerId,
    referred_uid: referredUserId,
    referral_code: referrer?.referralCode || '',
    referrer_name: referrer?.name || null,
    referrer_email: referrer?.email || null,
    referred_name: referred?.name || null,
    referred_email: referred?.email || null,
    status: 'joined',
  });
  if (error) throw error;
}

export async function getReferralsForUser(referrerId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('referred_uid, users:referred_uid(*)')
    .eq('referrer_uid', referrerId);
  if (error || !data) return [];
  return (data as any[])
    .map((r) => (r.users ? mapUser(r.users) : null))
    .filter(Boolean) as User[];
}

export function onReferralsChange(referrerId: string, callback: (referrals: Referral[]) => void) {
  const load = async () => {
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_uid', referrerId)
      .order('joined_at', { ascending: false });
    callback(
      (data || []).map((r: any) => ({
        id: r.id,
        referrerId: r.referrer_uid,
        referredUserId: r.referred_uid,
        createdAt: r.joined_at,
      }))
    );
  };
  load();
  const channel = supabase
    .channel(`referrals-${referrerId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals', filter: `referrer_uid=eq.${referrerId}` }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  salePrice: number;
  discount: number;
  duration?: number;
  features?: string;
}

export async function getPlans(): Promise<Plan[]> {
  const { data } = await supabase.from('plans').select('*').order('created_at', { ascending: true });
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    salePrice: p.sale_price || p.price,
    discount: p.discount || 0,
    duration: p.duration,
    features: p.features,
  }));
}

export function onPlansChange(callback: (plans: Plan[]) => void) {
  const load = async () => callback(await getPlans());
  load();
  const channel = supabase
    .channel('plans-watch')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function updatePlan(planId: string, updates: Partial<Plan>) {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.price !== undefined) payload.price = updates.price;
  if (updates.salePrice !== undefined) payload.sale_price = updates.salePrice;
  if (updates.discount !== undefined) payload.discount = updates.discount;
  if (updates.duration !== undefined) payload.duration = updates.duration;
  if (updates.features !== undefined) payload.features = updates.features;
  const { error } = await supabase.from('plans').update(payload).eq('id', planId);
  if (error) throw error;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('referral_code', code).maybeSingle();
  if (error || !data) return null;
  return mapUser(data);
}

export async function getAllUsers(): Promise<User[]> {
  const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  return (data || []).map(mapUser);
}

export function onAllUsersChange(callback: (users: User[]) => void) {
  const load = async () => callback(await getAllUsers());
  load();
  const channel = supabase
    .channel('all-users-watch')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function deleteUpload(uploadId: string) {
  const { error } = await supabase.from('uploads').delete().eq('id', uploadId);
  if (error) throw error;
  return true;
}
